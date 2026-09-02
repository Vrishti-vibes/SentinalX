import { NextRequest, NextResponse } from "next/server";
import { alertsRepository, PROTOTYPE_ALERT_SOURCE } from "@/lib/db/alerts.repository";
import { AlertListApiResponse, AlertStatus, AlertSeverity, AlertType } from "@/types/alert";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";
import { notificationService } from "@/lib/services/notification.service";

export async function GET(request: NextRequest): Promise<NextResponse<AlertListApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as AlertStatus | null;
    const severityParam = searchParams.get("severity") as AlertSeverity | null;
    const locParam = searchParams.get("loc") || searchParams.get("locationName");
    const limitParam = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const { alerts, storageMode } = await alertsRepository.listAlerts({
      status: statusParam || undefined,
      severity: severityParam || undefined,
      locationName: locParam || undefined,
      limit: limitParam,
    });

    const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;

    return NextResponse.json(
      {
        success: true,
        data: alerts,
        total: alerts.length,
        activeCount,
        storageMode,
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=10",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[API /api/alerts] Error listing alerts:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        total: 0,
        activeCount: 0,
        storageMode: "DEMO_IN_MEMORY",
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const { type, severity, title, message, locationName, latitude, longitude, riskScore, riskLevel, primaryThreat, triggeredBy } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and message are required." },
        { status: 400 }
      );
    }

    const alert = await alertsRepository.createAlert({
      type: (type as AlertType) || "LANDSLIDE_RISK",
      severity: (severity as AlertSeverity) || "WATCH",
      title: String(title),
      message: String(message),
      location: {
        name: String(locationName || "North Eastern Region"),
        latitude: typeof latitude === "number" ? latitude : 27.586,
        longitude: typeof longitude === "number" ? longitude : 91.859,
      },
      riskScore: typeof riskScore === "number" ? riskScore : null,
      riskLevel: typeof riskLevel === "string" ? riskLevel : null,
      primaryThreat: typeof primaryThreat === "string" ? primaryThreat : null,
      triggeredBy: Array.isArray(triggeredBy) ? (triggeredBy as string[]) : ["Manual Alert Creation"],
      source: PROTOTYPE_ALERT_SOURCE,
    });

    notificationService.queueAlertNotifications(alert);

    return NextResponse.json({ success: true, data: alert, disclaimer: PROTOTYPE_DISCLAIMER }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /api/alerts] Error creating alert:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
