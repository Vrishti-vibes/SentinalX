import { IncidentReport } from "@/types/risk";

export const MOCK_REPORTS: IncidentReport[] = [
  {
    id: "REP-2026-104",
    type: "ROCKFALL",
    severity: 4,
    locationName: "NH-10 Km 32, near Coronation Bridge",
    state: "Sikkim",
    reportedAt: "18 mins ago",
    status: "DISPATCHED",
    roadBlocked: true,
    description: "Multiple boulders detached from upper ridge; one lane blocked for heavy transport.",
  },
  {
    id: "REP-2026-103",
    type: "SLOPE_CRACK",
    severity: 3,
    locationName: "Cherrapunji East Escarpment",
    state: "Meghalaya",
    reportedAt: "45 mins ago",
    status: "VERIFIED",
    roadBlocked: false,
    description: "Transverse tension fissure observed across hill slope, approx 15m in length.",
  },
  {
    id: "REP-2026-102",
    type: "ROAD_SUBSIDENCE",
    severity: 4,
    locationName: "Lumding Hill Track Km 18",
    state: "Assam",
    reportedAt: "2 hours ago",
    status: "PENDING_VERIFICATION",
    roadBlocked: true,
    description: "Road shoulder sinking by ~40cm following morning rain shower.",
  },
];
