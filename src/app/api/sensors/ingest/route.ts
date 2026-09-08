import { NextRequest, NextResponse } from "next/server";
import { SensorsRepository } from "@/lib/db/sensors.repository";
import { CreateSensorReadingPayload } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Request payload must be a JSON object." },
        { status: 400 }
      );
    }

    const payload = body as Partial<CreateSensorReadingPayload & {
      tilt?: number;
      groundMotion?: number;
      battery?: number;
      timestamp?: string;
    }>;

    if (!payload.sensorId || typeof payload.sensorId !== "string") {
      return NextResponse.json(
        { success: false, error: "Field 'sensorId' is required and must be a valid string identifier." },
        { status: 400 }
      );
    }

    const soilMoisture = typeof payload.soilMoisture === "number" ? payload.soilMoisture : 84.0;
    const porePressure = typeof payload.porePressure === "number" ? payload.porePressure : 42.0;
    const tiltAngle = typeof payload.tiltAngle === "number" 
      ? payload.tiltAngle 
      : typeof payload.tilt === "number" ? payload.tilt : 4.5;
    const rainfall = typeof payload.rainfall === "number" ? payload.rainfall : 12.5;

    const created = await SensorsRepository.recordSensorReading({
      sensorId: payload.sensorId,
      stationName: payload.stationName || ("Geotechnical IoT Node " + payload.sensorId),
      state: payload.state || "Arunachal Pradesh",
      latitude: payload.latitude || 27.586,
      longitude: payload.longitude || 91.859,
      soilMoisture,
      porePressure,
      tiltAngle,
      rainfall,
      status: payload.status || "ONLINE",
    });

    const isThresholdCrossed = porePressure > 50.0 || tiltAngle > 8.0 || soilMoisture > 85.0;

    return NextResponse.json(
      {
        success: true,
        data: created,
        thresholdAlertTriggered: isThresholdCrossed,
        telemetrySummary: {
          sensorId: created.sensorId,
          status: created.status,
          soilMoisture: created.soilMoisture + "%",
          porePressure: created.porePressure + " kPa",
          tiltAngle: created.tiltAngle + " deg",
          rainfall24h: created.rainfall + " mm",
          ingestedAt: created.timestamp,
        },
        source: "SentinalX High-Frequency IoT Gateway (MQTT / HTTP Ingestion Grid)",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[API POST /api/sensors/ingest] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error processing IoT sensor telemetry." },
      { status: 500 }
    );
  }
}
