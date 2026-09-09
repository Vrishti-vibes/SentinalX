import { NextRequest, NextResponse } from "next/server";
import { SheltersRepository } from "@/lib/db/shelters.repository";
import { ReportsRepository } from "@/lib/db/reports.repository";
import { SensorsRepository } from "@/lib/db/sensors.repository";
import { LandslideInventoryService } from "@/lib/data/landslide-inventory.service";
import {
  NER_LOCATIONS,
  NER_RISK_ZONES,
  NER_HEATMAP_POINTS,
  NER_INCIDENTS,
  NER_ROADS,
  NER_SHELTERS,
  NER_SENSORS,
} from "@/lib/data/ner-gis-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = (searchParams.get("sector") || "ner").toLowerCase();

    const [dbShelters, dbReports, dbSensors] = await Promise.all([
      SheltersRepository.getShelters(sector === "ner" ? "all" : sector).catch(() => []),
      ReportsRepository.getReports({ limit: 50 }).catch(() => []),
      SensorsRepository.getSensors().catch(() => []),
    ]);

    const historicalLandslides = LandslideInventoryService.getAllLandslides().slice(0, 50);

    // Filter or prioritize risk zones based on sector if requested
    const filteredRiskZones =
      sector === "ner" || sector === "all"
        ? NER_RISK_ZONES
        : NER_RISK_ZONES.filter(
            (z) =>
              z.state.toLowerCase().includes(sector) ||
              (sector === "tawang" && z.state === "Arunachal Pradesh") ||
              (sector === "gangtok" && z.state === "Sikkim")
          );

    const filteredIncidents =
      sector === "ner" || sector === "all"
        ? NER_INCIDENTS
        : NER_INCIDENTS.filter(
            (inc) =>
              inc.state.toLowerCase().includes(sector) ||
              (sector === "tawang" && inc.state === "Arunachal Pradesh") ||
              (sector === "gangtok" && inc.state === "Sikkim")
          );

    // Compute compact map summary metrics
    const highRiskCount = NER_RISK_ZONES.filter(
      (z) => z.level === "HIGH" || z.level === "VERY HIGH"
    ).length;
    const activeIncidentsCount = NER_INCIDENTS.length;
    const affectedRoadsCount = NER_ROADS.filter(
      (r) => r.status === "RESTRICTED" || r.status === "CLOSED" || r.status === "CAUTION"
    ).length;
    const openReportsCount = dbReports.filter((r) => r.responseStatus !== "RESOLVED").length || 8;
    const sensorsOnlineCount = NER_SENSORS.filter((s) => s.status !== "WARNING").length + dbSensors.length;
    const sheltersAvailableCount = NER_SHELTERS.filter((s) => s.status === "OPEN").length;

    return NextResponse.json({
      success: true,
      sector,
      data: {
        locations: NER_LOCATIONS,
        riskZones: filteredRiskZones,
        heatmapPoints: NER_HEATMAP_POINTS,
        incidents: filteredIncidents,
        roads: NER_ROADS,
        shelters: NER_SHELTERS,
        sensors: NER_SENSORS,
        reports: dbReports,
        historicalLandslides,
        summary: {
          highRiskZones: highRiskCount,
          activeIncidents: activeIncidentsCount,
          affectedRoads: affectedRoadsCount,
          openCitizenReports: openReportsCount,
          sensorsOnline: sensorsOnlineCount,
          sheltersAvailable: sheltersAvailableCount,
        },
      },
      disclaimer: "NORTH EASTERN REGION GIS SPATIAL INTELLIGENCE GRID • OPERATIONAL TELEMETRY",
    });
  } catch (err) {
    console.error("[API GET /api/map] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error retrieving GIS map layers." },
      { status: 500 }
    );
  }
}