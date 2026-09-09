import { AlertRecord, AlertSeverity, AlertType, AlertStatus } from "@/types/alert";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { NotificationsRepository } from "./notifications.repository";

export const OPERATIONAL_ALERT_SOURCE = "SentinalX Operational Risk Engine";
export const PROTOTYPE_ALERT_SOURCE = OPERATIONAL_ALERT_SOURCE;

// Seed alerts for baseline in NER
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
    primaryThreat: "Moisture Infiltration on Hill Slopes (Active Advisory)",
    triggeredBy: ["Rainfall > 35mm/24h", "Pore Pressure > 40 kPa", "Citizen Verified Report"],
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
    source: OPERATIONAL_ALERT_SOURCE,
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
    source: OPERATIONAL_ALERT_SOURCE,
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
    source: OPERATIONAL_ALERT_SOURCE,
  },
];

// In-memory store for active sessions / fallback
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

    if (isDatabaseConfigured) {
      try {
        const found = await prisma.alert.findFirst({
          where: {
            status: "ACTIVE",
            type,
            severity,
            createdAt: { gte: new Date(cutoffTime) },
            locationName: { contains: locationName.split(" ")[0], mode: "insensitive" },
          },
        });

        if (found) {
          return {
            id: found.id,
            type: found.type as AlertType,
            severity: found.severity as AlertSeverity,
            title: found.title,
            message: found.message,
            location: {
              name: found.locationName,
              latitude: found.latitude,
              longitude: found.longitude,
            },
            riskScore: found.riskScore,
            riskLevel: found.riskLevel,
            primaryThreat: found.primaryThreat,
            triggeredBy: Array.isArray(found.triggeredBy) ? (found.triggeredBy as string[]) : [],
            status: found.status as AlertStatus,
            createdAt: found.createdAt.toISOString(),
            acknowledgedAt: found.acknowledgedAt?.toISOString() || null,
            resolvedAt: found.resolvedAt?.toISOString() || null,
            source: found.source,
          };
        }
      } catch (err) {
        console.warn("[AlertsRepository] Prisma findRecentActiveAlert failed:", err);
      }
    }

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
      source: params.source || OPERATIONAL_ALERT_SOURCE,
    };

    inMemoryAlerts.unshift(newRecord);

    if (isDatabaseConfigured) {
      try {
        await prisma.alert.create({
          data: {
            id: newRecord.id,
            type: newRecord.type,
            severity: newRecord.severity,
            title: newRecord.title,
            message: newRecord.message,
            locationName: newRecord.location.name,
            latitude: newRecord.location.latitude,
            longitude: newRecord.location.longitude,
            riskScore: newRecord.riskScore,
            riskLevel: newRecord.riskLevel,
            primaryThreat: newRecord.primaryThreat,
            triggeredBy: newRecord.triggeredBy,
            status: newRecord.status,
            source: newRecord.source,
            createdAt: new Date(now),
          },
        });
      } catch (err) {
        console.warn("[AlertsRepository] Prisma insert failed, retained in memory:", err);
      }
    }

    // Automatically dispatch multi-channel deliveries (In-App, Push, SMS)
    await NotificationsRepository.dispatchMultiChannelAlert({
      id: newRecord.id,
      title: newRecord.title,
      message: newRecord.message,
      locationName: newRecord.location.name,
      severity: newRecord.severity,
      riskScore: newRecord.riskScore,
    });

    return newRecord;
  }

  /**
   * List alerts with optional filters
   */
  async listAlerts(filters?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    locationName?: string;
    limit?: number;
  }): Promise<{ alerts: AlertRecord[]; storageMode: "SUPABASE_POSTGRES" | "DATABASE_NOT_CONFIGURED" }> {
    const limit = filters?.limit ?? 50;

    if (isDatabaseConfigured) {
      try {
        const where: Record<string, unknown> = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.severity) where.severity = filters.severity;
        if (filters?.locationName) {
          where.locationName = { contains: filters.locationName, mode: "insensitive" };
        }

        const dbAlerts = await prisma.alert.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        if (dbAlerts && dbAlerts.length > 0) {
          const list: AlertRecord[] = dbAlerts.map((a) => ({
            id: a.id,
            type: a.type as AlertType,
            severity: a.severity as AlertSeverity,
            title: a.title,
            message: a.message,
            location: {
              name: a.locationName,
              latitude: a.latitude,
              longitude: a.longitude,
            },
            riskScore: a.riskScore,
            riskLevel: a.riskLevel,
            primaryThreat: a.primaryThreat,
            triggeredBy: Array.isArray(a.triggeredBy) ? (a.triggeredBy as string[]) : [],
            status: a.status as AlertStatus,
            createdAt: a.createdAt.toISOString(),
            acknowledgedAt: a.acknowledgedAt?.toISOString() || null,
            resolvedAt: a.resolvedAt?.toISOString() || null,
            source: a.source,
          }));

          return { alerts: list, storageMode: "SUPABASE_POSTGRES" };
        }
      } catch (err) {
        console.warn("[AlertsRepository] Prisma listAlerts failed, using memory store:", err);
      }
    }

    let filtered = [...inMemoryAlerts];
    if (filters?.status) filtered = filtered.filter((a) => a.status === filters.status);
    if (filters?.severity) filtered = filtered.filter((a) => a.severity === filters.severity);
    if (filters?.locationName) {
      filtered = filtered.filter((a) =>
        a.location.name.toLowerCase().includes(filters.locationName!.toLowerCase())
      );
    }

    return {
      alerts: filtered.slice(0, limit),
      storageMode: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
    };
  }

  /**
   * Get single alert by ID
   */
  async getAlert(id: string): Promise<AlertRecord | null> {
    return this.getAlertById(id);
  }

  async getAlertById(id: string): Promise<AlertRecord | null> {
    if (isDatabaseConfigured) {
      try {
        const a = await prisma.alert.findUnique({ where: { id } });
        if (a) {
          return {
            id: a.id,
            type: a.type as AlertType,
            severity: a.severity as AlertSeverity,
            title: a.title,
            message: a.message,
            location: {
              name: a.locationName,
              latitude: a.latitude,
              longitude: a.longitude,
            },
            riskScore: a.riskScore,
            riskLevel: a.riskLevel,
            primaryThreat: a.primaryThreat,
            triggeredBy: Array.isArray(a.triggeredBy) ? (a.triggeredBy as string[]) : [],
            status: a.status as AlertStatus,
            createdAt: a.createdAt.toISOString(),
            acknowledgedAt: a.acknowledgedAt?.toISOString() || null,
            resolvedAt: a.resolvedAt?.toISOString() || null,
            source: a.source,
          };
        }
      } catch (err) {
        console.warn("[AlertsRepository] Prisma getAlertById failed:", err);
      }
    }

    return inMemoryAlerts.find((a) => a.id === id) || null;
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(id: string, status: AlertStatus): Promise<AlertRecord | null> {
    if (status === "ACKNOWLEDGED") return this.acknowledgeAlert(id);
    if (status === "RESOLVED") return this.resolveAlert(id);

    const alert = inMemoryAlerts.find((a) => a.id === id);
    if (alert) alert.status = status;

    if (isDatabaseConfigured) {
      try {
        await prisma.alert.update({
          where: { id },
          data: { status },
        });
      } catch (err) {
        console.warn("[AlertsRepository] Prisma updateAlertStatus failed:", err);
      }
    }

    return alert || null;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(id: string): Promise<AlertRecord | null> {
    const alert = inMemoryAlerts.find((a) => a.id === id);
    const now = new Date().toISOString();
    if (alert) {
      alert.status = "ACKNOWLEDGED";
      alert.acknowledgedAt = now;
    }

    if (isDatabaseConfigured) {
      try {
        await prisma.alert.update({
          where: { id },
          data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date(now) },
        });
      } catch (err) {
        console.warn("[AlertsRepository] Prisma acknowledgeAlert failed:", err);
      }
    }

    return alert || null;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(id: string): Promise<AlertRecord | null> {
    const alert = inMemoryAlerts.find((a) => a.id === id);
    const now = new Date().toISOString();
    if (alert) {
      alert.status = "RESOLVED";
      alert.resolvedAt = now;
    }

    if (isDatabaseConfigured) {
      try {
        await prisma.alert.update({
          where: { id },
          data: { status: "RESOLVED", resolvedAt: new Date(now) },
        });
      } catch (err) {
        console.warn("[AlertsRepository] Prisma resolveAlert failed:", err);
      }
    }

    return alert || null;
  }
}

export const alertsRepository = new AlertsRepository();

