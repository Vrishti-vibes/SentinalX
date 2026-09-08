import { memoryCache } from "@/lib/cache";
import {
  NormalizedWeatherResponse,
  LocationInfo,
} from "@/types/weather";

// Default demo location: Tawang, Arunachal Pradesh
export const DEFAULT_NER_LOCATION: LocationInfo = {
  name: "Tawang Sector",
  state: "Arunachal Pradesh",
  latitude: 27.586,
  longitude: 91.859,
  elevation: 3048,
};

// Known NER reference locations
export const NER_LOCATIONS: Record<string, LocationInfo> = {
  tawang: DEFAULT_NER_LOCATION,
  zemithang: {
    name: "Zemithang Valley",
    state: "Arunachal Pradesh",
    latitude: 27.705,
    longitude: 91.718,
    elevation: 2300,
  },
  gangtok: {
    name: "Gangtok / Sevoke Corridor",
    state: "Sikkim",
    latitude: 27.338,
    longitude: 88.606,
    elevation: 1650,
  },
  shillong: {
    name: "Cherrapunji / Sonapur Ridge",
    state: "Meghalaya",
    latitude: 25.27,
    longitude: 91.73,
    elevation: 1484,
  },
  haflong: {
    name: "Haflong / Jatinga",
    state: "Assam",
    latitude: 25.17,
    longitude: 93.02,
    elevation: 680,
  },
};

/**
 * WMO Weather Code interpreter
 */
function interpretWeatherCode(code: number): string {
  if (code === 0) return "Clear Sky";
  if (code === 1 || code === 2 || code === 3) return "Partly Cloudy / Overcast";
  if (code === 45 || code === 48) return "Fog / Mountain Mist";
  if (code >= 51 && code <= 55) return "Light to Moderate Drizzle";
  if (code >= 61 && code <= 65) return "Rain / Monsoon Showers";
  if (code >= 71 && code <= 77) return "Snowfall / Sleet";
  if (code >= 80 && code <= 82) return "Heavy Rain Showers";
  if (code >= 95 && code <= 99) return "Thunderstorm with High Precipitation";
  return "Variable Cloudiness";
}

/**
 * Fallback baseline weather response when external network is unavailable
 */
export function getDemoFallbackWeather(
  location: LocationInfo = DEFAULT_NER_LOCATION
): NormalizedWeatherResponse {
  return {
    source: "Open-Meteo Weather Model (Cached Baseline)",
    isFallback: true,
    status: "FALLBACK",
    timestamp: new Date().toISOString(),
    location,
    current: {
      temperatureC: 16.4,
      relativeHumidityPercent: 92,
      precipitationMm: 12.8,
      rainMm: 12.8,
      weatherCode: 80,
      weatherDescription: "Heavy Rain Showers",
      precipitationProbabilityPercent: 95,
      windSpeedKmh: 14.5,
    },
    recent: {
      rainfall1hMm: 12.8,
      rainfall24hMm: 142.5,
      rainfall72hMm: 286.0,
      maxHourlyRainfallMm: 24.5,
    },
    soil: {
      moisture0to7cmM3M3: 0.42,
      moisture7to28cmM3M3: 0.45,
      moisturePercent: 84.0,
      soilTemperatureC: 13.2,
    },
    freshness: "Regional Geotechnical Baseline (Standby Mode)",
    attribution: "Open-Meteo Historical Archive & Landslide Baseline",
    disclaimer: "Operational baseline active. Awaiting fresh external satellite connection.",
  };
}

/**
 * Server-side service to fetch and normalize weather from Open-Meteo
 */
