import {
  ResponseAssignment,
  ResponsePriority,
  ResponseStatus,
  ResponseTeamType,
  CreateResponsePayload,
} from "@/types/response";
import { getDbConfig, supabaseRestQuery } from "./client";

export const PROTOTYPE_RESPONSE_SOURCE = "SentinalX Prototype Response Orchestrator";

// Seed response assignments for realistic authority demo in NER
const SEED_RESPONSES: ResponseAssignment[] = [
  {
    id: "RESP-TW-01",
    alertId: "ALT-TW-01",
    reportId: "SX-LS-2048",
    location: {
      name: "Tawang Sector • NH-13 Km 4",
      latitude: 27.586,
      longitude: 91.859,
    },
    team: {
      name: "BRO Road Clearance Battalion 4 (Tawang)",
      type: "CLEARANCE",
      baseStation: "Tawang Division Depot",
      contactChannel: "VHF Ch 4 (Emergency)",
    },
    priority: "HIGH",
    status: "EN_ROUTE",
    estimatedResponseMinutes: 15,
    assignedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    arrivedAt: null,
    completedAt: null,
    notes: "Heavy earthmover & debris sweeper en route to clear Km 4 road shoulder.",
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    source: PROTOTYPE_RESPONSE_SOURCE,
  },
  {
    id: "RESP-TW-03",
    alertId: "ALT-TW-03",
    reportId: null,
    location: {
      name: "Zemithang-Lumla Slope Alpha",
      latitude: 27.68,
      longitude: 91.72,
    },
    team: {
      name: "SDRF High-Altitude Rescue Unit 1",
      type: "SEARCH_RESCUE",
      baseStation: "Lumla Sub-Division HQ",
      contactChannel: "Satellite Radio Band 2",
    },
    priority: "CRITICAL",
    status: "ASSIGNED",
    estimatedResponseMinutes: 10,
    assignedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    startedAt: null,
    arrivedAt: null,
    completedAt: null,
    notes: "Immediate traffic diversion and slope periphery evacuation unit assigned.",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    source: PROTOTYPE_RESPONSE_SOURCE,
  },
];

// In-memory response store for local prototype
const inMemoryResponses: ResponseAssignment[] = [...SEED_RESPONSES];

export class ResponsesRepository {
  /**
   * Find an active response assignment for a given alert ID to prevent duplicate dispatches
   */
  async findActiveResponseForAlert(alertId: string): Promise<ResponseAssignment | null> {
    const config = getDbConfig();
    if (!config.isConfigured) {
      const match = inMemoryResponses.find(
        (r) => r.alertId === alertId && r.status !== "COMPLETED" && r.status !== "CANCELLED"
      );
      return match || null;
    }

    try {
      const res = await supabaseRestQuery<Record<string, unknown>[]>("response_assignments", {
        method: "GET",
        query: {
          alert_id: `eq.${alertId}`,
          status: "neq.CANCELLED",
          limit: "1",
        },
      });

      if (res.data && res.data.length > 0) {
        return this.mapDbRowToResponse(res.data[0]);
      }
      return null;
    } catch {
      const match = inMemoryResponses.find((r) => r.alertId === alertId && r.status !== "CANCELLED");
      return match || null;
    }
  }

