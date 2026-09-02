import { memoryCache } from "@/lib/cache";
import {
  SatelliteObservation,
  SatelliteCatalogResponse,
} from "@/types/satellite";

export const COPERNICUS_DISCLAIMER =
  "COPERNICUS DATA SPACE • OBSERVATION METADATA CATALOG ONLY • Not a direct landslide sensor or confirmed SAR displacement prediction.";

export const DEFAULT_SATELLITE_AREA = {
  name: "Tawang Sector (NER)",
  latitude: 27.586,
  longitude: 91.859,
  radiusKm: 35,
};

/**
 * Fallback static prototype observations (clearly marked as fallback)
 */
export function getDemoFallbackObservations(
  area = DEFAULT_SATELLITE_AREA
): SatelliteCatalogResponse {
  return {
    source: "Copernicus Data Space",
    status: "FALLBACK",
    isFallback: true,
    fetchedAt: new Date().toISOString(),
    area,
    observationCount: 3,
    observations: [
      {
        productId: "S2A_MSIL2A_20260828T044701_N0511_R076_T45RXP_20260828T083015",
        collection: "SENTINEL-2-OPTICAL",
        satellitePlatform: "Sentinel-2A MSI",
        acquisitionTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        cloudCoverPercent: 18.4,
        bbox: [91.35, 27.1, 92.35, 28.1],
        previewUrl: "https://dataspace.copernicus.eu/browser",
        catalogUrl: "https://catalogue.dataspace.copernicus.eu",
        orbitNumber: 76,
        processingLevel: "Level-2A (Surface Reflectance)",
      },
      {
        productId: "S1A_IW_GRDH_1SDV_20260826T120530_20260826T120555_055410_06C120_7A89",
        collection: "SENTINEL-1-SAR",
        satellitePlatform: "Sentinel-1A SAR (C-Band)",
        acquisitionTime: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
        cloudCoverPercent: null, // SAR is all-weather
        bbox: [91.2, 27.0, 92.5, 28.2],
        previewUrl: "https://dataspace.copernicus.eu/browser",
        catalogUrl: "https://catalogue.dataspace.copernicus.eu",
        orbitNumber: 110,
        processingLevel: "Level-1 GRD (Ground Range Detected)",
      },
      {
        productId: "S2B_MSIL2A_20260823T044709_N0511_R076_T45RXP_20260823T081512",
        collection: "SENTINEL-2-OPTICAL",
        satellitePlatform: "Sentinel-2B MSI",
        acquisitionTime: new Date(Date.now() - 168 * 3600 * 1000).toISOString(),
        cloudCoverPercent: 32.1,
        bbox: [91.35, 27.1, 92.35, 28.1],
        previewUrl: "https://dataspace.copernicus.eu/browser",
        catalogUrl: "https://catalogue.dataspace.copernicus.eu",
        orbitNumber: 76,
        processingLevel: "Level-2A (Surface Reflectance)",
      },
    ],
    message: "Demo satellite metadata loaded (Offline/Simulated mode).",
    freshness: "Simulated EO Metadata",
    attribution: "European Space Agency (ESA) Copernicus Programme",
    disclaimer: COPERNICUS_DISCLAIMER,
  };
}

/**
 * Search Copernicus Data Space Ecosystem STAC / Catalog API for available Sentinel observations
 */
