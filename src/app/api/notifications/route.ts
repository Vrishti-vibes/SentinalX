import { NextRequest, NextResponse } from "next/server";
import { NotificationsRepository } from "@/lib/db/notifications.repository";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const deliveries = await NotificationsRepository.getDeliveries(limit);

    return NextResponse.json(
      {
        success: true,
        data: deliveries,
        total: deliveries.length,
        source: "notification_deliveries table",
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
