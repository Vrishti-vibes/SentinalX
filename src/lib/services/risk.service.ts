import {
  RiskInputs,
  RiskEngineResult,
  RiskFactors,
  FactorDetail,
  EngineRiskLevel,
  SourceProvenance,
  SensorTelemetry,
  IncidentReport,
  NormalizedFieldReportInput,
  RiskLocationContext,
  SourceHealthItem,
} from "@/types/risk";
import { NormalizedWeatherResponse } from "@/types/weather";

// ==========================================
// CONFIGURABLE OPERATIONAL WEIGHTS
// ==========================================
export const DEFAULT_RISK_WEIGHTS = {
  RAINFALL: 0.25,
  SOIL_MOISTURE: 0.20,
  PORE_PRESSURE: 0.20,
  SLOPE_STABILITY: 0.15,
  GROUND_MOTION: 0.10,
  FIELD_REPORTS: 0.10,
} as const;

// OPERATIONAL HEURISTIC THRESHOLDS
export const PROTOTYPE_THRESHOLDS = {
  SAFE_MAX: 29.9,
  MODERATE_MAX: 59.9,
  HIGH_MAX: 79.9,
  CRITICAL_MIN: 80.0,
  RANGES: {
    safeRange: "0.0 – 29.9 (Nominal Baseline)",
    moderateRange: "30.0 – 59.9 (Elevated Alert Watch)",
    highRange: "60.0 – 79.9 (High Hazard Advisory)",
    criticalRange: "80.0 – 100.0 (Severe Emergency Trigger)",
  },
} as const;

export const PROTOTYPE_DISCLAIMER =
  "SENTINALX OPERATIONAL RISK ENGINE • MULTI-SOURCE GEOTECHNICAL INTELLIGENCE GRID";

function calculateFreshnessMinutes(isoString?: string): number | null {
  if (!isoString) return null;
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.max(0, Math.round(diffMs / 60000));
  } catch {
    return null;
  }
}

/**
 * 1. Normalize Hydrological / Rainfall Input (0 to 100)
 */
function evaluateRainfallFactor(inputs: RiskInputs): FactorDetail {
  const { rainfall24hMm, rainfall72hMm, maxHourlyRainfallMm, rainfallSource, rainfallObservedAt } = inputs;

  if (rainfall24hMm === undefined && rainfall72hMm === undefined && maxHourlyRainfallMm === undefined) {
    return {
      factor: "rainfall",
      raw: null,
      normalizedScore: 0,
      score: 0,
      weight: 0,
      weightedContribution: 0,
      contribution: 0,
      status: "UNAVAILABLE",
      source: "No precipitation stream supplied",
      label: "Precipitation & Rainfall",
      summary: "No precipitation telemetry available in target sector.",
      observedAt: null,
      freshnessMinutes: null,
      isEstimated: true,
    };
  }

  const r24 = rainfall24hMm ?? 0;
  const r72 = rainfall72hMm ?? r24 * 1.8;
  const rMax = maxHourlyRainfallMm ?? 0;

  // Prototype heuristic curve for NER mountain terrain:
  const score24 = Math.min((r24 / 150) * 100, 100);
  const scoreHourly = Math.min((rMax / 30) * 100, 100);
  const score72 = Math.min((r72 / 300) * 100, 100);

  const combinedScore = Math.min(
    Math.round(score24 * 0.6 + scoreHourly * 0.25 + score72 * 0.15),
    100
  );

  let summary = `24h Total: ${r24.toFixed(1)} mm`;
  if (rMax > 0) summary += ` | Peak: ${rMax.toFixed(1)} mm/hr`;

  const source = rainfallSource || "Open-Meteo Weather Forecast Model (Non-IMD)";
  const isEstimated = source.toLowerCase().includes("fallback") || source.toLowerCase().includes("simulated");

  return {
    factor: "rainfall",
    raw: r24,
    normalizedScore: combinedScore,
    score: combinedScore,
    weight: DEFAULT_RISK_WEIGHTS.RAINFALL,
    weightedContribution: 0, // calculated in normalization pass
    contribution: 0,
    status: isEstimated ? "FALLBACK" : "LIVE",
    source,
    label: "Precipitation & Cumulative Rain",
    summary,
    observedAt: rainfallObservedAt || new Date().toISOString(),
    freshnessMinutes: calculateFreshnessMinutes(rainfallObservedAt),
    isEstimated,
  };
}

