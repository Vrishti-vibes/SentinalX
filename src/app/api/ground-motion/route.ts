import { NextRequest, NextResponse } from "next/server";
import { fetchNormalizedGroundMotion } from "@/lib/services/ground-motion.service";
import { GroundMotionApiResponse } from "@/types/ground-motion";

export async function GET(request: NextRequest): Promise<NextResponse<GroundMotionApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const minMagParam = searchParams.get("minMag");

    const days = daysParam ? parseInt(daysParam, 10) : 7;
    const minMag = minMagParam ? parseFloat(minMagParam) : 1.5;

    const data = await fetchNormalizedGroundMotion(
      !isNaN(days) ? days : 7,
      !isNaN(minMag) ? minMag : 1.5
    );

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[API /api/ground-motion] Handler error:", error);
    return NextResponse.json(
      {
        success: false,
        data: (await fetchNormalizedGroundMotion()) as unknown as import("@/types/ground-motion").GroundMotionResponse,
        error: "Failed to process ground-motion request",
      },
      { status: 500 }
    );
  }
}
