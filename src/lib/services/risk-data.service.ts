import {
  RiskInputs,
  RiskLocationContext,
  SourceHealthItem,
  NormalizedFieldReportInput,
} from "@/types/risk";
import {
  fetchNormalizedWeather,
  NER_LOCATIONS,
  DEFAULT_NER_LOCATION,
} from "@/lib/services/weather.service";
import { fetchNormalizedGroundMotion } from "@/lib/services/ground-motion.service";
import { searchCopernicusCatalog } from "@/lib/services/satellite.service";
import { SensorsRepository } from "@/lib/db/sensors.repository";
import { ReportsRepository } from "@/lib/db/reports.repository";
import { SensorReadingRecord, IncidentReportRecord } from "@/types/database";

export interface AggregatedRiskData {
  inputs: RiskInputs;
  location: RiskLocationContext;
  sourceHealth: SourceHealthItem[];
}

/**
 * Resolve target location from name, key, or coordinates
 */
export function resolveRiskLocation(
  locParam?: string | null,
  latParam?: number | null,
  lonParam?: number | null,
  nameParam?: string | null
): RiskLocationContext {
  // 1. Direct coordinates provided
  if (latParam != null && lonParam != null && !isNaN(latParam) && !isNaN(lonParam)) {
    return {
      name: nameParam || `Sector (${latParam.toFixed(3)}, ${lonParam.toFixed(3)})`,
      state: "North Eastern Region",
      latitude: latParam,
      longitude: lonParam,
      elevation: 2200,
    };
  }

  // 2. Lookup in known NER reference locations
  if (locParam) {
    const key = locParam.toLowerCase().trim();
    if (NER_LOCATIONS[key]) {
      const loc = NER_LOCATIONS[key];
      return {
        name: loc.name,
        state: loc.state,
        latitude: loc.latitude,
        longitude: loc.longitude,
        elevation: loc.elevation,
      };
    }

    // Partial search in known location names
    for (const [k, v] of Object.entries(NER_LOCATIONS)) {
      if (v.name.toLowerCase().includes(key) || key.includes(k)) {
        return {
          name: v.name,
          state: v.state,
          latitude: v.latitude,
          longitude: v.longitude,
          elevation: v.elevation,
        };
      }
    }
  }

  // 3. Default: Tawang Sector
  return {
    name: DEFAULT_NER_LOCATION.name,
    state: DEFAULT_NER_LOCATION.state,
    latitude: DEFAULT_NER_LOCATION.latitude,
    longitude: DEFAULT_NER_LOCATION.longitude,
    elevation: DEFAULT_NER_LOCATION.elevation,
  };
}

/**
 * Filter sensors closest to or matching the requested location
 */
function findMatchingSensor(
  sensors: SensorReadingRecord[],
  location: RiskLocationContext
): SensorReadingRecord | null {
  if (!sensors || sensors.length === 0) return null;

  // Exact or state/name match
  const nameMatch = sensors.find((s) =>
    s.stationName.toLowerCase().includes(location.name.toLowerCase()) ||
    location.name.toLowerCase().includes(s.stationName.toLowerCase()) ||
    (location.state && s.state.toLowerCase().includes(location.state.toLowerCase()))
  );
  if (nameMatch) return nameMatch;

  // Proximity match (Euclidean distance on lat/lon)
  let bestSensor = sensors[0];
  let minDistance = Infinity;

  for (const s of sensors) {
    const dist = Math.hypot(s.latitude - location.latitude, s.longitude - location.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      bestSensor = s;
    }
  }

  return bestSensor;
}

/**
 * Filter citizen reports relevant to the target location
 */
