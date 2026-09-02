export type ResponseTeamType =
  | "CLEARANCE"
  | "MEDICAL"
  | "SEARCH_RESCUE"
  | "TRAFFIC"
  | "GENERAL";

export type ResponsePriority = "NORMAL" | "HIGH" | "CRITICAL";

export type ResponseStatus =
  | "PENDING"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "ON_SITE"
  | "COMPLETED"
  | "CANCELLED";

export interface ResponseTeamInfo {
  name: string;
  type: ResponseTeamType;
  baseStation?: string;
  contactChannel?: string;
}

export interface ResponseLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export interface ResponseAssignment {
  id: string;
  alertId: string;
  reportId: string | null;
  location: ResponseLocation;
  team: ResponseTeamInfo;
  priority: ResponsePriority;
  status: ResponseStatus;
  estimatedResponseMinutes: number | null;
  assignedAt: string | null;
  startedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  source: string;
}

export interface CreateResponsePayload {
  alertId: string;
  reportId?: string | null;
  location: ResponseLocation;
  team: ResponseTeamInfo;
  priority: ResponsePriority;
  estimatedResponseMinutes?: number | null;
  notes?: string | null;
}

export interface UpdateResponseStatusPayload {
  status: ResponseStatus;
  notes?: string | null;
  teamName?: string;
  estimatedResponseMinutes?: number;
}

export interface ResponseListApiResponse {
  success: boolean;
  data: ResponseAssignment[];
  total: number;
  activeCount: number;
  storageMode: "SUPABASE_POSTGRES" | "DEMO_IN_MEMORY";
  disclaimer: string;
}

export interface ResponseDetailApiResponse {
  success: boolean;
  data: ResponseAssignment | null;
  error?: string;
  disclaimer: string;
}
