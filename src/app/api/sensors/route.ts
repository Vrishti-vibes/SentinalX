import { NextRequest, NextResponse } from "next/server";
import { SensorsRepository } from "@/lib/db/sensors.repository";
import { CreateSensorReadingPayload } from "@/types/database";

export async function GET() {
  try {
    const sensors = await SensorsRepository.getSensors();
    return NextResponse.json({
      success: true,
      count: sensors.length,
      data: sensors,
      disclaimer: "DEMO SENSORS • PROTOTYPE GEOTECHNICAL GRID",
    });
  } catch (err: unknown) {
    console.error("[API GET /api/sensors] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve sensor readings." },
      { status: 500 }
    );
  }
}

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

    const payload = body as Partial<CreateSensorReadingPayload>;

    if (!payload.sensorId || typeof payload.sensorId !== "string") {
      return NextResponse.json(
        { success: false, error: "Field 'sensorId' is required and must be a string." },
        { status: 400 }
      );
    }

    const numericFields = ["soilMoisture", "porePressure", "tiltAngle", "rainfall"] as const;
    for (const field of numericFields) {
      if (payload[field] === undefined || typeof payload[field] !== "number") {
        return NextResponse.json(
          { success: false, error: `Field '${field}' is required and must be a valid number.` },
          { status: 400 }
        );
      }
    }

    const created = await SensorsRepository.recordSensorReading({
      sensorId: payload.sensorId,
      stationName: payload.stationName,
      state: payload.state,
      latitude: payload.latitude,
      longitude: payload.longitude,
      soilMoisture: payload.soilMoisture!,
      porePressure: payload.porePressure!,
      tiltAngle: payload.tiltAngle!,
      rainfall: payload.rainfall!,
      status: payload.status,
    });

    return NextResponse.json(
      {
        success: true,
        data: created,
        message: `Sensor reading recorded for node ${created.sensorId}.`,
        disclaimer: "DEMO SENSORS • PROTOTYPE GEOTECHNICAL GRID",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[API POST /api/sensors] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error recording sensor reading." },
      { status: 500 }
    );
  }
}
