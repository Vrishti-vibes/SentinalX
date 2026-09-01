"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Navigation,
  Crosshair,
} from "lucide-react";

export default function SafeRouteScreen() {
  const [isStarted, setIsStarted] = useState(false);

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Red Diamond Logo + SentinelX */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 flex items-center justify-center">
            {/* Red diamond icon with exclamation mark */}
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
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="text-xs font-bold text-[#991b1b] tracking-wider">
            LIVE
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* 2. Subheader: North Eastern Region & Route Endpoints */}
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
            North Eastern Region
          </h1>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#334155] font-semibold">
            {/* Target icon */}
            <div className="w-4 h-4 flex items-center justify-center text-[#64748b]">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <span>Tawang Sector</span>
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
              {/* Subtle mountain ridge hatch lines */}
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
              {/* Red Landslide / Rockfall Warning Icon in the center */}
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
                {/* Tent Icon */}
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
              <span className="tracking-wide">SAFE ROUTE</span>
            </div>
          </div>
        </div>

        {/* 4. ROUTE STATUS Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
          {/* Header Label */}
          <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            ROUTE STATUS
          </div>

          {/* SAFE ROUTE AVAILABLE with Checkmark */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-base sm:text-[17px] font-extrabold text-[#065f46] tracking-tight">
              SAFE ROUTE AVAILABLE
            </span>
          </div>

          {/* Metrics (Distance & Estimated time) */}
          <div className="space-y-1.5 text-sm pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Distance:</span>
              <span className="font-bold text-slate-900">1.8 km</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Estimated time:</span>
              <span className="font-bold text-slate-900">8 min</span>
            </div>
          </div>

          {/* Red Warning Alert Box (Avoid: Landslide zone on main road) */}
          <div className="p-3 rounded-xl bg-[#fee2e2]/70 border border-[#fca5a5]/80 flex items-center gap-2 text-xs">
            {/* Warning Triangle Icon */}
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#b91c1c] shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="text-[#991b1b] font-medium leading-tight">
              <span className="font-bold">Avoid:</span> Landslide zone on main road.
            </div>
          </div>
        </div>

        {/* 5. Information Notice Box */}
        <div className="rounded-xl bg-[#f1f5f9] border border-slate-200/60 p-3.5 flex items-center gap-2.5 text-xs text-slate-600">
          <div className="w-4 h-4 flex items-center justify-center text-slate-500 shrink-0">
            <Info className="w-4 h-4 stroke-[2]" />
          </div>
          <p className="flex-1 text-center font-medium text-slate-600 leading-snug">
            Avoid unstable slopes and follow the recommended route.
          </p>
        </div>

        {/* 6. Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Start Safe Route Button */}
          <button
            type="button"
            onClick={() => setIsStarted(!isStarted)}
            className="w-full h-12 rounded-xl bg-[#00b074] hover:bg-[#009b66] text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
          >
            <Navigation className="w-4 h-4 fill-white stroke-white" />
            <span>{isStarted ? "GUIDANCE ACTIVE" : "START SAFE ROUTE"}</span>
          </button>

          {/* View Shelter Button */}
          <Link href="/shelters" className="block w-full">
            <button
              type="button"
              className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm tracking-wider flex items-center justify-center transition-all active:scale-[0.99]"
            >
              <span>VIEW SHELTER</span>
            </button>
          </Link>
        </div>

        {/* 7. Demo / Prototype Footer Note */}
        <div className="pt-2 pb-1 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
            DEMO / PROTOTYPE DATA
          </span>
        </div>
      </div>
    </div>
  );
}
