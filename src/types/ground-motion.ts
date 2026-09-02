export interface GroundMotionEvent {
  id: string;
  magnitude: number;
  place: string;
  latitude: number;
  longitude: number;
  depthKm: number;
  timestamp: string; // ISO 8601
  source: string; // e.g. "USGS"
  url: string;
}

export interface GroundMotionResponse {
  source: "USGS" | "demo";
  isFallback: boolean;
  status: "LIVE" | "FALLBACK";
  fetchedAt: string;
  region: {
    name: string;
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  eventCount: number;
  maxMagnitude: number;
  groundMotionIndex: number; // 0.0 to 1.0 prototype heuristic index
  events: GroundMotionEvent[];
  freshness: string;
  attribution: string;
  disclaimer: string;
}

export interface GroundMotionApiResponse {
  success: boolean;
  data: GroundMotionResponse;
  error?: string;
}