function filterRelevantReports(
  reports: IncidentReportRecord[],
  location: RiskLocationContext
): NormalizedFieldReportInput[] {
  if (!reports || reports.length === 0) return [];

  // Match reports matching location name or state
  const relevant = reports.filter((r) => {
    const locLower = location.name.toLowerCase();
    const repLoc = r.locationName.toLowerCase();
    return repLoc.includes(locLower) || locLower.includes(repLoc) || (location.state && repLoc.includes(location.state.toLowerCase()));
  });

  const targetReports = relevant.length > 0 ? relevant : reports;

  return targetReports.map((r) => ({
    id: r.reportId,
    severity: r.severity,
    isVerified: r.verificationStatus === "VERIFIED",
    roadBlocked: r.hazardType === "Road Blockage" || r.description.toLowerCase().includes("block"),
    locationName: r.locationName,
  }));
}

/**
 * Unified Risk Data Aggregator:
 * Gathers environmental weather, seismic ground-motion, in-situ geotechnical telemetry,
 * citizen reports, and satellite observation metadata in a fault-isolated manner.
 */
export async function gatherUnifiedRiskInputs(
  location: RiskLocationContext,
  manualOverrides: Partial<RiskInputs> = {}
): Promise<AggregatedRiskData> {
  const sourceHealth: SourceHealthItem[] = [];

  // Measure start times for latency estimation
  const t0 = Date.now();

  const [weatherRes, groundRes, sensorRes, reportRes, satRes] = await Promise.allSettled([
    fetchNormalizedWeather(location.latitude, location.longitude, location.name),
    fetchNormalizedGroundMotion(7, 1.5),
    SensorsRepository.getSensors(),
    ReportsRepository.getReports(),
    searchCopernicusCatalog(location.latitude, location.longitude, 14),
  ]);

  const inputs: RiskInputs = {
    locationName: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    ...manualOverrides,
  };

  // 1. Process Weather Stream (Open-Meteo)
  if (weatherRes.status === "fulfilled" && weatherRes.value) {
    const w = weatherRes.value;
    const isLive = !w.isFallback;

    if (inputs.rainfall24hMm === undefined) inputs.rainfall24hMm = w.recent.rainfall24hMm;
    if (inputs.rainfall72hMm === undefined) inputs.rainfall72hMm = w.recent.rainfall72hMm;
    if (inputs.maxHourlyRainfallMm === undefined) inputs.maxHourlyRainfallMm = w.recent.maxHourlyRainfallMm;
    if (inputs.soilMoisturePercent === undefined) inputs.soilMoisturePercent = w.soil.moisturePercent;

    inputs.rainfallSource = isLive ? "Open-Meteo Weather API" : "Simulated Weather Model Baseline";
    inputs.rainfallObservedAt = w.timestamp;
    inputs.soilMoistureSource = isLive ? "Open-Meteo Volumetric Soil Layers" : "Simulated Soil Profile";
    inputs.soilMoistureObservedAt = w.timestamp;

    sourceHealth.push({
      name: "Weather & Precipitation",
      source: "Open-Meteo",
      status: isLive ? "LIVE" : "FALLBACK",
      observedAt: w.timestamp,
      latencyMs: Date.now() - t0,
      summary: `24h Rain: ${w.recent.rainfall24hMm} mm, Soil: ${w.soil.moisturePercent}%`,
    });
  } else {
    sourceHealth.push({
      name: "Weather & Precipitation",
      source: "Open-Meteo",
      status: "FALLBACK",
      observedAt: new Date().toISOString(),
      latencyMs: null,
      summary: "Weather feed fallback active",
    });
  }

  // 2. Process Ground-Motion Stream (USGS)
  if (groundRes.status === "fulfilled" && groundRes.value) {
    const g = groundRes.value;
    if (inputs.groundMotionIndex === undefined) {
      inputs.groundMotionIndex = g.groundMotionIndex;
    }
    inputs.groundMotionSource = g.source === "USGS" ? "USGS Earthquake Catalog" : "Simulated Seismic Baseline";
    inputs.groundMotionObservedAt = g.fetchedAt;

    sourceHealth.push({
      name: "Seismic & Ground-Motion",
      source: g.source === "USGS" ? "USGS FDSN Earthquake API" : "Simulated Baseline",
      status: g.status,
      observedAt: g.fetchedAt,
      latencyMs: Date.now() - t0,
      summary: `${g.eventCount} event(s) in NER (Max Mag: ${g.maxMagnitude.toFixed(1)}, Index: ${g.groundMotionIndex})`,
    });
  } else {
    sourceHealth.push({
      name: "Seismic & Ground-Motion",
      source: "USGS FDSN API",
      status: "FALLBACK",
      observedAt: new Date().toISOString(),
      latencyMs: null,
      summary: "Ground-motion fallback active",
    });
  }

  // 3. Process In-Situ Geotechnical Sensors (Internal Repository)
  if (sensorRes.status === "fulfilled" && Array.isArray(sensorRes.value)) {
    const matchedSensor = findMatchingSensor(sensorRes.value, location);
    if (matchedSensor) {
      if (inputs.porePressureKpa === undefined) inputs.porePressureKpa = matchedSensor.porePressure;
      if (inputs.tiltAngleDeg === undefined) inputs.tiltAngleDeg = matchedSensor.tiltAngle;
      if (inputs.sensorStatus === undefined) inputs.sensorStatus = matchedSensor.status;
      inputs.sensorSource = `${matchedSensor.stationName} (${matchedSensor.storage === "SUPABASE_POSTGRES" ? "PostgreSQL" : "Demo In-Memory"})`;
      inputs.sensorObservedAt = matchedSensor.timestamp;

      sourceHealth.push({
        name: "In-Situ Geotechnical Sensors",
        source: matchedSensor.stationName,
        status: "DEMO", // Honest: demo sensor readings in current prototype
        observedAt: matchedSensor.timestamp,
        latencyMs: 1,
        summary: `Pore: ${matchedSensor.porePressure} kPa, Tilt: ${matchedSensor.tiltAngle}° (${matchedSensor.status})`,
      });
    }
  } else {
    sourceHealth.push({
      name: "In-Situ Geotechnical Sensors",
      source: "Prototype Sensor Grid",
      status: "UNAVAILABLE",
      observedAt: null,
      latencyMs: null,
      summary: "No sensor readings available",
    });
  }

  // 4. Process Citizen Field Reports (Internal Repository)
  if (reportRes.status === "fulfilled" && Array.isArray(reportRes.value)) {
    const relevantReports = filterRelevantReports(reportRes.value, location);
    if (inputs.recentFieldReports === undefined) {
      inputs.recentFieldReports = relevantReports;
    }

    sourceHealth.push({
      name: "Citizen Field Reports",
      source: "SentinalX Field Reports Repository",
      status: "DEMO",
      observedAt: new Date().toISOString(),
      latencyMs: 1,
      summary: `${relevantReports.length} report(s) logged in sector (${relevantReports.filter((r) => r.isVerified).length} verified)`,
    });
  } else {
    sourceHealth.push({
      name: "Citizen Field Reports",
      source: "SentinalX Reports Repository",
      status: "UNAVAILABLE",
      observedAt: null,
      latencyMs: null,
      summary: "No field reports available",
    });
  }

  // 5. Copernicus Satellite Metadata (Observation discovery only)
  if (satRes.status === "fulfilled" && satRes.value) {
    const s = satRes.value;
    sourceHealth.push({
      name: "Copernicus Satellite Catalog",
      source: "Copernicus Data Space STAC",
      status: s.status,
      observedAt: s.fetchedAt,
      latencyMs: Date.now() - t0,
      summary: `${s.observationCount} Sentinel-1/2 products discovered in sector`,
    });
  } else {
    sourceHealth.push({
      name: "Copernicus Satellite Catalog",
      source: "Copernicus Data Space",
      status: "FALLBACK",
      observedAt: new Date().toISOString(),
      latencyMs: null,
      summary: "Satellite catalog discovery fallback active",
    });
  }

  return {
    inputs,
    location,
    sourceHealth,
  };
}
