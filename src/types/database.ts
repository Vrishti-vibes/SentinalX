export type VerificationStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export type ResponseStatus =
  | "SUBMITTED"
  | "VERIFIED"
  | "AUTHORITIES_NOTIFIED"
  | "RESPONSE_ASSIGNED"
  | "RESOLVED";

export type HazardType = "Landslide" | "Flooding" | "Road Blockage" | "Other Hazard";
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

// ==========================================
// A. INCIDENT / FIELD REPORT RECORD
// ==========================================
export interface IncidentReportRecord {
  id: string; // UUID or string id
  reportId: string; // Public identifier, e.g. "SX-LS-2048"
  hazardType: HazardType;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  description: string;
  photoUrl?: string | null;
  submittedAt: string; // ISO 8601
  verificationStatus: VerificationStatus;
  responseStatus: ResponseStatus;
  assignedTeam?: string | null;
  estimatedResponseMinutes?: number | null;
  storage: "SUPABASE_POSTGRES" | "DEMO_IN_MEMORY";
  clientReportId?: string | null;
}

export interface CreateReportPayload {
  clientReportId?: string | null;
  hazardType: HazardType;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  severity?: SeverityLevel | "Low" | "Moderate" | "High" | "Critical";
  description: string;
  photoUrl?: string | null;
}

export interface UpdateReportStatusPayload {
  verificationStatus?: VerificationStatus;
  responseStatus?: ResponseStatus;
  assignedTeam?: string;
  estimatedResponseMinutes?: number;
  statusMessage?: string;
}

// ==========================================
// B. SENSOR READING RECORD
// ==========================================
export interface SensorReadingRecord {
  id: string;
  sensorId: string;
  stationName: string;
  state: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  soilMoisture: number; // %
  porePressure: number; // kPa
  tiltAngle: number; // deg
  rainfall: number; // 24h mm
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  storage: "SUPABASE_POSTGRES" | "DEMO_IN_MEMORY";
}

export interface CreateSensorReadingPayload {
  sensorId: string;
  stationName?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  soilMoisture: number;
  porePressure: number;
  tiltAngle: number;
  rainfall: number;
  status?: "ONLINE" | "DEGRADED" | "OFFLINE";
}

// ==========================================
// C. RISK ASSESSMENT RECORD
// ==========================================
export interface RiskAssessmentRecord {
  id: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  score: number;
  level: "SAFE" | "MODERATE" | "HIGH" | "CRITICAL";
  primaryThreat: string;
  recommendation: string;
  inputCoverageRatio: number;
  sources: {
    weather: "LIVE" | "DEMO" | "UNAVAILABLE";
    sensors: "LIVE" | "DEMO" | "UNAVAILABLE";
    fieldReports: "LIVE" | "DEMO" | "UNAVAILABLE";
    terrain: "LIVE" | "DEMO" | "UNAVAILABLE";
  };
  factorSummary: {
    rainfallScore: number;
    soilMoistureScore: number;
    porePressureScore: number;
    slopeStabilityScore: number;
    groundMotionScore: number;
    fieldReportsScore: number;
  };
  storage: "SUPABASE_POSTGRES" | "DEMO_IN_MEMORY";
}

// ==========================================
// D. REPORT STATUS HISTORY RECORD
// ==========================================
export interface ReportStatusHistoryRecord {
  id: string;
  reportId: string;
  status: ResponseStatus;
  message: string;
  timestamp: string; // ISO 8601
}
