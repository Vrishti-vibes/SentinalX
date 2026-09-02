import {
  ResponseAssignment,
  ResponsePriority,
  ResponseStatus,
  ResponseTeamInfo,
  ResponseTeamType,
  CreateResponsePayload,
} from "@/types/response";
import { AlertRecord } from "@/types/alert";
import { responsesRepository } from "@/lib/db/responses.repository";
import { notificationService } from "./notification.service";

// Valid status transitions map
const VALID_TRANSITIONS: Record<ResponseStatus, ResponseStatus[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["ON_SITE", "CANCELLED"],
  ON_SITE: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export class ResponseService {
  /**
   * Transparent rule-based prototype team recommendation
   */
  recommendTeamForAlert(alert: AlertRecord): { team: ResponseTeamInfo; estimatedMinutes: number } {
    const text = `${alert.title} ${alert.message} ${alert.primaryThreat || ""}`.toLowerCase();
    const isCritical = alert.severity === "CRITICAL";
    const isHigh = alert.severity === "HIGH";

    let type: ResponseTeamType = "GENERAL";
    let name = "SDRF Quick Response Unit Alpha";
    let baseStation = "District Emergency Operations Center";

    if (alert.type === "ROAD_BLOCKAGE" || text.includes("road") || text.includes("block") || text.includes("corridor")) {
      type = "CLEARANCE";
      name = "BRO Heavy Road Clearance Battalion 4";
      baseStation = "BRO Mountain Depot";
    } else if (isCritical || text.includes("crack") || text.includes("collapse") || text.includes("avalanche")) {
      type = "SEARCH_RESCUE";
      name = "SDRF High-Altitude Rescue Unit 1";
      baseStation = "Sector Command Sub-station";
    } else if (text.includes("medical") || text.includes("casualty") || text.includes("injured")) {
      type = "MEDICAL";
      name = "District Mobile Health & Paramedic Unit";
      baseStation = "District Civil Hospital";
    } else if (text.includes("traffic") || text.includes("diversion") || text.includes("jam")) {
      type = "TRAFFIC";
      name = "State Highway Traffic Patrol Unit";
      baseStation = "Highway Police Post";
    }

    // Prototype estimated response minutes
    const estimatedMinutes = isCritical ? 12 : isHigh ? 20 : 35;

    return {
      team: {
        name,
        type,
        baseStation,
        contactChannel: "Radio Band Ch 4",
      },
      estimatedMinutes,
    };
  }

  /**
   * Create or retrieve response workflow candidate for a given alert
   */
  async createCandidateFromAlert(alert: AlertRecord): Promise<ResponseAssignment> {
    // 1. Check for existing active response (Deduplication)
    const existing = await responsesRepository.findActiveResponseForAlert(alert.id);
    if (existing) {
      return existing;
    }

    const { team, estimatedMinutes } = this.recommendTeamForAlert(alert);
    const priority: ResponsePriority =
      alert.severity === "CRITICAL" ? "CRITICAL" : alert.severity === "HIGH" ? "HIGH" : "NORMAL";

    const payload: CreateResponsePayload = {
      alertId: alert.id,
      location: alert.location,
      team,
      priority,
      estimatedResponseMinutes: estimatedMinutes,
      notes: `Automated response candidate generated for ${alert.severity} alert in ${alert.location.name}.`,
    };

    const newAssignment = await responsesRepository.createResponseAssignment(payload);
    return newAssignment;
  }

  /**
   * Update response status with strict workflow validation and notifications
   */
  async updateResponseStatus(
    id: string,
    newStatus: ResponseStatus,
    updates?: { notes?: string | null; teamName?: string; estimatedResponseMinutes?: number }
  ): Promise<{ success: boolean; data?: ResponseAssignment; error?: string }> {
    const current = await responsesRepository.getResponseAssignment(id);
    if (!current) {
      return { success: false, error: "Response assignment not found." };
    }

    // Validate state transition
    const allowed = VALID_TRANSITIONS[current.status] || [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from '${current.status}' to '${newStatus}'. Allowed transitions: ${
          allowed.length > 0 ? allowed.join(", ") : "None (Terminal State)"
        }`,
      };
    }

    const updated = await responsesRepository.updateResponseStatus(id, newStatus, updates);
    if (!updated) {
      return { success: false, error: "Failed to persist response status update." };
    }

    return { success: true, data: updated };
  }
}

export const responseService = new ResponseService();
