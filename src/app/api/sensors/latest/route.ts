import { NextRequest, NextResponse } from "next/server";
import { SensorsRepository } from "@/lib/db/sensors.repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || searchParams.get("loc") || undefined;

    const latest = await SensorsRepository.getLatestSensor(location);

    if (!latest) {
      return NextResponse.json(
        { success: false, error: "No sensor readings available for target location." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: latest,
      location: location || "All sectors",
      source: "sensor_readings table",
    });
  } catch (err: unknown) {
    console.error("[API GET /api/sensors/latest] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error querying latest sensor reading." },
      { status: 500 }
    );
  }
}
