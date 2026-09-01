export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "SEVERE";

export type ThreatStatus = "NORMAL" | "WATCH" | "ADVISORY" | "WARNING" | "CRITICAL";

export interface GeoLocation {
  lat: number;
  lng: number;
  elevation?: number;
  state: string;
  district: string;
  corridorName?: string;
}

export interface SensorTelemetry {
  id: string;
  stationName: string;
  state: string;
  coordinates: [number, number];
  porePressureKpa: number;
  soilMoisturePercent: number;
  tiltAngleDeg: number;
  rainfall24hMm: number;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  lastUpdated: string;
}

export interface AlertItem {
  id: string;
  title: string;
  riskLevel: RiskLevel;
  location: string;
  state: string;
  summary: string;
  probabilityScore: number;
  timestamp: string;
  recommendedAction: string;
  isActive: boolean;
}

export interface CorridorRisk {
  id: string;
  highwayCode: string;
  corridorName: string;
  state: string;
  riskLevel: RiskLevel;
  activeBlockages: number;
  rainfallLast24h: number;
  slopeStabilityScore: number;
}

export interface IncidentReport {
  id: string;
  type: "ROCKFALL" | "DEBRIS_FLOW" | "SLOPE_CRACK" | "ROAD_SUBSIDENCE";
  severity: 1 | 2 | 3 | 4 | 5;
  locationName: string;
  state: string;
  reportedAt: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "DISPATCHED" | "RESOLVED";
  roadBlocked: boolean;
  description: string;
}
