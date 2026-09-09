"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  RotateCw,
  ShieldAlert,
  Compass,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SensorReadingRecord, IncidentReportRecord } from "@/types/database";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { REFRESH_INTERVALS } from "@/lib/config/refresh";
import LeafletMapDynamic from "@/components/map/LeafletMapDynamic";
import {
  GisMapFeature,
  LayerVisibility,
  DEFAULT_LAYER_VISIBILITY,
  NerLocationItem,
} from "@/types/gis-map";
import {
  NER_LOCATIONS,
  NER_INCIDENTS,
  NER_ROADS,
  NER_SHELTERS,
  NER_SENSORS,
  NER_RISK_ZONES,
} from "@/lib/data/ner-gis-data";
import { useDeviceMode } from "@/components/layout/DeviceModeContext";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  getStoredLocationId,
  setStoredLocationId,
  LOCATION_CHANGE_EVENT,
} from "@/lib/utils/location-store";

interface LayerToggleItem {
  key: keyof LayerVisibility;
  label: string;
  icon: string;
}

const LAYER_TOGGLES: LayerToggleItem[] = [
  { key: "heatmap", label: "Risk Heatmap", icon: "🔥" },
  { key: "riskZones", label: "Landslide Risk Zones", icon: "⬡" },
  { key: "incidents", label: "Active Incidents", icon: "⚠️" },
  { key: "reports", label: "Citizen Reports", icon: "▲" },
  { key: "roads", label: "Road Status", icon: "🛣️" },
  { key: "shelters", label: "Shelters", icon: "⛺" },
  { key: "sensors", label: "IoT Sensors", icon: "📡" },
];

