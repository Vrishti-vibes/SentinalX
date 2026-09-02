import { NextRequest, NextResponse } from "next/server";
import { responsesRepository } from "@/lib/db/responses.repository";
import { responseService } from "@/lib/services/response.service";
import { ResponseStatus } from "@/types/response";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
): Promise<NextResponse> {
  try {
    const { responseId } = await params;
    const response = await responsesRepository.getResponseAssignment(responseId);

    if (!response) {
      return NextResponse.json(
        { success: false, error: "Response assignment not found.", disclaimer: PROTOTYPE_DISCLAIMER },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: response, disclaimer: PROTOTYPE_DISCLAIMER });
  } catch (error: unknown) {
    console.error("[API /api/responses/[responseId]] Error getting response:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
): Promise<NextResponse> {
  try {
    const { responseId } = await params;
    let body: Record<string, unknown> = {};

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const { status, notes, teamName, estimatedResponseMinutes } = body;
    const validStatuses: ResponseStatus[] = [
      "PENDING",
      "ASSIGNED",
      "EN_ROUTE",
      "ON_SITE",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!status || !validStatuses.includes(status as ResponseStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = await responseService.updateResponseStatus(responseId, status as ResponseStatus, {
      notes: typeof notes === "string" ? notes : undefined,
      teamName: typeof teamName === "string" ? teamName : undefined,
      estimatedResponseMinutes:
        typeof estimatedResponseMinutes === "number" ? estimatedResponseMinutes : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, disclaimer: PROTOTYPE_DISCLAIMER },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data, disclaimer: PROTOTYPE_DISCLAIMER });
  } catch (error: unknown) {
    console.error("[API /api/responses/[responseId]] Error updating response:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
