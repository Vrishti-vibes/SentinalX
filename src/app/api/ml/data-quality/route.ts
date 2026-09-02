import { NextResponse } from "next/server";
import { DataQualityService } from "@/lib/data/data-quality.service";

export async function GET() {
  try {
    const report = DataQualityService.generateQualityReport();
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err: unknown) {
    console.error("[API /api/ml/data-quality] Error generating report:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate ML data quality report",
      },
      { status: 500 }
    );
  }
}