/**
 * 2. Normalize Soil Moisture Factor (0 to 100)
 */
function evaluateSoilMoistureFactor(inputs: RiskInputs): FactorDetail {
  const { soilMoisturePercent, soilMoistureSource, soilMoistureObservedAt } = inputs;

  if (soilMoisturePercent === undefined) {
    return {
      factor: "soilMoisture",
      raw: null,
      normalizedScore: 0,
      score: 0,
      weight: 0,
      weightedContribution: 0,
      contribution: 0,
      status: "UNAVAILABLE",
      source: "Soil moisture profile unavailable",
      label: "Soil Moisture Index (Weather Model)",
      summary: "Soil moisture data unavailable.",
      observedAt: null,
      freshnessMinutes: null,
      isEstimated: true,
    };
  }

  // Heuristic indicator curve based on Open-Meteo volumetric soil layers
  let score = 0;
  if (soilMoisturePercent < 40) {
    score = (soilMoisturePercent / 40) * 25;
  } else if (soilMoisturePercent < 70) {
    score = 25 + ((soilMoisturePercent - 40) / 30) * 35; // 25 -> 60
  } else if (soilMoisturePercent < 85) {
    score = 60 + ((soilMoisturePercent - 70) / 15) * 25; // 60 -> 85
  } else {
    score = 85 + Math.min(((soilMoisturePercent - 85) / 15) * 15, 15); // 85 -> 100
  }

  const normalizedScore = Math.min(Math.round(score), 100);
  const source = soilMoistureSource || "Open-Meteo Volumetric Soil Profile (Model)";
  const isEstimated = source.toLowerCase().includes("fallback") || source.toLowerCase().includes("simulated");

  return {
    factor: "soilMoisture",
    raw: soilMoisturePercent,
    normalizedScore,
    score: normalizedScore,
    weight: DEFAULT_RISK_WEIGHTS.SOIL_MOISTURE,
    weightedContribution: 0,
    contribution: 0,
    status: isEstimated ? "FALLBACK" : "LIVE",
    source,
    label: "Soil Moisture Index (Weather Model)",
    summary: `Estimated moisture indicator: ${soilMoisturePercent.toFixed(1)}% (derived from forecast layers).`,
    observedAt: soilMoistureObservedAt || new Date().toISOString(),
    freshnessMinutes: calculateFreshnessMinutes(soilMoistureObservedAt),
    isEstimated,
  };
}

/**
 * 3. Normalize Pore Water Pressure & Geotech Telemetry (0 to 100)
 */
function evaluatePorePressureFactor(inputs: RiskInputs): FactorDetail {
  const { porePressureKpa, tiltAngleDeg, sensorStatus, sensorSource, sensorObservedAt } = inputs;

  if (porePressureKpa === undefined && tiltAngleDeg === undefined) {
    return {
      factor: "porePressure",
      raw: null,
      normalizedScore: 0,
      score: 0,
      weight: 0,
      weightedContribution: 0,
      contribution: 0,
      status: "UNAVAILABLE",
      source: "No sensor telemetry supplied",
      label: "Pore Pressure & Tilt (Field Telemetry)",
      summary: "No sensor telemetry supplied.",
      observedAt: null,
      freshnessMinutes: null,
      isEstimated: true,
    };
  }

  const kpa = porePressureKpa ?? 0;
  const tilt = tiltAngleDeg ?? 0;

  // Operational thresholds: nominal <20 kPa, elevated 20-50 kPa, critical >50 kPa
  const pressureScore = Math.min((kpa / 70) * 100, 100);
  const tiltScore = Math.min((tilt / 15) * 100, 100);

  let combined = Math.round(pressureScore * 0.65 + tiltScore * 0.35);
  if (sensorStatus === "DEGRADED") combined = Math.min(combined + 10, 100);

  const source = sensorSource || "In-Situ Geotechnical Telemetry Grid (IoT)";

  return {
    factor: "porePressure",
    raw: kpa,
    normalizedScore: Math.min(combined, 100),
    score: Math.min(combined, 100),
    weight: DEFAULT_RISK_WEIGHTS.PORE_PRESSURE,
    weightedContribution: 0,
    contribution: 0,
    status: "ESTIMATED",
    source,
    label: "Pore Pressure & Tilt (Field Telemetry)",
    summary: `Hydrostatic pressure: ${kpa.toFixed(1)} kPa | Slope displacement: ${tilt.toFixed(1)}° tilt.`,
    observedAt: sensorObservedAt || new Date().toISOString(),
    freshnessMinutes: calculateFreshnessMinutes(sensorObservedAt),
    isEstimated: true,
  };
}

