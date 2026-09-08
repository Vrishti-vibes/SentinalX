/**
 * SentinalX Risk-Aware Road Routing Types
 * Phase 18: Real Road Network & Public OSRM Routing
 */

export interface RoutePoint {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name?: string;
}

export interface GeoJsonLineString {
  type: "LineString";
  coordinates: [number, number][]; // [longitude, latitude]
}

export type TravelMode = "DRIVING" | "WALKING";

export interface RouteRiskAnalysis {
  hazardIntersections: number;
  exposedDistanceKm: number;
  maximumRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  exposureScore: number; // 0 to 100
  roadBlocked: boolean;
  unverifiedReportsCount: number;
  blockageDetails?: string;
  analysisType: "OPERATIONAL_ROUTE_RISK_ANALYSIS";
}

export interface RouteCandidate {
  id: string;
  name: string;
  source: "OSRM/OpenStreetMap" | "CACHED_CORRIDOR" | "LOCAL_GIS_GRID";
  status: "LIVE" | "FALLBACK" | "CACHED";
  travelMode: TravelMode;
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  etaMinutes: number;
  walkingDurationSeconds: number;
  walkingEtaMinutes: number;
  drivingDurationSeconds: number;
  drivingEtaMinutes: number;
  geometry: GeoJsonLineString;
  steps: RouteStep[];
  routeRisk: RouteRiskAnalysis;
  routeScore: number; // Lower is better (travel time + risk penalties)
  isRecommended: boolean;
}

export interface RouteResponse {
  source: "OSRM/OpenStreetMap" | "CACHED_CORRIDOR" | "LOCAL_GIS_GRID";
  status: "LIVE" | "FALLBACK" | "CACHED";
  travelMode: TravelMode;
  origin: RoutePoint;
  destination: RoutePoint;
  recommendedRoute: RouteCandidate;
  alternatives: RouteCandidate[];
  calculatedAt: string;
  attribution: string;
  hazardAvoidanceSummary?: string;
  disclaimer?: string;
}
