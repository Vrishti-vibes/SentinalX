import { NextRequest, NextResponse } from "next/server";
import { resolveRiskLocation, gatherUnifiedRiskInputs } from "@/lib/services/risk-data.service";
import { computeLandslideRisk, PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";
import { alertService } from "@/lib/services/alert.service";
import { AlertEvaluateResponse } from "@/types/alert";
import { RiskInputs } from "@/types/risk";

export async function POST(request: NextRequest): Promise<NextResponse<AlertEvaluateResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const locParam = searchParams.get("loc");
    const latParam = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lonParam = searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : null;
    const cooldownParam = searchParams.get("cooldown") ? parseInt(searchParams.get("cooldown")!, 10) : 30;

    let body: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text && text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty or invalid JSON is treated as empty payload
    }

    const locationName = (body.locationName as string) || (body.location as { name?: string })?.name || locParam;
    const latitude = (body.latitude as number) ?? (body.location as { latitude?: number })?.latitude ?? latParam;
    const longitude = (body.longitude as number) ?? (body.location as { longitude?: number })?.longitude ?? lonParam;

    // 1. Resolve Location Context
    const location = resolveRiskLocation(locationName, latitude, longitude, locationName);

    // 2. Gather Unified Multi-Source Risk Inputs
    const overrides = (body.manualOverrides || body) as Partial<RiskInputs>;
    const aggregated = await gatherUnifiedRiskInputs(location, overrides);

    // 3. Compute Risk Intelligence
    const riskResult = computeLandslideRisk(aggregated.inputs, aggregated.location, aggregated.sourceHealth);

    // 4. Evaluate Threshold & Deduplicate Alerts
    const evaluateResult = await alertService.evaluateRiskForAlert(riskResult, cooldownParam);

    return NextResponse.json(evaluateResult, { status: 200 });
  } catch (error: unknown) {
    console.error("[API /api/alerts/evaluate] Evaluation error:", error);
    return NextResponse.json(
      {
        success: false,
        alertGenerated: false,
        alert: null,
        riskResult: null,
        reason: "Internal server error during risk & alert evaluation.",
        notificationsQueued: 0,
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}

// Also support GET for quick health/trigger check
export async function GET(request: NextRequest): Promise<NextResponse<AlertEvaluateResponse>> {
  return POST(request);
}