/**
 * 4. Normalize Slope Stability / Factor of Safety (0 to 100)
 */
function evaluateSlopeStabilityFactor(inputs: RiskInputs): FactorDetail {
  const { factorOfSafety, slopeAngleDeg, terrainVulnerabilityIndex } = inputs;

  if (factorOfSafety === undefined && slopeAngleDeg === undefined && terrainVulnerabilityIndex === undefined) {
    return {
      factor: "slopeStability",
      raw: null,
      normalizedScore: 0,
      score: 0,
      weight: 0,
      weightedContribution: 0,
      contribution: 0,
      status: "UNAVAILABLE",
      source: "DEM / Lithology profile unavailable",
      label: "Slope & Geomorphic Stability",
      summary: "DEM slope stability profile unavailable.",
      observedAt: null,
      freshnessMinutes: null,
      isEstimated: true,
    };
  }

  let stabilityScore = 30; // fallback moderate default

  if (factorOfSafety !== undefined) {
    if (factorOfSafety >= 1.6) {
      stabilityScore = Math.max(0, 20 - (factorOfSafety - 1.6) * 20);
    } else if (factorOfSafety >= 1.2) {
      stabilityScore = 20 + ((1.6 - factorOfSafety) / 0.4) * 30;
    } else if (factorOfSafety >= 1.0) {
      stabilityScore = 50 + ((1.2 - factorOfSafety) / 0.2) * 30;
    } else {
      stabilityScore = 80 + Math.min(((1.0 - factorOfSafety) / 0.3) * 20, 20);
    }
  } else if (slopeAngleDeg !== undefined) {
    stabilityScore = Math.min(Math.max((slopeAngleDeg - 15) / 40, 0) * 100, 100);
  } else if (terrainVulnerabilityIndex !== undefined) {
    stabilityScore = Math.min(Math.max(terrainVulnerabilityIndex, 0) * 100, 100);
  }

  const rawDisplay = factorOfSafety !== undefined ? `${factorOfSafety.toFixed(2)} FoS` : slopeAngleDeg ? `${slopeAngleDeg}° slope` : null;

  return {
    factor: "slopeStability",
    raw: rawDisplay,
    normalizedScore: Math.round(stabilityScore),
    score: Math.round(stabilityScore),
    weight: DEFAULT_RISK_WEIGHTS.SLOPE_STABILITY,
    weightedContribution: 0,
    contribution: 0,
    status: "DEMO",
    source: "Copernicus DEM 30m / Geomorphic Slope Model",
    label: "Slope & Geomorphic Stability (FoS)",
    summary: factorOfSafety !== undefined ? `Factor of Safety estimated at ${factorOfSafety.toFixed(2)} (${factorOfSafety < 1.0 ? "Failure Zone" : factorOfSafety < 1.3 ? "Marginally Stable" : "Stable"}).` : "Terrain elevation model gradient assessed.",
    observedAt: new Date().toISOString(),
    freshnessMinutes: 0,
    isEstimated: true,
  };
}

/**
 * 5. Normalize Ground Motion / Seismic Triggers (0 to 100)
 */
function evaluateGroundMotionFactor(inputs: RiskInputs): FactorDetail {
  const { groundMotionIndex, groundMotionSource, groundMotionObservedAt } = inputs;

  if (groundMotionIndex === undefined) {
    return {
      factor: "groundMotion",
      raw: null,
      normalizedScore: 0,
      score: 0,
      weight: 0,
      weightedContribution: 0,
      contribution: 0,
      status: "UNAVAILABLE",
      source: "No seismic indicator supplied",
      label: "Ground Motion (USGS Indicator)",
      summary: "No ground-motion parameter supplied.",
      observedAt: null,
      freshnessMinutes: null,
      isEstimated: true,
    };
  }

  // 0.0 (quiescent) to 1.0 (strong ground motion parameter)
  const normalizedScore = Math.min(Math.round(Math.max(groundMotionIndex, 0) * 100), 100);
  const source = groundMotionSource || "USGS FDSN Earthquake Catalog API (Live Indicator)";
  const isLive = source.toLowerCase().includes("usgs") && !source.toLowerCase().includes("simulated") && !source.toLowerCase().includes("fallback");

  return {
    factor: "groundMotion",
    raw: groundMotionIndex,
    normalizedScore,
    score: normalizedScore,
    weight: DEFAULT_RISK_WEIGHTS.GROUND_MOTION,
    weightedContribution: 0,
    contribution: 0,
    status: isLive ? "LIVE" : "DEMO",
    source,
    label: "Ground Motion (USGS Seismic Indicator)",
    summary: `Prototype ground-motion index: ${(groundMotionIndex * 100).toFixed(0)}% (USGS seismic indicator).`,
    observedAt: groundMotionObservedAt || new Date().toISOString(),
    freshnessMinutes: calculateFreshnessMinutes(groundMotionObservedAt),
    isEstimated: !isLive,
  };
}

