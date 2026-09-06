import { NextRequest, NextResponse } from "next/server";
import { SheltersRepository } from "@/lib/db/shelters.repository";
import { ReportsRepository } from "@/lib/db/reports.repository";
import { SensorsRepository } from "@/lib/db/sensors.repository";
import { LandslideInventoryService } from "@/lib/data/landslide-inventory.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get("sector") || "tawang";

    const [shelters, reports, sensors] = await Promise.all([
      SheltersRepository.getShelters(sector),
      ReportsRepository.getReports({ limit: 20 }),
      SensorsRepository.getSensors(),
    ]);

    const historicalLandslides = LandslideInventoryService.getAllLandslides().slice(0, 30);

    // Risk zones metadata for sector
    const riskZones = [
      {
        id: "RZ-TW-01",
        name: "Zemithang-Lumla Slope Alpha",
        sector: "tawang",
        level: "Critical",
        fos: 0.92,
        saturation: "94.2%",
        color: "#b91c1c",
        fillColor: "#ef4444",
        coordinates: [
          [27.575, 91.838],
          [27.598, 91.842],
          [27.604, 91.868],
          [27.588, 91.878],
          [27.568, 91.862],
        ],
        description: "Active tension crack displacement detected near Lumla. Factor of Safety FoS < 1.0 (Severe Failure Risk).",
      },
      {
        id: "RZ-TW-02",
        name: "Tawang Ridge KM-14 Watch Zone",
        sector: "tawang",
        level: "Moderate",
        fos: 1.18,
        saturation: "78.0%",
        color: "#d97706",
        fillColor: "#f59e0b",
        coordinates: [
          [27.558, 91.815],
          [27.572, 91.822],
          [27.579, 91.842],
          [27.562, 91.838],
        ],
        description: "Elevated pore pressure from antecedent rainfall. Caution advised on cut slopes.",
      },
      {
        id: "RZ-GTK-01",
        name: "Teesta Valley Escarpment Alpha",
        sector: "gangtok",
        level: "Critical",
        fos: 0.88,
        saturation: "91.5%",
        color: "#b91c1c",
        fillColor: "#ef4444",
        coordinates: [
          [27.318, 88.588],
          [27.342, 88.598],
          [27.338, 88.625],
          [27.312, 88.618],
        ],
        description: "Active rockfall and debris accumulation along NH-10 riverbank cutting. Severe risk.",
      },
    ].filter((z) => sector === "all" || z.sector === sector);

    return NextResponse.json({
      success: true,
      sector,
      data: {
        riskZones,
        shelters,
        sensors,
        reports,
        historicalLandslides,
      },
      disclaimer: "GIS SPATIAL INTELLIGENCE AGGREGATION • HYBRID LIVE + SEEDED PROTOTYPE",
    });
  } catch (err) {
    console.error("[API GET /api/map] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error retrieving GIS map layers." },
      { status: 500 }
    );
  }
}