import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification.service";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const notifications = notificationService.listNotifications(limit);

    return NextResponse.json(
      {
        success: true,
        data: notifications,
        total: notifications.length,
        deliveryModel: "PROTOTYPE_OUTBOX (In-App active; SMS/Push simulated)",
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=5",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[API /api/notifications] Error listing notifications:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
