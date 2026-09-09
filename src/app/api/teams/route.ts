import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

const PROTOTYPE_TEAMS = [
  {
    name: "Tawang Response Unit",
    sector: "Tawang Sector",
    status: "STANDBY",
    contactNumber: "+91-3794-222-101",
    defaultResponseMinutes: 20,
  },
  {
    name: "Gangtok Highway Response Unit",
    sector: "Gangtok Sector",
    status: "STANDBY",
    contactNumber: "+91-3592-202-202",
    defaultResponseMinutes: 25,
  },
  {
    name: "Shillong Field Unit",
    sector: "Shillong Sector",
    status: "DISPATCHED",
    contactNumber: "+91-3642-224-303",
    defaultResponseMinutes: 15,
  },
  {
    name: "Guwahati Emergency Unit",
    sector: "Guwahati / Haflong Sector",
    status: "ON_SITE",
    contactNumber: "+91-3612-335-404",
    defaultResponseMinutes: 30,
  },
  {
    name: "Kohima Terrain Unit",
    sector: "Kohima Sector",
    status: "STANDBY",
    contactNumber: "+91-3702-290-505",
    defaultResponseMinutes: 20,
  },
];

export async function GET() {
  if (isDatabaseConfigured) {
    try {
      const teams = await prisma.responseTeam.findMany({
        orderBy: { name: "asc" },
      });
      if (teams && teams.length > 0) {
        return NextResponse.json({
          success: true,
          count: teams.length,
          data: teams,
          source: "Supabase PostgreSQL",
        });
      }
    } catch (err) {
      console.warn("[API /api/teams] Prisma findMany failed, returning prototype teams:", err);
    }
  }

  return NextResponse.json({
    success: true,
    count: PROTOTYPE_TEAMS.length,
    data: PROTOTYPE_TEAMS,
    source: isDatabaseConfigured ? "Supabase PostgreSQL" : "DATABASE_NOT_CONFIGURED",
  });
}
