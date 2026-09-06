import { NextRequest, NextResponse } from "next/server";
import {
  computeLandslideRisk,
  PROTOTYPE_DISCLAIMER,
} from "@/lib/services/risk.service";
import {
  resolveRiskLocation,
  gatherUnifiedRiskInputs,
} from "@/lib/services/risk-data.service";
import { RiskComputeApiResponse, RiskInputs } from "@/types/risk";

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

    return NextResponse.json(
      {
        success: true,
        result,
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
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
        disclaimer: PROTOTYPE_DISCLAIMER,
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

    return NextResponse.json(
      {
        success: true,
        result,
        disclaimer: PROTOTYPE_DISCLAIMER,
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
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}