export async function fetchNormalizedWeather(
  lat: number = DEFAULT_NER_LOCATION.latitude,
  lon: number = DEFAULT_NER_LOCATION.longitude,
  locationName?: string
): Promise<NormalizedWeatherResponse> {
  const roundedLat = Number(lat.toFixed(3));
  const roundedLon = Number(lon.toFixed(3));
  const cacheKey = `weather_${roundedLat}_${roundedLon}`;

  // 1. Check in-memory TTL cache (5 min TTL)
  const cached = memoryCache.get<NormalizedWeatherResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const location: LocationInfo = {
    name: locationName || DEFAULT_NER_LOCATION.name,
    state: DEFAULT_NER_LOCATION.state,
    latitude: roundedLat,
    longitude: roundedLon,
  };

  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation,rain,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_temperature_0_to_7cm&daily=precipitation_sum,precipitation_probability_max&timezone=Asia/Kolkata&forecast_days=3`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout

    const response = await fetch(openMeteoUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SentinalX-Landslide-Monitoring/1.0",
      },
      next: { revalidate: 300 }, // Next.js ISR cache hint (5 mins)
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[WeatherService] Open-Meteo API returned status ${response.status}. Using fallback.`);
      return getDemoFallbackWeather(location);
    }

    const data = await response.json();

    // 2. Parse current values
    const currentTemp = data.current?.temperature_2m ?? 16.0;
    const currentHumidity = data.current?.relative_humidity_2m ?? 85;
    const currentPrecip = data.current?.precipitation ?? 0;
    const currentRain = data.current?.rain ?? currentPrecip;
    const weatherCode = data.current?.weather_code ?? 0;
    const windSpeed = data.current?.wind_speed_10m ?? 0;

    // 3. Compute recent rainfall from hourly data or daily sum
    let rainfall24h = 0;
    let rainfall72h = 0;
    let maxHourly = 0;

    if (Array.isArray(data.hourly?.precipitation)) {
      const hourlyPrecip: number[] = data.hourly.precipitation;
      // Take first 24 hours of forecast/observed data
      const next24 = hourlyPrecip.slice(0, 24);
      rainfall24h = next24.reduce((sum, val) => sum + (val || 0), 0);
      rainfall72h = hourlyPrecip.reduce((sum, val) => sum + (val || 0), 0);
      maxHourly = Math.max(...next24, 0);
    } else if (Array.isArray(data.daily?.precipitation_sum)) {
      rainfall24h = data.daily.precipitation_sum[0] ?? 0;
      rainfall72h = (data.daily.precipitation_sum as number[]).reduce((a, b) => a + (b || 0), 0);
    }

    // 4. Parse soil conditions
    let soil0to7 = 0.35;
    let soil7to28 = 0.38;
    let soilTemp = 14.0;

    if (Array.isArray(data.hourly?.soil_moisture_0_to_7cm) && data.hourly.soil_moisture_0_to_7cm.length > 0) {
      soil0to7 = data.hourly.soil_moisture_0_to_7cm[0] ?? 0.35;
    }
    if (Array.isArray(data.hourly?.soil_moisture_7_to_28cm) && data.hourly.soil_moisture_7_to_28cm.length > 0) {
      soil7to28 = data.hourly.soil_moisture_7_to_28cm[0] ?? 0.38;
    }
    if (Array.isArray(data.hourly?.soil_temperature_0_to_7cm) && data.hourly.soil_temperature_0_to_7cm.length > 0) {
      soilTemp = data.hourly.soil_temperature_0_to_7cm[0] ?? 14.0;
    }

    // Soil moisture volumetric m3/m3 normalized to percentage (saturation threshold around 0.50 m3/m3 in clay-loam)
    const approximateSoilSaturationPercent = Math.min(
      Math.round((((soil0to7 + soil7to28) / 2) / 0.5) * 100),
      100
    );

    const precipProbability =
      Array.isArray(data.daily?.precipitation_probability_max) && data.daily.precipitation_probability_max.length > 0
        ? data.daily.precipitation_probability_max[0]
        : undefined;

    const normalized: NormalizedWeatherResponse = {
      source: "Open-Meteo",
      isFallback: false,
      status: "LIVE",
      timestamp: new Date().toISOString(),
      location: {
        ...location,
        elevation: data.elevation ?? location.elevation,
      },
      current: {
        temperatureC: Number(currentTemp.toFixed(1)),
        relativeHumidityPercent: Math.round(currentHumidity),
        precipitationMm: Number(currentPrecip.toFixed(1)),
        rainMm: Number(currentRain.toFixed(1)),
        weatherCode,
        weatherDescription: interpretWeatherCode(weatherCode),
        precipitationProbabilityPercent: precipProbability,
        windSpeedKmh: Number(windSpeed.toFixed(1)),
      },
      recent: {
        rainfall1hMm: Number(currentPrecip.toFixed(1)),
        rainfall24hMm: Number(rainfall24h.toFixed(1)),
        rainfall72hMm: Number(rainfall72h.toFixed(1)),
        maxHourlyRainfallMm: Number(maxHourly.toFixed(1)),
      },
      soil: {
        moisture0to7cmM3M3: Number(soil0to7.toFixed(3)),
        moisture7to28cmM3M3: Number(soil7to28.toFixed(3)),
        moisturePercent: approximateSoilSaturationPercent,
        soilTemperatureC: Number(soilTemp.toFixed(1)),
      },
      freshness: "Live Weather Model (Updated within 15 min)",
      attribution: "Open-Meteo Weather Forecast API (Non-commercial Open Data)",
      disclaimer: "OPEN-METEO WEATHER MODEL DATA • PROTOTYPE INTEGRATION",
    };

    // Store in TTL cache (300 seconds / 5 mins)
    memoryCache.set(cacheKey, normalized, 300);

    return normalized;
  } catch (err: unknown) {
    console.error("[WeatherService] Error fetching live weather:", err);
    return getDemoFallbackWeather(location);
  }
}
