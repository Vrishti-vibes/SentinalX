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
} from "lucide-react";
import { RouteResponse, RouteCandidate } from "@/types/routing";

export default function SafeRouteScreen() {
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
          // Check local cached route
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
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Red Diamond Logo + SentinalX */}
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

        {/* Right: Live/Offline + Refresh */}
        <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                !isOnline ? "bg-amber-500" : isOsrmLive ? "bg-[#16a34a]" : "bg-blue-500"
              }`}
            />
            <span className="text-xs font-bold text-[#991b1b] tracking-wider">
              {!isOnline ? "OFFLINE" : isOsrmLive ? "LIVE" : "FALLBACK"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* 2. Subheader: North Eastern Region & Route Endpoints */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
              North Eastern Region
            </h1>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {isOsrmLive ? "OSRM / OSM ROAD" : "DEMO FALLBACK"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#334155] font-semibold flex-wrap">
            <div className="w-4 h-4 flex items-center justify-center text-[#64748b]">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <span>Tawang Sector (27.586°N, 91.859°E)</span>
            <span className="text-[#94a3b8] font-bold mx-1">→</span>
            <span>Tawang Community Center</span>
          </div>
        </div>

        {/* 3. Map Card Component */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {/* Topographic Map Background Container */}
          <div className="relative h-60 w-full bg-[#f8fafc] overflow-hidden">
            {/* Topographic Contour Lines SVG Pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-35"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-20,30 Q80,10 180,50 T380,40 T500,20"
                fill="none"
                stroke="#64748b"
                strokeWidth="0.9"
              />
              <path
                d="M-20,65 Q100,40 220,80 T420,70"
                fill="none"
                stroke="#64748b"
                strokeWidth="0.9"
              />
              <path
                d="M-20,105 Q120,80 240,120 T440,110"
                fill="none"
                stroke="#64748b"
                strokeWidth="0.9"
              />
              <path
                d="M-20,145 Q140,120 260,160 T460,150"
                fill="none"
                stroke="#64748b"
                strokeWidth="0.9"
              />
              <path
                d="M-20,185 Q160,160 280,200 T480,190"
                fill="none"
                stroke="#64748b"
                strokeWidth="0.9"
              />
              <path
                d="M-20,225 Q180,200 300,240 T500,230"
                fill="none"
                stroke="#64748b"
                strokeWidth="0.9"
              />
              <path
                d="M80,30 L110,65 M140,40 L165,75 M220,50 L250,90"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="0.6"
              />
            </svg>

            {/* Red Hazard Polygon (Translucent Red with border) */}
            <div
              className="absolute top-4 left-12 w-48 h-36 bg-[#f87171]/25 border-2 border-[#ef4444]/60"
              style={{
                clipPath:
                  "polygon(45% 0%, 90% 12%, 100% 65%, 85% 95%, 28% 100%, 0% 70%, 15% 25%)",
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-[#b91c1c] fill-[#b91c1c]"
                >
                  <path d="M12 3L2 21H22L12 3Z" />
                  <path
                    d="M12 9V14"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="17" r="1.2" fill="#ffffff" />
                </svg>
              </div>
            </div>

            {/* Green Safe Route Line (Bypassing the hazard zone) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 175,240 Q 230,170 245,115 Q 255,80 270,55"
                fill="none"
                stroke="#16a34a"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Blue GPS Location Dot (Start position) */}
            <div className="absolute bottom-12 left-24 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/25 animate-ping absolute" />
              <div className="w-6 h-6 rounded-full bg-blue-400/40 flex items-center justify-center relative">
                <div className="w-3.5 h-3.5 rounded-full bg-[#2563eb] border-2 border-white shadow-md" />
              </div>
            </div>

            {/* Green Destination Shelter Pin (Tent Icon) */}
            <div className="absolute top-9 right-16 sm:right-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-[#16a34a] border-2 border-white shadow-md flex items-center justify-center text-white">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.5 21 12 3l8.5 18H3.5z" />
                  <path d="M12 3v18" />
                  <path d="M9 21l3-6 3 6" />
                </svg>
              </div>
            </div>

            {/* Top-Left Pill Badge: SAFE ROUTE */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-sm text-xs font-bold text-[#0f172a]">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span className="tracking-wide">
                {isBlocked ? "ROUTE OBSTRUCTED" : "SAFE ROUTE"}
              </span>
            </div>

            {/* Bottom-Right Attribution */}
            <div className="absolute bottom-2 right-2 z-10 text-[9px] font-medium text-slate-500 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
              © OpenStreetMap contributors
            </div>
          </div>
        </div>

        {/* 4. ROUTE STATUS Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <span>ROUTE STATUS</span>
            <span className="font-mono text-[10px] text-slate-400">
              {routeData?.source || "OSRM/OpenStreetMap"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded-full ${
                isBlocked ? "bg-rose-700" : "bg-[#065f46]"
              } flex items-center justify-center text-white shrink-0`}
            >
              {isBlocked ? (
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </div>
            <span
              className={`text-base sm:text-[17px] font-extrabold ${
                isBlocked ? "text-rose-700" : "text-[#065f46]"
              } tracking-tight`}
            >
              {isBlocked
                ? "ROAD BLOCKAGE REPORTED — RE-ROUTING"
                : "SAFE ROUTE AVAILABLE"}
            </span>
          </div>

          {/* Metrics (Distance & Estimated time) */}
          <div className="space-y-1.5 text-sm pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Distance:</span>
              <span className="font-bold text-slate-900">{distanceStr}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Estimated time:</span>
              <span className="font-bold text-slate-900">{etaStr}</span>
            </div>
            {recommended?.routeRisk && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500">Hazard Intersections:</span>
                <span className="font-mono font-bold text-slate-700">
                  {recommended.routeRisk.hazardIntersections} (Max: {recommended.routeRisk.maximumRisk})
                </span>
              </div>
            )}
          </div>

          {/* Red Warning Alert Box (Avoid: Landslide zone on main road) */}
          <div className="p-3 rounded-xl bg-[#fee2e2]/70 border border-[#fca5a5]/80 flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#b91c1c] shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="text-[#991b1b] font-medium leading-tight">
              <span className="font-bold">Avoid:</span> Active landslide zone on Main Arterial Rd. Follow the ridge bypass corridor.
            </div>
          </div>
        </div>

        {/* 5. Turn-by-Turn Maneuvers if Available */}
        {recommended?.steps && recommended.steps.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended Route Steps</span>
            </div>
            <div className="space-y-1.5 divide-y divide-slate-100">
              {recommended.steps.map((st, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                  <span className="text-slate-700 font-medium">{st.instruction}</span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0">
                    {st.distanceMeters}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Information Notice Box */}
        <div className="rounded-xl bg-[#f1f5f9] border border-slate-200/60 p-3.5 flex items-center gap-2.5 text-xs text-slate-600">
          <div className="w-4 h-4 flex items-center justify-center text-slate-500 shrink-0">
            <Info className="w-4 h-4 stroke-[2]" />
          </div>
          <p className="flex-1 text-center font-medium text-slate-600 leading-snug">
            Avoid unstable slopes and follow the recommended road bypass.
          </p>
        </div>

        {/* 7. Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsStarted(!isStarted)}
            className="w-full h-12 rounded-xl bg-[#00b074] hover:bg-[#009b66] text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
          >
            <Navigation className="w-4 h-4 fill-white stroke-white" />
            <span>{isStarted ? "GUIDANCE ACTIVE" : "START SAFE ROUTE"}</span>
          </button>

          <Link href="/shelters" className="block w-full">
            <button
              type="button"
              className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm tracking-wider flex items-center justify-center transition-all active:scale-[0.99]"
            >
              <span>VIEW SHELTER</span>
            </button>
          </Link>
        </div>

        {/* 8. Demo / Prototype Footer Note */}
        <div className="pt-2 pb-1 text-center space-y-0.5">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase block">
            {routeData?.disclaimer || "PROTOTYPE ROUTE RISK ANALYSIS"}
          </span>
          <span className="text-[9px] text-slate-400 block">
            {routeData?.attribution || "Route data © OpenStreetMap contributors"}
          </span>
        </div>
      </div>
    </div>
  );
}
