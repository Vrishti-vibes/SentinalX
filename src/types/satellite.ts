export interface SatelliteObservation {
  productId: string;
  collection: "SENTINEL-1-SAR" | "SENTINEL-2-OPTICAL" | "SENTINEL-3" | "OTHER";
  satellitePlatform: string;
  acquisitionTime: string; // ISO 8601
  cloudCoverPercent?: number | null;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  previewUrl?: string | null;
  catalogUrl: string;
  orbitNumber?: number | null;
  processingLevel: string;
}

export interface SatelliteCatalogResponse {
  source: "Copernicus Data Space";
  status: "LIVE" | "CONFIG_REQUIRED" | "FALLBACK";
  isFallback: boolean;
  fetchedAt: string;
  area: {
    name: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  observationCount: number;
  observations: SatelliteObservation[];
  message: string;
  freshness: string;
  attribution: string;
  disclaimer: string;
}

export interface SatelliteApiResponse {
  success: boolean;
  data: SatelliteCatalogResponse;
  error?: string;
}
