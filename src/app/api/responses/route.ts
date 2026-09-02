import { NextRequest, NextResponse } from "next/server";
import { responsesRepository, PROTOTYPE_RESPONSE_SOURCE } from "@/lib/db/responses.repository";
import { ResponsePriority, ResponseStatus, ResponseTeamType, CreateResponsePayload, ResponseListApiResponse } from "@/types/response";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";

export async function GET(request: NextRequest): Promise<NextResponse<ResponseListApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as ResponseStatus | null;
    const priorityParam = searchParams.get("priority") as ResponsePriority | null;
    const alertIdParam = searchParams.get("alertId");
    const reportIdParam = searchParams.get("reportId");
    const limitParam = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const { responses, storageMode } = await responsesRepository.listResponseAssignments({
      status: statusParam || undefined,
      priority: priorityParam || undefined,
      alertId: alertIdParam || undefined,
      reportId: reportIdParam || undefined,
      limit: limitParam,
    });

    const activeCount = responses.filter(
      (r) => r.status === "ASSIGNED" || r.status === "EN_ROUTE" || r.status === "ON_SITE" || r.status === "PENDING"
    ).length;

    return NextResponse.json(
      {
        success: true,
        data: responses,
        total: responses.length,
        activeCount,
        storageMode,
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
    console.error("[API /api/responses] Error listing responses:", error);
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

    const { alertId, reportId, location, team, priority, estimatedResponseMinutes, notes } = body;

    if (!alertId || !location || !team || !priority) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: alertId, location, team, priority.",
        },
        { status: 400 }
      );
    }

    const payload: CreateResponsePayload = {
      alertId: String(alertId),
      reportId: reportId ? String(reportId) : null,
      location: {
        name: String((location as { name?: string }).name || "North Eastern Region"),
        latitude: Number((location as { latitude?: number }).latitude) || 27.586,
        longitude: Number((location as { longitude?: number }).longitude) || 91.859,
      },
      team: {
        name: String((team as { name?: string }).name || "SDRF Response Unit"),
        type: ((team as { type?: string }).type as ResponseTeamType) || "GENERAL",
        baseStation: (team as { baseStation?: string }).baseStation,
        contactChannel: (team as { contactChannel?: string }).contactChannel,
      },
      priority: (priority as ResponsePriority) || "NORMAL",
      estimatedResponseMinutes: typeof estimatedResponseMinutes === "number" ? estimatedResponseMinutes : 15,
      notes: typeof notes === "string" ? notes : null,
    };

    const newResponse = await responsesRepository.createResponseAssignment(payload);

    return NextResponse.json(
      {
        success: true,
        data: newResponse,
        disclaimer: PROTOTYPE_DISCLAIMER,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[API /api/responses] Error creating response:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
