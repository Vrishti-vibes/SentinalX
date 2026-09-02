import { AlertRecord, AlertSeverity, AlertType, AlertStatus } from "@/types/alert";
import { getDbConfig, supabaseRestQuery } from "./client";

export const PROTOTYPE_ALERT_SOURCE = "SentinalX Prototype Alert Engine";

// Seed alerts for demo baseline in NER
const SEED_ALERTS: AlertRecord[] = [
  {
    id: "ALT-TW-01",
    type: "LANDSLIDE_RISK",
    severity: "HIGH",
    title: "High Landslide Threat • Tawang Sector",
    message:
      "High landslide risk detected on NH-13 Km 4 corridor. Accelerated slope pore pressure and rainfall saturation. Exercise caution and follow designated safe routes.",
    location: {
      name: "Tawang Sector",
      latitude: 27.586,
      longitude: 91.859,
    },
    riskScore: 78.4,
    riskLevel: "HIGH",
    primaryThreat: "Moisture Infiltration on Hill Slopes (Prototype Watch)",
    triggeredBy: ["Rainfall > 35mm/24h", "Pore Pressure > 40 kPa", "Citizen Verified Report"],
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
    source: PROTOTYPE_ALERT_SOURCE,
  },
  {
    id: "ALT-GTK-02",
    type: "ROAD_BLOCKAGE",
    severity: "WATCH",
    title: "Active Debris Watch • Sevoke Teesta Escarpment",
    message:
      "Moderate slope instability and minor debris wash along Teesta River valley cutting. Single lane traffic advisory active.",
    location: {
      name: "Gangtok / Sevoke Corridor",
      latitude: 27.338,
      longitude: 88.606,
    },
    riskScore: 48.9,
    riskLevel: "MODERATE",
    primaryThreat: "Heightened Soil Saturation & Runoff",
    triggeredBy: ["Soil Saturation > 80%", "Riverbank Cutting"],
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
    source: PROTOTYPE_ALERT_SOURCE,
  },
  {
    id: "ALT-TW-03",
    type: "FIELD_INCIDENT",
    severity: "CRITICAL",
    title: "Critical Tension Crack Displacement • Zemithang Slope",
    message:
      "Field verified tension crack displacement exceeding 4.2 mm/hr on Lumla approach. Immediate traffic diversion to Safe Route recommended.",
    location: {
      name: "Zemithang-Lumla Slope Alpha",
      latitude: 27.68,
      longitude: 91.72,
    },
    riskScore: 88.5,
    riskLevel: "CRITICAL",
    primaryThreat: "Active Slip Plane Rupture Imminent",
    triggeredBy: ["Inclinometer Tilt > 10°", "Verified Citizen Report"],
    status: "ACKNOWLEDGED",
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    resolvedAt: null,
    source: PROTOTYPE_ALERT_SOURCE,
  },
];

// In-memory array for local prototype execution
const inMemoryAlerts: AlertRecord[] = [...SEED_ALERTS];

export class AlertsRepository {
  /**
   * Find recent active alert with matching fingerprint within cooldown window
   */
  async findRecentActiveAlert(
    locationName: string,
    type: AlertType,
    severity: AlertSeverity,
    cooldownMinutes: number = 30
  ): Promise<AlertRecord | null> {
    const cutoffTime = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();
    const config = getDbConfig();

    if (!config.isConfigured) {
      const match = inMemoryAlerts.find(
        (a) =>
          a.status === "ACTIVE" &&
          a.type === type &&
          a.severity === severity &&
          a.location.name.toLowerCase().includes(locationName.toLowerCase().split(" ")[0]) &&
          a.createdAt >= cutoffTime
      );
      return match || null;
    }

    try {
      const res = await supabaseRestQuery<Record<string, unknown>[]>("alerts", {
        method: "GET",
        query: {
          status: "eq.ACTIVE",
          type: `eq.${type}`,
          severity: `eq.${severity}`,
          created_at: `gte.${cutoffTime}`,
          order: "created_at.desc",
          limit: "1",
        },
      });

      if (res.data && res.data.length > 0) {
        return this.mapDbRowToAlert(res.data[0]);
      }
      return null;
    } catch (err) {
      console.warn("[AlertsRepository] Supabase find query failed, falling back to memory:", err);
      const match = inMemoryAlerts.find(
        (a) =>
          a.status === "ACTIVE" &&
          a.type === type &&
          a.severity === severity &&
          a.createdAt >= cutoffTime
      );
      return match || null;
    }
  }

