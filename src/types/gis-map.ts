export type LayerFilter = "all" | "hazards" | "historical" | "sensors" | "shelters" | "routes";

export interface LayerVisibility {
  heatmap: boolean;
  riskZones: boolean;
  reports: boolean;
  incidents: boolean;
  roads: boolean;
  shelters: boolean;
  sensors: boolean;
  historical?: boolean;
}

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  heatmap: true,
  riskZones: true,
  reports: true,
  incidents: true,
  roads: true,
  shelters: true,
  sensors: true,
  historical: false,
};

export type RecommendedAction = "MONITOR" | "STAY ALERT" | "AVOID ZONE" | "EVACUATE";

export interface GisMapFeature {
  id: string;
  name: string;
  subCode?: string;
  type: "hazard" | "historical" | "sensor" | "shelter" | "location" | "report" | "incident" | "road";
  riskLevel: "Critical" | "High" | "Moderate" | "Safe" | "Low";
  fos?: number;
  saturation?: string;
  rainfall?: number | string;
  moisture?: string;
  groundMovement?: string;
  slopeStability?: string;
  slopeFos?: number;
  riskScore?: number;
  road?: string;
  status?: string;
  activeIncidents?: number;
  affectedRoads?: number;
  nearbyShelters?: number;
  dataSource?: string;
  recommendedAction?: RecommendedAction;
  actionAdvice?: string;
  telemetry1?: string;
  telemetry2?: string;
  telemetry3?: string;
  description: string;
  actionText: string;
  actionHref: string;
  coords?: { x: number; y: number };
  latLng?: [number, number];
  isDemo?: boolean;
}

export interface NerLocationItem {
  id: string;
  name: string;
  state: string;
  latLng: [number, number];
  zoom: number;
  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";
  rainfall: number;
  soilMoisture: number;
  groundMovement: string;
  slopeStability: string;
  activeIncidents: number;
  affectedRoads: number;
  nearbyShelters: number;
  primaryRoad: string;
  roadStatus: string;
  description: string;
}
