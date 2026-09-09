import { NextRequest, NextResponse } from "next/server";
import { ReportsRepository } from "@/lib/db/reports.repository";
import { CreateReportPayload, ResponseStatus } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ResponseStatus | null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    const reports = await ReportsRepository.getReports({
      status: status || undefined,
      limit: limit && !isNaN(limit) ? limit : undefined,
    });

    return NextResponse.json({
      success: true,
      count: reports.length,
      data: reports,
      source: "SentinalX Field Incident Intelligence Pipeline",
    });
  } catch (err: unknown) {
    console.error("[API GET /api/reports] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve incident reports." },
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

    const payload = body as Partial<CreateReportPayload>;

    // Required field validation
    if (!payload.description || typeof payload.description !== "string" || payload.description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Field 'description' is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const validHazardTypes = ["Landslide", "Flooding", "Road Blockage", "Other Hazard"];
    if (payload.hazardType && !validHazardTypes.includes(payload.hazardType)) {
      return NextResponse.json(
        { success: false, error: `Invalid hazardType. Expected one of: ${validHazardTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const createdReport = await ReportsRepository.createReport({
      clientReportId: payload.clientReportId || null,
      hazardType: payload.hazardType || "Landslide",
      locationName: payload.locationName || "Tawang Sector, North Eastern Region",
      latitude: typeof payload.latitude === "number" ? payload.latitude : 27.586,
      longitude: typeof payload.longitude === "number" ? payload.longitude : 91.859,
      severity: payload.severity,
      description: payload.description.trim(),
      photoUrl: payload.photoUrl,
    });

    return NextResponse.json(
      {
        success: true,
        reportId: createdReport.reportId,
        data: createdReport,
        message: "Field report logged and forwarded to response system.",
        source: "SentinalX Field Incident Intelligence Pipeline",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[API POST /api/reports] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error creating field report." },
      { status: 500 }
    );
  }
}
