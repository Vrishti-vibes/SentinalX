export interface LocationInfo {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface CurrentWeather {
  temperatureC: number;
  relativeHumidityPercent: number;
  precipitationMm: number;
  rainMm: number;
  weatherCode: number;
  weatherDescription: string;
  precipitationProbabilityPercent?: number;
  windSpeedKmh?: number;
}

export interface RecentRainfall {
  rainfall1hMm: number;
  rainfall24hMm: number;
  rainfall72hMm: number;
  maxHourlyRainfallMm: number;
}

export interface SoilConditions {
  moisture0to7cmM3M3?: number;
  moisture7to28cmM3M3?: number;
  moisturePercent?: number;
  soilTemperatureC?: number;
}

export interface NormalizedWeatherResponse {
  source: "Open-Meteo" | "demo";
  isFallback: boolean;
  status: "LIVE" | "FALLBACK";
  timestamp: string;
  location: LocationInfo;
  current: CurrentWeather;
  recent: RecentRainfall;
  soil: SoilConditions;
  freshness: string;
  attribution: string;
  disclaimer: string;
}

export interface WeatherApiResponse {
  success: boolean;
  data: NormalizedWeatherResponse;
  error?: string;
}
