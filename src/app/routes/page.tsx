"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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

export default function SafeRouteScreen() {
  const { isMobile, isTablet } = useDeviceMode();
  const isSimulatedMobileOrTablet = isMobile || isTablet;

  const [isStarted, setIsStarted] = useState(false);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const fetchRoute = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        setIsOnline(navigator.onLine);
        if (!navigator.onLine) {
          const cachedStr = localStorage.getItem("sentinalx_cached_route");
          if (cachedStr) {
            setRouteData(JSON.parse(cachedStr));
            setIsLoading(false);
            return;
          }
        }
      }

      const res = await fetch(
        "/api/routes?fromLat=27.586&fromLon=91.859&toLat=27.592&toLon=91.875"
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setRouteData(json.data);
          if (typeof window !== "undefined") {
            localStorage.setItem("sentinalx_cached_route", JSON.stringify(json.data));
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
    fetchRoute();

    const handleOnline = () => {
      setIsOnline(true);
      fetchRoute();
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
  }, []);

  const recommended = routeData?.recommendedRoute;
  const distanceStr = recommended ? `${recommended.distanceKm} km` : "1.8 km";
  const etaStr = recommended ? `${recommended.etaMinutes} min` : "8 min";
  const isOsrmLive = routeData?.status === "LIVE";
  const isBlocked = recommended?.routeRisk?.roadBlocked;

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Link href="/" className="flex items-center gap-2 group">
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

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchRoute}
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
              {!isOnline ? "OFFLINE" : isOsrmLive ? "LIVE OSRM" : "SIMULATED"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-4 max-w-7xl w-full mx-auto">
        {/* 2. Subheader */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block">
                • EMERGENCY EVACUATION ROUTING •
              </span>
              <h1 className="text-[22px] sm:text-2xl font-extrabold text-[#0f172a] tracking-tight leading-tight mt-0.5">
                Safe Evacuation Road Route
              </h1>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              {isOsrmLive ? "OSRM / OPENSTREETMAP" : "ROUTE SIMULATION"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-[#334155] font-semibold flex-wrap">
            <div className="w-4 h-4 flex items-center justify-center text-blue-600">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <span>Origin: Tawang Sector (27.586°N, 91.859°E)</span>
            <span className="text-[#94a3b8] font-bold mx-1">→</span>
            <div className="w-4 h-4 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span>Destination: Tawang Community Center (Shelter #1)</span>
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
                {isBlocked ? "PRIMARY ROAD OBSTRUCTED" : "SAFEST ROUTE AVAILABLE"}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {isBlocked
                ? "Direct road corridor intersecting high landslide risk polygon. Auto-diverted to safe bypass."
                : "Route calculated avoiding active landslide tension crack zone on Main Arterial Rd."}
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
                originLat={27.586}
                originLon={91.859}
                destLat={27.592}
                destLon={91.875}
              />
            </div>
          </div>

          {/* 3. TRAVEL DISTANCE (single full-width card) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] uppercase text-slate-500 font-extrabold tracking-wider block">
              TRAVEL DISTANCE
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block font-mono">
              2.8 km
            </span>
          </div>

          {/* 4. ESTIMATED TIME (single full-width card) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] uppercase text-slate-500 font-extrabold tracking-wider block">
              ESTIMATED TIME
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block font-mono">
              5 min
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
              Bypassing Zemithang-Lumla Slope Alpha (FoS 0.92, Saturation 94.2%). Primary corridor active shear displacement.
            </p>
          </div>

          {/* 6. START SAFE ROUTE Button */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setIsStarted(!isStarted)}
              className={`w-full h-12 rounded-xl text-white font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] ${
                isStarted
                  ? "bg-emerald-700 hover:bg-emerald-800"
                  : "bg-[#16a34a] hover:bg-[#15803d]"
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{isStarted ? "SAFE ROUTE ACTIVE" : "START SAFE ROUTE"}</span>
            </button>

            <Link href="/shelters" className="block w-full">
              <button
                type="button"
                className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all"
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
                Avoids: Zemithang-Lumla Hazard Polygon
              </span>
            </div>

            {/* Map Canvas */}
            <div className="relative h-[500px] w-full bg-[#edf2f7] overflow-hidden">
              <LeafletRouteMapDynamic
                routeData={routeData}
                originLat={27.586}
                originLon={91.859}
                destLat={27.592}
                destLon={91.875}
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
                    : "SAFEST ROUTE AVAILABLE"}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isBlocked
                  ? "Direct road corridor intersecting high landslide risk polygon. Auto-diverted to safe bypass."
                  : "Route calculated avoiding active landslide tension crack zone on Main Arterial Rd."}
              </p>

              {/* Metric Badges: Distance and ETA */}
              <div className="grid grid-cols-2 gap-3 pt-1 font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Travel Distance
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">
                    2.8 km
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Estimated Time
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">
                    5 min
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
                <p className="text-[11px] text-rose-900 font-medium">
                  Bypassing Zemithang-Lumla Slope Alpha (FoS 0.92, Saturation 94.2%).
                </p>
              </div>

              {/* Turn-by-Turn Navigation Steps */}
              {recommended?.steps && recommended.steps.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Turn-by-Turn Navigation
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                    {recommended.steps.slice(0, 4).map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-[11px]">{step.instruction}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {Math.round(step.distanceMeters)}m • {Math.round(step.durationSeconds / 60)} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* START NAVIGATION / EMERGENCY SHELTERS */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStarted(!isStarted)}
                  className={`w-full h-11 rounded-xl text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] ${
                    isStarted
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-[#16a34a] hover:bg-[#15803d]"
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>{isStarted ? "SAFE ROUTE ACTIVE" : "START SAFE ROUTE"}</span>
                </button>

                <Link href="/shelters" className="block w-full">
                  <button
                    type="button"
                    className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <span>VIEW ALL NEARBY SHELTERS</span>
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