import { NextRequest, NextResponse } from "next/server";
import { alertsRepository } from "@/lib/db/alerts.repository";
import { AlertStatus } from "@/types/alert";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
): Promise<NextResponse> {
  try {
    const { alertId } = await params;
    const alert = await alertsRepository.getAlert(alertId);

    if (!alert) {
      return NextResponse.json({ success: false, error: "Alert not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: alert, disclaimer: PROTOTYPE_DISCLAIMER });
  } catch (error: unknown) {
    console.error("[API /api/alerts/[alertId]] Error getting alert:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
): Promise<NextResponse> {
  try {
    const { alertId } = await params;
    let body: Record<string, unknown> = {};

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const { status } = body;
    const validStatuses: AlertStatus[] = ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"];

    if (!status || !validStatuses.includes(status as AlertStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updated = await alertsRepository.updateAlertStatus(alertId, status as AlertStatus);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Alert not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated, disclaimer: PROTOTYPE_DISCLAIMER });
  } catch (error: unknown) {
    console.error("[API /api/alerts/[alertId]] Error updating alert:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