export async function searchCopernicusCatalog(
  lat: number = DEFAULT_SATELLITE_AREA.latitude,
  lon: number = DEFAULT_SATELLITE_AREA.longitude,
  days: number = 14
): Promise<SatelliteCatalogResponse> {
  const roundedLat = Number(lat.toFixed(3));
  const roundedLon = Number(lon.toFixed(3));
  const cacheKey = `copernicus_catalog_${roundedLat}_${roundedLon}_${days}d`;

  // 1. Check in-memory cache (30 min / 1800s TTL)
  const cached = memoryCache.get<SatelliteCatalogResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const area = {
    name: `Area (${roundedLat}, ${roundedLon})`,
    latitude: roundedLat,
    longitude: roundedLon,
    radiusKm: 35,
  };

  const deltaDeg = 0.45; // roughly 35-45km bounding box
  const bbox = [
    Number((roundedLon - deltaDeg).toFixed(3)),
    Number((roundedLat - deltaDeg).toFixed(3)),
    Number((roundedLon + deltaDeg).toFixed(3)),
    Number((roundedLat + deltaDeg).toFixed(3)),
  ];

  const startTime = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const endTime = new Date().toISOString();

  // Official Copernicus Data Space STAC Search Endpoint
  const stacSearchUrl = "https://catalogue.dataspace.copernicus.eu/stac/search";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout

    const response = await fetch(stacSearchUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SentinalX-Landslide-Monitoring/1.0",
      },
      body: JSON.stringify({
        bbox,
        collections: ["SENTINEL-1", "SENTINEL-2"],
        datetime: `${startTime}/${endTime}`,
        limit: 10,
      }),
      next: { revalidate: 1800 },
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        source: "Copernicus Data Space",
        status: "CONFIG_REQUIRED",
        isFallback: true,
        fetchedAt: new Date().toISOString(),
        area,
        observationCount: 0,
        observations: [],
        message: "Copernicus catalog credentials/configuration required for live satellite search.",
        freshness: "Configuration Required",
        attribution: "European Space Agency (ESA) Copernicus Programme",
        disclaimer: COPERNICUS_DISCLAIMER,
      };
    }

    if (!response.ok) {
      console.warn(`[SatelliteService] Copernicus STAC returned status ${response.status}. Using fallback.`);
      return getDemoFallbackObservations(area);
    }

    const data = await response.json();
    const rawFeatures = Array.isArray(data.features) ? data.features : [];

    const observations: SatelliteObservation[] = rawFeatures.map(
      (f: Record<string, unknown>) => {
        const props = (f.properties || {}) as Record<string, unknown>;
        const collectionRaw = String(f.collection || props.collection || "");
        const collection: SatelliteObservation["collection"] = collectionRaw.includes("SENTINEL-1")
          ? "SENTINEL-1-SAR"
          : collectionRaw.includes("SENTINEL-2")
          ? "SENTINEL-2-OPTICAL"
          : "OTHER";

        return {
          productId: String(f.id || `eo-${Date.now()}`),
          collection,
          satellitePlatform: String(props["platform"] || props["constellation"] || "Sentinel EO"),
          acquisitionTime: String(props.datetime || props.start_datetime || new Date().toISOString()),
          cloudCoverPercent:
            typeof props["eo:cloud_cover"] === "number"
              ? Number((props["eo:cloud_cover"] as number).toFixed(1))
              : null,
          bbox: Array.isArray(f.bbox) ? (f.bbox as [number, number, number, number]) : (bbox as [number, number, number, number]),
          previewUrl: "https://dataspace.copernicus.eu/browser",
          catalogUrl: "https://catalogue.dataspace.copernicus.eu",
          orbitNumber: typeof props["sat:orbit_state"] === "number" ? props["sat:orbit_state"] : null,
          processingLevel: String(props["processing:level"] || "Level-1/2 Standard"),
        };
      }
    );

    const result: SatelliteCatalogResponse = {
      source: "Copernicus Data Space",
      status: "LIVE",
      isFallback: false,
      fetchedAt: new Date().toISOString(),
      area,
      observationCount: observations.length,
      observations,
      message: `Successfully retrieved ${observations.length} Sentinel observation(s) from Copernicus STAC catalog.`,
      freshness: "Live Copernicus Data Space STAC Catalog",
      attribution: "European Space Agency (ESA) Copernicus Data Space Ecosystem",
      disclaimer: COPERNICUS_DISCLAIMER,
    };

    memoryCache.set(cacheKey, result, 1800);
    return result;
  } catch (err: unknown) {
    console.error("[SatelliteService] Exception querying Copernicus catalog:", err);
    return getDemoFallbackObservations(area);
  }
}
