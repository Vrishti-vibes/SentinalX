import { NextRequest, NextResponse } from "next/server";
import { LandslideInventoryService } from "@/lib/data/landslide-inventory.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || undefined;
    const yearStr = searchParams.get("year");
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const source = searchParams.get("source") || undefined;

    const records = LandslideInventoryService.getNerLandslides({
      state,
      year,
      source,
    });

    const stateCounts = LandslideInventoryService.getNerStateCounts();
    const sourceCounts = LandslideInventoryService.getSourceCounts();

    return NextResponse.json({
      success: true,
      count: records.length,
      data: records,
      metadata: {
        stateCounts,
        sourceCounts,
        region: "North Eastern Region (NER)",
      },
    });
  } catch (err: unknown) {
    console.error("[API /api/landslides/inventory] Error retrieving inventory:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve historical landslide inventory",
      },
      { status: 500 }
    );
  }
}
