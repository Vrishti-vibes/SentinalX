"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  ChevronRight,
  X,
  RotateCw,
} from "lucide-react";
import { RiskEngineResult, RiskComputeApiResponse } from "@/types/risk";
import { SensorReadingRecord, IncidentReportRecord } from "@/types/database";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { REFRESH_INTERVALS } from "@/lib/config/refresh";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";
import LeafletMapDynamic from "@/components/map/LeafletMapDynamic";
import {
  GisMapFeature,
  LayerFilter,
  LayerVisibility,
  DEFAULT_LAYER_VISIBILITY,
} from "@/types/gis-map";
import { useDeviceMode } from "@/components/layout/DeviceModeContext";
import { BrandLogo } from "@/components/brand/BrandLogo";
interface LayerToggleItem {
  key: keyof LayerVisibility;
  label: string;
  badge: string;
  icon: string;
}

const LAYER_TOGGLES: LayerToggleItem[] = [
  { key: "riskZones", label: "Risk Zones", badge: "Polygons", icon: "⬡" },
  { key: "historical", label: "Historical Landslides", badge: "GSI/ISRO", icon: "◆" },
  { key: "shelters", label: "Shelters", badge: "Relief", icon: "⛺" },
  { key: "sensors", label: "Sensors", badge: "IoT Grid", icon: "📡" },
  { key: "reports", label: "Citizen Reports", badge: "Live", icon: "▲" },
  { key: "roads", label: "Road Status", badge: "OSM", icon: "🛣️" },
];

