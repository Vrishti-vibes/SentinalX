import { DataFreshnessStatus, DataFreshnessMetadata } from "@/types/freshness";
import { FRESHNESS_THRESHOLDS } from "@/lib/config/refresh";

export function calculateAgeSeconds(isoTimestamp: string | null): number | null {
  if (!isoTimestamp) return null;
  try {
    const diffMs = Date.now() - new Date(isoTimestamp).getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  } catch {
    return null;
  }
}

export function formatAge(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--";
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export function getFreshnessStatus(params: {
  lastSuccessfulUpdate: string | null;
  isOnline: boolean;
  isRefreshing?: boolean;
  isCached?: boolean;
  hasError?: boolean;
}): DataFreshnessStatus {
  const { lastSuccessfulUpdate, isOnline, isRefreshing, isCached, hasError } = params;

  if (!isOnline) return "OFFLINE";
  if (isRefreshing) return "REFRESHING";
  if (hasError && !lastSuccessfulUpdate) return "UNAVAILABLE";
  if (isCached) return "CACHED";

  if (!lastSuccessfulUpdate) return "UNAVAILABLE";

  const age = calculateAgeSeconds(lastSuccessfulUpdate);
  if (age === null) return "UNAVAILABLE";

  if (age > FRESHNESS_THRESHOLDS.STALE_SECONDS) {
    return "STALE";
  }

  return "LIVE";
}

export function isStale(
  isoTimestamp: string | null,
  thresholdSeconds: number = FRESHNESS_THRESHOLDS.STALE_SECONDS
): boolean {
  const age = calculateAgeSeconds(isoTimestamp);
  if (age === null) return true;
  return age > thresholdSeconds;
}
