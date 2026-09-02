export type EngineRiskLevel = "SAFE" | "MODERATE" | "HIGH" | "CRITICAL";
export type LegacyRiskLevel = "LOW" | "MODERATE" | "HIGH" | "SEVERE";
export type RiskLevel = EngineRiskLevel | LegacyRiskLevel;

export type ThreatStatus = "NORMAL" | "WATCH" | "ADVISORY" | "WARNING" | "CRITICAL";
export type DataSourceStatus = "LIVE" | "DEMO" | "FALLBACK" | "CONFIG_REQUIRED" | "UNAVAILABLE";

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

// ==========================================
// PROTOTYPE RISK ENGINE & DATA TYPES
// ==========================================

export interface NormalizedFieldReportInput {
  id?: string;
  severity: 1 | 2 | 3 | 4 | 5;
  isVerified: boolean;
  roadBlocked?: boolean;
  ageHours?: number;
  locationName?: string;
}

export interface RiskLocationContext {
  name: string;
  state?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface RiskInputs {
  locationName?: string;
  latitude?: number;
  longitude?: number;

  // Hydrological / Weather Inputs
  rainfall24hMm?: number;
  rainfall72hMm?: number;
  maxHourlyRainfallMm?: number;
  soilMoisturePercent?: number;

  // Geotechnical / Sensor Inputs (Demo telemetry in prototype)
  porePressureKpa?: number;
  tiltAngleDeg?: number;
  factorOfSafety?: number; // FoS (e.g. 0.85 to 2.5)
  sensorStatus?: "ONLINE" | "DEGRADED" | "OFFLINE";

  // Terrain / Geophysical Inputs
  slopeAngleDeg?: number; // e.g. 15° to 65°
  terrainVulnerabilityIndex?: number; // 0.0 to 1.0 (DEM/Lithology index)
  groundMotionIndex?: number; // 0.0 to 1.0 (USGS seismic index / demo parameter)

  // Crowdsourced / Observational Inputs
  recentFieldReports?: NormalizedFieldReportInput[];

  // Source Provenance Hints (optional manual overrides)
  rainfallSource?: string;
  rainfallObservedAt?: string;
  soilMoistureSource?: string;
  soilMoistureObservedAt?: string;
  groundMotionSource?: string;
  groundMotionObservedAt?: string;
  sensorSource?: string;
  sensorObservedAt?: string;
}

export interface FactorDetail {
  factor?: string;
  raw: number | string | null;
  normalizedScore: number; // 0 to 100
  score?: number; // alias for normalizedScore
  weight: number; // relative weight in prototype formula (0.0 to 1.0)
  weightedContribution: number; // contribution to total score
  contribution?: number; // alias for weightedContribution
  status: DataSourceStatus;
  source?: string;
  label: string;
  summary: string;
  observedAt?: string | null;
  freshnessMinutes?: number | null;
  isEstimated?: boolean;
}

export interface RiskFactors {
  rainfall: FactorDetail;
  soilMoisture: FactorDetail;
  porePressure: FactorDetail;
  slopeStability: FactorDetail;
  groundMotion: FactorDetail;
  fieldReports: FactorDetail;
}

export interface SourceProvenance {
  weather: DataSourceStatus;
  sensors: DataSourceStatus;
  fieldReports: DataSourceStatus;
  terrain: DataSourceStatus;
}

export interface SourceHealthItem {
  name: string;
  source: string;
  status: DataSourceStatus;
  observedAt: string | null;
  latencyMs: number | null;
  summary?: string;
}

export interface RiskEngineResult {
  score: number; // 0.0 to 100.0 (prototype early-warning indicator)
  level: EngineRiskLevel;
  inputCoverageRatio: number; // 0.0 to 1.0 proportion of input streams supplied (NOT model accuracy)
  primaryThreat: string;
  recommendation: string;
  location?: RiskLocationContext;
  factors: RiskFactors;
  sources: SourceProvenance;
  sourceHealth?: SourceHealthItem[];
  explanations: string[];
  prototypeThresholds: {
    safeRange: string;
    moderateRange: string;
    highRange: string;
    criticalRange: string;
  };
  calculatedAt?: string;
  timestamp: string;
}

export interface RiskComputeApiResponse {
  success: boolean;
  result: RiskEngineResult;
  disclaimer: string;
  error?: string;
}