  /**
   * Create and persist a new response assignment
   */
  async createResponseAssignment(payload: CreateResponsePayload): Promise<ResponseAssignment> {
    const newId = `RESP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newRecord: ResponseAssignment = {
      id: newId,
      alertId: payload.alertId,
      reportId: payload.reportId || null,
      location: payload.location,
      team: payload.team,
      priority: payload.priority,
      status: "PENDING",
      estimatedResponseMinutes: payload.estimatedResponseMinutes ?? 15,
      assignedAt: null,
      startedAt: null,
      arrivedAt: null,
      completedAt: null,
      notes: payload.notes || "Prototype response assignment created.",
      createdAt: now,
      updatedAt: now,
      source: PROTOTYPE_RESPONSE_SOURCE,
    };

    const config = getDbConfig();
    if (!config.isConfigured) {
      inMemoryResponses.unshift(newRecord);
      return newRecord;
    }

    try {
      const res = await supabaseRestQuery<Record<string, unknown>>("response_assignments", {
        method: "POST",
        body: {
          id: newRecord.id,
          alert_id: newRecord.alertId,
          report_id: newRecord.reportId,
          location_name: newRecord.location.name,
          latitude: newRecord.location.latitude,
          longitude: newRecord.location.longitude,
          team_name: newRecord.team.name,
          team_type: newRecord.team.type,
          priority: newRecord.priority,
          status: newRecord.status,
          estimated_response_minutes: newRecord.estimatedResponseMinutes,
          notes: newRecord.notes,
          source: newRecord.source,
          created_at: newRecord.createdAt,
          updated_at: newRecord.updatedAt,
        },
      });

      if (res.data) {
        return this.mapDbRowToResponse(res.data);
      }
      inMemoryResponses.unshift(newRecord);
      return newRecord;
    } catch (err) {
      console.warn("[ResponsesRepository] Supabase insert exception, storing in-memory:", err);
      inMemoryResponses.unshift(newRecord);
      return newRecord;
    }
  }

  /**
   * List response assignments with optional filters
   */
  async listResponseAssignments(filters?: {
    status?: ResponseStatus;
    priority?: ResponsePriority;
    alertId?: string;
    reportId?: string;
    limit?: number;
  }): Promise<{ responses: ResponseAssignment[]; storageMode: "SUPABASE_POSTGRES" | "DEMO_IN_MEMORY" }> {
    const limit = filters?.limit ?? 50;
    const config = getDbConfig();

    if (!config.isConfigured) {
      let filtered = [...inMemoryResponses];
      if (filters?.status) filtered = filtered.filter((r) => r.status === filters.status);
      if (filters?.priority) filtered = filtered.filter((r) => r.priority === filters.priority);
      if (filters?.alertId) filtered = filtered.filter((r) => r.alertId === filters.alertId);
      if (filters?.reportId) filtered = filtered.filter((r) => r.reportId === filters.reportId);

      return {
        responses: filtered.slice(0, limit),
        storageMode: "DEMO_IN_MEMORY",
      };
    }

    try {
      const query: Record<string, string> = {
        order: "created_at.desc",
        limit: String(limit),
      };
      if (filters?.status) query.status = `eq.${filters.status}`;
      if (filters?.priority) query.priority = `eq.${filters.priority}`;
      if (filters?.alertId) query.alert_id = `eq.${filters.alertId}`;
      if (filters?.reportId) query.report_id = `eq.${filters.reportId}`;

      const res = await supabaseRestQuery<Record<string, unknown>[]>("response_assignments", {
        method: "GET",
        query,
      });

      if (res.data && Array.isArray(res.data)) {
        return {
          responses: res.data.map((r) => this.mapDbRowToResponse(r)),
          storageMode: "SUPABASE_POSTGRES",
        };
      }

      return { responses: inMemoryResponses.slice(0, limit), storageMode: "DEMO_IN_MEMORY" };
    } catch (err) {
      console.warn("[ResponsesRepository] Supabase query exception, fallback to in-memory:", err);
      return { responses: inMemoryResponses.slice(0, limit), storageMode: "DEMO_IN_MEMORY" };
    }
  }

  /**
   * Get a response assignment by ID
   */
  async getResponseAssignment(id: string): Promise<ResponseAssignment | null> {
    const config = getDbConfig();
    if (!config.isConfigured) {
      return inMemoryResponses.find((r) => r.id === id) || null;
    }

    try {
      const res = await supabaseRestQuery<Record<string, unknown>[]>("response_assignments", {
        method: "GET",
        query: { id: `eq.${id}`, limit: "1" },
      });

      if (res.data && res.data.length > 0) {
        return this.mapDbRowToResponse(res.data[0]);
      }
      return inMemoryResponses.find((r) => r.id === id) || null;
    } catch {
      return inMemoryResponses.find((r) => r.id === id) || null;
    }
  }

  /**
   * Update response status and timestamp lifecycle
   */
  async updateResponseStatus(
    id: string,
    newStatus: ResponseStatus,
    updates?: { notes?: string | null; teamName?: string; estimatedResponseMinutes?: number }
  ): Promise<ResponseAssignment | null> {
    const now = new Date().toISOString();

    const memIdx = inMemoryResponses.findIndex((r) => r.id === id);
    if (memIdx >= 0) {
      const current = inMemoryResponses[memIdx];
      current.status = newStatus;
      current.updatedAt = now;

      if (updates?.notes) current.notes = updates.notes;
      if (updates?.teamName) current.team.name = updates.teamName;
      if (updates?.estimatedResponseMinutes !== undefined) {
        current.estimatedResponseMinutes = updates.estimatedResponseMinutes;
      }

      if (newStatus === "ASSIGNED" && !current.assignedAt) current.assignedAt = now;
      if (newStatus === "EN_ROUTE" && !current.startedAt) current.startedAt = now;
      if (newStatus === "ON_SITE" && !current.arrivedAt) current.arrivedAt = now;
      if (newStatus === "COMPLETED" && !current.completedAt) current.completedAt = now;
    }

    const config = getDbConfig();
    if (!config.isConfigured) {
      return memIdx >= 0 ? inMemoryResponses[memIdx] : null;
    }

    try {
      const dbUpdates: Record<string, unknown> = {
        status: newStatus,
        updated_at: now,
      };
      if (updates?.notes) dbUpdates.notes = updates.notes;
      if (updates?.teamName) dbUpdates.team_name = updates.teamName;
      if (updates?.estimatedResponseMinutes !== undefined) {
        dbUpdates.estimated_response_minutes = updates.estimatedResponseMinutes;
      }

      if (newStatus === "ASSIGNED") dbUpdates.assigned_at = now;
      if (newStatus === "EN_ROUTE") dbUpdates.started_at = now;
      if (newStatus === "ON_SITE") dbUpdates.arrived_at = now;
      if (newStatus === "COMPLETED") dbUpdates.completed_at = now;

      const res = await supabaseRestQuery<Record<string, unknown>>("response_assignments", {
        method: "PATCH",
        query: { id: `eq.${id}` },
        body: dbUpdates,
      });

      if (res.data) {
        return this.mapDbRowToResponse(res.data);
      }
      return memIdx >= 0 ? inMemoryResponses[memIdx] : null;
    } catch {
      return memIdx >= 0 ? inMemoryResponses[memIdx] : null;
    }
  }

  private mapDbRowToResponse(row: Record<string, unknown>): ResponseAssignment {
    return {
      id: row.id as string,
      alertId: row.alert_id as string,
      reportId: (row.report_id as string) || null,
      location: {
        name: (row.location_name as string) || "North Eastern Region",
        latitude: Number(row.latitude) || 27.586,
        longitude: Number(row.longitude) || 91.859,
      },
      team: {
        name: (row.team_name as string) || "SDRF Quick Response Unit",
        type: (row.team_type as ResponseTeamType) || "GENERAL",
      },
      priority: (row.priority as ResponsePriority) || "NORMAL",
      status: (row.status as ResponseStatus) || "PENDING",
      estimatedResponseMinutes:
        row.estimated_response_minutes !== null && row.estimated_response_minutes !== undefined
          ? Number(row.estimated_response_minutes)
          : null,
      assignedAt: (row.assigned_at as string) || null,
      startedAt: (row.started_at as string) || null,
      arrivedAt: (row.arrived_at as string) || null,
      completedAt: (row.completed_at as string) || null,
      notes: (row.notes as string) || null,
      createdAt: row.created_at as string,
      updatedAt: (row.updated_at as string) || row.created_at as string,
      source: (row.source as string) || PROTOTYPE_RESPONSE_SOURCE,
    };
  }
}

export const responsesRepository = new ResponsesRepository();
