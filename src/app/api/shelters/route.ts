import { NextRequest, NextResponse } from "next/server";
import { SheltersRepository } from "@/lib/db/shelters.repository";
import { SheltersApiResponse } from "@/types/shelter";

export async function GET(request: NextRequest): Promise<NextResponse<SheltersApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get("sector") || "tawang";

    const shelters = await SheltersRepository.getShelters(sector);

    return NextResponse.json({
      success: true,
      count: shelters.length,
      data: shelters,
      sector,
      disclaimer: "DEMO / PROTOTYPE SHELTER DIRECTORY • SEEDED RESCUE BASES",
    });
  } catch (err) {
    console.error("[API GET /api/shelters] Error:", err);
    return NextResponse.json(
      {
        success: false,
        count: 0,
        data: [],
        sector: "tawang",
        disclaimer: "Internal server error retrieving shelters",
      },
      { status: 500 }
    );
  }
}
