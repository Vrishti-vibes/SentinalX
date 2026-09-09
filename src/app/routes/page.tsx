"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Navigation,
  Crosshair,
  RotateCw,
  Layers,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { RouteResponse, RouteCandidate } from "@/types/routing";
import LeafletRouteMapDynamic from "@/components/map/LeafletRouteMapDynamic";
import { useDeviceMode } from "@/components/layout/DeviceModeContext";
import {
  getStoredLocationId,
  setStoredLocationId,
  getResolvedLocation,
  LOCATION_CHANGE_EVENT,
} from "@/lib/utils/location-store";
import { NER_LOCATIONS } from "@/lib/data/ner-gis-data";

const DEFAULT_SHELTERS_BY_LOCATION: Record<
  string,
  { name: string; lat: number; lon: number; hazardName: string; hazardDesc: string }
> = {
  tawang: {
    name: "Tawang High-Ground Community Relief Shelter",
    lat: 27.585,
    lon: 91.865,
    hazardName: "Main Arterial Slope Failure Risk",
    hazardDesc: "Bypassing Lumla-Tawang Tension Crack Zone. Primary corridor active shear displacement.",
  },
  gangtok: {
    name: "Gangtok Indoor Stadium Relief Camp",
    lat: 27.332,
    lon: 88.614,
    hazardName: "NH-10 Ranipool Slope Subsidence",
    hazardDesc: "Bypassing Teesta Riverbank Scour and KM 24 Debris Flow polygon on NH-10.",
  },
  guwahati: {
    name: "Sarusajai Sports Complex Relief Haven",
    lat: 26.115,
    lon: 91.758,
    hazardName: "Southern Residual Ridge Cut Erosion",
    hazardDesc: "Bypassing southern hill-slope washout corridor. Direct traffic along expressway link.",
  },
  shillong: {
    name: "Shillong Central Youth Center",
    lat: 25.582,
    lon: 91.885,
    hazardName: "Upper Shillong Escarpment Slumping",
    hazardDesc: "Bypassing Shillong-Cherrapunji escarpment cut failure via high-ground Mawkhar ridge.",
  },
  cherrapunji: {
    name: "Sohra Civil Sub-Division Relief Hall",
    lat: 25.295,
    lon: 91.735,
    hazardName: "Sohra Rim Deep Gully Collapse",
    hazardDesc: "Bypassing active escarpment gorge headwall tension crack via upper plateau bypass.",
  },
  haflong: {
    name: "Haflong District Indoor Stadium",
    lat: 25.172,
    lon: 93.025,
    hazardName: "Barail Mudslide Track Subsidence",
    hazardDesc: "Bypassing railway culvert mudflow spillage along lower Jatinga valley highway.",
  },
  kohima: {
    name: "Kohima Local Ground Community Pavilion",
    lat: 25.670,
    lon: 94.112,
    hazardName: "Zubza Disang Shale Sinking Zone",
    hazardDesc: "Bypassing NH-29 carriage-way subsidence sinking corridor via upper ridge link.",
  },
  imphal: {
    name: "Khuman Lampak Relief Complex",
    lat: 24.821,
    lon: 93.945,
    hazardName: "NH-37 Mountain Pass Boulder Debris",
    hazardDesc: "Bypassing Noney hillside boulder release area along arterial highway corridor.",
  },
  aizawl: {
    name: "Aizawl High Ground Parish Hall",
    lat: 23.755,
    lon: 92.730,
    hazardName: "Hunthar Rotational Landslide Slip Circle",
    hazardDesc: "Bypassing Hunthar active deep-seated creep zone via Durtlang mountain crest.",
  },
  agartala: {
    name: "Swami Vivekananda Relief Hub",
    lat: 23.836,
    lon: 91.282,
    hazardName: "Baramura Ridge Gully Erosion",
    hazardDesc: "Bypassing eastern road-cutting rain wash-outs along NH-08 corridor.",
  },
  itanagar: {
    name: "Indira Gandhi Park Relief Pavilion",
    lat: 27.098,
    lon: 93.619,
    hazardName: "NH-415 Road Widening Debris Slide",
    hazardDesc: "Bypassing foothills unstable cut slope via Capital Complex arterial avenue.",
  },
  ner: {
    name: "Guwahati Regional Disaster Logistics Hub",
    lat: 26.143,
    lon: 91.789,
    hazardName: "Interstate Strategic Corridor Risk",
    hazardDesc: "Regional safe evacuation grid connecting central staging facilities.",
  },
};

