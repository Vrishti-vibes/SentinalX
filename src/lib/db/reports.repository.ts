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

import fs from "fs";
import path from "path";

// Global in-memory persistence store (active cache & fallback when database is not configured)
interface MemoryDbStore {
  reports: Map<string, IncidentReportRecord>;
  history: Map<string, ReportStatusHistoryRecord[]>;
}

const PERSISTENCE_DIR = path.join(process.cwd(), ".next");
const PERSISTENCE_FILE = path.join(PERSISTENCE_DIR, "sentinalx_reports_store.json");

function loadPersistedStore(): MemoryDbStore | null {
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      const raw = fs.readFileSync(PERSISTENCE_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.reports) && Array.isArray(data.history)) {
        const reports = new Map<string, IncidentReportRecord>(data.reports);
        const history = new Map<string, ReportStatusHistoryRecord[]>(data.history);
        if (reports.size > 0) {
          return { reports, history };
        }
      }
    }
  } catch {
    // fallback
  }
  return null;
}

function savePersistedStore(store: MemoryDbStore) {
  try {
    if (!fs.existsSync(PERSISTENCE_DIR)) {
      fs.mkdirSync(PERSISTENCE_DIR, { recursive: true });
    }
    const payload = JSON.stringify(
      {
        reports: Array.from(store.reports.entries()),
        history: Array.from(store.history.entries()),
      },
      null,
      2
    );
    fs.writeFileSync(PERSISTENCE_FILE, payload, "utf-8");
  } catch {
    // ignore
  }
}

