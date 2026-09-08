export type ProviderDataStatus =
  | "LIVE"
  | "CONNECTED"
  | "VERIFIED_HISTORICAL"
  | "DEMO"
  | "FALLBACK"
  | "CONFIG_REQUIRED"
  | "LIMITED_DATA"
  | "PROTOTYPE"
  | "OFFLINE"
  | "UNAVAILABLE"
  | "ERROR";

export interface ExternalProviderInfo {
  providerName: string;
  source: string;
  status: ProviderDataStatus;
  isFallback: boolean;
  fetchedAt: string;
  summary: string;
  freshness: string;
  itemCount?: number;
  attribution: string;
}

export interface UnifiedDataStatusResponse {
  weather: ExternalProviderInfo;
  groundMotion: ExternalProviderInfo;
  satellite: ExternalProviderInfo;
  geotechnicalSensors: ExternalProviderInfo;
  routing?: ExternalProviderInfo;
  fieldReports?: ExternalProviderInfo;
  historicalDataset?: ExternalProviderInfo;
  mlModel?: ExternalProviderInfo;
  riskEngine?: ExternalProviderInfo;
  timestamp: string;
  overallHealth: "OPTIMAL" | "DEGRADED_FALLBACK" | "OFFLINE";
  architectureNote: string;
  disclaimer: string;
}

export interface UnifiedDataStatusApiResponse {
  success: boolean;
  data: UnifiedDataStatusResponse;
}
