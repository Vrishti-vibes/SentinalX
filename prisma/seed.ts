// Prisma Seed Script for SentinalX
// Seeds Response Teams, Incident Reports, Status History, and Report Assignments

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RESPONSE_TEAMS = [
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

const SEED_REPORTS = [
  {
    reportId: "SX-LS-2048",
    hazardType: "Landslide",
    locationName: "Tawang Sector, North Eastern Region",
    latitude: 27.586,
    longitude: 91.859,
    severity: 4,
    description: "Observed active rockfall and debris accumulation on highway shoulder near Km 4. Road partially blocked.",
    photoUrl: "https://demo.sentinalx.ner/evidence/Hazard_Evidence_Tawang_Km4.jpg",
    verificationStatus: "PENDING_VERIFICATION",
    responseStatus: "SUBMITTED",
    assignedTeamName: null,
    estimatedResponseMinutes: 20,
    history: [
      {
        status: "SUBMITTED",
        message: "Incident reported by citizen via field interface. Awaiting authority review.",
        minutesAgo: 35,
      },
    ],
  },
  {
    reportId: "SX-FL-2049",
    hazardType: "Flooding",
    locationName: "Gangtok Sector, Sikkim",
    latitude: 27.331,
    longitude: 88.613,
    severity: 4,
    description: "Flash flood water overtopping NH-10 culvert at Teesta lowlands. Silt and mudflow impeding vehicles.",
    photoUrl: null,
    verificationStatus: "VERIFIED",
    responseStatus: "VERIFIED",
    assignedTeamName: null,
    estimatedResponseMinutes: 25,
    history: [
      {
        status: "SUBMITTED",
        message: "Report logged via citizen field interface.",
        minutesAgo: 120,
      },
      {
        status: "VERIFIED",
        message: "Cross-verified with Gangtok Geotechnical Sensor telemetry.",
        minutesAgo: 95,
      },
    ],
  },
  {
    reportId: "SX-RB-2050",
    hazardType: "Road Blockage",
    locationName: "Shillong Sector, Meghalaya",
    latitude: 25.578,
    longitude: 91.893,
    severity: 3,
    description: "Transverse tension fissure and road subsidence near Km 18 bypass. Single-lane bottleneck.",
    photoUrl: null,
    verificationStatus: "VERIFIED",
    responseStatus: "DISPATCHED",
    assignedTeamName: "Shillong Field Unit",
    estimatedResponseMinutes: 15,
    history: [
      {
        status: "SUBMITTED",
        message: "Report logged via citizen field interface.",
        minutesAgo: 180,
      },
      {
        status: "VERIFIED",
        message: "Road inspector confirmed transverse fissure.",
        minutesAgo: 150,
      },
      {
        status: "DISPATCHED",
        message: "Shillong Field Unit dispatched from district base with traffic barriers.",
        minutesAgo: 120,
      },
    ],
  },
  {
    reportId: "SX-LS-2051",
    hazardType: "Landslide",
    locationName: "Haflong Sector, Assam",
    latitude: 25.176,
    longitude: 93.018,
    severity: 5,
    description: "Major mudslide blocking Dima Hasao railway bypass. Heavy debris flow across road cutting.",
    photoUrl: null,
    verificationStatus: "VERIFIED",
    responseStatus: "ON_SITE",
    assignedTeamName: "Guwahati Emergency Unit",
    estimatedResponseMinutes: 0,
    history: [
      {
        status: "SUBMITTED",
        message: "Report logged via citizen field interface.",
        minutesAgo: 240,
      },
      {
        status: "VERIFIED",
        message: "Verified critical slide area. High volume debris flow.",
        minutesAgo: 210,
      },
      {
        status: "DISPATCHED",
        message: "Guwahati Emergency Unit deployed with heavy earthmovers.",
        minutesAgo: 180,
      },
      {
        status: "ON_SITE",
        message: "Guwahati Emergency Unit on site. Operations underway.",
        minutesAgo: 60,
      },
    ],
  },
  {
    reportId: "SX-LS-2052",
    hazardType: "Other Hazard",
    locationName: "Kohima Sector, Nagaland",
    latitude: 25.675,
    longitude: 94.108,
    severity: 2,
    description: "Retaining wall surface fracture near residential hill slope. Minor runoff channel diverted.",
    photoUrl: null,
    verificationStatus: "VERIFIED",
    responseStatus: "RESOLVED",
    assignedTeamName: "Kohima Terrain Unit",
    estimatedResponseMinutes: 0,
    history: [
      {
        status: "SUBMITTED",
        message: "Report logged via citizen field interface.",
        minutesAgo: 360,
      },
      {
        status: "VERIFIED",
        message: "Verified minor slope distress.",
        minutesAgo: 330,
      },
      {
        status: "DISPATCHED",
        message: "Kohima Terrain Unit dispatched for stabilization.",
        minutesAgo: 300,
      },
      {
        status: "ON_SITE",
        message: "Kohima Terrain Unit arrived and reinforced wall footing.",
        minutesAgo: 240,
      },
      {
        status: "RESOLVED",
        message: "Drainage diversion installed and footing secured. Incident resolved.",
        minutesAgo: 120,
      },
    ],
  },
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("[project-ref]") || dbUrl.includes("[password]")) {
    console.log("DATABASE CONFIGURATION REQUIRED: Valid DATABASE_URL not found in environment.");
    console.log("Seed script safely skipped DB writes until credentials are configured.");
    return;
  }

  console.log("Starting SentinalX PostgreSQL Database Seed...");

  const teamMap = new Map<string, string>();
  for (const t of RESPONSE_TEAMS) {
    const team = await prisma.responseTeam.upsert({
      where: { name: t.name },
      update: {
        sector: t.sector,
        status: t.status,
        contactNumber: t.contactNumber,
        defaultResponseMinutes: t.defaultResponseMinutes,
      },
      create: {
        name: t.name,
        sector: t.sector,
        status: t.status,
        contactNumber: t.contactNumber,
        defaultResponseMinutes: t.defaultResponseMinutes,
      },
    });
    teamMap.set(team.name, team.id);
    console.log("  Response Team seeded: " + team.name + " (ID: " + team.id + ")");
  }

  for (const r of SEED_REPORTS) {
    const assignedTeamId = r.assignedTeamName ? teamMap.get(r.assignedTeamName) || null : null;

    const report = await prisma.incidentReport.upsert({
      where: { reportId: r.reportId },
      update: {
        hazardType: r.hazardType,
        locationName: r.locationName,
        latitude: r.latitude,
        longitude: r.longitude,
        severity: r.severity,
        description: r.description,
        photoUrl: r.photoUrl,
        verificationStatus: r.verificationStatus,
        responseStatus: r.responseStatus,
        assignedTeam: r.assignedTeamName,
        assignedTeamId,
        estimatedResponseMinutes: r.estimatedResponseMinutes,
      },
      create: {
        reportId: r.reportId,
        hazardType: r.hazardType,
        locationName: r.locationName,
        latitude: r.latitude,
        longitude: r.longitude,
        severity: r.severity,
        description: r.description,
        photoUrl: r.photoUrl,
        verificationStatus: r.verificationStatus,
        responseStatus: r.responseStatus,
        assignedTeam: r.assignedTeamName,
        assignedTeamId,
        estimatedResponseMinutes: r.estimatedResponseMinutes,
      },
    });

    console.log("  Incident Report seeded: " + report.reportId + " (" + report.locationName + ")");

    await prisma.reportStatusHistory.deleteMany({
      where: { reportId: r.reportId },
    });

    for (const h of r.history) {
      const timestamp = new Date(Date.now() - h.minutesAgo * 60 * 1000);
      await prisma.reportStatusHistory.create({
        data: {
          reportId: r.reportId,
          status: h.status,
          message: h.message,
          timestamp,
        },
      });
    }

    if (assignedTeamId && r.assignedTeamName) {
      await prisma.reportAssignment.deleteMany({
        where: { reportId: r.reportId },
      });

      await prisma.reportAssignment.create({
        data: {
          reportId: r.reportId,
          teamId: assignedTeamId,
          assignedBy: "Authority Command Center",
          notes: "Standard rapid response deployment for " + r.hazardType,
          estimatedResponseMinutes: r.estimatedResponseMinutes,
        },
      });
    }
  }

  console.log("SentinalX PostgreSQL database successfully seeded!");
}

main()
  .catch((e) => {
    console.error("Database seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