function createInitialStore(): MemoryDbStore {
  const persisted = loadPersistedStore();
  if (persisted) return persisted;

  const reports = new Map<string, IncidentReportRecord>();
  const history = new Map<string, ReportStatusHistoryRecord[]>();

  const seedReports: IncidentReportRecord[] = [
    {
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
      submittedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      verificationStatus: "PENDING_VERIFICATION",
      responseStatus: "NEW",
      assignedTeam: null,
      estimatedResponseMinutes: null,
      storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
    },
    {
      id: "rep-seed-002",
      reportId: "SX-FL-2049",
      hazardType: "Flooding",
      locationName: "Gangtok Sector, Sikkim",
      latitude: 27.331,
      longitude: 88.613,
      severity: 4,
      description:
        "Flash flood water overtopping NH-10 culvert at Teesta lowlands. Silt and mudflow impeding vehicles.",
      photoUrl: null,
      submittedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      verificationStatus: "VERIFIED",
      responseStatus: "VERIFIED",
      assignedTeam: null,
      estimatedResponseMinutes: 25,
      storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
    },
    {
      id: "rep-seed-003",
      reportId: "SX-RB-2050",
      hazardType: "Road Blockage",
      locationName: "Shillong Sector, Meghalaya",
      latitude: 25.578,
      longitude: 91.893,
      severity: 3,
      description:
        "Transverse tension fissure and road subsidence near Km 18 bypass. Single-lane bottleneck.",
      photoUrl: null,
      submittedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      verificationStatus: "VERIFIED",
      responseStatus: "DISPATCHED",
      assignedTeam: "Shillong Field Unit",
      estimatedResponseMinutes: 15,
      storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
    },
    {
      id: "rep-seed-004",
      reportId: "SX-LS-2051",
      hazardType: "Landslide",
      locationName: "Haflong Sector, Assam",
      latitude: 25.176,
      longitude: 93.018,
      severity: 5,
      description:
        "Major mudslide blocking Dima Hasao railway bypass. Heavy debris flow across road cutting.",
      photoUrl: null,
      submittedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      verificationStatus: "VERIFIED",
      responseStatus: "ON_SITE",
      assignedTeam: "Guwahati Emergency Unit",
      estimatedResponseMinutes: 0,
      storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
    },
    {
      id: "rep-seed-005",
      reportId: "SX-LS-2052",
      hazardType: "Other Hazard",
      locationName: "Kohima Sector, Nagaland",
      latitude: 25.675,
      longitude: 94.108,
      severity: 2,
      description:
        "Retaining wall surface fracture near residential hill slope. Minor runoff channel diverted.",
      photoUrl: null,
      submittedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
      verificationStatus: "VERIFIED",
      responseStatus: "RESOLVED",
      assignedTeam: "Kohima Terrain Unit",
      estimatedResponseMinutes: 0,
      storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
    },
  ];

  for (const r of seedReports) {
    reports.set(r.reportId, r);
  }

  history.set("SX-LS-2048", [
    {
      id: "hist-2048-1",
      reportId: "SX-LS-2048",
      status: "NEW",
      message: "Incident reported by citizen via field interface. Awaiting authority review.",
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
  ]);

  history.set("SX-FL-2049", [
    {
      id: "hist-2049-1",
      reportId: "SX-FL-2049",
      status: "NEW",
      message: "Report logged via citizen field interface.",
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2049-2",
      reportId: "SX-FL-2049",
      status: "VERIFIED",
      message: "Cross-verified with Gangtok Geotechnical Sensor telemetry.",
      timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    },
  ]);

  history.set("SX-RB-2050", [
    {
      id: "hist-2050-1",
      reportId: "SX-RB-2050",
      status: "NEW",
      message: "Report logged via citizen field interface.",
      timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2050-2",
      reportId: "SX-RB-2050",
      status: "VERIFIED",
      message: "Road inspector confirmed transverse fissure.",
      timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2050-3",
      reportId: "SX-RB-2050",
      status: "DISPATCHED",
      message: "Shillong Field Unit dispatched from district base with traffic barriers.",
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    },
  ]);

  history.set("SX-LS-2051", [
    {
      id: "hist-2051-1",
      reportId: "SX-LS-2051",
      status: "NEW",
      message: "Report logged via citizen field interface.",
      timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2051-2",
      reportId: "SX-LS-2051",
      status: "VERIFIED",
      message: "Verified critical slide area. High volume debris flow.",
      timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2051-3",
      reportId: "SX-LS-2051",
      status: "DISPATCHED",
      message: "Guwahati Emergency Unit deployed with heavy earthmovers.",
      timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2051-4",
      reportId: "SX-LS-2051",
      status: "ON_SITE",
      message: "Guwahati Emergency Unit on site. Operations underway.",
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ]);

  history.set("SX-LS-2052", [
    {
      id: "hist-2052-1",
      reportId: "SX-LS-2052",
      status: "NEW",
      message: "Report logged via citizen field interface.",
      timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2052-2",
      reportId: "SX-LS-2052",
      status: "VERIFIED",
      message: "Verified minor slope distress.",
      timestamp: new Date(Date.now() - 330 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2052-3",
      reportId: "SX-LS-2052",
      status: "DISPATCHED",
      message: "Kohima Terrain Unit dispatched for stabilization.",
      timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2052-4",
      reportId: "SX-LS-2052",
      status: "ON_SITE",
      message: "Kohima Terrain Unit arrived and reinforced wall footing.",
      timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2052-5",
      reportId: "SX-LS-2052",
      status: "RESOLVED",
      message: "Drainage diversion installed and footing secured. Incident resolved.",
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    },
  ]);

  const store = { reports, history };
  savePersistedStore(store);
  return store;
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
  assignedTeamId?: string | null;
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
    assignedTeamId: r.assignedTeamId ?? null,
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

    savePersistedStore(globalStore);
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
  ): Promise<{ report: IncidentReportRecord | null; history: ReportStatusHistoryRecord[]; error?: string }> {
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
    const currentHistory = globalStore.history.get(reportId) || [];
    if (!report) return { report: null, history: [] };

    // Transition Validation
    const VALID_NEXT: Record<string, string[]> = {
      NEW: ["UNDER_REVIEW", "VERIFIED", "REJECTED"],
      SUBMITTED: ["UNDER_REVIEW", "VERIFIED", "REJECTED"],
      UNDER_REVIEW: ["VERIFIED", "REJECTED"],
      AUTHORITIES_NOTIFIED: ["VERIFIED", "DISPATCHED", "REJECTED"],
      VERIFIED: ["DISPATCHED", "RESPONSE_ASSIGNED", "REJECTED"],
      RESPONSE_ASSIGNED: ["DISPATCHED", "ON_SITE", "RESOLVED"],
      DISPATCHED: ["ON_SITE", "RESOLVED"],
      ON_SITE: ["RESOLVED"],
      RESOLVED: [],
      REJECTED: [],
    };

    if (payload.responseStatus && payload.responseStatus !== report.responseStatus) {
      const allowed = VALID_NEXT[report.responseStatus] || [];
      if (!allowed.includes(payload.responseStatus)) {
        return {
          report,
          history: currentHistory,
          error: `Invalid transition: cannot change status from ${report.responseStatus} to ${payload.responseStatus}.`,
        };
      }
    }

    const now = new Date().toISOString();

    if (payload.assignedTeam !== undefined) {
      report.assignedTeam = payload.assignedTeam;
    }
    if (payload.estimatedResponseMinutes !== undefined) {
      report.estimatedResponseMinutes = payload.estimatedResponseMinutes;
    }

    if (payload.responseStatus) {
      report.responseStatus = payload.responseStatus;
      if (
        payload.responseStatus === "VERIFIED" ||
        payload.responseStatus === "DISPATCHED" ||
        payload.responseStatus === "ON_SITE" ||
        payload.responseStatus === "RESOLVED"
      ) {
        report.verificationStatus = "VERIFIED";
      } else if (payload.responseStatus === "REJECTED") {
        report.verificationStatus = "REJECTED";
      }
    }

    if (payload.verificationStatus) {
      report.verificationStatus = payload.verificationStatus;
      if (payload.verificationStatus === "REJECTED") {
        report.responseStatus = "REJECTED";
      } else if (payload.verificationStatus === "VERIFIED" && (report.responseStatus === "NEW" || report.responseStatus === "UNDER_REVIEW" || report.responseStatus === "SUBMITTED")) {
        report.responseStatus = "VERIFIED";
      }
    }

    const message =
      payload.statusMessage ||
      (payload.responseStatus === "VERIFIED"
        ? "Hazard report verified by authority command."
        : payload.responseStatus === "DISPATCHED"
        ? `${report.assignedTeam || "Response Unit"} dispatched to incident site.`
        : payload.responseStatus === "ON_SITE"
        ? `${report.assignedTeam || "Response Unit"} confirmed on site and operating.`
        : payload.responseStatus === "RESOLVED"
        ? "Hazard cleared and sector secured. Incident resolved."
        : payload.responseStatus === "REJECTED"
        ? "Report rejected upon field investigation."
        : payload.assignedTeam
        ? `Assigned response team: ${payload.assignedTeam}`
        : `Status transitioned to ${payload.responseStatus || report.responseStatus}`);

    const newHistoryItem: ReportStatusHistoryRecord = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reportId,
      status: payload.responseStatus || report.responseStatus,
      message,
      timestamp: now,
    };

    currentHistory.push(newHistoryItem);
    globalStore.history.set(reportId, currentHistory);

    // Persist to disk
    savePersistedStore(globalStore);

    // Persist update to Supabase via Prisma if configured
    if (isDatabaseConfigured) {
      try {
        let teamId: string | null = null;
        if (report.assignedTeam) {
          const team = await prisma.responseTeam.findFirst({
            where: { name: { equals: report.assignedTeam, mode: "insensitive" } },
          });
          if (team) {
            teamId = team.id;
            report.assignedTeamId = team.id;
          }
        }

        await prisma.incidentReport.update({
          where: { reportId },
          data: {
            verificationStatus: report.verificationStatus,
            responseStatus: report.responseStatus,
            assignedTeam: report.assignedTeam,
            assignedTeamId: teamId,
            estimatedResponseMinutes: report.estimatedResponseMinutes,
            statusHistory: {
              create: {
                status: newHistoryItem.status,
                message: newHistoryItem.message,
              },
            },
          },
        });

        if (teamId && payload.assignedTeam) {
          await prisma.reportAssignment.create({
            data: {
              reportId,
              teamId,
              assignedBy: "Authority Command Center",
              notes: payload.statusMessage || `Assigned team: ${payload.assignedTeam}`,
              estimatedResponseMinutes: report.estimatedResponseMinutes,
            },
          });
        }
      } catch (err) {
        console.warn("[ReportsRepository] Prisma update failed:", err);
      }
    }

    return { report, history: currentHistory };
  },
};
