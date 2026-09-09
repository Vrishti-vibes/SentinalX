import { NextRequest, NextResponse } from "next/server";
import { ReportsRepository } from "@/lib/db/reports.repository";
import { UpdateReportStatusPayload, ResponseStatus, VerificationStatus } from "@/types/database";

interface RouteParams {
  params: Promise<{ reportId: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { reportId } = await context.params;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "Missing reportId parameter." },
        { status: 400 }
      );
    }

    const { report, history } = await ReportsRepository.getReportById(reportId);

    if (!report) {
      return NextResponse.json(
        { success: false, error: `Report '${reportId}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: report.reportId,
      data: report,
      history,
      source: "SentinalX Field Incident Intelligence Pipeline",
    });
  } catch (err: unknown) {
    console.error("[API GET /api/reports/[reportId]] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error retrieving report details." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { reportId } = await context.params;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "Missing reportId parameter." },
        { status: 400 }
      );
    }

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

    const payload = body as UpdateReportStatusPayload;

    const validResponseStatuses: ResponseStatus[] = [
      "NEW",
      "UNDER_REVIEW",
      "VERIFIED",
      "DISPATCHED",
      "ON_SITE",
      "RESOLVED",
      "REJECTED",
      "SUBMITTED",
      "AUTHORITIES_NOTIFIED",
      "RESPONSE_ASSIGNED",
    ];
    if (payload.responseStatus && !validResponseStatuses.includes(payload.responseStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid responseStatus. Expected one of: ${validResponseStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validVerificationStatuses: VerificationStatus[] = [
      "PENDING_VERIFICATION",
      "VERIFIED",
      "REJECTED",
    ];
    if (payload.verificationStatus && !validVerificationStatuses.includes(payload.verificationStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid verificationStatus. Expected one of: ${validVerificationStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = await ReportsRepository.updateReportStatus(reportId, payload);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    if (!result.report) {
      return NextResponse.json(
        { success: false, error: `Report '${reportId}' not found.` },
        { status: 404 }
      );
    }

    const { report, history } = result;

    return NextResponse.json({
      success: true,
      reportId: report.reportId,
      data: report,
      history,
      message: `Report ${report.reportId} status successfully updated to ${report.responseStatus}.`,
      disclaimer: "DEMO / PROTOTYPE DATA • PERSISTENT BACKEND REPOSITORY",
    });
  } catch (err: unknown) {
    console.error("[API PATCH /api/reports/[reportId]] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error updating report status." },
      { status: 500 }
    );
  }
}
