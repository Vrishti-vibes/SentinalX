import { NextRequest, NextResponse } from "next/server";
import { generateAiRiskExplanation } from "@/lib/services/ai-risk-explainer.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "Tawang Sector";
    const score = parseFloat(searchParams.get("score") || "78");
    const level = searchParams.get("level") || "HIGH";
    const rainfall = parseFloat(searchParams.get("rainfall") || "38.2");
    const soilMoisture = parseFloat(searchParams.get("soilMoisture") || "84.5");
    const porePressure = parseFloat(searchParams.get("porePressure") || "42.1");
    const threat = searchParams.get("threat") || "Elevated pore-water pressure on steep slope";

    const explanation = await generateAiRiskExplanation({
      locationName: location,
      numericalScore: score,
      riskLevel: level,
      rainfall24h: rainfall,
      soilMoisture,
      porePressure,
      primaryThreat: threat,
    });

    return NextResponse.json({
      success: true,
      data: explanation,
    });
  } catch (err: unknown) {
    console.error("[API GET /api/ai/risk-explanation] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate risk explanation." },
      { status: 500 }
    );
  }
}
