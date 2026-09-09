import { NextRequest, NextResponse } from "next/server";
import { ReportsRepository } from "@/lib/db/reports.repository";
import { UpdateReportStatusPayload, ResponseStatus } from "@/types/database";

interface RouteParams {
  params: Promise<{ reportId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { reportId } = await context.params;
    if (!reportId) {
      return NextResponse.json({ success: false, error: "Missing reportId parameter." }, { status: 400 });
    }

    const body = await request.json();
    const payload = body as UpdateReportStatusPayload;

    const validStatuses: ResponseStatus[] = [
      "SUBMITTED",
      "VERIFIED",
      "AUTHORITIES_NOTIFIED",
      "RESPONSE_ASSIGNED",
      "RESOLVED",
    ];

    if (payload.responseStatus && !validStatuses.includes(payload.responseStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Expected one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await ReportsRepository.updateReportStatus(reportId, payload);
    if (!result.report) {
      return NextResponse.json({ success: false, error: `Report '${reportId}' not found.` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reportId: result.report.reportId,
      data: result.report,
      history: result.history,
      message: `Report status updated to ${result.report.responseStatus}.`,
    });
  } catch (err: unknown) {
    console.error("[API PATCH /api/reports/[reportId]/status] Error:", err);
    return NextResponse.json({ success: false, error: "Internal server error updating report status." }, { status: 500 });
  }
}
