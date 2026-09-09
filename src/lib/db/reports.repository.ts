import {
  IncidentReportRecord,
  CreateReportPayload,
  UpdateReportStatusPayload,
  ReportStatusHistoryRecord,
  ResponseStatus,
  HazardType,
  SeverityLevel,
} from "@/types/database";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

// Global in-memory persistence store (active cache & fallback when database is not configured)
interface MemoryDbStore {
  reports: Map<string, IncidentReportRecord>;
  history: Map<string, ReportStatusHistoryRecord[]>;
}

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
    storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
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

function generateNextReportId(): string {
  const count = globalStore.reports.size + 2048;
  return `SX-LS-${count}`;
}

// Helper to map Prisma entity to IncidentReportRecord
function mapPrismaReport(r: {
  id: string;
  reportId: string;
  hazardType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: number;
  description: string;
  photoUrl: string | null;
  submittedAt: Date;
  verificationStatus: string;
  responseStatus: string;
  assignedTeam: string | null;
  estimatedResponseMinutes: number | null;
}): IncidentReportRecord {
  return {
    id: r.id,
    reportId: r.reportId,
    hazardType: r.hazardType as HazardType,
    locationName: r.locationName,
    latitude: r.latitude,
    longitude: r.longitude,
    severity: r.severity as SeverityLevel,
    description: r.description,
    photoUrl: r.photoUrl,
    submittedAt: r.submittedAt.toISOString(),
    verificationStatus: r.verificationStatus as IncidentReportRecord["verificationStatus"],
    responseStatus: r.responseStatus as ResponseStatus,
    assignedTeam: r.assignedTeam,
    estimatedResponseMinutes: r.estimatedResponseMinutes,
    storage: "SUPABASE_POSTGRES",
  };
}

export const ReportsRepository = {
  /**
   * Create a new field report
   */
  async createReport(payload: CreateReportPayload): Promise<IncidentReportRecord> {
    const isConfigured = isDatabaseConfigured;

    // Idempotency check: if clientReportId exists in memory, return it
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
      storage: isConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
      clientReportId: payload.clientReportId || null,
    };

    const initialHistory: ReportStatusHistoryRecord = {
      id: `hist-${Date.now()}`,
      reportId,
      status: "SUBMITTED",
      message: "Report logged via citizen field interface.",
      timestamp: now,
    };

    // Store in memory cache
    globalStore.reports.set(reportId, newRecord);
    globalStore.history.set(reportId, [initialHistory]);

    // Persist to Supabase via Prisma if database is configured
    if (isConfigured) {
      try {
        const created = await prisma.incidentReport.create({
          data: {
            reportId: newRecord.reportId,
            hazardType: newRecord.hazardType,
            locationName: newRecord.locationName,
            latitude: newRecord.latitude,
            longitude: newRecord.longitude,
            severity: newRecord.severity,
            description: newRecord.description,
            photoUrl: newRecord.photoUrl,
            verificationStatus: newRecord.verificationStatus,
            responseStatus: newRecord.responseStatus,
            assignedTeam: newRecord.assignedTeam,
            estimatedResponseMinutes: newRecord.estimatedResponseMinutes,
            statusHistory: {
              create: {
                status: initialHistory.status,
                message: initialHistory.message,
              },
            },
          },
        });
        newRecord.id = created.id;
        newRecord.storage = "SUPABASE_POSTGRES";
      } catch (err) {
        console.warn("[ReportsRepository] Prisma insert failed, retained in memory:", err);
        newRecord.storage = "DATABASE_NOT_CONFIGURED";
      }
    }

    return newRecord;
  },

  /**
   * Get all reports
   */
  async getReports(options: { status?: ResponseStatus; limit?: number } = {}): Promise<IncidentReportRecord[]> {
    if (isDatabaseConfigured) {
      try {
        const dbReports = await prisma.incidentReport.findMany({
          where: options.status ? { responseStatus: options.status } : undefined,
          orderBy: { submittedAt: "desc" },
          take: options.limit,
        });

        if (dbReports && dbReports.length > 0) {
          return dbReports.map(mapPrismaReport);
        }
      } catch (err) {
        console.warn("[ReportsRepository] Prisma getReports failed, using local store:", err);
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
    if (isDatabaseConfigured) {
      try {
        const dbReport = await prisma.incidentReport.findUnique({
          where: { reportId },
          include: {
            statusHistory: {
              orderBy: { timestamp: "asc" },
            },
          },
        });

        if (dbReport) {
          const report = mapPrismaReport(dbReport);
          const history: ReportStatusHistoryRecord[] = dbReport.statusHistory.map((h) => ({
            id: h.id,
            reportId: h.reportId,
            status: h.status as ResponseStatus,
            message: h.message,
            timestamp: h.timestamp.toISOString(),
          }));
          return { report, history };
        }
      } catch (err) {
        console.warn("[ReportsRepository] Prisma getReportById failed:", err);
      }
    }

    const report = globalStore.reports.get(reportId) || null;
    const history = globalStore.history.get(reportId) || [];
    return { report, history };
  },

  /**
   * Update report status & record audit history
   */
  async updateReportStatus(
    reportId: string,
    payload: UpdateReportStatusPayload
  ): Promise<{ report: IncidentReportRecord | null; history: ReportStatusHistoryRecord[] }> {
    const existing = globalStore.reports.get(reportId);
    if (!existing) {
      // Check if it exists in DB
      if (isDatabaseConfigured) {
        try {
          const dbReport = await prisma.incidentReport.findUnique({ where: { reportId } });
          if (dbReport) {
            globalStore.reports.set(reportId, mapPrismaReport(dbReport));
          }
        } catch {
          // ignore
        }
      }
    }

    const report = globalStore.reports.get(reportId);
    if (!report) return { report: null, history: [] };

    const now = new Date().toISOString();

    if (payload.verificationStatus) report.verificationStatus = payload.verificationStatus;
    if (payload.responseStatus) report.responseStatus = payload.responseStatus;
    if (payload.assignedTeam !== undefined) report.assignedTeam = payload.assignedTeam;
    if (payload.estimatedResponseMinutes !== undefined) {
      report.estimatedResponseMinutes = payload.estimatedResponseMinutes;
    }

    const newHistoryItem: ReportStatusHistoryRecord = {
      id: `hist-${Date.now()}`,
      reportId,
      status: payload.responseStatus || report.responseStatus,
      message:
        payload.statusMessage ||
        `Status transitioned to ${payload.responseStatus || report.responseStatus}`,
      timestamp: now,
    };

    const currentHistory = globalStore.history.get(reportId) || [];
    currentHistory.push(newHistoryItem);
    globalStore.history.set(reportId, currentHistory);

    // Persist update to Supabase via Prisma
    if (isDatabaseConfigured) {
      try {
        await prisma.incidentReport.update({
          where: { reportId },
          data: {
            verificationStatus: payload.verificationStatus,
            responseStatus: payload.responseStatus,
            assignedTeam: payload.assignedTeam,
            estimatedResponseMinutes: payload.estimatedResponseMinutes,
            statusHistory: {
              create: {
                status: newHistoryItem.status,
                message: newHistoryItem.message,
              },
            },
          },
        });
      } catch (err) {
        console.warn("[ReportsRepository] Prisma update failed:", err);
      }
    }

    return { report, history: currentHistory };
  },
};