export default function LiveTerrainRiskMapScreen() {
  const { isMobile } = useDeviceMode();
  const [selectedLocation, setSelectedLocation] = useState<string>("tawang");
  const activeFilter: LayerFilter = "all";
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  const [selectedFeature, setSelectedFeature] = useState<GisMapFeature | null>(null);

  const toggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const setAllLayers = (visible: boolean) => {
    setLayerVisibility({
      riskZones: visible,
      historical: visible,
      shelters: visible,
      sensors: visible,
      reports: visible,
      roads: visible,
    });
  };

  // Live Backend Data States
  const [riskResult, setRiskResult] = useState<RiskEngineResult | null>(null);
  const [sensors, setSensors] = useState<SensorReadingRecord[]>([]);
  const [reports, setReports] = useState<IncidentReportRecord[]>([]);
  const [lastGisUpdateAt, setLastGisUpdateAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGisData = async () => {
    setError(null);

    try {
      const [riskRes, sensorRes, reportRes] = await Promise.allSettled([
        fetch(`/api/risk/compute?loc=${encodeURIComponent(selectedLocation)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
        fetch("/api/sensors"),
        fetch("/api/reports"),
      ]);

      if (riskRes.status === "fulfilled" && riskRes.value.ok) {
        const riskJson: RiskComputeApiResponse = await riskRes.value.json();
        if (riskJson.success && riskJson.result) {
          setRiskResult(riskJson.result);
        }
      } else {
        setError("Risk intelligence service temporarily unavailable");
      }

      if (sensorRes.status === "fulfilled" && sensorRes.value.ok) {
        const sensorJson = await sensorRes.value.json();
        if (sensorJson.success && Array.isArray(sensorJson.data)) {
          setSensors(sensorJson.data);
        }
      }

      if (reportRes.status === "fulfilled" && reportRes.value.ok) {
        const reportJson = await reportRes.value.json();
        if (reportJson.success && Array.isArray(reportJson.data)) {
          setReports(reportJson.data);
        }
      }

      setLastGisUpdateAt(new Date().toISOString());
    } catch (err: unknown) {
      console.error("[GIS Map] Error fetching intelligence:", err);
      setError("Network error while connecting to GIS data streams.");
    } finally {
      setIsLoading(false);
    }
  };

  const { isRefreshing, refreshNow } = useAutoRefresh(fetchGisData, {
    intervalMs: REFRESH_INTERVALS.GIS_MAP,
    enabled: true,
  });

  useEffect(() => {
    setIsLoading(true);
    fetchGisData();
  }, [selectedLocation]);

  const handleRefresh = () => {
    refreshNow();
  };

  // Derived location metadata
  const locationName =
    riskResult?.location?.name ??
    (selectedLocation === "gangtok" ? "Gangtok / Sevoke Corridor" : "Tawang Sector");
  const riskScore = riskResult ? riskResult.score : 43.5;
  const riskLevel = riskResult ? riskResult.level : "MODERATE";
  const isTawang = selectedLocation === "tawang";

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* â”€â”€ 1. Header Bar â”€â”€ */}
      <header className="h-14 bg-white border-b border-rose-100 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Link href="/">
          <BrandLogo textClassName="text-[17px] font-bold tracking-tight text-[#0f172a]" />
        </Link>

        {/* Live status badge & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black text-slate-800 tracking-wider">
              COMMAND GIS
            </span>
            <span className="text-[9px] font-mono text-blue-700 bg-blue-50 px-1 rounded font-bold">
              MODEL INFERENCE
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh GIS intelligence"
            title="Refresh GIS intelligence"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* â”€â”€ 2. Scrollable Body â”€â”€ */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Page Title & Location Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block">
                • NORTH EASTERN REGION • DISASTER COMMAND GIS
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                MDoNER Operational Grid
              </span>
            </div>
            <h1 className="text-[20px] font-extrabold text-[#0f172a] tracking-tight leading-tight mt-0.5">
              Live Landslide Risk Map
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Regional operational coverage across monitored sectors • Live telemetry & hazard corridors
            </p>
          </div>

          {/* Location Selector Tabs */}
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Monitored Operational Sectors
            </span>
            <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedLocation("tawang")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedLocation === "tawang"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📍 Tawang Sector (AR)
              </button>
              <button
                type="button"
                onClick={() => setSelectedLocation("gangtok")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedLocation === "gangtok"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📍 Sikkim / NH-10 (SK)
              </button>
            </div>
          </div>
        </div>



        {/* â”€â”€ 3. Layer Control Panel â”€â”€ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold uppercase tracking-wider text-slate-700 text-[10px]">
                Map Layer Controls
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[9px] font-bold">
                {Object.values(layerVisibility).filter(Boolean).length} / 6 Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => setAllLayers(true)}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                All On
              </button>
              <button
                type="button"
                onClick={() => setAllLayers(false)}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"} gap-1.5`}>
            {LAYER_TOGGLES.map((t) => {
              const isVisible = layerVisibility[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={isVisible}
                  onClick={() => toggleLayer(t.key)}
                  className={`px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between border transition-all text-[11px] ${
                    isVisible
                      ? "bg-[#0f172a] text-white border-[#0f172a] shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="text-xs">{t.icon}</span>
                    <span className="font-bold truncate">{t.label}</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ml-1.5 ${
                      isVisible ? "bg-emerald-400" : "bg-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 4. GIS Map Canvas ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
          {/* Top telemetry bar */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-slate-700 truncate">
                Interactive GIS • {locationName}
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[10px] shrink-0">
              {isTawang ? "2,200 m – 4,100 m MSL • OpenStreetMap" : "1,400 m – 2,800 m MSL • OpenStreetMap"}
            </span>
          </div>

          {/* Interactive Leaflet Map Viewport */}
          <div className={`relative ${isMobile ? "h-[400px]" : "h-[400px] sm:h-[480px] lg:h-[600px] xl:h-[650px]"} w-full bg-[#edf2f7] overflow-hidden`}>
            <LeafletMapDynamic
              selectedLocation={selectedLocation as "tawang" | "gangtok"}
              activeFilter={activeFilter}
              layerVisibility={layerVisibility}
              onSelectFeature={setSelectedFeature}
              riskResult={riskResult}
              reports={reports}
              sensors={sensors}
            />
          </div>
        </div>

        {/* ── 5. Prominent Risk Analysis & AI Logic (Immediately below GIS Map) ── */}
        <div className={`rounded-2xl border border-slate-200 bg-white ${isMobile ? "p-3.5 space-y-4" : "p-4 sm:p-6 space-y-5"} shadow-sm`}>
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  COMMAND CENTER TELEMETRY
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                RISK ANALYSIS
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Current Location: <strong>Tawang Sector, Arunachal Pradesh</strong></span>
              </p>
            </div>

            {/* Overall Risk Banner */}
            <div className="px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-300 text-orange-950 flex flex-col sm:items-end self-start sm:self-auto">
              <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                OVERALL RISK
              </span>
              <span className="text-base sm:text-lg font-black text-orange-900 tracking-tight">
                HIGH — AVOID ZONE
              </span>
            </div>
          </div>

          {/* Clean Data Table + Risk Score Summary Grid */}
          <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"} gap-5 items-start`}>
            {/* Clean Data Table */}
            <div className="lg:col-span-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 sm:px-4">Parameter</th>
                      <th className="py-2.5 px-3 sm:px-4">Value</th>
                      <th className="py-2.5 px-3 sm:px-4">Status</th>
                      <th className="py-2.5 px-3 sm:px-4 hidden sm:table-cell">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900">Rainfall</td>
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-orange-600">82 / 100</td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-200">
                          HIGH
                        </span>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-[10px] text-slate-500 hidden sm:table-cell font-mono">
                        Live Weather API
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900">Soil Moisture</td>
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-orange-600">77 / 100</td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-200">
                          HIGH
                        </span>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-[10px] text-slate-500 hidden sm:table-cell font-mono">
                        Simulated Sensor
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900">Pore Pressure</td>
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-amber-600">61 / 100</td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                          MODERATE
                        </span>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-[10px] text-slate-500 hidden sm:table-cell font-mono">
                        Hydrology Model
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900">Slope Stability / FoS</td>
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-rose-600">0.98</td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-200">
                          HIGH
                        </span>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-[10px] text-slate-500 hidden sm:table-cell font-mono">
                        Infinite-Slope Model
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900">Ground Motion</td>
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-emerald-600">0 / 100</td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                          LOW
                        </span>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-[10px] text-slate-500 hidden sm:table-cell font-mono">
                        USGS Regional Feed
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900">Citizen Reports</td>
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-orange-600">72 / 100</td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-200">
                          HIGH
                        </span>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-[10px] text-slate-500 hidden sm:table-cell font-mono">
                        Crowdsourced Queue
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-2.5 bg-slate-50/80 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono">
                <span>* Demo/mock values labeled for Hackathon demonstration scenario</span>
                <span>Combined 6-Factor Linear Risk Matrix</span>
              </div>
            </div>

            {/* Risk Score & Recommended Directive Card */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3.5 w-full">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  RISK SCORE
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-rose-700 tracking-tight">
                    82
                  </span>
                  <span className="text-sm font-extrabold text-slate-400 font-mono">
                    / 100
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-100/70 border border-orange-200 space-y-0.5">
                <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                  Risk Level:
                </span>
                <div className="text-base font-black text-orange-950">
                  HIGH
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-200 space-y-0.5">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                  Recommended Action:
                </span>
                <div className="text-base font-black text-rose-950">
                  AVOID ZONE
                </div>
              </div>

              <Link href="/routes" className="block pt-1">
                <button
                  type="button"
                  className="w-full h-11 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>VIEW SAFE BYPASS ROUTE</span>
                </button>
              </Link>
            </div>
          </div>

          {/* ── Risk Factors AI Logic Visual Progress Bars ── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/70 pb-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                  Risk Factors (AI Indicator Weights)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Multi-indicator hazard engine combining live meteorological telemetry and slope mechanics
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-bold self-start sm:self-auto">
                MODEL INFERENCE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* RAINFALL */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>RAINFALL</span>
                  <span className="font-mono text-orange-600 font-black">82</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: "82%" }} />
                </div>
              </div>

              {/* SOIL MOISTURE */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>SOIL MOISTURE</span>
                  <span className="font-mono text-orange-600 font-black">77</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: "77%" }} />
                </div>
              </div>

              {/* PORE PRESSURE */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>PORE PRESSURE</span>
                  <span className="font-mono text-amber-600 font-black">61</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "61%" }} />
                </div>
              </div>

              {/* SLOPE STABILITY */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>SLOPE STABILITY</span>
                  <span className="font-mono text-rose-600 font-black">HIGH</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-600" style={{ width: "85%" }} />
                </div>
              </div>

              {/* GROUND MOTION */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>GROUND MOTION</span>
                  <span className="font-mono text-emerald-600 font-black">LOW</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "5%" }} />
                </div>
              </div>

              {/* CITIZEN REPORTS */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>CITIZEN REPORTS</span>
                  <span className="font-mono text-orange-600 font-black">72</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: "72%" }} />
                </div>
              </div>
            </div>

            {/* AI Risk Assessment & Recommended Response Box */}
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-2.5 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800">
                  AI RISK ASSESSMENT
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-orange-600 text-white">
                  HIGH RISK
                </span>
              </div>
              <div className="text-xs font-black text-orange-950 uppercase tracking-wide">
                RECOMMENDED RESPONSE:
              </div>
              <ul className="text-xs text-orange-950 font-bold space-y-1 list-disc pl-4 leading-relaxed">
                <li>AVOID HIGH-RISK ROAD CORRIDOR</li>
                <li>USE SAFE BYPASS</li>
                <li>MONITOR SHELTER CAPACITY</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── 6. Feature Inspection & Telemetry Panel ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 relative">
          {selectedFeature ? (
            /* Selected Specific Feature */
            <>
              {/* Prominent Action Directive Banner */}
              {(() => {
                const action = selectedFeature.recommendedAction ?? (
                  selectedFeature.riskLevel === "Critical"
                    ? "EVACUATE"
                    : selectedFeature.riskLevel === "High"
                    ? "AVOID ZONE"
                    : selectedFeature.riskLevel === "Moderate"
                    ? "STAY ALERT"
                    : "MONITOR"
                );
                return (
                  <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                    action === "EVACUATE"
                      ? "bg-rose-50 border-rose-300 text-rose-950"
                      : action === "AVOID ZONE"
                      ? "bg-orange-50 border-orange-300 text-orange-950"
                      : action === "STAY ALERT"
                      ? "bg-amber-50 border-amber-300 text-amber-950"
                      : "bg-emerald-50 border-emerald-300 text-emerald-950"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${
                        action === "EVACUATE"
                          ? "bg-[#b91c1c]"
                          : action === "AVOID ZONE"
                          ? "bg-[#ea580c]"
                          : action === "STAY ALERT"
                          ? "bg-[#d97706]"
                          : "bg-[#16a34a]"
                      }`}>
                        RECOMMENDED ACTION
                      </span>
                      <span className="text-xs sm:text-sm font-black tracking-wide">
                        {action === "EVACUATE"
                          ? "SEVERE → EVACUATE IMMEDIATELY"
                          : action === "AVOID ZONE"
                          ? "HIGH → AVOID HAZARD ZONE"
                          : action === "STAY ALERT"
                          ? "MODERATE → STAY ALERT"
                          : "LOW → MONITOR CONDITIONS"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {selectedFeature.dataSource ?? "Model Inference"}
                    </span>
                  </div>
                );
              })()}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        selectedFeature.riskLevel === "Critical"
                          ? "bg-rose-100 text-[#991b1b]"
                          : selectedFeature.riskLevel === "High"
                          ? "bg-orange-100 text-orange-900"
                          : selectedFeature.riskLevel === "Moderate"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {selectedFeature.riskLevel} Level
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {selectedFeature.subCode
                        ? `${selectedFeature.id} • ${selectedFeature.subCode}`
                        : selectedFeature.id}
                    </span>
                    {selectedFeature.isDemo && (
                      <span className="text-[9px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                        PROTOTYPE / DEMO
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    {selectedFeature.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 7 Core Geotechnical & Operational Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5 text-xs font-mono">
                {/* 1. Rainfall */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-[8px] uppercase text-slate-400 font-bold">
                    <span>Current Rainfall</span>
                    <span className="text-emerald-700 font-bold">LIVE API</span>
                  </div>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">
                    {selectedFeature.rainfall ?? `${riskResult?.factors.rainfall.raw ?? 4.3} mm`}
                  </span>
                </div>

                {/* 2. Moisture */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-[8px] uppercase text-slate-400 font-bold">
                    <span>Moisture</span>
                    <span className="text-blue-700 font-bold">SOIL</span>
                  </div>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">
                    {selectedFeature.moisture ?? selectedFeature.saturation ?? `${riskResult?.factors.soilMoisture.raw ?? 68}%`}
                  </span>
                </div>

                {/* 3. Slope FoS */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-[8px] uppercase text-slate-400 font-bold">
                    <span>Slope / FoS</span>
                    <span className="text-indigo-700 font-bold">STABILITY</span>
                  </div>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">
                    {selectedFeature.slopeFos !== undefined
                      ? `${selectedFeature.slopeFos.toFixed(2)} (${selectedFeature.slopeFos < 1.0 ? "Critical" : "Marginal"})`
                      : selectedFeature.fos !== undefined
                      ? `${selectedFeature.fos.toFixed(2)} (${selectedFeature.fos < 1.0 ? "Critical" : "Marginal"})`
                      : "FoS 1.15"}
                  </span>
                </div>

                {/* 4. Risk Score */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-[8px] uppercase text-slate-400 font-bold">
                    <span>Risk Score</span>
                    <span className="text-rose-700 font-bold">INDEX</span>
                  </div>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">
                    {selectedFeature.riskScore !== undefined
                      ? `${selectedFeature.riskScore.toFixed(1)} / 100`
                      : `${riskScore.toFixed(1)} / 100`}
                  </span>
                </div>

                {/* 5. Risk Level */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-[8px] uppercase text-slate-400 font-bold">
                    <span>Risk Level</span>
                    <span className="text-slate-500 font-bold">SCALE</span>
                  </div>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">
                    {selectedFeature.riskLevel.toUpperCase()}
                  </span>
                </div>

                {/* 6. Data Source / Status */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                  <div className="flex justify-between items-center text-[8px] uppercase text-slate-400 font-bold">
                    <span>Data Source</span>
                    <span className="text-slate-600 font-bold">STREAM</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 block mt-0.5 truncate" title={selectedFeature.dataSource ?? "Model Inference"}>
                    {selectedFeature.dataSource ?? "Model Inference"}
                  </span>
                </div>
              </div>

              {/* Action Advice & Description */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Command Directives &amp; Action Advice
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedFeature.actionAdvice ?? selectedFeature.description}
                </p>
              </div>

              <Link href={selectedFeature.actionHref} className="block pt-1">
                <button
                  type="button"
                  className="w-full h-10 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>{selectedFeature.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </>
          ) : (
            /* Default: Location Multi-Source Risk Summary */
            <>
              {/* Default Recommended Action Banner */}
              {(() => {
                const defaultAction = riskLevel === "CRITICAL"
                  ? "EVACUATE"
                  : riskLevel === "HIGH"
                  ? "AVOID ZONE"
                  : riskLevel === "MODERATE"
                  ? "STAY ALERT"
                  : "MONITOR";
                return (
                  <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                    defaultAction === "EVACUATE"
                      ? "bg-rose-50 border-rose-300 text-rose-950"
                      : defaultAction === "AVOID ZONE"
                      ? "bg-orange-50 border-orange-300 text-orange-950"
                      : defaultAction === "STAY ALERT"
                      ? "bg-amber-50 border-amber-300 text-amber-950"
                      : "bg-emerald-50 border-emerald-300 text-emerald-950"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${
                        defaultAction === "EVACUATE"
                          ? "bg-[#b91c1c]"
                          : defaultAction === "AVOID ZONE"
                          ? "bg-[#ea580c]"
                          : defaultAction === "STAY ALERT"
                          ? "bg-[#d97706]"
                          : "bg-[#16a34a]"
                      }`}>
                        RECOMMENDED ACTION
                      </span>
                      <span className="text-xs sm:text-sm font-black tracking-wide">
                        {defaultAction === "EVACUATE"
                          ? "SEVERE → EVACUATE REGION"
                          : defaultAction === "AVOID ZONE"
                          ? "HIGH → AVOID HAZARD PASSES"
                          : defaultAction === "STAY ALERT"
                          ? "MODERATE → STAY ALERT"
                          : "LOW → REGULAR MONITORING"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      Live Weather + Risk Model
                    </span>
                  </div>
                );
              })()}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        riskLevel === "CRITICAL"
                          ? "bg-rose-100 text-[#991b1b]"
                          : riskLevel === "HIGH"
                          ? "bg-orange-100 text-orange-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {riskLevel} Risk
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      Score: {riskScore.toFixed(1)} / 100
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#991b1b]" />
                    <span>{locationName}</span>
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {isLoading ? "Updating..." : "Live Streams Active"}
                </span>
              </div>

              {riskResult && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {riskResult.primaryThreat}
                  </p>

                  {/* 6 Linear Factors Compact Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 pt-1 text-[10px] font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Rainfall</span>
                      <span className="font-bold text-slate-800">
                        {riskResult.factors.rainfall.score}/100
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Moisture</span>
                      <span className="font-bold text-slate-800">
                        {riskResult.factors.soilMoisture.score}/100
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Pore Press</span>
                      <span className="font-bold text-slate-800">
                        {riskResult.factors.porePressure.score}/100
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Slope FoS</span>
                      <span className="font-bold text-slate-800">
                        {riskResult.factors.slopeStability.score}/100
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Ground Motion</span>
                      <span className="font-bold text-slate-800">
                        {riskResult.factors.groundMotion.score}/100
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Reports</span>
                      <span className="font-bold text-slate-800">
                        {riskResult.factors.fieldReports.score}/100
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 6 & 7. Source Telemetry & Risk Legend (Responsive 2-Column Desktop Grid) ── */}
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"} gap-3.5`}>
          {/* ── 6. Compact SYSTEM STATUS Area ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              <span>SYSTEM STATUS</span>
              <span className="font-mono text-slate-400 font-bold">FAULT-ISOLATED ARCHITECTURE</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
              {/* Weather API: LIVE */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-bold truncate">Weather API</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[9px] shrink-0 ml-1">
                  LIVE
                </span>
              </div>

              {/* Risk Engine: ACTIVE */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-bold truncate">Risk Engine</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-[9px] shrink-0 ml-1">
                  ACTIVE
                </span>
              </div>

              {/* Historical Inventory: AVAILABLE */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-bold truncate">Historical Inventory</span>
                <span className="font-mono font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded text-[9px] shrink-0 ml-1">
                  AVAILABLE
                </span>
              </div>

              {/* Sensor Feed: PROTOTYPE */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-bold truncate">Sensor Feed</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[9px] shrink-0 ml-1">
                  PROTOTYPE
                </span>
              </div>

              {/* Citizen Reports: DEMO */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-bold truncate">Citizen Reports</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-[9px] shrink-0 ml-1">
                  DEMO
                </span>
              </div>

              {/* Routing: ACTIVE */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-bold truncate">Routing</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[9px] shrink-0 ml-1">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* â”€â”€ 7. GIS Risk Legend â”€â”€ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                4-Level Geotechnical Risk Scale
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-bold">FoS &amp; RAINFALL CRITERIA</span>
            </div>

            {/* 4-Tier Risk Matrix with Geotechnical Thresholds */}
            {isMobile ? (
              <div className="space-y-2 text-[10px]">
                {/* 🟢 Low (Safe) */}
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#16a34a] shrink-0" />
                    <div>
                      <div className="font-extrabold text-emerald-950 text-xs">Low (Safe)</div>
                      <div className="text-[10px] text-emerald-800 font-medium">FoS ≥ 1.50 • Stable Slope</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                    SAFE
                  </span>
                </div>

                {/* 🟡 Moderate Risk */}
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#f59e0b] shrink-0" />
                    <div>
                      <div className="font-extrabold text-amber-950 text-xs">Moderate Risk</div>
                      <div className="text-[10px] text-amber-800 font-medium">FoS 1.20–1.49 • Moisture &gt; 70%</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                    ALERT
                  </span>
                </div>

                {/* 🟠 High Risk */}
                <div className="p-2.5 rounded-xl bg-orange-50/80 border border-orange-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ea580c] shrink-0" />
                    <div>
                      <div className="font-extrabold text-orange-950 text-xs">High Risk</div>
                      <div className="text-[10px] text-orange-800 font-medium">FoS 1.00–1.19 • Active Creep</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded">
                    AVOID
                  </span>
                </div>

                {/* 🔴 Severe Risk */}
                <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#b91c1c] shrink-0" />
                    <div>
                      <div className="font-extrabold text-[#991b1b] text-xs">Severe Risk</div>
                      <div className="text-[10px] text-rose-800 font-medium">FoS &lt; 1.00 • Critical Failure Imminent</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                    EVACUATE
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shrink-0" />
                    <span className="font-extrabold text-emerald-950">Low (Safe)</span>
                  </div>
                  <div className="text-[9px] text-emerald-800 font-medium">
                    FoS ≥ 1.50 • Stable • Rain &lt; 25mm
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                    <span className="font-extrabold text-amber-950">Moderate</span>
                  </div>
                  <div className="text-[9px] text-amber-800 font-medium">
                    FoS 1.20–1.49 • Moisture &gt; 70%
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-200 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] shrink-0" />
                    <span className="font-extrabold text-orange-950">High Risk</span>
                  </div>
                  <div className="text-[9px] text-orange-800 font-medium">
                    FoS 1.00–1.19 • Active Creep
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c] shrink-0" />
                    <span className="font-extrabold text-[#991b1b]">Severe</span>
                  </div>
                  <div className="text-[9px] text-rose-800 font-medium">
                    FoS &lt; 1.00 • Critical Failure
                  </div>
                </div>
              </div>
            )}

            {/* Layer Feature Symbols */}
            <div className="border-t border-slate-100 pt-2">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Active Map Feature Symbols
              </div>
              <div className={`grid ${isMobile ? "grid-cols-2 gap-1.5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1"} text-[10px] text-slate-700`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded border border-rose-500 bg-rose-500/20 shrink-0" />
                  <span className="truncate">🔴 Risk Zone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-purple-700 rotate-45 shrink-0" />
                  <span className="truncate">🟣 Historical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🏠</span>
                  <span className="truncate">Shelter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">📡</span>
                  <span className="truncate">IoT Sensor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[7px] font-black shrink-0">▲</span>
                  <span className="truncate">🔺 Citizen Rep</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-600 shrink-0" />
                  <span className="truncate">━ Safe Road</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€ 8. Navigation Hub â”€â”€ */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link href="/routes" className="block">
            <button
              type="button"
              className="w-full h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe Routes</span>
            </button>
          </Link>
          <Link href="/shelters" className="block">
            <button
              type="button"
              className="w-full h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Shelters</span>
            </button>
          </Link>
        </div>

        {/* ── 9. Demo Disclaimer ── */}
        <div className="pt-2 pb-1 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
            "SENTINALX DISASTER COMMAND GIS • MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION (MDONER)"
          </span>
        </div>
      </div>
    </div>
  );
}
