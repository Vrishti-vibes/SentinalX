import { RiskEngineResult } from "@/types/risk";

export type AlertSeverity = "INFO" | "WATCH" | "HIGH" | "CRITICAL";

export type AlertType =
  | "LANDSLIDE_RISK"
  | "ROAD_BLOCKAGE"
  | "FIELD_INCIDENT"
  | "SHELTER_UPDATE";

export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface AlertLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export interface AlertRecord {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  location: AlertLocation;
  riskScore: number | null;
  riskLevel: string | null;
  primaryThreat: string | null;
  triggeredBy: string[];
  status: AlertStatus;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  source: string;
}

export type NotificationChannel = "IN_APP" | "SMS" | "PUSH";
export type NotificationRecipientType = "CITIZEN" | "AUTHORITY";
export type NotificationStatus = "QUEUED" | "SIMULATED";

export interface NotificationEvent {
  id: string;
  alertId: string;
  channel: NotificationChannel;
  recipientType: NotificationRecipientType;
  status: NotificationStatus;
  title: string;
  message: string;
  targetDestination: string;
  createdAt: string;
  simulatedDeliveryNote: string;
}

export interface AlertEvaluateRequest {
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };
  manualOverrides?: Record<string, unknown>;
}

export interface AlertEvaluateResponse {
  success: boolean;
  alertGenerated: boolean;
  alert: AlertRecord | null;
  riskResult: RiskEngineResult | null;
  reason: string;
  notificationsQueued: number;
  disclaimer: string;
}

export interface AlertListApiResponse {
  success: boolean;
  data: AlertRecord[];
  total: number;
  activeCount: number;
  storageMode: "SUPABASE_POSTGRES" | "DEMO_IN_MEMORY";
  disclaimer: string;
}
