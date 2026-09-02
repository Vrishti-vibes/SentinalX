import { NextResponse } from "next/server";
import { getDbConfig } from "@/lib/db/client";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";

export async function GET(): Promise<NextResponse> {
  const dbConfig = getDbConfig();

  return NextResponse.json(
    {
      success: true,
      serverTime: new Date().toISOString(),
      serverStatus: "HEALTHY",
      storageMode: dbConfig.isConfigured ? "SUPABASE_POSTGRES" : "DEMO_IN_MEMORY",
      syncEndpointActive: true,
      note: "Client connectivity is determined client-side via navigator.onLine. This endpoint verifies server sync availability.",
      disclaimer: PROTOTYPE_DISCLAIMER,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
