"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RiskEngineResult, RiskComputeApiResponse } from "@/types/risk";
import { NormalizedWeatherResponse, WeatherApiResponse } from "@/types/weather";
import {
  saveRiskSnapshot,
  getRiskSnapshot,
  saveWeatherSnapshot,
  getWeatherSnapshot,
  getCacheAgeMinutes,
} from "@/lib/offline/storage";
import { useAutoRefresh } from "./use-auto-refresh";
import { REFRESH_INTERVALS } from "@/lib/config/refresh";

export interface UseRiskIntelligenceReturn {
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  riskResult: RiskEngineResult | null;
  weatherData: NormalizedWeatherResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isCached: boolean;
  cacheAgeMinutes: number;
  lastCalculatedAt: string | null;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdatedText: string;
}

export function useRiskIntelligence(initialLocation: string = "tawang"): UseRiskIntelligenceReturn {
  const [selectedLocation, _setSelectedLocation] = useState<string>(initialLocation);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sentinalx_selected_location");
      if (stored && stored !== initialLocation) {
        _setSelectedLocation(stored);
      }
    }
  }, [initialLocation]);

  const setSelectedLocation = useCallback((loc: string) => {
    _setSelectedLocation(loc);
    if (typeof window !== "undefined") {
      localStorage.setItem("sentinalx_selected_location", loc);
      window.dispatchEvent(new CustomEvent("sentinalx-location-change", { detail: loc }));
    }
  }, []);

  useEffect(() => {
    const handleLocationChange = (e: any) => {
      if (e.detail && e.detail !== selectedLocation) {
        _setSelectedLocation(e.detail);
      }
    };
    window.addEventListener("sentinalx-location-change", handleLocationChange);
    return () => window.removeEventListener("sentinalx-location-change", handleLocationChange);
  }, [selectedLocation]);
  const [riskResult, setRiskResult] = useState<RiskEngineResult | null>(null);
  const [weatherData, setWeatherData] = useState<NormalizedWeatherResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [cacheAgeMinutes, setCacheAgeMinutes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);

  const loadFromOfflineCache = useCallback((loc: string): boolean => {
    const cachedRisk = getRiskSnapshot(loc);
    const cachedWeather = getWeatherSnapshot(loc);

    if (cachedRisk) {
      setRiskResult(cachedRisk.data);
      setIsCached(true);
      setCacheAgeMinutes(getCacheAgeMinutes(cachedRisk.cachedAt));
    }
    if (cachedWeather) {
      setWeatherData(cachedWeather.data);
    }

    return Boolean(cachedRisk);
  }, []);

  const fetchIntelligence = useCallback(
    async (loc: string) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setError(null);

      // Check if browser is offline
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const hasCache = loadFromOfflineCache(loc);
        if (!hasCache) {
          setError("Offline: No cached data available for this sector.");
        }
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      try {
        const [riskRes, weatherRes] = await Promise.allSettled([
          fetch(`/api/risk/compute?loc=${encodeURIComponent(loc)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }),
          fetch(`/api/weather?loc=${encodeURIComponent(loc)}`),
        ]);

        let freshRiskLoaded = false;

        // 1. Process Risk Result
        if (riskRes.status === "fulfilled" && riskRes.value.ok) {
          const riskJson: RiskComputeApiResponse = await riskRes.value.json();
          if (riskJson.success && riskJson.result) {
            setRiskResult(riskJson.result);
            setIsCached(false);
            setCacheAgeMinutes(0);
            saveRiskSnapshot(loc, riskJson.result, "LIVE");
            freshRiskLoaded = true;
          } else {
            setError(riskJson.error || "Failed to compute risk intelligence");
          }
        }

        // 2. Process Weather Result
        if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
          const weatherJson: WeatherApiResponse = await weatherRes.value.json();
          if (weatherJson.success && weatherJson.data) {
            setWeatherData(weatherJson.data);
            saveWeatherSnapshot(loc, weatherJson.data);
          }
        }

        // Fallback to offline cache if live fetch failed
        if (!freshRiskLoaded) {
          const hasCache = loadFromOfflineCache(loc);
          if (!hasCache) {
            setError("Risk intelligence service temporarily unavailable");
          }
        }
      } catch (err: unknown) {
        console.error("[useRiskIntelligence] Error fetching intelligence:", err);
        const hasCache = loadFromOfflineCache(loc);
        if (!hasCache) {
          setError("Network error while connecting to SentinalX risk engine.");
        }
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [loadFromOfflineCache]
  );

  // Hook into auto-refresh manager
  const { isRefreshing, refreshNow } = useAutoRefresh(
    () => fetchIntelligence(selectedLocation),
    {
      intervalMs: REFRESH_INTERVALS.RISK_INTELLIGENCE,
      enabled: true,
    }
  );

  // Initial fetch on location change
  useEffect(() => {
    setIsLoading(true);
    fetchIntelligence(selectedLocation);
  }, [selectedLocation, fetchIntelligence]);

  const lastCalculatedAt = riskResult?.calculatedAt || null;

  const lastUpdatedText = lastCalculatedAt
    ? isCached
      ? `Last known: ${new Date(lastCalculatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} (${cacheAgeMinutes}m ago)`
      : new Date(lastCalculatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
    : "--:--";

  return {
    selectedLocation,
    setSelectedLocation,
    riskResult,
    weatherData,
    isLoading,
    isRefreshing,
    isCached,
    cacheAgeMinutes,
    lastCalculatedAt,
    error,
    refresh: refreshNow,
    lastUpdatedText,
  };
}
