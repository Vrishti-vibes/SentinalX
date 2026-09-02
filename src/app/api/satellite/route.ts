import { NextRequest, NextResponse } from "next/server";
import { searchCopernicusCatalog } from "@/lib/services/satellite.service";
import { SatelliteApiResponse } from "@/types/satellite";

export async function GET(request: NextRequest): Promise<NextResponse<SatelliteApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const daysParam = searchParams.get("days");

    const lat = latParam ? parseFloat(latParam) : undefined;
    const lon = lonParam ? parseFloat(lonParam) : undefined;
    const days = daysParam ? parseInt(daysParam, 10) : undefined;

    const data = await searchCopernicusCatalog(
      lat !== undefined && !isNaN(lat) ? lat : undefined,
      lon !== undefined && !isNaN(lon) ? lon : undefined,
      days !== undefined && !isNaN(days) ? days : undefined
    );

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[API /api/satellite] Handler error:", error);
    return NextResponse.json(
      {
        success: false,
        data: (await searchCopernicusCatalog()) as unknown as import("@/types/satellite").SatelliteCatalogResponse,
        error: "Failed to process satellite catalog query",
      },
      { status: 500 }
    );
  }
}