/**
 * 6. Normalize Verified Field Incident Reports (0 to 100)
 */
function evaluateFieldReportsFactor(inputs: RiskInputs): FactorDetail {
  const { recentFieldReports } = inputs;

  if (!recentFieldReports || recentFieldReports.length === 0) {
    return {
      factor: "fieldReports",
      raw: 0,
      normalizedScore: 0,
      score: 0,
      weight: DEFAULT_RISK_WEIGHTS.FIELD_REPORTS,
      weightedContribution: 0,
      contribution: 0,
      status: "DEMO",
      source: "SentinalX Verified Field Reports Database",
      label: "Field Incident Reports",
      summary: "0 active hazard reports logged in sector.",
      observedAt: new Date().toISOString(),
      freshnessMinutes: 0,
      isEstimated: false,
    };
  }

  let totalReportScore = 0;

  for (const report of recentFieldReports) {
    let score = (report.severity / 5) * 50;
    if (report.isVerified) score *= 1.3;
    if (report.roadBlocked) score += 20;
    totalReportScore += score;
  }

  const normalizedScore = Math.min(Math.round(totalReportScore), 100);

  return {
    factor: "fieldReports",
    raw: recentFieldReports.length,
    normalizedScore,
    score: normalizedScore,
    weight: DEFAULT_RISK_WEIGHTS.FIELD_REPORTS,
    weightedContribution: 0,
    contribution: 0,
    status: "DEMO",
    source: "SentinalX Verified Field Reports Database",
    label: "Field Incident Reports",
    summary: `${recentFieldReports.length} field report(s) logged (${recentFieldReports.filter((r) => r.isVerified).length} verified).`,
    observedAt: new Date().toISOString(),
    freshnessMinutes: 0,
    isEstimated: false,
  };
}

/**
 * MAIN RISK COMPUTATION ENGINE (Stateless, Transparent, Explainable)
 */
