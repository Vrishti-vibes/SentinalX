/**
 * SentinalX Risk-Aware Road Routing API Endpoint
 * Phase 18: Public OSRM Road Routing with Hazard Layer
 *
 * GET /api/routes?fromLat=...&fromLon=...&toLat=...&toLon=...
 */

import { NextRequest, NextResponse } from "next/server";
import { RoutingService } from "@/lib/services/routing.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromLatStr = searchParams.get("fromLat");
    const fromLonStr = searchParams.get("fromLon");
    const toLatStr = searchParams.get("toLat");
    const toLonStr = searchParams.get("toLon");

    // Missing parameters validation
    if (!fromLatStr || !fromLonStr || !toLatStr || !toLonStr) {
      return NextResponse.json(
        {
          error: "Missing required query parameters: fromLat, fromLon, toLat, toLon",
          example: "/api/routes?fromLat=27.586&fromLon=91.859&toLat=27.592&toLon=91.875",
        },
        { status: 400 }
      );
    }

    const fromLat = parseFloat(fromLatStr);
    const fromLon = parseFloat(fromLonStr);
    const toLat = parseFloat(toLatStr);
    const toLon = parseFloat(toLonStr);

    // Coordinate validation
    const validation = RoutingService.validateCoordinates(fromLat, fromLon, toLat, toLon);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid coordinates" },
        { status: 400 }
      );
    }

    const originName = searchParams.get("originName") || undefined;
    const destName = searchParams.get("destName") || undefined;
    const mode = (searchParams.get("mode") === "walking" ? "WALKING" : "DRIVING") as "DRIVING" | "WALKING";

    const routeData = await RoutingService.computeSafeRoute(
      fromLat,
      fromLon,
      toLat,
      toLon,
      { originName, destName, travelMode: mode }
    );

    return NextResponse.json({
      success: true,
      data: routeData,
    });
  } catch (error) {
    console.error("Error in /api/routes:", error);
    return NextResponse.json(
      {
        error: "Internal server error while computing risk-aware safe route",
      },
      { status: 500 }
    );
  }
}
