import {
  IncidentReportRecord,
  CreateReportPayload,
  UpdateReportStatusPayload,
  ReportStatusHistoryRecord,
  ResponseStatus,
  HazardType,
  SeverityLevel,
} from "@/types/database";
import { getDbConfig, supabaseRestQuery } from "./client";

// Global in-memory persistence store (for demo / fallback mode)
interface MemoryDbStore {
  reports: Map<string, IncidentReportRecord>;
  history: Map<string, ReportStatusHistoryRecord[]>;
}

// Helper to initialize seed data
function createInitialStore(): MemoryDbStore {
  const reports = new Map<string, IncidentReportRecord>();
  const history = new Map<string, ReportStatusHistoryRecord[]>();

  const seedReport: IncidentReportRecord = {
    id: "rep-seed-001",
    reportId: "SX-LS-2048",
    hazardType: "Landslide",
    locationName: "Tawang Sector, North Eastern Region",
    latitude: 27.586,
    longitude: 91.859,
    severity: 4,
    description:
      "Observed active rockfall and debris accumulation on highway shoulder near Km 4. Road partially blocked.",
    photoUrl: "https://demo.sentinalx.ner/evidence/Hazard_Evidence_Tawang_Km4.jpg",
    submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    verificationStatus: "VERIFIED",
    responseStatus: "RESPONSE_ASSIGNED",
    assignedTeam: "SDRF Quick Response Unit Alpha (Tawang HQ)",
    estimatedResponseMinutes: 15,
    storage: "DEMO_IN_MEMORY",
  };

  reports.set(seedReport.reportId, seedReport);

  const seedHistory: ReportStatusHistoryRecord[] = [
    {
      id: "hist-001",
      reportId: "SX-LS-2048",
      status: "SUBMITTED",
      message: "Report logged via citizen field interface.",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-002",
      reportId: "SX-LS-2048",
      status: "VERIFIED",
      message: "Cross-verified with geotechnical sensor node telemetry.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-003",
      reportId: "SX-LS-2048",
      status: "AUTHORITIES_NOTIFIED",
      message: "Alert dispatched to district disaster management authority.",
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-004",
      reportId: "SX-LS-2048",
      status: "RESPONSE_ASSIGNED",
      message: "SDRF Quick Response Unit dispatched from Tawang HQ.",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ];

  history.set(seedReport.reportId, seedHistory);

  return { reports, history };
}

// Global singleton in Node runtime
const globalStore: MemoryDbStore = ((globalThis as unknown as { __sentinalx_store?: MemoryDbStore })
  .__sentinalx_store ??= createInitialStore());

function parseSeverity(s?: SeverityLevel | "Low" | "Moderate" | "High" | "Critical"): SeverityLevel {
  if (typeof s === "number" && s >= 1 && s <= 5) return s;
  if (s === "Low") return 1;
  if (s === "Moderate") return 3;
  if (s === "High") return 4;
  if (s === "Critical") return 5;
  return 3;
}

/**
 * Generate Next Sequential Report ID: SX-LS-XXXX
 */
function generateNextReportId(): string {
  const count = globalStore.reports.size + 2048;
  return `SX-LS-${count}`;
}

export const ReportsRepository = {
  /**
   * Create a new field report
   */
  async createReport(payload: CreateReportPayload): Promise<IncidentReportRecord> {
    const config = getDbConfig();

    // Idempotency check: if clientReportId was provided and exists, return existing
    if (payload.clientReportId) {
      for (const rep of globalStore.reports.values()) {
        if (rep.clientReportId === payload.clientReportId) {
          return rep;
        }
      }
    }

    const reportId = generateNextReportId();
    const now = new Date().toISOString();
    const severity = parseSeverity(payload.severity);

    const newRecord: IncidentReportRecord = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      reportId,
      hazardType: payload.hazardType || "Landslide",
      locationName: payload.locationName || "Tawang Sector, North Eastern Region",
      latitude: payload.latitude ?? 27.586,
      longitude: payload.longitude ?? 91.859,
      severity,
      description: payload.description,
      photoUrl: payload.photoUrl || null,
      submittedAt: now,
      verificationStatus: "PENDING_VERIFICATION",
      responseStatus: "SUBMITTED",
      assignedTeam: null,
      estimatedResponseMinutes: 20,
      storage: config.isConfigured ? "SUPABASE_POSTGRES" : "DEMO_IN_MEMORY",
      clientReportId: payload.clientReportId || null,
    };

    const initialHistory: ReportStatusHistoryRecord = {
      id: `hist-${Date.now()}`,
      reportId,
      status: "SUBMITTED",
      message: "Report logged via citizen field interface.",
      timestamp: now,
    };

    // Always store in memory store as immediate cache/fallback
    globalStore.reports.set(reportId, newRecord);
    globalStore.history.set(reportId, [initialHistory]);

    // If Supabase is configured, attempt remote insert
    if (config.isConfigured) {
      const dbPayload = {
        report_id: newRecord.reportId,
        hazard_type: newRecord.hazardType,
        location_name: newRecord.locationName,
        latitude: newRecord.latitude,
        longitude: newRecord.longitude,
        severity: newRecord.severity,
        description: newRecord.description,
        photo_url: newRecord.photoUrl,
        verification_status: newRecord.verificationStatus,
        response_status: newRecord.responseStatus,
      };

      const { error } = await supabaseRestQuery("incident_reports", {
        method: "POST",
        body: dbPayload,
      });

      if (error) {
        console.warn("[ReportsRepository] Supabase insert failed, retained in memory:", error);
        newRecord.storage = "DEMO_IN_MEMORY";
      } else {
        // Also insert history in Supabase
        await supabaseRestQuery("report_status_history", {
          method: "POST",
          body: {
            report_id: reportId,
            status: initialHistory.status,
            message: initialHistory.message,
          },
        });
      }
    }

    return newRecord;
  },

  /**
   * Get all reports
   */
  async getReports(options: { status?: ResponseStatus; limit?: number } = {}): Promise<IncidentReportRecord[]> {
    const config = getDbConfig();

    if (config.isConfigured) {
      const query: Record<string, string> = {
        select: "*",
        order: "submitted_at.desc",
      };
      if (options.status) query.response_status = `eq.${options.status}`;
      if (options.limit) query.limit = String(options.limit);

      const { data, error } = await supabaseRestQuery<Record<string, unknown>[]>("incident_reports", {
        query,
      });

      if (!error && Array.isArray(data)) {
        return data.map((d) => ({
          id: String(d.id),
          reportId: String(d.report_id),
          hazardType: d.hazard_type as HazardType,
          locationName: String(d.location_name),
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          severity: Number(d.severity) as SeverityLevel,
          description: String(d.description),
          photoUrl: d.photo_url ? String(d.photo_url) : null,
          submittedAt: String(d.submitted_at),
          verificationStatus: d.verification_status as IncidentReportRecord["verificationStatus"],
          responseStatus: d.response_status as ResponseStatus,
          assignedTeam: d.assigned_team ? String(d.assigned_team) : null,
          estimatedResponseMinutes: d.estimated_response_minutes ? Number(d.estimated_response_minutes) : null,
          storage: "SUPABASE_POSTGRES",
        }));
      }
    }

    // Return in-memory list
    let list = Array.from(globalStore.reports.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    if (options.status) {
      list = list.filter((r) => r.responseStatus === options.status);
    }
    if (options.limit) {
      list = list.slice(0, options.limit);
    }

    return list;
  },

  /**
   * Get a single report by reportId (e.g. "SX-LS-2048")
   */
  async getReportById(
    reportId: string
  ): Promise<{ report: IncidentReportRecord | null; history: ReportStatusHistoryRecord[] }> {
    const config = getDbConfig();
    const upperId = reportId.toUpperCase();

    let report = globalStore.reports.get(upperId) || null;
    let history = globalStore.history.get(upperId) || [];

    if (config.isConfigured) {
      const { data, error } = await supabaseRestQuery<Record<string, unknown>[]>("incident_reports", {
        query: { report_id: `eq.${upperId}`, limit: "1" },
      });

      if (!error && data && data.length > 0) {
        const d = data[0];
        report = {
          id: String(d.id),
          reportId: String(d.report_id),
          hazardType: d.hazard_type as HazardType,
          locationName: String(d.location_name),
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          severity: Number(d.severity) as SeverityLevel,
          description: String(d.description),
          photoUrl: d.photo_url ? String(d.photo_url) : null,
          submittedAt: String(d.submitted_at),
          verificationStatus: d.verification_status as IncidentReportRecord["verificationStatus"],
          responseStatus: d.response_status as ResponseStatus,
          assignedTeam: d.assigned_team ? String(d.assigned_team) : null,
          estimatedResponseMinutes: d.estimated_response_minutes ? Number(d.estimated_response_minutes) : null,
          storage: "SUPABASE_POSTGRES",
        };

        // Fetch history
        const { data: histData } = await supabaseRestQuery<Record<string, unknown>[]>("report_status_history", {
          query: { report_id: `eq.${upperId}`, order: "timestamp.asc" },
        });

        if (Array.isArray(histData)) {
          history = histData.map((h) => ({
            id: String(h.id),
            reportId: String(h.report_id),
            status: h.status as ResponseStatus,
            message: String(h.message),
            timestamp: String(h.timestamp),
          }));
        }
      }
    }

    return { report, history };
  },

  /**
   * Update report status and append to history
   */
  async updateReportStatus(
    reportId: string,
    update: UpdateReportStatusPayload
  ): Promise<{ report: IncidentReportRecord | null; history: ReportStatusHistoryRecord[] }> {
    const upperId = reportId.toUpperCase();
    const existing = globalStore.reports.get(upperId);
    const now = new Date().toISOString();

    if (!existing) {
      return { report: null, history: [] };
    }

    if (update.verificationStatus) existing.verificationStatus = update.verificationStatus;
    if (update.responseStatus) existing.responseStatus = update.responseStatus;
    if (update.assignedTeam !== undefined) existing.assignedTeam = update.assignedTeam;
    if (update.estimatedResponseMinutes !== undefined)
      existing.estimatedResponseMinutes = update.estimatedResponseMinutes;

    const newHistoryItem: ReportStatusHistoryRecord = {
      id: `hist-${Date.now()}`,
      reportId: upperId,
      status: existing.responseStatus,
      message: update.statusMessage || `Status updated to ${existing.responseStatus}.`,
      timestamp: now,
    };

    const currentHistory = globalStore.history.get(upperId) || [];
    currentHistory.push(newHistoryItem);
    globalStore.history.set(upperId, currentHistory);

    const config = getDbConfig();
    if (config.isConfigured) {
      await supabaseRestQuery("incident_reports", {
        method: "PATCH",
        query: { report_id: `eq.${upperId}` },
        body: {
          verification_status: existing.verificationStatus,
          response_status: existing.responseStatus,
          assigned_team: existing.assignedTeam,
          estimated_response_minutes: existing.estimatedResponseMinutes,
          updated_at: now,
        },
      });

      await supabaseRestQuery("report_status_history", {
        method: "POST",
        body: {
          report_id: upperId,
          status: newHistoryItem.status,
          message: newHistoryItem.message,
        },
      });
    }

    return { report: existing, history: currentHistory };
  },
};
