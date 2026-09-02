import { NextRequest, NextResponse } from "next/server";
import {
  computeLandslideRisk,
  PROTOTYPE_DISCLAIMER,
} from "@/lib/services/risk.service";
import {
  resolveRiskLocation,
  gatherUnifiedRiskInputs,
} from "@/lib/services/risk-data.service";
import { RiskInputs, RiskComputeApiResponse } from "@/types/risk";

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
      return NextResponse.json(
        {
          success: false,
          result: {} as unknown as import("@/types/risk").RiskEngineResult,
          error: "Invalid JSON in request body.",
          disclaimer: PROTOTYPE_DISCLAIMER,
        },
        { status: 400 }
      );
    }

    if (body !== null && typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          result: {} as unknown as import("@/types/risk").RiskEngineResult,
          error: "Request body must be a JSON object containing risk inputs.",
          disclaimer: PROTOTYPE_DISCLAIMER,
        },
        { status: 400 }
      );
    }

    const payload = (body || {}) as Record<string, unknown>;

    // 1. Resolve Location Context
    const location = resolveRiskLocation(
      (payload.locationName as string) || locParam,
      (payload.latitude as number) ?? latParam,
      (payload.longitude as number) ?? lonParam,
      payload.locationName as string
    );

    // 2. Validate numeric fields if supplied in payload
    const numericFields: (keyof RiskInputs)[] = [
      "rainfall24hMm",
      "rainfall72hMm",
      "maxHourlyRainfallMm",
      "soilMoisturePercent",
      "porePressureKpa",
      "tiltAngleDeg",
      "factorOfSafety",
      "slopeAngleDeg",
      "groundMotionIndex",
      "terrainVulnerabilityIndex",
      "latitude",
      "longitude",
    ];

    for (const field of numericFields) {
      if (payload[field] !== undefined && typeof payload[field] !== "number") {
        return NextResponse.json(
          {
            success: false,
            result: {} as unknown as import("@/types/risk").RiskEngineResult,
            error: `Field '${field}' must be a valid number if provided.`,
            disclaimer: PROTOTYPE_DISCLAIMER,
          },
          { status: 400 }
        );
      }
    }

    // 3. Multi-source location-aware aggregation
    const aggregated = await gatherUnifiedRiskInputs(location, payload as Partial<RiskInputs>);

    // 4. Compute explainable risk result
    const result = computeLandslideRisk(aggregated.inputs, aggregated.location, aggregated.sourceHealth);

    return NextResponse.json(
      {
        success: true,
        result,
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[API /api/risk/compute] Unexpected compute error:", error);
    return NextResponse.json(
      {
        success: false,
        result: {} as unknown as import("@/types/risk").RiskEngineResult,
        error: "Internal server error while computing risk score.",
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}

// Also support GET for quick health / location check
export async function GET(request: NextRequest): Promise<NextResponse<RiskComputeApiResponse>> {
  return POST(request);
}
