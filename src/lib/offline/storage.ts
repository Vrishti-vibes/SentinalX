import { RiskEngineResult } from "@/types/risk";
import { NormalizedWeatherResponse } from "@/types/weather";
import { AlertRecord } from "@/types/alert";
import { CreateReportPayload } from "@/types/database";

export interface CacheEnvelope<T> {
  cachedAt: string;
  expiresAt: string;
  sourceStatus: "LIVE" | "CACHED" | "DEMO" | "FALLBACK";
  data: T;
}

export interface PendingOfflineReport {
  localReportId: string;
  payload: CreateReportPayload;
  queuedAt: string;
  syncStatus: "QUEUED_OFFLINE" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
  retryCount: number;
  serverReportId: string | null;
  lastError: string | null;
}

const STORAGE_PREFIX = "sentinalx:v1:";
const PENDING_REPORTS_KEY = `${STORAGE_PREFIX}pending_reports`;

// Freshness limits (in milliseconds)
export const CACHE_TTL = {
  RISK: 30 * 60 * 1000, // 30 mins
  WEATHER: 30 * 60 * 1000, // 30 mins
  ALERTS: 60 * 60 * 1000, // 60 mins
  SHELTERS: 6 * 60 * 60 * 1000, // 6 hours
  ROUTES: 6 * 60 * 60 * 1000, // 6 hours
};

function isClient(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getItem<T>(key: string): CacheEnvelope<T> | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch (err) {
    console.warn(`[OfflineStorage] Error reading key ${key}:`, err);
    return null;
  }
}

function setItem<T>(
  key: string,
  data: T,
  ttlMs: number,
  sourceStatus: "LIVE" | "CACHED" | "DEMO" | "FALLBACK" = "LIVE"
): void {
  if (!isClient()) return;
  try {
    const now = new Date();
    const envelope: CacheEnvelope<T> = {
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      sourceStatus,
      data,
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[OfflineStorage] Error saving key ${key}:`, err);
  }
}

export function getCacheAgeMinutes(cachedAt: string): number {
  try {
    const diffMs = Date.now() - new Date(cachedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  } catch {
    return 0;
  }
}

export function isCacheExpired(envelope: CacheEnvelope<unknown>): boolean {
  try {
    return new Date().toISOString() > envelope.expiresAt;
  } catch {
    return true;
  }
}

// ==========================================
// 1. RISK & WEATHER CACHING
// ==========================================
export function saveRiskSnapshot(
  locationKey: string,
  risk: RiskEngineResult,
  sourceStatus: "LIVE" | "DEMO" | "FALLBACK" = "LIVE"
): void {
  const key = `${STORAGE_PREFIX}risk:${locationKey.toLowerCase()}`;
  setItem(key, risk, CACHE_TTL.RISK, sourceStatus);
}

export function getRiskSnapshot(locationKey: string): CacheEnvelope<RiskEngineResult> | null {
  const key = `${STORAGE_PREFIX}risk:${locationKey.toLowerCase()}`;
  return getItem<RiskEngineResult>(key);
}

export function saveWeatherSnapshot(locationKey: string, weather: NormalizedWeatherResponse): void {
  const key = `${STORAGE_PREFIX}weather:${locationKey.toLowerCase()}`;
  setItem(key, weather, CACHE_TTL.WEATHER, "LIVE");
}

export function getWeatherSnapshot(locationKey: string): CacheEnvelope<NormalizedWeatherResponse> | null {
  const key = `${STORAGE_PREFIX}weather:${locationKey.toLowerCase()}`;
  return getItem<NormalizedWeatherResponse>(key);
}

// ==========================================
// 2. ALERTS CACHING
// ==========================================
export function saveAlertsSnapshot(alerts: AlertRecord[]): void {
  const key = `${STORAGE_PREFIX}alerts`;
  setItem(key, alerts, CACHE_TTL.ALERTS, "LIVE");
}

export function getAlertsSnapshot(): CacheEnvelope<AlertRecord[]> | null {
  const key = `${STORAGE_PREFIX}alerts`;
  return getItem<AlertRecord[]>(key);
}

// ==========================================
// 3. SHELTERS & ROUTES CACHING
// ==========================================
export function saveSheltersSnapshot(shelters: unknown[]): void {
  const key = `${STORAGE_PREFIX}shelters`;
  setItem(key, shelters, CACHE_TTL.SHELTERS, "LIVE");
}

export function getSheltersSnapshot<T = unknown[]>(): CacheEnvelope<T> | null {
  const key = `${STORAGE_PREFIX}shelters`;
  return getItem<T>(key);
}

export function saveRouteSnapshot(routeData: unknown): void {
  const key = `${STORAGE_PREFIX}routes`;
  setItem(key, routeData, CACHE_TTL.ROUTES, "LIVE");
}

export function getRouteSnapshot<T = unknown>(): CacheEnvelope<T> | null {
  const key = `${STORAGE_PREFIX}routes`;
  return getItem<T>(key);
}

// ==========================================
// 4. OFFLINE FIELD REPORT QUEUE
// ==========================================
export function getPendingReports(): PendingOfflineReport[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(PENDING_REPORTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingOfflineReport[];
  } catch {
    return [];
  }
}

export function queuePendingReport(payload: CreateReportPayload): PendingOfflineReport {
  const localReportId = `SX-OFFLINE-${Date.now().toString().slice(-6)}`;
  const reports = getPendingReports();

  const item: PendingOfflineReport = {
    localReportId,
    payload: {
      ...payload,
      clientReportId: localReportId,
    },
    queuedAt: new Date().toISOString(),
    syncStatus: "QUEUED_OFFLINE",
    retryCount: 0,
    serverReportId: null,
    lastError: null,
  };

  reports.unshift(item);

  if (isClient()) {
    try {
      localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(reports));
    } catch (err) {
      console.warn("[OfflineStorage] Failed to queue report:", err);
    }
  }

  return item;
}

export function updatePendingReport(
  localReportId: string,
  updates: Partial<PendingOfflineReport>
): void {
  if (!isClient()) return;
  try {
    const reports = getPendingReports();
    const idx = reports.findIndex((r) => r.localReportId === localReportId);
    if (idx >= 0) {
      reports[idx] = { ...reports[idx], ...updates };
      localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(reports));
    }
  } catch (err) {
    console.warn("[OfflineStorage] Error updating pending report:", err);
  }
}

export function removePendingReport(localReportId: string): void {
  if (!isClient()) return;
  try {
    const reports = getPendingReports();
    const filtered = reports.filter((r) => r.localReportId !== localReportId);
    localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("[OfflineStorage] Error removing pending report:", err);
  }
}
