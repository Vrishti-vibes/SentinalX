import { NextRequest, NextResponse } from "next/server";
import { RiskRepository } from "@/lib/db/risk.repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || searchParams.get("loc") || "Tawang";

    const latest = await RiskRepository.getLatestRisk(location);

    if (!latest) {
      // If none in table yet, trigger computation
      const baseUrl = request.nextUrl.origin;
      const calcRes = await fetch(`${baseUrl}/api/risk?location=${encodeURIComponent(location)}`);
      if (calcRes.ok) {
        const afterCalc = await RiskRepository.getLatestRisk(location);
        if (afterCalc) {
          return NextResponse.json({ success: true, data: afterCalc });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: latest,
      location,
      source: "risk_assessments table",
    });
  } catch (err: unknown) {
    console.error("[API GET /api/risk/latest] Error:", err);
    return NextResponse.json({ success: false, error: "Internal server error querying latest risk." }, { status: 500 });
  }
}