export function computeLandslideRisk(
  inputs: RiskInputs,
  locationContext?: RiskLocationContext,
  sourceHealth?: SourceHealthItem[]
): RiskEngineResult {
  const rainfall = evaluateRainfallFactor(inputs);
  const soilMoisture = evaluateSoilMoistureFactor(inputs);
  const porePressure = evaluatePorePressureFactor(inputs);
  const slopeStability = evaluateSlopeStabilityFactor(inputs);
  const groundMotion = evaluateGroundMotionFactor(inputs);
  const fieldReports = evaluateFieldReportsFactor(inputs);

  const rawFactors = [
    rainfall,
    soilMoisture,
    porePressure,
    slopeStability,
    groundMotion,
    fieldReports,
  ];

  // Calculate sum of active weights (dynamically renormalizes so partial data never deflates score)
  const activeWeightSum = rawFactors.reduce(
    (sum, f) => (f.status !== "UNAVAILABLE" ? sum + f.weight : sum),
    0
  );

  let finalScore = 0;
  const explanations: string[] = [];

  if (activeWeightSum > 0) {
    for (const factor of rawFactors) {
      if (factor.status !== "UNAVAILABLE") {
        const effectiveWeight = factor.weight / activeWeightSum;
        const contribution = factor.normalizedScore * effectiveWeight;
        factor.weightedContribution = Number(contribution.toFixed(1));
        factor.contribution = factor.weightedContribution;
        finalScore += contribution;

        // Add top contributing factors to explanations
        if (factor.normalizedScore >= 60) {
          explanations.push(
            `HIGH ${factor.label.toUpperCase()}: ${factor.summary}`
          );
        } else if (factor.normalizedScore >= 35) {
          explanations.push(`ELEVATED ${factor.label}: ${factor.summary}`);
        }
      } else {
        factor.weightedContribution = 0;
        factor.contribution = 0;
      }
    }
  }

  finalScore = Math.min(Math.max(Number(finalScore.toFixed(1)), 0), 100);

  if (explanations.length === 0) {
    explanations.push("All environmental and geotechnical telemetry within nominal prototype safety baselines.");
  }

  // Determine categorical Risk Level
  let level: EngineRiskLevel = "SAFE";
  let primaryThreat = "Baseline Soil Equilibrium";
  let recommendation = "Standard surveillance active.";

  if (finalScore >= PROTOTYPE_THRESHOLDS.CRITICAL_MIN) {
    level = "CRITICAL";
    primaryThreat = "Severe Slope Liquefaction / Shear Failure Imminent";
    recommendation = "Immediate civilian evacuation to designated shelters and road closure enforcement.";
  } else if (finalScore > PROTOTYPE_THRESHOLDS.MODERATE_MAX) {
    level = "HIGH";
    primaryThreat = "Heightened Pore Pressure & Rapid Slope Creep";
    recommendation = "Restrict heavy transport on mountain corridors and place quick response teams on standby.";
  } else if (finalScore > PROTOTYPE_THRESHOLDS.SAFE_MAX) {
    level = "MODERATE";
    primaryThreat = "Moisture Infiltration on Hill Slopes";
    recommendation = "Continuous telemetry watch and automated citizen advisories.";
  }

  // Input coverage ratio: proportion of input streams supplied (NOT model accuracy)
  const activeStreamCount = rawFactors.filter((f) => f.status !== "UNAVAILABLE").length;
  const inputCoverageRatio = Number((activeStreamCount / rawFactors.length).toFixed(2));

  const sources: SourceProvenance = {
    weather: rainfall.status,
    sensors: porePressure.status,
    fieldReports: fieldReports.status,
    terrain: slopeStability.status,
  };

  const factors: RiskFactors = {
    rainfall,
    soilMoisture,
    porePressure,
    slopeStability,
    groundMotion,
    fieldReports,
  };

  const nowIso = new Date().toISOString();

  return {
    score: finalScore,
    level,
    inputCoverageRatio,
    primaryThreat,
    recommendation,
    location: locationContext,
    factors,
    sources,
    sourceHealth,
    explanations,
    prototypeThresholds: PROTOTYPE_THRESHOLDS.RANGES,
    calculatedAt: nowIso,
    timestamp: nowIso,
  };
}

// ==========================================
// ADAPTERS (Connecting Real / Mock Data Sources)
// ==========================================

export function adaptWeatherToRiskInputs(weather: NormalizedWeatherResponse): Partial<RiskInputs> {
  return {
    rainfall24hMm: weather.recent.rainfall24hMm,
    rainfall72hMm: weather.recent.rainfall72hMm,
    maxHourlyRainfallMm: weather.recent.maxHourlyRainfallMm,
    soilMoisturePercent: weather.soil.moisturePercent,
    latitude: weather.location.latitude,
    longitude: weather.location.longitude,
    locationName: weather.location.name,
    rainfallSource: weather.attribution,
    rainfallObservedAt: weather.timestamp,
    soilMoistureSource: weather.attribution,
    soilMoistureObservedAt: weather.timestamp,
  };
}

export function adaptSensorToRiskInputs(sensor: SensorTelemetry): Partial<RiskInputs> {
  return {
    porePressureKpa: sensor.porePressureKpa,
    tiltAngleDeg: sensor.tiltAngleDeg,
    soilMoisturePercent: sensor.soilMoisturePercent,
    rainfall24hMm: sensor.rainfall24hMm,
    sensorStatus: sensor.status,
    locationName: sensor.stationName,
    latitude: sensor.coordinates[0],
    longitude: sensor.coordinates[1],
    sensorSource: sensor.stationName,
    sensorObservedAt: sensor.lastUpdated,
  };
}

export function adaptReportsToFieldReportInputs(reports: IncidentReport[]): NormalizedFieldReportInput[] {
  return reports.map((r) => ({
    id: r.id,
    severity: r.severity,
    isVerified: r.status === "VERIFIED" || r.status === "DISPATCHED" || r.status === "RESOLVED",
    roadBlocked: r.roadBlocked,
    locationName: r.locationName,
  }));
}