  /**
   * Create and persist a new alert
   */
  async createAlert(params: {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    location: { name: string; latitude: number; longitude: number };
    riskScore: number | null;
    riskLevel: string | null;
    primaryThreat: string | null;
    triggeredBy: string[];
    source?: string;
  }): Promise<AlertRecord> {
    const newId = `ALT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newRecord: AlertRecord = {
      id: newId,
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      location: params.location,
      riskScore: params.riskScore,
      riskLevel: params.riskLevel,
      primaryThreat: params.primaryThreat,
      triggeredBy: params.triggeredBy,
      status: "ACTIVE",
      createdAt: now,
      acknowledgedAt: null,
      resolvedAt: null,
      source: params.source || PROTOTYPE_ALERT_SOURCE,
    };

    const config = getDbConfig();
    if (!config.isConfigured) {
      inMemoryAlerts.unshift(newRecord);
      return newRecord;
    }

    try {
      const res = await supabaseRestQuery<Record<string, unknown>>("alerts", {
        method: "POST",
        body: {
          id: newRecord.id,
          type: newRecord.type,
          severity: newRecord.severity,
          title: newRecord.title,
          message: newRecord.message,
          location_name: newRecord.location.name,
          latitude: newRecord.location.latitude,
          longitude: newRecord.location.longitude,
          risk_score: newRecord.riskScore,
          risk_level: newRecord.riskLevel,
          primary_threat: newRecord.primaryThreat,
          triggered_by: newRecord.triggeredBy,
          status: newRecord.status,
          source: newRecord.source,
          created_at: newRecord.createdAt,
        },
      });

      if (res.data) {
        return this.mapDbRowToAlert(res.data);
      }

      inMemoryAlerts.unshift(newRecord);
      return newRecord;
    } catch (err) {
      console.warn("[AlertsRepository] Supabase insert exception, storing in-memory:", err);
      inMemoryAlerts.unshift(newRecord);
      return newRecord;
    }
  }

  /**
   * List alerts with optional filters
   */
  async listAlerts(filters?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    locationName?: string;
    limit?: number;
  }): Promise<{ alerts: AlertRecord[]; storageMode: "SUPABASE_POSTGRES" | "DEMO_IN_MEMORY" }> {
    const limit = filters?.limit ?? 50;
    const config = getDbConfig();

    if (!config.isConfigured) {
      let filtered = [...inMemoryAlerts];
      if (filters?.status) {
        filtered = filtered.filter((a) => a.status === filters.status);
      }
      if (filters?.severity) {
        filtered = filtered.filter((a) => a.severity === filters.severity);
      }
      if (filters?.locationName) {
        filtered = filtered.filter((a) =>
          a.location.name.toLowerCase().includes(filters.locationName!.toLowerCase())
        );
      }
      return {
        alerts: filtered.slice(0, limit),
        storageMode: "DEMO_IN_MEMORY",
      };
    }

    try {
      const query: Record<string, string> = {
        order: "created_at.desc",
        limit: String(limit),
      };
      if (filters?.status) query.status = `eq.${filters.status}`;
      if (filters?.severity) query.severity = `eq.${filters.severity}`;

      const res = await supabaseRestQuery<Record<string, unknown>[]>("alerts", {
        method: "GET",
        query,
      });

      if (res.data && Array.isArray(res.data)) {
        return {
          alerts: res.data.map((r) => this.mapDbRowToAlert(r)),
          storageMode: "SUPABASE_POSTGRES",
        };
      }

      return { alerts: inMemoryAlerts.slice(0, limit), storageMode: "DEMO_IN_MEMORY" };
    } catch (err) {
      console.warn("[AlertsRepository] Supabase list exception, fallback to in-memory:", err);
      return { alerts: inMemoryAlerts.slice(0, limit), storageMode: "DEMO_IN_MEMORY" };
    }
  }

  /**
   * Get an alert by ID
   */
  async getAlert(id: string): Promise<AlertRecord | null> {
    const config = getDbConfig();
    if (!config.isConfigured) {
      return inMemoryAlerts.find((a) => a.id === id) || null;
    }

    try {
      const res = await supabaseRestQuery<Record<string, unknown>[]>("alerts", {
        method: "GET",
        query: { id: `eq.${id}`, limit: "1" },
      });

      if (res.data && res.data.length > 0) {
        return this.mapDbRowToAlert(res.data[0]);
      }
      return inMemoryAlerts.find((a) => a.id === id) || null;
    } catch {
      return inMemoryAlerts.find((a) => a.id === id) || null;
    }
  }

  /**
   * Update alert status (ACTIVE -> ACKNOWLEDGED -> RESOLVED)
   */
  async updateAlertStatus(id: string, newStatus: AlertStatus): Promise<AlertRecord | null> {
    const now = new Date().toISOString();

    // Check in-memory first
    const memoryIdx = inMemoryAlerts.findIndex((a) => a.id === id);
    if (memoryIdx >= 0) {
      inMemoryAlerts[memoryIdx].status = newStatus;
      if (newStatus === "ACKNOWLEDGED" && !inMemoryAlerts[memoryIdx].acknowledgedAt) {
        inMemoryAlerts[memoryIdx].acknowledgedAt = now;
      }
      if (newStatus === "RESOLVED") {
        inMemoryAlerts[memoryIdx].resolvedAt = now;
      }
    }

    const config = getDbConfig();
    if (!config.isConfigured) {
      return memoryIdx >= 0 ? inMemoryAlerts[memoryIdx] : null;
    }

    try {
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: now,
      };
      if (newStatus === "ACKNOWLEDGED") updates.acknowledged_at = now;
      if (newStatus === "RESOLVED") updates.resolved_at = now;

      const res = await supabaseRestQuery<Record<string, unknown>>("alerts", {
        method: "PATCH",
        query: { id: `eq.${id}` },
        body: updates,
      });

      if (res.data) {
        return this.mapDbRowToAlert(res.data);
      }
      return memoryIdx >= 0 ? inMemoryAlerts[memoryIdx] : null;
    } catch {
      return memoryIdx >= 0 ? inMemoryAlerts[memoryIdx] : null;
    }
  }

  private mapDbRowToAlert(row: Record<string, unknown>): AlertRecord {
    return {
      id: row.id as string,
      type: row.type as AlertType,
      severity: row.severity as AlertSeverity,
      title: row.title as string,
      message: row.message as string,
      location: {
        name: (row.location_name as string) || "North Eastern Region",
        latitude: Number(row.latitude) || 27.586,
        longitude: Number(row.longitude) || 91.859,
      },
      riskScore: row.risk_score !== null && row.risk_score !== undefined ? Number(row.risk_score) : null,
      riskLevel: (row.risk_level as string) || null,
      primaryThreat: (row.primary_threat as string) || null,
      triggeredBy: Array.isArray(row.triggered_by) ? (row.triggered_by as string[]) : [],
      status: row.status as AlertStatus,
      createdAt: row.created_at as string,
      acknowledgedAt: (row.acknowledged_at as string) || null,
      resolvedAt: (row.resolved_at as string) || null,
      source: (row.source as string) || PROTOTYPE_ALERT_SOURCE,
    };
  }
}

export const alertsRepository = new AlertsRepository();
