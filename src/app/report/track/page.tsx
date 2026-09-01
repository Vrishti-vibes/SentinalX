"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  AlertTriangle,
  RotateCw,
  Phone,
  Timer,
  ExternalLink,
} from "lucide-react";

export default function TrackReportScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── Header ── */}
      <header className="h-14 bg-white border-b border-rose-100 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* SentinalX logo + wordmark */}
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

        {/* LIVE pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100/70 border border-rose-200">
          <span className="w-2 h-2 rounded-full bg-[#b91c1c]" />
          <span className="text-xs font-bold text-[#991b1b] tracking-wider">LIVE</span>
        </div>
      </header>

      {/* ── Scrollable Content ── */}
      <div className="p-4 sm:p-5 space-y-4">

        {/* Page title */}
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
            TRACK REPORT
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time incident tracking &amp; response
          </p>
        </div>

        {/* Report ID card */}
        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              REPORT ID
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#6ee7b7] text-[#064e3b] text-xs font-extrabold flex items-center gap-1">
              <span>✓</span>
              <span>VERIFIED</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-[#0f172a] tracking-tight">
            SX-LS-2048
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Tawang Sector</span>
          </div>
        </div>

        {/* Red alert banner */}
        <div className="rounded-2xl bg-[#b91c1c] p-4 text-white shadow-md flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-extrabold uppercase tracking-wider">
              AUTHORITIES NOTIFIED
            </div>
            <div className="text-xs font-bold text-white/95 leading-snug">
              STAY AWAY FROM THE AREA. An active landslide zone has been verified.
            </div>
          </div>
        </div>

        {/* Response Timeline */}
        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm space-y-4">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            RESPONSE TIMELINE
          </div>

          <div className="relative pl-7 space-y-5">
            {/* vertical line */}
            <div className="absolute left-2.5 top-2 bottom-3 w-[2px] bg-slate-200" />

            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                <span className="text-[10px] font-bold">✓</span>
              </div>
              <div className="text-xs font-bold text-slate-900">Report Submitted</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">08:42 AM</div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                <span className="text-[10px] font-bold">✓</span>
              </div>
              <div className="text-xs font-bold text-slate-900">Verified</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">08:45 AM</div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                <span className="text-[10px] font-bold">✓</span>
              </div>
              <div className="text-xs font-bold text-slate-900">Authorities Notified</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">08:46 AM</div>
            </div>

            {/* Step 4 — In Progress */}
            <div className="relative">
              <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-white border-2 border-[#b91c1c] flex items-center justify-center shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#b91c1c] animate-ping absolute" />
                <span className="w-2 h-2 rounded-full bg-[#b91c1c]" />
              </div>
              <div className="text-xs font-bold text-[#b91c1c]">Response Team Assigned</div>
              <div className="text-[10px] text-[#b91c1c] font-semibold mt-0.5">In Progress...</div>
            </div>
          </div>
        </div>

        {/* Estimated Response (dark card) */}
        <div className="rounded-2xl bg-[#181d24] p-4 text-white shadow-md flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              ESTIMATED RESPONSE
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              10–20 min
            </div>
          </div>
        </div>

        {/* Incident Location Map card */}
        <div className="rounded-2xl border border-rose-100 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Incident Location</span>
            <Link href="/routes" className="text-slate-500 hover:text-slate-800">
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* SVG map canvas */}
          <div className="relative h-52 w-full bg-[#eef2f7] overflow-hidden">
            {/* Contour lines */}
            <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
              <path d="M-20,25  Q90,5  190,45 T390,35"  fill="none" stroke="#64748b" strokeWidth="1"/>
              <path d="M-20,60  Q110,35 230,75 T430,65"  fill="none" stroke="#64748b" strokeWidth="1"/>
              <path d="M-20,100 Q130,75 250,115 T450,105" fill="none" stroke="#64748b" strokeWidth="1"/>
              <path d="M-20,140 Q150,115 270,155 T470,145" fill="none" stroke="#64748b" strokeWidth="1"/>
              <path d="M-20,180 Q170,155 290,195 T490,185" fill="none" stroke="#64748b" strokeWidth="1"/>
            </svg>

            {/* Red hazard polygon */}
            <div
              className="absolute top-5 left-10 w-44 h-32 bg-[#fca5a5]/30 border-2 border-[#ef4444]/55"
              style={{ clipPath: "polygon(45% 0%, 90% 12%, 100% 65%, 85% 95%, 28% 100%, 0% 70%, 15% 25%)" }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#b91c1c]">
                  <path d="M12 3L2 21H22L12 3Z" />
                  <path d="M12 9V14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="17" r="1.2" fill="#fff"/>
                </svg>
              </div>
            </div>

            {/* Green route line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 165,220 Q 220,160 238,108 Q 250,75 265,50"
                fill="none"
                stroke="#16a34a"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>

            {/* Blue GPS dot */}
            <div className="absolute bottom-10 left-[88px]">
              <div className="w-3.5 h-3.5 rounded-full bg-[#2563eb] border-2 border-white shadow" />
            </div>

            {/* Shelter pin */}
            <div className="absolute top-8 right-14">
              <div className="w-6 h-6 rounded-full bg-[#16a34a] border-2 border-white shadow flex items-center justify-center text-[9px]">
                ⛺
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full h-11 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "REFRESHING..." : "Refresh Status"}</span>
          </button>

          <a
            href="tel:1070"
            className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
          >
            <Phone className="w-4 h-4 text-[#b91c1c]" />
            <span>Call Emergency</span>
          </a>
        </div>

        {/* Footer note */}
        <div className="pt-2 pb-1 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            DEMO / PROTOTYPE DATA
          </span>
        </div>
      </div>
    </div>
  );
}
