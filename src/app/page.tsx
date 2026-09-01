"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CloudRain,
  Mountain,
  AlertTriangle,
  Navigation,
  ShieldCheck,
  MapPin,
  ChevronRight,
  Layers,
  ArrowUpRight,
  Compass,
} from "lucide-react";
import { MOCK_ALERTS } from "@/data/mock/alerts.mock";

export default function MonitorHomeScreen() {
  const latestAlert = MOCK_ALERTS[0];

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. SentinelX Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Red Diamond Logo + SentinelX */}
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
            SentinelX
          </span>
        </Link>

        {/* Right: Green dot + LIVE */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <span className="text-xs font-bold text-[#991b1b] tracking-wider">
              LIVE
            </span>
          </div>
          <Link
            href="/alerts"
            className="relative w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[8px] font-bold flex items-center justify-center border-2 border-white">
              3
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Region Subheader */}
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
            North Eastern Region
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            AI Landslide Risk Monitoring & Early Warning
          </p>
        </div>

        {/* 2. Current Landslide Threat Status Card */}
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-white via-rose-50/30 to-rose-100/40 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#991b1b] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              CURRENT LANDSLIDE THREAT
            </span>
            <span className="text-[11px] font-mono text-slate-500">Updated 2m ago</span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
              <span>HIGH RISK</span>
              <span className="text-sm sm:text-base font-bold text-rose-600 font-mono">
                (78% Vulnerability)
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Tawang Sector • NH-13 Highway Km 4 Alert</span>
            </p>
          </div>

          {/* Risk Gauge Bar */}
          <div className="space-y-1 pt-1">
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
              <div className="h-full w-1/4 bg-emerald-400" />
              <div className="h-full w-1/4 bg-amber-400" />
              <div className="h-full w-1/4 bg-orange-500 relative ring-2 ring-rose-500" />
              <div className="h-full w-1/4 bg-slate-300" />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-slate-500 pt-0.5">
              <span>Low</span>
              <span>Moderate</span>
              <span className="font-bold text-orange-600">High</span>
              <span>Severe</span>
            </div>
          </div>
        </div>

        {/* 3. Status Metrics Triad */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Rainfall */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Rainfall</span>
              <CloudRain className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 leading-none">
                142.5 <span className="text-[10px] font-normal text-slate-500">mm</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">24h Total</div>
            </div>
            <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] font-bold text-rose-600">
              ▲ Heavy (Alert)
            </div>
          </div>

          {/* Stability */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Stability</span>
              <Mountain className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 leading-none">
                1.08 <span className="text-[10px] font-normal text-slate-500">FoS</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Factor of Safety</div>
            </div>
            <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] font-bold text-amber-600">
              Unstable Slope
            </div>
          </div>

          {/* Road Access */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Road Access</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-rose-600 leading-none truncate">
                Restricted
              </div>
              <div className="text-[10px] text-slate-500 mt-1">1 Lane Closed</div>
            </div>
            <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] font-bold text-rose-600">
              Km 4 Blocked
            </div>
          </div>
        </div>

        {/* 4. Risk Map Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Live Terrain Risk Map
            </span>
            <Link
              href="/map"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>Full Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white h-48 shadow-sm">
            {/* Topographic Map Lines */}
            <svg
              className="absolute inset-0 w-full h-full opacity-40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M-10,30 Q80,10 180,50 T380,40" fill="none" stroke="#64748b" strokeWidth="1" />
              <path d="M-10,70 Q100,50 220,90 T420,80" fill="none" stroke="#64748b" strokeWidth="1" />
              <path d="M-10,110 Q120,90 240,130 T440,120" fill="none" stroke="#64748b" strokeWidth="1" />
              <path d="M-10,150 Q140,130 260,170 T460,160" fill="none" stroke="#64748b" strokeWidth="1" />
            </svg>

            {/* Red Hazard Area */}
            <div
              className="absolute top-6 left-16 w-36 h-28 bg-rose-500/20 border border-rose-500/60"
              style={{ clipPath: "polygon(30% 0%, 90% 20%, 100% 70%, 60% 100%, 0% 80%, 10% 20%)" }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              </div>
            </div>

            {/* Blue Location Dot */}
            <div className="absolute bottom-6 left-10">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow" />
            </div>

            {/* Green Safe Route Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 50,150 Q 140,110 200,60 T 300,40"
                fill="none"
                stroke="#16a34a"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>

            {/* Destination Shelter */}
            <div className="absolute top-6 right-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-800 shadow-sm">
              <span>🏥 Tawang Shelter</span>
            </div>
          </div>
        </div>

        {/* 5. Quick Actions: Safe Route & Nearest Shelter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Safe Route Card */}
          <Link
            href="/routes"
            className="group rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 p-4 transition-all shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Navigation className="w-5 h-5 fill-emerald-600 stroke-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                    Safe Route
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                    1.8 km • 8 min
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tawang Sector → Community Center
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </Link>

          {/* Nearest Shelter Card */}
          <Link
            href="/shelters"
            className="group rounded-2xl bg-white border border-slate-200 hover:border-blue-500 p-4 transition-all shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700">
                    Nearest Shelter
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                    1.8 km
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tawang Community Center (Open)
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </Link>
        </div>

        {/* Demo / Prototype Data Footer */}
        <div className="pt-2 pb-1 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
            DEMO / PROTOTYPE DATA
          </span>
        </div>
      </div>
    </div>
  );
}
