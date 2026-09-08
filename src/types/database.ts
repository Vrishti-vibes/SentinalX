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
  level: "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "CRITICAL" | "SAFE";
  primaryThreat: string;
  recommendation: string;
  inputCoverageRatio: number;
  sources: {
    weather: "LIVE" | "CACHED" | "UNAVAILABLE";
    sensors: "LIVE" | "STANDBY" | "UNAVAILABLE";
    fieldReports: "LIVE" | "STANDBY" | "UNAVAILABLE";
    terrain: "LIVE" | "CACHED" | "UNAVAILABLE";
  };
  factorSummary: {
    rainfallScore: number;
    soilMoistureScore: number;
    porePressureScore: number;
    slopeStabilityScore: number;
    groundMotionScore: number;
    fieldReportsScore: number;
  };
  storage: "SUPABASE_POSTGRES" | "IN_MEMORY_STANDBY" | "DEMO_IN_MEMORY";
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

// ==========================================
// E. USERS & ROLES
// ==========================================
export interface UserRecord {
  id: string;
  email?: string;
  phoneNumber?: string;
  fullName: string;
  role: "CITIZEN" | "RESPONDER" | "AUTHORITY" | "ADMIN";
  state: string;
  district?: string;
  notificationPreferences: {
    inApp: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// F. ROADS AND ROAD CONDITIONS
// ==========================================
export interface RoadRecord {
  id: string;
  locationId: string;
  name: string;
  highwayRef?: string;
  status: "CLEAR" | "CAUTION" | "BLOCKED";
  blockageReason?: string;
  coordinates?: [number, number][];
  updatedAt: string;
}

// ==========================================
// G. NOTIFICATION DELIVERIES
// ==========================================
export interface NotificationDeliveryRecord {
  id: string;
  alertId?: string;
  userId?: string;
  channel: "IN_APP" | "SMS" | "PUSH" | "EMAIL";
  recipientType: "CITIZEN" | "RESPONDER" | "AUTHORITY";
  targetDestination: string;
  severity: string;
  title: string;
  message: string;
  deliveryStatus: "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "PROVIDER_NOT_CONFIGURED";
  deliveryProvider?: string;
  deliveryError?: string;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

// ==========================================
// H. AUDIT LOGS
// ==========================================
export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  actorRole?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
