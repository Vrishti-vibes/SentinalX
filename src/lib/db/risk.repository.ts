import { RiskAssessmentRecord } from "@/types/database";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

interface CreateRiskPayload {
  locationId?: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "CRITICAL" | "SAFE";
  primaryThreat: string;
  recommendation: string;
  inputCoverageRatio?: number;
  sources: {
    weather: "LIVE" | "CACHED" | "UNAVAILABLE";
    sensors: "LIVE" | "STANDBY" | "UNAVAILABLE";
    fieldReports: "LIVE" | "STANDBY" | "UNAVAILABLE";
    terrain: "LIVE" | "CACHED" | "UNAVAILABLE";
  };
  factorSummary: {
    rainfallScore: number;
    soilMoistureScore: number;
    porePressureScore: number;
    slopeStabilityScore: number;
    groundMotionScore: number;
    fieldReportsScore: number;
  };
  confidenceScore?: number;
}

// In-memory store for active session caching and fallback
const globalRiskAssessments: RiskAssessmentRecord[] =
  ((globalThis as unknown as { __sentinalx_risk_assessments?: RiskAssessmentRecord[] })
    .__sentinalx_risk_assessments ??= []);

export const RiskRepository = {
  /**
   * Save a newly evaluated risk assessment
   */
  async saveRiskAssessment(payload: CreateRiskPayload): Promise<RiskAssessmentRecord> {
    const now = new Date().toISOString();
    const id = `risk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const record: RiskAssessmentRecord = {
      id,
      locationName: payload.locationName,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: now,
      score: payload.score,
      level: payload.level,
      primaryThreat: payload.primaryThreat,
      recommendation: payload.recommendation,
      inputCoverageRatio: payload.inputCoverageRatio ?? 1.0,
      sources: payload.sources,
      factorSummary: payload.factorSummary,
      storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
    };

    globalRiskAssessments.unshift(record);
    if (globalRiskAssessments.length > 100) globalRiskAssessments.pop();

    if (isDatabaseConfigured) {
      try {
        const created = await prisma.riskAssessment.create({
          data: {
            locationId: payload.locationId || (payload.locationName.toLowerCase().includes("gangtok") ? "gangtok" : "tawang"),
            locationName: payload.locationName,
            latitude: payload.latitude,
            longitude: payload.longitude,
            score: payload.score,
            level: payload.level,
            primaryThreat: payload.primaryThreat,
            recommendation: payload.recommendation,
            inputCoverageRatio: payload.inputCoverageRatio ?? 1.0,
            sources: payload.sources,
            factorSummary: payload.factorSummary,
            confidenceScore: payload.confidenceScore ?? 0.92,
            timestamp: new Date(now),
          },
        });
        record.id = created.id;
        record.storage = "SUPABASE_POSTGRES";
      } catch (err) {
        console.warn("[RiskRepository] Prisma create riskAssessment failed, retained in memory:", err);
        record.storage = "DATABASE_NOT_CONFIGURED";
      }
    }

    return record;
  },

  /**
   * Get latest risk assessments for a location
   */
  async getLatestRisk(locationName?: string): Promise<RiskAssessmentRecord | null> {
    if (isDatabaseConfigured) {
      try {
        const where = locationName
          ? {
              locationName: {
                contains: locationName,
                mode: "insensitive" as const,
              },
            }
          : undefined;

        const latest = await prisma.riskAssessment.findFirst({
          where,
          orderBy: { timestamp: "desc" },
        });

        if (latest) {
          return {
            id: latest.id,
            locationName: latest.locationName,
            latitude: latest.latitude ?? undefined,
            longitude: latest.longitude ?? undefined,
            timestamp: latest.timestamp.toISOString(),
            score: latest.score,
            level: latest.level as RiskAssessmentRecord["level"],
            primaryThreat: latest.primaryThreat,
            recommendation: latest.recommendation,
            inputCoverageRatio: latest.inputCoverageRatio,
            sources: latest.sources as unknown as RiskAssessmentRecord["sources"],
            factorSummary: latest.factorSummary as unknown as RiskAssessmentRecord["factorSummary"],
            storage: "SUPABASE_POSTGRES",
          };
        }
      } catch (err) {
        console.warn("[RiskRepository] Prisma getLatestRisk failed:", err);
      }
    }

    if (!locationName) return globalRiskAssessments[0] || null;

    const loc = locationName.toLowerCase();
    const found = globalRiskAssessments.find((r) => r.locationName.toLowerCase().includes(loc));
    return found || null;
  },

  /**
   * Get historical risk assessments
   */
  async getRiskHistory(locationName?: string, limit = 20): Promise<RiskAssessmentRecord[]> {
    if (isDatabaseConfigured) {
      try {
        const where = locationName
          ? {
              locationName: {
                contains: locationName,
                mode: "insensitive" as const,
              },
            }
          : undefined;

        const list = await prisma.riskAssessment.findMany({
          where,
          orderBy: { timestamp: "desc" },
          take: limit,
        });

        if (list && list.length > 0) {
          return list.map((latest) => ({
            id: latest.id,
            locationName: latest.locationName,
            latitude: latest.latitude ?? undefined,
            longitude: latest.longitude ?? undefined,
            timestamp: latest.timestamp.toISOString(),
            score: latest.score,
            level: latest.level as RiskAssessmentRecord["level"],
            primaryThreat: latest.primaryThreat,
            recommendation: latest.recommendation,
            inputCoverageRatio: latest.inputCoverageRatio,
            sources: latest.sources as unknown as RiskAssessmentRecord["sources"],
            factorSummary: latest.factorSummary as unknown as RiskAssessmentRecord["factorSummary"],
            storage: "SUPABASE_POSTGRES",
          }));
        }
      } catch (err) {
        console.warn("[RiskRepository] Prisma getRiskHistory failed:", err);
      }
    }

    let list = globalRiskAssessments;
    if (locationName) {
      const loc = locationName.toLowerCase();
      list = list.filter((r) => r.locationName.toLowerCase().includes(loc));
    }
    return list.slice(0, limit);
  },
};