export default function LiveNerGisMapScreen() {
  const { isMobile: isContextMobile } = useDeviceMode();
  const [isScreenMobile, setIsScreenMobile] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handleResize = () => setIsScreenMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = isContextMobile || isScreenMobile;

  // Default is stored location or 'ner' Regional Overview across 8 states
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => getStoredLocationId("ner"));
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  const [selectedFeature, setSelectedFeature] = useState<GisMapFeature | null>(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(true);

  // Sync with global location store on mount and external updates
  useEffect(() => {
    const stored = getStoredLocationId("ner");
    if (stored && stored !== selectedLocationId) {
      setSelectedLocationId(stored);
    }
  }, []);

  useEffect(() => {
    const handleLocationChange = (e: any) => {
      if (e.detail && e.detail !== selectedLocationId) {
        setSelectedLocationId(e.detail);
      }
    };
    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
    return () => window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
  }, [selectedLocationId]);

  // Live Map API Telemetry States
  const [mapApiData, setMapApiData] = useState<any>(null);
  const [reports, setReports] = useState<IncidentReportRecord[]>([]);
  const [sensors, setSensors] = useState<SensorReadingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Toggle individual layer
  const toggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const setAllLayers = (visible: boolean) => {
    setLayerVisibility({
      heatmap: visible,
      riskZones: visible,
      incidents: visible,
      reports: visible,
      roads: visible,
      shelters: visible,
      sensors: visible,
    });
  };

  // Fetch GIS Data from /api/map
  const fetchGisData = async () => {
    try {
      const [mapRes, reportRes, sensorRes] = await Promise.allSettled([
        fetch(`/api/map?sector=${encodeURIComponent(selectedLocationId)}`),
        fetch("/api/reports?limit=50"),
        fetch("/api/sensors/latest"),
      ]);

      if (mapRes.status === "fulfilled" && mapRes.value.ok) {
        const json = await mapRes.value.json();
        if (json.success && json.data) {
          setMapApiData(json.data);
        }
      }

      if (reportRes.status === "fulfilled" && reportRes.value.ok) {
        const json = await reportRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          setReports(json.data);
        }
      }

      if (sensorRes.status === "fulfilled" && sensorRes.value.ok) {
        const json = await sensorRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          setSensors(json.data);
        }
      }
    } catch (err: unknown) {
      console.error("[GIS Map] Error fetching intelligence:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const { isRefreshing, refreshNow } = useAutoRefresh(fetchGisData, {
    intervalMs: REFRESH_INTERVALS.GIS_MAP,
    enabled: true,
  });

  useEffect(() => {
    fetchGisData();
  }, [selectedLocationId]);

  // Derived current selected location data
  const currentLocationData: NerLocationItem = useMemo(() => {
    const match = NER_LOCATIONS.find((l) => l.id.toLowerCase() === selectedLocationId.toLowerCase());
    return match || NER_LOCATIONS[0];
  }, [selectedLocationId]);

  // Handle selecting a location from search or dropdown
  const handleSelectLocation = (loc: NerLocationItem) => {
    setStoredLocationId(loc.id);
    startTransition(() => {
      setSelectedLocationId(loc.id);
      setSelectedFeature(null);
      setSearchQuery("");
      setIsSearchOpen(false);
      setIsMobilePanelOpen(true);
    });
  };

  // Filtered search results
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return NER_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.state.toLowerCase().includes(query) ||
        loc.primaryRoad.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Summary counts
  const summary = useMemo(() => {
    if (mapApiData?.summary) return mapApiData.summary;
    return {
      highRiskZones: NER_RISK_ZONES.filter((z) => z.level === "HIGH" || z.level === "VERY HIGH").length,
      activeIncidents: NER_INCIDENTS.length,
      affectedRoads: NER_ROADS.filter((r) => r.status === "RESTRICTED" || r.status === "CLOSED").length,
      openCitizenReports: reports.filter((r) => r.responseStatus !== "RESOLVED").length || 8,
      sensorsOnline: NER_SENSORS.filter((s) => s.status !== "WARNING").length + sensors.length,
      sheltersAvailable: NER_SHELTERS.filter((s) => s.status === "OPEN").length,
    };
  }, [mapApiData, reports, sensors]);

  // Active feature to show in Intelligence Panel
  const panelData = useMemo(() => {
    if (selectedFeature) {
      return {
        areaName: selectedFeature.name,
        state: selectedFeature.subCode || currentLocationData.state,
        riskScore: selectedFeature.riskScore ?? currentLocationData.riskScore,
        riskLevel: (selectedFeature.riskLevel || currentLocationData.riskLevel).toUpperCase(),
        rainfall: selectedFeature.rainfall ?? `${currentLocationData.rainfall} mm`,
        soilMoisture: selectedFeature.moisture ?? `${currentLocationData.soilMoisture}%`,
        groundMovement: selectedFeature.groundMovement ?? currentLocationData.groundMovement,
        slopeStability: selectedFeature.slopeStability ?? currentLocationData.slopeStability,
        activeIncidents: selectedFeature.activeIncidents ?? currentLocationData.activeIncidents,
        affectedRoads: selectedFeature.affectedRoads ?? currentLocationData.affectedRoads,
        nearbyShelters: selectedFeature.nearbyShelters ?? currentLocationData.nearbyShelters,
        roadName: selectedFeature.road ?? currentLocationData.primaryRoad,
        roadStatus: selectedFeature.status ?? currentLocationData.roadStatus,
        description: selectedFeature.description ?? currentLocationData.description,
        actionAdvice: selectedFeature.actionAdvice,
        actionHref: selectedFeature.actionHref || "/routes",
        actionText: selectedFeature.actionText || "Safe Route",
      };
    }

    return {
      areaName: currentLocationData.name,
      state: currentLocationData.state,
      riskScore: currentLocationData.riskScore,
      riskLevel: currentLocationData.riskLevel,
      rainfall: `${currentLocationData.rainfall} mm`,
      soilMoisture: `${currentLocationData.soilMoisture}%`,
      groundMovement: currentLocationData.groundMovement,
      slopeStability: currentLocationData.slopeStability,
      activeIncidents: currentLocationData.activeIncidents,
      affectedRoads: currentLocationData.affectedRoads,
      nearbyShelters: currentLocationData.nearbyShelters,
      roadName: currentLocationData.primaryRoad,
      roadStatus: currentLocationData.roadStatus,
      description: currentLocationData.description,
      actionAdvice: `Real-time operational monitoring active for ${currentLocationData.name}.`,
      actionHref: "/routes",
      actionText: "Safe Route",
    };
  }, [selectedFeature, currentLocationData]);

  // Reusable panel content component
  const renderIntelligenceCard = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4 select-none">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            SELECTED AREA
          </span>
          {selectedFeature && (
            <button
              type="button"
              onClick={() => setSelectedFeature(null)}
              className="text-[10px] text-blue-600 hover:underline font-bold"
            >
              Reset to {currentLocationData.name}
            </button>
          )}
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
          {panelData.areaName}
        </h2>
        <div className="text-xs text-slate-500 font-medium mt-0.5">
          {panelData.state}
        </div>
      </div>

      {/* Risk Score & Level Badge */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            GEOTECHNICAL RISK SCORE
          </span>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {panelData.riskScore} <span className="text-xs text-slate-400 font-sans">/ 100</span>
          </span>
        </div>
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase ${
            panelData.riskLevel === "CRITICAL" || panelData.riskLevel === "VERY HIGH"
              ? "bg-rose-100 text-rose-800 border border-rose-200"
              : panelData.riskLevel === "HIGH"
              ? "bg-orange-100 text-orange-800 border border-orange-200"
              : panelData.riskLevel === "MODERATE"
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
        >
          {panelData.riskLevel}
        </span>
      </div>

      {/* Key Parameters Table */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Rainfall:</span>
          <strong className="font-mono text-slate-900 font-bold">{panelData.rainfall}</strong>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Soil Moisture:</span>
          <strong className="font-mono text-slate-900 font-bold">{panelData.soilMoisture}</strong>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Ground Movement:</span>
          <strong className="text-slate-900 font-bold text-right">{panelData.groundMovement}</strong>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Slope Stability:</span>
          <strong className="text-slate-900 font-bold text-right">{panelData.slopeStability}</strong>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Active Incidents:</span>
          <strong className="font-mono text-rose-600 font-bold">{panelData.activeIncidents}</strong>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Affected Roads:</span>
          <strong className="font-mono text-orange-600 font-bold">{panelData.affectedRoads}</strong>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Nearby Shelters:</span>
          <strong className="font-mono text-emerald-700 font-bold">{panelData.nearbyShelters}</strong>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Primary Road:</span>
          <strong className="text-slate-900 font-bold">{panelData.roadName}</strong>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500 font-medium">Road Status:</span>
          <span
            className={`font-mono font-extrabold px-1.5 py-0.5 rounded text-[10px] ${
              panelData.roadStatus === "RESTRICTED" || panelData.roadStatus === "CLOSED"
                ? "bg-rose-100 text-rose-800"
                : panelData.roadStatus === "CAUTION"
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {panelData.roadStatus}
          </span>
        </div>
      </div>

      {/* Description & Action Advice */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Operational Advisory
        </span>
        <p className="text-slate-700 leading-relaxed font-medium">
          {panelData.actionAdvice || panelData.description}
        </p>
      </div>

      {/* Action Buttons: View Details, Safe Route, Create Alert */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
        <Link
          href="/authority"
          className="text-center py-2 px-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] transition-all shadow-xs"
        >
          View Details
        </Link>
        <Link
          href={panelData.actionHref || "/routes"}
          className="text-center py-2 px-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] transition-all shadow-xs"
        >
          Safe Route
        </Link>
        <Link
          href="/alerts/history"
          className="text-center py-2 px-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] transition-all shadow-xs"
        >
          Create Alert
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans pb-12">
      {/* ── 1. Top Command Header ── */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Link href="/">
          <BrandLogo textClassName="text-[17px] font-bold tracking-tight text-[#0f172a]" />
        </Link>

        {/* Live operational status & refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black text-slate-800 tracking-wider">
              NER GIS COMMAND
            </span>
            <span className="text-[9px] font-mono text-blue-700 bg-blue-50 px-1 rounded font-bold">
              8 STATES ACTIVE
            </span>
          </div>

          <button
            type="button"
            onClick={refreshNow}
            disabled={isRefreshing}
            aria-label="Refresh GIS intelligence"
            title="Refresh GIS intelligence"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* ── 2. Compact Map Summary Bar ── */}
      <div className="bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-200">
              NER Spatial Summary
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-[11px]">
            <div className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1.5">
              <span className="text-slate-400">High Risk Zones:</span>
              <strong className="text-rose-400">{summary.highRiskZones}</strong>
            </div>
            <div className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1.5">
              <span className="text-slate-400">Active Incidents:</span>
              <strong className="text-orange-400">{summary.activeIncidents}</strong>
            </div>
            <div className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1.5">
              <span className="text-slate-400">Affected Roads:</span>
              <strong className="text-amber-400">{summary.affectedRoads}</strong>
            </div>
            <div className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1.5">
              <span className="text-slate-400">Citizen Reports:</span>
              <strong className="text-sky-400">{summary.openCitizenReports}</strong>
            </div>
            <div className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1.5">
              <span className="text-slate-400">Sensors Online:</span>
              <strong className="text-emerald-400">{summary.sensorsOnline}</strong>
            </div>
            <div className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1.5">
              <span className="text-slate-400">Shelters Available:</span>
              <strong className="text-teal-400">{summary.sheltersAvailable}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Main Body: Search Bar, Layer Controls, and Map + Side Panel ── */}
      <main className="p-3 sm:p-5 max-w-7xl mx-auto w-full space-y-3">
        {/* Title, Search Box, and Sector Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block">
                • NORTH EASTERN REGION GIS •
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                All 8 States
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
              Professional Disaster Management GIS System
            </h1>
          </div>

          {/* Location Search Bar & Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative w-full sm:w-72">
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-1.5" />
                <input
                  type="text"
                  placeholder="Search Guwahati, Gangtok, Shillong..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 w-full focus:outline-hidden font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Search Results */}
              {isSearchOpen && filteredSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredSearchResults.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{loc.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {loc.state} • {loc.primaryRoad}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          loc.riskLevel === "VERY HIGH"
                            ? "bg-rose-100 text-rose-800"
                            : loc.riskLevel === "HIGH"
                            ? "bg-orange-100 text-orange-800"
                            : loc.riskLevel === "MODERATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {loc.riskScore}/100
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick State/Sector Selector Dropdown */}
            <select
              aria-label="Select North Eastern Region Operational State or Sector"
              value={selectedLocationId}
              onChange={(e) => {
                const match = NER_LOCATIONS.find((l) => l.id === e.target.value);
                if (match) handleSelectLocation(match);
              }}
              className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-2.5 py-1.5 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="ner">🌐 ALL NER — Regional Overview (8 States)</option>
              <option value="gangtok">📍 Sikkim — Gangtok / East Sikkim</option>
              <option value="tawang">📍 Arunachal Pradesh — Tawang Sector</option>
              <option value="guwahati">📍 Assam — Guwahati Metropolitan</option>
              <option value="haflong">📍 Assam — Dima Hasao / Haflong</option>
              <option value="shillong">📍 Meghalaya — Shillong / East Khasi</option>
              <option value="cherrapunji">📍 Meghalaya — Cherrapunji Rim</option>
              <option value="kohima">📍 Nagaland — Kohima / Zubza</option>
              <option value="imphal">📍 Manipur — Imphal / Jiribam</option>
              <option value="aizawl">📍 Mizoram — Aizawl Urban Slope</option>
              <option value="itanagar">📍 Arunachal Pradesh — Itanagar Complex</option>
              <option value="agartala">📍 Tripura — Agartala / Baramura</option>
            </select>
          </div>
        </div>

        {/* Quick Regional Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: "ner", label: "NER Overview" },
            { id: "gangtok", label: "Gangtok (SK)" },
            { id: "tawang", label: "Tawang (AR)" },
            { id: "guwahati", label: "Guwahati (AS)" },
            { id: "shillong", label: "Shillong (ML)" },
            { id: "kohima", label: "Kohima (NL)" },
            { id: "imphal", label: "Imphal (MN)" },
            { id: "aizawl", label: "Aizawl (MZ)" },
            { id: "agartala", label: "Agartala (TR)" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const match = NER_LOCATIONS.find((l) => l.id === item.id);
                if (match) handleSelectLocation(match);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                selectedLocationId === item.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ── 4. Independent 7-Layer Control Strip ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold uppercase tracking-wider text-slate-700 text-[10px]">
                GIS Map Layers
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[9px] font-bold">
                {Object.values(layerVisibility).filter(Boolean).length} / 7 Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => setAllLayers(true)}
                className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                All On
              </button>
              <button
                type="button"
                onClick={() => setAllLayers(false)}
                className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {LAYER_TOGGLES.map((t) => {
              const isVisible = Boolean(layerVisibility[t.key]);
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={isVisible}
                  onClick={() => toggleLayer(t.key)}
                  className={`px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between border transition-all text-xs ${
                    isVisible
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="text-xs">{t.icon}</span>
                    <span className="font-bold truncate text-[11px]">{t.label}</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ml-1 ${
                      isVisible ? "bg-emerald-400" : "bg-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 5. Main Content: Map Canvas + Selected Location Intelligence Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* GIS Map Viewport (Left / Main) */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Telemetry bar above map */}
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-bold text-slate-800 truncate">
                  Interactive GIS View • {currentLocationData.name}
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[10px] shrink-0">
                Lat {currentLocationData.latLng[0].toFixed(2)}°N, Lng {currentLocationData.latLng[1].toFixed(2)}°E
              </span>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className={`relative ${isMobile ? "h-[440px]" : "h-[580px] lg:h-[640px]"} w-full bg-slate-100 overflow-hidden`}>
              <LeafletMapDynamic
                selectedLocation={selectedLocationId}
                selectedLocationData={currentLocationData}
                layerVisibility={layerVisibility}
                onSelectFeature={(feature) => {
                  setSelectedFeature(feature);
                  setIsMobilePanelOpen(true);
                }}
                onSelectLocation={(locId) => {
                  const match = NER_LOCATIONS.find((l) => l.id === locId);
                  if (match) handleSelectLocation(match);
                }}
                reports={reports}
                sensors={sensors}
              />
            </div>
          </div>

          {/* Selected Location Intelligence Panel */}
          <div className="lg:col-span-4 space-y-3">
            {/* Mobile Collapsible Toggle Button */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between font-bold text-xs text-slate-800"
              >
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Selected Area Intelligence ({panelData.areaName})</span>
                </span>
                {isMobilePanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isMobilePanelOpen && (
                <div className="mt-3">
                  {renderIntelligenceCard()}
                </div>
              )}
            </div>

            {/* Desktop Intelligence Panel (Always visible on lg screens) */}
            <div className="hidden lg:block">
              {renderIntelligenceCard()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
