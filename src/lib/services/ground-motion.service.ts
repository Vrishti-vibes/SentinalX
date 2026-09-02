import { memoryCache } from "@/lib/cache";
import {
  GroundMotionEvent,
  GroundMotionResponse,
} from "@/types/ground-motion";

// Default North Eastern Region (NER) Geographic Bounding Box
export const NER_BOUNDING_BOX = {
  name: "North Eastern Region (NER)",
  minLat: 22.0,
  maxLat: 29.5,
  minLon: 88.0,
  maxLon: 97.5,
};

export const GROUND_MOTION_DISCLAIMER =
  "USGS EARTHQUAKE FEED • PROTOTYPE GROUND-MOTION INDICATOR • Not a direct landslide sensor or confirmed trigger.";

/**
 * Fallback static demo ground-motion response
 */
export function getDemoFallbackGroundMotion(): GroundMotionResponse {
  return {
    source: "demo",
    isFallback: true,
    status: "FALLBACK",
    fetchedAt: new Date().toISOString(),
    region: NER_BOUNDING_BOX,
    eventCount: 2,
    maxMagnitude: 2.8,
    groundMotionIndex: 0.25,
    events: [
      {
        id: "demo-eq-001",
        magnitude: 2.8,
        place: "34 km ESE of Tawang, Arunachal Pradesh",
        latitude: 27.48,
        longitude: 92.15,
        depthKm: 14.2,
        timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        source: "Demo Baseline",
        url: "https://earthquake.usgs.gov",
      },
      {
        id: "demo-eq-002",
        magnitude: 2.1,
        place: "18 km NNW of Bomdila, Arunachal Pradesh",
        latitude: 27.38,
        longitude: 92.38,
        depthKm: 10.0,
        timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        source: "Demo Baseline",
        url: "https://earthquake.usgs.gov",
      },
    ],
    freshness: "Simulated Seismic Telemetry (Offline Mode)",
    attribution: "SentinalX Simulated Seismic Baseline",
    disclaimer: GROUND_MOTION_DISCLAIMER,
  };
}

/**
 * Heuristic aggregation formula for prototype groundMotionIndex (0.0 to 1.0)
 *
 * FORMULA:
 * - If 0 events in past 7 days: groundMotionIndex = 0.0 (Quiescent baseline)
 * - If events exist:
 *     maxMagWeight = min((maxMagnitude / 7.0) * 0.70, 0.70)
 *     countWeight = min((eventCount / 10.0) * 0.30, 0.30)
 *     groundMotionIndex = Number((maxMagWeight + countWeight).toFixed(2))
 *
 * NOTE: This is a prototype heuristic early-warning parameter, NOT a certified geotechnical seismic risk assessment.
 */
function calculatePrototypeGroundMotionIndex(
  maxMagnitude: number,
  eventCount: number
): number {
  if (eventCount === 0 || maxMagnitude <= 0) return 0.0;

  const maxMagWeight = Math.min((maxMagnitude / 7.0) * 0.7, 0.7);
  const countWeight = Math.min((eventCount / 10.0) * 0.3, 0.3);

  return Number(Math.min(Math.max(maxMagWeight + countWeight, 0), 1.0).toFixed(2));
}

/**
 * Fetch and normalize recent seismic / ground-motion events from USGS FDSN GeoJSON API
 */
export async function fetchNormalizedGroundMotion(
  days: number = 7,
  minMagnitude: number = 1.5
): Promise<GroundMotionResponse> {
  const cacheKey = `usgs_ground_motion_${days}d_${minMagnitude}m`;

  // 1. Check in-memory TTL cache (15 min / 900s TTL)
  const cached = memoryCache.get<GroundMotionResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const startTime = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const { minLat, maxLat, minLon, maxLon } = NER_BOUNDING_BOX;

  const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${encodeURIComponent(
    startTime
  )}&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}&minmagnitude=${minMagnitude}&orderby=time`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout

    const response = await fetch(usgsUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SentinalX-Landslide-Monitoring/1.0",
      },
      next: { revalidate: 900 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[GroundMotionService] USGS API returned status ${response.status}. Using fallback.`);
      return getDemoFallbackGroundMotion();
    }

    const data = await response.json();

    const rawFeatures = Array.isArray(data.features) ? data.features : [];

    const events: GroundMotionEvent[] = rawFeatures.map((f: Record<string, unknown>) => {
      const props = (f.properties || {}) as Record<string, unknown>;
      const geom = (f.geometry || {}) as Record<string, unknown>;
      const coords = Array.isArray(geom.coordinates) ? geom.coordinates : [0, 0, 0];

      return {
        id: String(f.id || `usgs-${Date.now()}`),
        magnitude: typeof props.mag === "number" ? Number(props.mag.toFixed(1)) : 0,
        place: String(props.place || "North Eastern Region"),
        longitude: Number(coords[0] || 0),
        latitude: Number(coords[1] || 0),
        depthKm: Number(coords[2] || 0),
        timestamp: props.time ? new Date(Number(props.time)).toISOString() : new Date().toISOString(),
        source: "USGS",
        url: String(props.url || "https://earthquake.usgs.gov"),
      };
    });

    const maxMagnitude = events.reduce((max, e) => Math.max(max, e.magnitude), 0);
    const groundMotionIndex = calculatePrototypeGroundMotionIndex(maxMagnitude, events.length);

    const normalized: GroundMotionResponse = {
      source: "USGS",
      isFallback: false,
      status: "LIVE",
      fetchedAt: new Date().toISOString(),
      region: NER_BOUNDING_BOX,
      eventCount: events.length,
      maxMagnitude,
      groundMotionIndex,
      events,
      freshness: "Live USGS Earthquake Catalog (Updated within 15 min)",
      attribution: "U.S. Geological Survey (USGS) Earthquake Hazards Program",
      disclaimer: GROUND_MOTION_DISCLAIMER,
    };

    // Store in cache for 15 minutes (900 seconds)
    memoryCache.set(cacheKey, normalized, 900);

    return normalized;
  } catch (err: unknown) {
    console.error("[GroundMotionService] Exception querying USGS API:", err);
    return getDemoFallbackGroundMotion();
  }
}
