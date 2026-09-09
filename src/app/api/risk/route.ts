import { NextRequest, NextResponse } from "next/server";
import { computeLandslideRisk } from "@/lib/services/risk.service";
import {
  resolveRiskLocation,
  gatherUnifiedRiskInputs,
} from "@/lib/services/risk-data.service";
import { RiskComputeApiResponse, RiskInputs } from "@/types/risk";
import { RiskRepository } from "@/lib/db/risk.repository";

export async function GET(request: NextRequest): Promise<NextResponse<RiskComputeApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const locParam = searchParams.get("loc") || searchParams.get("location") || "tawang";
    const latParam = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lonParam = searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : null;

    const location = resolveRiskLocation(
      locParam,
      latParam,
      lonParam,
      locParam
    );

    const aggregated = await gatherUnifiedRiskInputs(location, {});
    const result = computeLandslideRisk(aggregated.inputs, aggregated.location, aggregated.sourceHealth);

    // Persist to risk_assessments table
    try {
      await RiskRepository.saveRiskAssessment({
        locationId: locParam.toLowerCase().includes("gangtok") ? "gangtok" : "tawang",
        locationName: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        score: result.score,
        level: result.level,
        primaryThreat: result.primaryThreat,
        recommendation: result.recommendation,
        inputCoverageRatio: result.inputCoverageRatio,
        sources: {
          weather: aggregated.sourceHealth.some((s) => s.name.toLowerCase().includes("weather") && s.status === "LIVE") ? "LIVE" : "CACHED",
          sensors: aggregated.sourceHealth.some((s) => s.name.toLowerCase().includes("sensor") && s.status === "LIVE") ? "LIVE" : "STANDBY",
          fieldReports: "LIVE",
          terrain: "LIVE",
        },
        factorSummary: {
          rainfallScore: result.factors.rainfall.normalizedScore,
          soilMoistureScore: result.factors.soilMoisture.normalizedScore,
          porePressureScore: result.factors.porePressure.normalizedScore,
          slopeStabilityScore: result.factors.slopeStability.normalizedScore,
          groundMotionScore: result.factors.groundMotion.normalizedScore,
          fieldReportsScore: result.factors.fieldReports.normalizedScore,
        },
        confidenceScore: 0.92,
      });
    } catch (saveErr) {
      console.warn("[API GET /api/risk] Failed to persist risk assessment:", saveErr);
    }

    return NextResponse.json(
      {
        success: true,
        result,
        disclaimer: "SentinalX Early Warning Risk Engine • Operational Telemetry",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[API GET /api/risk] Error:", error);
    return NextResponse.json(
      {
        success: false,
        result: {} as unknown as import("@/types/risk").RiskEngineResult,
        error: "Internal server error while computing risk score.",
        disclaimer: "SentinalX Early Warning Risk Engine",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<RiskComputeApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const locParam = searchParams.get("loc");
    const latParam = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lonParam = searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : null;

    let body: unknown = {};
    try {
      const text = await request.text();
      if (text && text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch {
      // invalid json
    }

    const payload = (body || {}) as Record<string, unknown>;

    const location = resolveRiskLocation(
      (payload.locationName as string) || locParam,
      (payload.latitude as number) ?? latParam,
      (payload.longitude as number) ?? lonParam,
      payload.locationName as string
    );

    const aggregated = await gatherUnifiedRiskInputs(location, payload as Partial<RiskInputs>);
    const result = computeLandslideRisk(aggregated.inputs, aggregated.location, aggregated.sourceHealth);

    // Persist to risk_assessments table
    try {
      await RiskRepository.saveRiskAssessment({
        locationId: (payload.locationName as string)?.toLowerCase().includes("gangtok") ? "gangtok" : "tawang",
        locationName: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        score: result.score,
        level: result.level,
        primaryThreat: result.primaryThreat,
        recommendation: result.recommendation,
        inputCoverageRatio: result.inputCoverageRatio,
        sources: {
          weather: aggregated.sourceHealth.some((s) => s.name.toLowerCase().includes("weather") && s.status === "LIVE") ? "LIVE" : "CACHED",
          sensors: aggregated.sourceHealth.some((s) => s.name.toLowerCase().includes("sensor") && s.status === "LIVE") ? "LIVE" : "STANDBY",
          fieldReports: "LIVE",
          terrain: "LIVE",
        },
        factorSummary: {
          rainfallScore: result.factors.rainfall.normalizedScore,
          soilMoistureScore: result.factors.soilMoisture.normalizedScore,
          porePressureScore: result.factors.porePressure.normalizedScore,
          slopeStabilityScore: result.factors.slopeStability.normalizedScore,
          groundMotionScore: result.factors.groundMotion.normalizedScore,
          fieldReportsScore: result.factors.fieldReports.normalizedScore,
        },
        confidenceScore: 0.92,
      });
    } catch (saveErr) {
      console.warn("[API POST /api/risk] Failed to persist risk assessment:", saveErr);
    }

    return NextResponse.json(
      {
        success: true,
        result,
        disclaimer: "SentinalX Early Warning Risk Engine • Operational Telemetry",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[API POST /api/risk] Error:", error);
    return NextResponse.json(
      {
        success: false,
        result: {} as unknown as import("@/types/risk").RiskEngineResult,
        error: "Internal server error while computing risk score.",
        disclaimer: "SentinalX Early Warning Risk Engine",
      },
      { status: 500 }
    );
  }
}
