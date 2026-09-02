"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  AlertTriangle,
  Plus,
  Minus,
  Maximize2,
  Navigation,
  ChevronRight,
  X,
  RotateCw,
  Layers,
  Activity,
  ShieldCheck,
  Shield,
  Droplets,
  CloudRain,
  Mountain,
  Radio,
  ExternalLink,
} from "lucide-react";
import { RiskEngineResult, RiskComputeApiResponse } from "@/types/risk";
import { SensorReadingRecord, IncidentReportRecord } from "@/types/database";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { REFRESH_INTERVALS } from "@/lib/config/refresh";
import { OfflineStatus } from "@/components/OfflineStatus";
import { DataFreshness } from "@/components/DataFreshness";
import { LandslideInventoryService } from "@/lib/data/landslide-inventory.service";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";

type LayerFilter = "all" | "hazards" | "historical" | "sensors" | "shelters" | "routes";

interface GisMapFeature {
  id: string;
  name: string;
  subCode?: string;
  type: "hazard" | "historical" | "sensor" | "shelter" | "location";
  riskLevel: "Critical" | "High" | "Moderate" | "Safe";
  fos?: number;
  saturation?: string;
  telemetry1?: string;
  telemetry2?: string;
  telemetry3?: string;
  description: string;
  actionText: string;
  actionHref: string;
  coords: { x: number; y: number };
  isDemo?: boolean;
}

const FILTER_TABS: { id: LayerFilter; label: string }[] = [
  { id: "all", label: "All Layers" },
  { id: "hazards", label: "Hazards" },
  { id: "historical", label: "Historical GSI/ISRO" },
  { id: "sensors", label: "IoT Nodes" },
  { id: "shelters", label: "Shelters" },
  { id: "routes", label: "Corridors" },
];

