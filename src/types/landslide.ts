/**
 * SentinalX Landslide Data & ML Types for North Eastern Region (NER)
 * Phase 17 Fix: Leakage-Safe Spatial-Temporal Partitioning & Version Consistency
 */

export type NerState =
  | "Arunachal Pradesh"
  | "Assam"
  | "Manipur"
  | "Meghalaya"
  | "Mizoram"
  | "Nagaland"
  | "Sikkim"
  | "Tripura";

export const NER_STATES: readonly NerState[] = [
  "Arunachal Pradesh",
  "Assam",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
] as const;

export type LandslideSource =
  | "GSI_BHUSANKET"
  | "ISRO_NRSC_LANDSLIDE_ATLAS"
  | "NASA_GLOBAL_LANDSLIDE_CATALOG"
  | "STATE_DISASTER_MANAGEMENT"
  | "OPEN_METEO_HISTORICAL_ARCHIVE";

export type ProvenanceClassification =
  | "DIRECT_SOURCE_RECORD"
  | "SOURCE_DERIVED"
  | "CATALOG_REFERENCE"
  | "MANUALLY_CURATED"
  | "PROVENANCE_INCOMPLETE";

export interface DataProvenance {
  source: LandslideSource | string;
  sourceUrl: string;
  retrievedAt: string;
  licenseOrTerms: string;
  processingVersion: string;
  provenanceClassification?: ProvenanceClassification;
}

export interface HistoricalLandslideRecord {
  id: string;
  sourceRecordId?: string | null;
  latitude: number;
  longitude: number;
  date: string; // ISO 8601 or YYYY-MM-DD
  state: NerState | string;
  district?: string | null;
  locationName?: string | null;
  clusterId?: string;
  source: LandslideSource;
  sourceUrl?: string | null;
  landslideType?: string | null;
  trigger?: string | null;
  severity?: string | null;
  fatalities?: number | null;
  injuries?: number | null;
  geocodeStatus?: "VERIFIED" | "GEOCODE_INCOMPLETE";
  provenanceClassification?: ProvenanceClassification;
  provenance: DataProvenance;
}

export interface FeatureLineageAnchor {
  sampleId: string;
  clusterId: string;
  source: string;
  sourceRecordId: string;
  provenanceClassification: ProvenanceClassification;
  geographicAnchor: {
    state: string;
    district: string | null;
    coordinates: { lat: number; lon: number };
  };
  temporalAnchor: string;
  rainfallLineage: {
    provider: string;
    window: string;
    method: string;
  };
  terrainLineage: {
    provider: string;
    resolution: string;
    method: string;
  };
  seismicLineage: {
    provider: string;
    method: string;
  };
  label: 1 | 0;
}

export interface NerDatasetSample {
  sampleId: string;
  clusterId?: string;
  latitude: number;
  longitude: number;
  state: NerState | string;
  district?: string | null;
  timestamp: string;
  landslideOccurred: 1 | 0;

  // Environmental features (strictly antecedent to event timestamp)
  rainfall_1h_mm?: number | null;
  rainfall_3h_mm?: number | null;
  rainfall_24h_mm?: number | null;
  rainfall_72h_mm?: number | null;

  elevation_m?: number | null;
  slope_deg?: number | null;
  aspect_deg?: number | null;

  soil_moisture_m3m3?: number | null;
  seismic_indicator?: number | null;

  isNegativeSample: boolean;
  negativeControlMethod?: string;
  negativeControlEvidence?: string;

  featureSource?: Record<string, string>;
  featureTimestamp?: string;
  featureMethod?: string;

  lineage?: FeatureLineageAnchor;
  provenance: DataProvenance;
}

export interface DataQualityReport {
  datasetVersion: string;
  datasetStatus: "READY_FOR_PROTOTYPE" | "LIMITED_DATA" | "INSUFFICIENT_DATA" | "DATA_QUALITY_WARNING";
  totalRecords: number;
  nerRecords: number;
  positiveCount: number;
  negativeCount: number;
  stateBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  dateRange: {
    start: string;
    end: string;
  };
  missingness: {
    missingCoords: number;
    missingDates: number;
    missingRainfall: number;
    missingTerrain: number;
  };
  duplicates: {
    count: number;
    details: string[];
  };
  negativeControlQuality: {
    validNegatives: number;
    method: string;
    status: string;
  };
  leakageAudit: {
    temporalLeakage: boolean;
    spatialLeakage: boolean;
    sameIncidentLeakage: boolean;
    duplicateLeakage: boolean;
    minTrainTestDistanceKm: number;
    notes: string;
  };
  rawSourceCoverage: number;
  recordProvenanceCoverage: number;
  rainfallProvenanceCoverage: number;
  terrainProvenanceCoverage: number;
  lineageCoverage: number;
  negativeControlEvidenceCoverage: number;
  reproducibilityStatus: "VERIFIED" | "PARTIAL" | "LIMITED" | "UNAVAILABLE";
  negativeSamplingMethod: string;
  spatialJoinMethod: string;
  temporalJoinMethod: string;
  generatedAt: string;
}

export interface MlPredictionRequest {
  latitude: number;
  longitude: number;
  timestamp?: string;
  rainfall_1h_mm?: number | null;
  rainfall_3h_mm?: number | null;
  rainfall_24h_mm?: number | null;
  rainfall_72h_mm?: number | null;
  elevation_m?: number | null;
  slope_deg?: number | null;
  aspect_deg?: number | null;
  soil_moisture_m3m3?: number | null;
  seismic_indicator?: number | null;
}

export interface MlPredictionResponse {
  available: boolean;
  modelStatus: "VALIDATED" | "LIMITED_DATA" | "DATA_PIPELINE_READY" | "MODEL_NOT_TRAINED" | "HEURISTIC_FALLBACK";
  prediction?: 0 | 1 | null;
  predictionProbability?: number | null;
  probability?: number | null; // Backwards compatibility
  riskScore?: number | null;
  modelVersion: string;
  datasetVersion: string;
  featureCoverage: {
    total: number;
    present: number;
    ratio: number;
  };
  featureImportance?: Record<string, number>;
  calculatedAt: string;
  modelLimitations: string[];
  disclaimer: string;
}
