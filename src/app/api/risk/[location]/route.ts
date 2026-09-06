import { NextRequest, NextResponse } from "next/server";
import {
  computeLandslideRisk,
  PROTOTYPE_DISCLAIMER,
} from "@/lib/services/risk.service";
import {
  resolveRiskLocation,
  gatherUnifiedRiskInputs,
} from "@/lib/services/risk-data.service";
import { RiskComputeApiResponse } from "@/types/risk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ location: string }> }
): Promise<NextResponse<RiskComputeApiResponse>> {
  try {
    const { location: locParam } = await params;
    const location = resolveRiskLocation(locParam, null, null, locParam);

    const aggregated = await gatherUnifiedRiskInputs(location, {});
    const result = computeLandslideRisk(aggregated.inputs, aggregated.location, aggregated.sourceHealth);

    return NextResponse.json({
      success: true,
      result,
      disclaimer: PROTOTYPE_DISCLAIMER,
    });
  } catch (error: unknown) {
    console.error("[API GET /api/risk/[location]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        result: {} as unknown as import("@/types/risk").RiskEngineResult,
        error: "Internal server error while computing risk score for location.",
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}