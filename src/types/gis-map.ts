export type LayerFilter = "all" | "hazards" | "historical" | "sensors" | "shelters" | "routes";

export interface LayerVisibility {
  riskZones: boolean;
  historical: boolean;
  shelters: boolean;
  sensors: boolean;
  reports: boolean;
  roads: boolean;
}

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  riskZones: true,
  historical: true,
  shelters: true,
  sensors: true,
  reports: true,
  roads: true,
};

export type RecommendedAction = "MONITOR" | "STAY ALERT" | "AVOID ZONE" | "EVACUATE";

export interface GisMapFeature {
  id: string;
  name: string;
  subCode?: string;
  type: "hazard" | "historical" | "sensor" | "shelter" | "location" | "report";
  riskLevel: "Critical" | "High" | "Moderate" | "Safe" | "Low";
  fos?: number;
  saturation?: string;
  rainfall?: number | string;
  moisture?: string;
  slopeFos?: number;
  riskScore?: number;
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