export default function LiveTerrainRiskMapScreen() {
  const [selectedLocation, setSelectedLocation] = useState<string>("tawang");
  const [activeFilter, setActiveFilter] = useState<LayerFilter>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedFeature, setSelectedFeature] = useState<GisMapFeature | null>(null);

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

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 1.6));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.9));
  const handleResetZoom = () => setZoomLevel(1);

  // Derived location metadata
  const locationName =
    riskResult?.location?.name ??
    (selectedLocation === "gangtok" ? "Gangtok / Sevoke Corridor" : "Tawang Sector");
  const riskScore = riskResult ? riskResult.score : 43.5;
  const riskLevel = riskResult ? riskResult.level : "MODERATE";

  // Build Dynamic Features List based on selected sector and real backend data
  const isTawang = selectedLocation === "tawang";

  const dynamicFeatures: GisMapFeature[] = [
    // 1. Primary Sector Risk Marker
    {
      id: isTawang ? "LOC-TW" : "LOC-GTK",
      name: locationName,
      subCode: isTawang ? "NH-13 Sector" : "NH-10 Corridor",
      type: "location",
      riskLevel: riskLevel === "CRITICAL" ? "Critical" : riskLevel === "HIGH" ? "High" : "Moderate",
      fos: isTawang ? 1.08 : 1.15,
      saturation: riskResult ? `${riskResult.factors.soilMoisture.raw}%` : "84.0%",
      telemetry1: `24h Rainfall: ${riskResult?.factors.rainfall.raw ?? 4.3} mm (${riskResult?.factors.rainfall.status ?? "LIVE"})`,
      telemetry2: `Pore Pressure: ${riskResult?.factors.porePressure.raw ?? 42.1} kPa (Demo Telemetry)`,
      telemetry3: `USGS Ground Motion Index: ${(Number(riskResult?.factors.groundMotion.raw ?? 0) * 100).toFixed(0)}%`,
      description:
        riskResult?.primaryThreat ??
        "Elevated moisture infiltration on mountain slopes. Continuous monitoring active.",
      actionText: "View Detailed Risk Breakdown",
      actionHref: "/",
      coords: isTawang ? { x: 50, y: 46 } : { x: 52, y: 50 },
    },
    // 2. Critical Hazard Zone Feature
    {
      id: isTawang ? "HZ-01" : "HZ-GTK-01",
      name: isTawang ? "Zemithang-Lumla Slope Alpha" : "Teesta Valley Escarpment",
      type: "hazard",
      riskLevel: "Critical",
      fos: isTawang ? 0.92 : 0.88,
      saturation: isTawang ? "94.2%" : "91.5%",
      telemetry1: "Tension crack displacement: 4.2 mm/hr",
      telemetry2: "Soil liquefaction risk: Extreme",
      description: isTawang
        ? "Active tension crack displacement detected near Lumla. Road partially blocked."
        : "Active rockfall and debris accumulation along NH-10 riverbank cutting.",
      actionText: "Open Safe Route Bypass",
      actionHref: "/routes",
      coords: isTawang ? { x: 38, y: 32 } : { x: 35, y: 36 },
      isDemo: true,
    },
    // 3. Moderate Hazard Zone Feature
    {
      id: isTawang ? "HZ-02" : "HZ-GTK-02",
      name: isTawang ? "Tawang Ridge KM-14" : "Rangpo-Singtam Hill Slope",
      type: "hazard",
      riskLevel: "Moderate",
      fos: 1.18,
      saturation: "78.0%",
      telemetry1: `Recent Rainfall: ${riskResult?.factors.rainfall.raw ?? 4.3} mm`,
      telemetry2: "Pore-pressure trend: Increasing",
      description:
        "Elevated pore pressure from antecedent rainfall. Caution advised on slope periphery.",
      actionText: "Report Hazard Observation",
      actionHref: "/report",
      coords: isTawang ? { x: 68, y: 55 } : { x: 65, y: 62 },
      isDemo: true,
    },
    // 4. In-Situ Geotechnical Sensor Node
    {
      id: isTawang ? "SN-01" : "SN-GTK-01",
      name: isTawang ? "Sela Pass Sub-surface Probe" : "Sevoke Teesta Escarpment Station",
      subCode: isTawang ? "SN-TW-01" : "SN-SK-01",
      type: "sensor",
      riskLevel: "Moderate",
      fos: 1.12,
      saturation: "82.5%",
      telemetry1: `Hydrostatic Pressure: ${riskResult?.factors.porePressure.raw ?? 42.1} kPa`,
      telemetry2: "Inclinometer Tilt: 9.6° displacement",
      telemetry3: "Status: ONLINE (Demo Telemetry)",
      description:
        "In-situ geotechnical piezometer and tilt sensor telemetry node. Prototype in-memory grid.",
      actionText: "Inspect Authority Dashboard",
      actionHref: "/authority",
      coords: isTawang ? { x: 30, y: 45 } : { x: 28, y: 48 },
      isDemo: true,
    },
    // 5. Designated Emergency Shelter
    {
      id: isTawang ? "SH-01" : "SH-GTK-01",
      name: isTawang ? "Tawang Community Center" : "Teesta Valley Relief Center",
      type: "shelter",
      riskLevel: "Safe",
      fos: 2.1,
      saturation: "18.0%",
      telemetry1: "Capacity: 85% (340 / 400 Open)",
      telemetry2: "Medical supply: Staged & Operational",
      description:
        "Primary regional disaster shelter on reinforced bedrock with emergency rations and backup power.",
      actionText: "View Shelter Directions",
      actionHref: "/shelters",
      coords: isTawang ? { x: 78, y: 22 } : { x: 76, y: 25 },
      isDemo: true,
    },
    // 6. Historical Landslide Inventory Records (GSI Bhusanket / ISRO / NASA)
    ...LandslideInventoryService.getNerLandslides().slice(0, 5).map((rec, i) => ({
      id: rec.id,
      name: rec.locationName || `${rec.district}, ${rec.state}`,
      subCode: `${rec.source} (${rec.date})`,
      type: "historical" as const,
      riskLevel: "High" as const,
      telemetry1: `Catalog: ${rec.source} (${rec.date})`,
      telemetry2: `Trigger: ${rec.trigger ?? "Heavy Rain"}`,
      telemetry3: `Severity: ${rec.severity ?? "High"} (Historical Record)`,
      description: `Historical landslide event cataloged by ${rec.source}. Fatalities: ${rec.fatalities ?? 0} | Injuries: ${rec.injuries ?? 0}. Provenance: ${rec.provenance.sourceUrl}`,
      actionText: "Explore Historical Landslide Inventory",
      actionHref: "/api/landslides/inventory",
      coords: {
        x: 25 + (i * 14) % 65,
        y: 35 + (i * 11) % 45,
      },
    })),
  ];

  // Layer filter helper
  const isFeatureVisible = (type: GisMapFeature["type"]) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "hazards" && (type === "hazard" || type === "location")) return true;
    if (activeFilter === "historical" && type === "historical") return true;
    if (activeFilter === "sensors" && type === "sensor") return true;
    if (activeFilter === "shelters" && type === "shelter") return true;
    return false;
  };

  const showRoads = activeFilter === "all" || activeFilter === "routes";
  const showHazardZones = activeFilter === "all" || activeFilter === "hazards";

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── 1. Header Bar ── */}
      <header className="h-14 bg-white border-b border-rose-100 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-[#b91c1c]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 12L12 22L22 12L12 2Z" />
              <line x1="12" y1="8" x2="12" y2="13" strokeWidth="2.5" />
              <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <span className="text-[17px] font-bold text-[#991b1b] tracking-tight">
            SentinalX
          </span>
        </Link>

        {/* Live status badge & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100/70 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-[#b91c1c] animate-pulse" />
            <span className="text-xs font-bold text-[#991b1b] tracking-wider">
              LIVE GIS
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

      {/* ── 2. Scrollable Body ── */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Page Title & Location Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block">
              • NORTH EASTERN REGION • GIS RISK MATRIX
            </span>
            <h1 className="text-[20px] font-extrabold text-[#0f172a] tracking-tight leading-tight mt-0.5">
              Live Landslide Risk Map
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time geotechnical terrain, sensor grid &amp; 24 historical GSI/ISRO catalog points
            </p>
          </div>

          {/* Location Selector Tabs */}
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
              Tawang Sector
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
              Gangtok / Sevoke
            </button>
          </div>
        </div>

        {/* ── 3. Layer Filter Pills ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-label={`Filter map by ${tab.label}`}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                activeFilter === tab.id
                  ? "bg-[#181d24] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
                DEM Terrain • {locationName}
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[10px] shrink-0">
              {isTawang ? "2,200 m – 4,100 m MSL" : "1,400 m – 2,800 m MSL"}
            </span>
          </div>

          {/* Map Viewport */}
          <div className="relative h-72 sm:h-80 w-full bg-[#edf2f7] overflow-hidden select-none">
            {/* Zoomable inner container */}
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-300 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Topographic elevation contour lines */}
              <svg
                className="absolute inset-0 w-full h-full opacity-30"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M-20,25 Q90,5 190,45 T390,35" fill="none" stroke="#64748b" strokeWidth="1" />
                <path d="M-20,60 Q110,35 230,75 T430,65" fill="none" stroke="#64748b" strokeWidth="1" />
                <path d="M-20,100 Q130,75 250,115 T450,105" fill="none" stroke="#64748b" strokeWidth="1" />
                <path d="M-20,140 Q150,115 270,155 T470,145" fill="none" stroke="#64748b" strokeWidth="1" />
                <path d="M-20,180 Q170,155 290,195 T490,185" fill="none" stroke="#64748b" strokeWidth="1" />
                <path d="M-20,220 Q190,195 310,235 T510,225" fill="none" stroke="#64748b" strokeWidth="1" />
              </svg>

              {/* Road network */}
              {showRoads && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Blocked / High-Risk Road Segment */}
                  <path
                    d="M 50,180 Q 120,140 160,120 T 260,80"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                  />
                  {/* Safe Evacuation Corridor */}
                  <path
                    d="M 120,250 Q 180,190 220,140 T 285,70"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Critical Risk Zone Polygon (Prototype) */}
              {showHazardZones && (
                <div
                  onClick={() => setSelectedFeature(dynamicFeatures[1])}
                  className="absolute top-10 left-20 w-36 h-28 bg-[#f87171]/35 border-2 border-[#ef4444] cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    clipPath:
                      "polygon(35% 0%, 90% 15%, 100% 65%, 80% 95%, 25% 100%, 0% 70%, 10% 25%)",
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <AlertTriangle className="w-5 h-5 text-[#b91c1c] fill-[#b91c1c]" />
                    <span className="text-[8px] font-black text-[#991b1b] bg-white/80 px-1 rounded uppercase tracking-tighter">
                      CRITICAL ZONE
                    </span>
                  </div>
                </div>
              )}

              {/* Moderate Risk Zone Polygon (Prototype) */}
              {showHazardZones && (
                <div
                  onClick={() => setSelectedFeature(dynamicFeatures[2])}
                  className="absolute bottom-12 right-12 w-32 h-24 bg-[#fbbf24]/25 border-2 border-[#f59e0b] cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    clipPath:
                      "polygon(20% 0%, 80% 10%, 100% 70%, 75% 100%, 15% 90%, 0% 40%)",
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="text-[10px] font-black text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded shadow-sm">
                      WATCH ZONE
                    </span>
                  </div>
                </div>
              )}

              {/* Dynamic Feature Markers */}
              {dynamicFeatures.map((feature) => {
                if (!isFeatureVisible(feature.type)) return null;
                const isSelected = selectedFeature?.id === feature.id;

                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => setSelectedFeature(feature)}
                    style={{
                      left: `${feature.coords.x}%`,
                      top: `${feature.coords.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all ${
                      isSelected ? "scale-125 z-30" : "hover:scale-110"
                    }`}
                  >
                    {feature.type === "location" && (
                      <div className="flex flex-col items-center">
                        <div className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono font-bold text-[9px] shadow-lg border border-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{riskScore.toFixed(1)}</span>
                        </div>
                        <div className="w-3 h-3 bg-slate-900 rotate-45 -mt-1 border-r border-b border-white" />
                      </div>
                    )}
                    {feature.type === "hazard" && (
                      <div className="w-6 h-6 rounded-full bg-[#b91c1c] border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold">
                        ▲
                      </div>
                    )}
                    {feature.type === "historical" && (
                      <div className="w-6 h-6 rounded-md bg-purple-700 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-black rotate-45">
                        <span className="-rotate-45">◆</span>
                      </div>
                    )}
                    {feature.type === "sensor" && (
                      <div className="w-6 h-6 rounded-full bg-[#2563eb] border-2 border-white shadow-md flex items-center justify-center text-[10px]">
                        📡
                      </div>
                    )}
                    {feature.type === "shelter" && (
                      <div className="w-7 h-7 rounded-full bg-[#16a34a] border-2 border-white shadow-md flex items-center justify-center text-[11px]">
                        ⛺
                      </div>
                    )}
                  </button>
                );
              })}

              {/* GPS "YOU ARE HERE" marker */}
              <div className="absolute bottom-16 left-16 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-4 h-4 rounded-full bg-[#2563eb] border-2 border-white shadow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
                <span className="absolute top-5 -left-7 bg-slate-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                  YOU ARE HERE
                </span>
              </div>
            </div>

            {/* Floating Zoom Controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-30">
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Zoom In on GIS map"
                className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur border border-slate-300 shadow-sm flex items-center justify-center text-slate-700 hover:bg-white active:scale-95"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Zoom Out on GIS map"
                className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur border border-slate-300 shadow-sm flex items-center justify-center text-slate-700 hover:bg-white active:scale-95"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                aria-label="Reset zoom on GIS map"
                className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur border border-slate-300 shadow-sm flex items-center justify-center text-slate-700 hover:bg-white active:scale-95"
                title="Reset View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 5. Feature Inspection & Telemetry Panel ── */}
        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm space-y-3 relative">
          {selectedFeature ? (
            /* Selected Specific Feature */
            <>
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
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        DEMO
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

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selectedFeature.description}
              </p>

              {/* Telemetry Details */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {selectedFeature.fos !== undefined && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Factor of Safety (FoS)
                    </span>
                    <span className="text-xs font-black font-mono text-slate-800">
                      {selectedFeature.fos.toFixed(2)}{" "}
                      {selectedFeature.fos < 1.0 ? "(Failure Zone)" : "(Marginally Stable)"}
                    </span>
                  </div>
                )}
                {selectedFeature.saturation && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Soil Saturation
                    </span>
                    <span className="text-xs font-black font-mono text-slate-800">
                      {selectedFeature.saturation}
                    </span>
                  </div>
                )}
                {selectedFeature.telemetry1 && (
                  <div className="col-span-2 p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Telemetry Feeds
                    </span>
                    <div className="text-[11px] font-medium text-slate-800">
                      • {selectedFeature.telemetry1}
                    </div>
                    {selectedFeature.telemetry2 && (
                      <div className="text-[11px] font-medium text-slate-800">
                        • {selectedFeature.telemetry2}
                      </div>
                    )}
                    {selectedFeature.telemetry3 && (
                      <div className="text-[11px] font-medium text-slate-800">
                        • {selectedFeature.telemetry3}
                      </div>
                    )}
                  </div>
                )}
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
                  {isLoading ? "Updating..." : "Live Streams"}
                </span>
              </div>

              {riskResult && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {riskResult.primaryThreat}
                  </p>

                  {/* 6 Linear Factors Compact Matrix */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono">
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

        {/* ── 6. Source Telemetry Health Bar ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
            <span>GIS DATA STREAM STATUS</span>
            <span className="font-mono text-slate-400">Fault-Isolated</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-semibold">Weather (Open-Meteo)</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1 rounded text-[9px]">
                LIVE
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-semibold">USGS Seismic Indicator</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1 rounded text-[9px]">
                LIVE
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-semibold">In-Situ Sensors</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-100 px-1 rounded text-[9px]">
                DEMO
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-semibold">Copernicus STAC Catalog</span>
              <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1 rounded text-[9px]">
                FALLBACK
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100 col-span-2">
              <span className="text-slate-700 font-semibold">Road Routing (OSRM/OSM)</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1 rounded text-[9px]">
                LIVE / RISK-AWARE
              </span>
            </div>
          </div>
        </div>

        {/* ── 7. GIS Risk Legend ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
            GIS RISK LEGEND
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#b91c1c]" />
              <span>Critical Risk (FoS &lt; 1.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#f59e0b]" />
              <span>Watch Zone (FoS 1.0–1.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#16a34a]" />
              <span>Safe Evacuation Corridor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">⛺</span>
              <span>Designated Shelters</span>
            </div>
          </div>
        </div>

        {/* ── 8. Navigation Hub ── */}
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
            {PROTOTYPE_DISCLAIMER}
          </span>
        </div>
      </div>
    </div>
  );
}