function SafeRouteContent() {
  const { isMobile, isTablet } = useDeviceMode();
  const isSimulatedMobileOrTablet = isMobile || isTablet;
  const searchParams = useSearchParams();

  // Location synchronization from query or shared store
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    return searchParams.get("loc") || getStoredLocationId("tawang");
  });

  useEffect(() => {
    const handleLocationChange = (e: any) => {
      if (e.detail && e.detail !== selectedLocationId) {
        setSelectedLocationId(e.detail);
      }
    };
    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
    return () => window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
  }, [selectedLocationId]);

  const resolvedOrigin = getResolvedLocation(selectedLocationId);
  const defaultShelter =
    DEFAULT_SHELTERS_BY_LOCATION[selectedLocationId.toLowerCase()] ||
    DEFAULT_SHELTERS_BY_LOCATION.tawang;

  // Read destination coordinates from query if routed from Shelters page or fall back to sector shelter
  const destLatParam = searchParams.get("destLat");
  const destLonParam = searchParams.get("destLon");
  const destNameParam = searchParams.get("destName");

  const originLat = resolvedOrigin.latLng[0];
  const originLon = resolvedOrigin.latLng[1];
  const originName = resolvedOrigin.name;

  const destLat = destLatParam ? parseFloat(destLatParam) : defaultShelter.lat;
  const destLon = destLonParam ? parseFloat(destLonParam) : defaultShelter.lon;
  const destName = destNameParam || defaultShelter.name;
  const hazardName = defaultShelter.hazardName;
  const hazardDesc = defaultShelter.hazardDesc;

  const [travelMode, setTravelMode] = useState<"DRIVING" | "WALKING">("DRIVING");
  const [isStarted, setIsStarted] = useState(false);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const fetchRoute = async (mode: "DRIVING" | "WALKING" = travelMode) => {
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        setIsOnline(navigator.onLine);
        if (!navigator.onLine) {
          const cachedStr = localStorage.getItem(`sentinalx_cached_route_${selectedLocationId}_${mode}`);
          if (cachedStr) {
            setRouteData(JSON.parse(cachedStr));
            setIsLoading(false);
            return;
          }
        }
      }

      const res = await fetch(
        `/api/routes?fromLat=${originLat}&fromLon=${originLon}&toLat=${destLat}&toLon=${destLon}&originName=${encodeURIComponent(
          originName
        )}&destName=${encodeURIComponent(destName)}&mode=${mode.toLowerCase()}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setRouteData(json.data);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `sentinalx_cached_route_${selectedLocationId}_${mode}`,
              JSON.stringify(json.data)
            );
          }
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute(travelMode);

    const handleOnline = () => {
      setIsOnline(true);
      fetchRoute(travelMode);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [originLat, originLon, destLat, destLon, travelMode, selectedLocationId]);

  const recommended = routeData?.recommendedRoute;
  const distanceStr = recommended ? `${recommended.distanceKm.toFixed(1)} km` : "2.8 km";
  const drivingEta = recommended?.drivingEtaMinutes ?? recommended?.etaMinutes ?? 12;
  const walkingEta = recommended?.walkingEtaMinutes ?? 42;
  const etaStr = travelMode === "WALKING" ? `${walkingEta} min` : `${drivingEta} min`;
  const isOsrmLive = routeData?.status === "LIVE";
  const isBlocked = recommended?.routeRisk?.roadBlocked;

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Link href="/">
          <BrandLogo textClassName="text-[17px] font-bold tracking-tight text-[#0f172a]" />
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchRoute(travelMode)}
            disabled={isLoading}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Refresh Route"
            aria-label="Refresh Route"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                !isOnline ? "bg-amber-500" : isOsrmLive ? "bg-emerald-500" : "bg-blue-500"
              }`}
            />
            <span className="text-[11px] font-bold text-slate-800 tracking-wider">
              {!isOnline ? "OFFLINE" : isOsrmLive ? "LIVE OSRM" : "LOCAL GIS GRID"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-4 max-w-7xl w-full mx-auto">
        {/* Sector Quick Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: "tawang", label: "Tawang (AR)" },
            { id: "gangtok", label: "Gangtok (SK)" },
            { id: "guwahati", label: "Guwahati (AS)" },
            { id: "shillong", label: "Shillong (ML)" },
            { id: "cherrapunji", label: "Cherrapunji (ML)" },
            { id: "haflong", label: "Haflong (AS)" },
            { id: "kohima", label: "Kohima (NL)" },
            { id: "imphal", label: "Imphal (MN)" },
            { id: "aizawl", label: "Aizawl (MZ)" },
            { id: "agartala", label: "Agartala (TR)" },
            { id: "itanagar", label: "Itanagar (AR)" },
            { id: "ner", label: "NER Regional" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedLocationId(item.id);
                setStoredLocationId(item.id);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                selectedLocationId.toLowerCase() === item.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 2. Subheader & Mode Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block">
                • EMERGENCY EVACUATION ROUTING •
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                {isOsrmLive ? "OSRM / OPENSTREETMAP" : "OPERATIONAL GIS GRID"}
              </span>
            </div>
            <h1 className="text-[22px] sm:text-2xl font-extrabold text-[#0f172a] tracking-tight leading-tight mt-0.5">
              Safe Evacuation Corridor
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-[#334155] font-semibold flex-wrap">
              <div className="w-4 h-4 flex items-center justify-center text-blue-600">
                <Crosshair className="w-3.5 h-3.5" />
              </div>
              <span>Origin: {originName} ({originLat.toFixed(3)}°N, {originLon.toFixed(3)}°E)</span>
              <span className="text-[#94a3b8] font-bold mx-1">→</span>
              <div className="w-4 h-4 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-emerald-900 font-bold">Destination: {destName}</span>
            </div>
          </div>

          {/* Travel Mode Switcher: Driving vs Walking */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl self-start md:self-auto border border-slate-300/80 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setTravelMode("DRIVING");
                fetchRoute("DRIVING");
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                travelMode === "DRIVING"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🚗 Driving</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                (~{drivingEta} min)
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTravelMode("WALKING");
                fetchRoute("WALKING");
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                travelMode === "WALKING"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🚶 Walking</span>
              <span className="text-[10px] font-mono text-blue-700 font-bold">
                (~{walkingEta} min)
              </span>
            </button>
          </div>
        </div>

        {/* 3. Responsive Layout: Tailored Mobile Single-Column vs Desktop 12-Column Grid */}

        {/* ── Mobile Layout: Strictly single-column in requested order ── */}
        <div className={`flex flex-col space-y-3.5 ${isSimulatedMobileOrTablet ? "flex" : "lg:hidden"}`}>
          {/* 1. ROUTE STATUS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <span>ROUTE STATUS</span>
              <span className="font-mono text-[9px] text-slate-400">
                {routeData?.source || "OSRM / OpenStreetMap"}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full ${
                  isBlocked ? "bg-rose-700" : "bg-[#065f46]"
                } flex items-center justify-center text-white shrink-0`}
              >
                {isBlocked ? (
                  <AlertTriangle className="w-4 h-4 text-white" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span
                className={`text-base font-black ${
                  isBlocked ? "text-rose-700" : "text-[#065f46]"
                } tracking-tight leading-tight`}
              >
                {isBlocked ? "PRIMARY ROAD OBSTRUCTED" : "SAFEST CORRIDOR AVAILABLE"}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {isBlocked
                ? "Direct road corridor intersecting high landslide risk polygon. Auto-diverted to safe bypass."
                : `Route dynamically calculated avoiding active hazard zone (${hazardName}).`}
            </p>
          </div>

          {/* 2. MAP (full width) */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
            <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-700">OSRM Safe Bypass Cartography</span>
              <span className="text-slate-500 font-mono text-[9px]">CARTO Voyager Basemap</span>
            </div>
            <div className="relative h-[320px] w-full bg-[#edf2f7] overflow-hidden">
              <LeafletRouteMapDynamic
                routeData={routeData}
                originLat={originLat}
                originLon={originLon}
                destLat={destLat}
                destLon={destLon}
                originName={originName}
                destName={destName}
                hazardName={hazardName}
              />
            </div>
          </div>

          {/* 3. TRAVEL DISTANCE (single full-width card) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] uppercase text-slate-500 font-extrabold tracking-wider block">
              TRAVEL DISTANCE
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block font-mono">
              {distanceStr}
            </span>
          </div>

          {/* 4. ESTIMATED TIME (single full-width card) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-slate-500 font-extrabold tracking-wider">
              <span>ESTIMATED TIME</span>
              <span className="text-slate-400 font-normal">({travelMode === "WALKING" ? "Walking Pace" : "Vehicle"})</span>
            </div>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block font-mono">
              {etaStr}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              {travelMode === "WALKING" ? "3.5 km/h Mountain Trail Transit" : "Hilly Terrain Transit (~25 km/h)"}
            </span>
          </div>

          {/* 5. HAZARD AVOIDANCE (single full-width card) */}
          <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between font-extrabold text-[#991b1b]">
              <span className="text-[11px] uppercase tracking-wider">HAZARD AVOIDANCE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-200/70 rounded text-rose-900 font-black">
                CRITICAL
              </span>
            </div>
            <p className="text-xs text-rose-950 font-semibold leading-relaxed">
              {hazardDesc}
            </p>
          </div>

          {/* 6. START SAFE ROUTE Button */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setIsStarted(!isStarted)}
              className="w-full h-12 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>{isStarted ? "ROUTING ACTIVE • FOLLOW BYPASS" : "START SAFE ROUTE"}</span>
            </button>

            <Link href="/shelters" className="block w-full">
              <button
                type="button"
                className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>VIEW DESIGNATED SHELTERS</span>
              </button>
            </Link>
          </div>
        </div>

        {/* ── Desktop Layout: Full-Width GIS Command Grid ── */}
        <div className={`${isSimulatedMobileOrTablet ? "hidden" : "hidden lg:grid"} lg:grid-cols-12 gap-5 items-start`}>
          {/* Real Leaflet Map with OpenStreetMap / CARTO Basemap */}
          <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800">
                  OpenStreetMap Live Road Network • Risk-Aware Dynamic Routing
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">
                Avoids: {hazardName}
              </span>
            </div>

            {/* Map Canvas */}
            <div className="relative h-[500px] w-full bg-[#edf2f7] overflow-hidden">
              <LeafletRouteMapDynamic
                routeData={routeData}
                originLat={originLat}
                originLon={originLon}
                destLat={destLat}
                destLon={destLon}
                originName={originName}
                destName={destName}
                hazardName={hazardName}
              />
            </div>
          </div>

          {/* Right Side: Status, Steps & Actions */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            {/* ROUTE STATUS Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                <span>ROUTE STATUS</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {routeData?.source || "OSRM / OpenStreetMap"}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full ${
                    isBlocked ? "bg-rose-700" : "bg-[#065f46]"
                  } flex items-center justify-center text-white shrink-0`}
                >
                  {isBlocked ? (
                    <AlertTriangle className="w-4 h-4 text-white" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </div>
                <span
                  className={`text-lg font-black ${
                    isBlocked ? "text-rose-700" : "text-[#065f46]"
                  } tracking-tight`}
                >
                  {isBlocked
                    ? "PRIMARY ROAD OBSTRUCTED"
                    : "SAFEST CORRIDOR AVAILABLE"}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isBlocked
                  ? "Direct road corridor intersecting high landslide risk polygon. Auto-diverted to safe bypass."
                  : `Route dynamically calculated avoiding active hazard zone (${hazardName}).`}
              </p>

              {/* Metric Badges: Distance and ETA */}
              <div className="grid grid-cols-2 gap-3 pt-1 font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Travel Distance
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">
                    {distanceStr}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Estimated Time ({travelMode === "WALKING" ? "Walking" : "Vehicle"})
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">
                    {etaStr}
                  </span>
                </div>
              </div>

              {/* Avoided Hazard Summary */}
              <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-extrabold text-[#991b1b]">
                  <span className="text-[10px] uppercase tracking-wider">Hazard Avoidance</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-200/70 rounded text-rose-900">
                    CRITICAL
                  </span>
                </div>
                <p className="text-rose-950 font-semibold leading-relaxed text-[11px]">
                  {hazardDesc}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStarted(!isStarted)}
                  className="w-full h-11 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{isStarted ? "ROUTING ACTIVE • FOLLOW BYPASS" : "START SAFE ROUTE"}</span>
                </button>

                <Link href="/shelters" className="block w-full">
                  <button
                    type="button"
                    className="w-full h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <span>VIEW DESIGNATED SHELTERS</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SafeRouteScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
          Loading safe evacuation route...
        </div>
      }
    >
      <SafeRouteContent />
    </Suspense>
  );
}


