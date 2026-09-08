"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PhoneCall,
  AlertTriangle,
  ShieldAlert,
  Navigation,
  MapPin,
  Compass,
  CheckCircle2,
  ExternalLink,
  Layers,
  Ambulance,
  Flame,
  LifeBuoy,
  Info,
} from "lucide-react";
import { IncidentReportRecord } from "@/types/database";

function EmergencyContent() {
  const searchParams = useSearchParams();
  const reportIdParam = searchParams.get("reportId") || searchParams.get("id");

  const [incident, setIncident] = useState<IncidentReportRecord | null>(null);
  const [isLoadingIncident, setIsLoadingIncident] = useState(false);

  useEffect(() => {
    if (!reportIdParam) return;

    let isMounted = true;
    async function loadIncident() {
      setIsLoadingIncident(true);
      try {
        const res = await fetch(`/api/reports/${reportIdParam}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setIncident(json.data);
          }
        }
      } catch (err) {
        console.warn("Could not load incident context for emergency:", err);
      } finally {
        if (isMounted) setIsLoadingIncident(false);
      }
    }

    loadIncident();
    return () => {
      isMounted = false;
    };
  }, [reportIdParam]);

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── 1. Header ── */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Brand */}
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

        {/* Right: Emergency 24x7 Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider">
            EMERGENCY 24x7
          </span>
        </div>
      </header>

      {/* ── 2. Content Body ── */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Page Title */}
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
            Emergency Assistance &amp; SOS
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            1-tap national helplines, local safety guidelines &amp; evacuation routing
          </p>
        </div>

        {/* ── 3. Incident Context Box (If query param present) ── */}
        {incident && (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/50 p-4 shadow-sm space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>LINKED INCIDENT CONTEXT</span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-700">
                {incident.reportId}
              </span>
            </div>

            <div className="text-sm font-extrabold text-slate-900">
              {incident.hazardType} • {incident.locationName}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-200/80">
              <span className="text-slate-600 font-medium">
                Status: <strong className="text-slate-900">{incident.responseStatus.replace("_", " ")}</strong>
              </span>
              <Link
                href={`/report/track?id=${incident.reportId}`}
                className="font-bold text-[#991b1b] hover:underline flex items-center gap-1"
              >
                <span>TRACK REPORT</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* ── 4 & 5. Emergency Helplines & Safety Guidance (Responsive 2-Column Desktop Grid) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Primary Emergency Services */}
          <div className="lg:col-span-6 space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
              National Emergency Helplines
            </span>

            {/* 112 - ERSS */}
            <a
              href="tel:112"
              className="rounded-2xl bg-gradient-to-r from-[#b91c1c] to-[#991b1b] p-4 text-white shadow-md flex items-center justify-between hover:opacity-95 transition-all active:scale-[0.99] block"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-2xl font-black font-mono tracking-tight leading-none">
                    112
                  </div>
                  <div className="text-xs font-bold text-white/90 mt-1">
                    National Emergency Response (ERSS)
                  </div>
                  <div className="text-[10px] text-white/75 font-medium">
                    Police • Disaster Response • All Emergencies
                  </div>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-white text-[#991b1b] text-xs font-extrabold tracking-wider shrink-0">
                CALL
              </span>
            </a>

            {/* 108 - Medical */}
            <a
              href="tel:108"
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-all active:scale-[0.99] block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#b91c1c] flex items-center justify-center shrink-0">
                  <Ambulance className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="text-lg font-black font-mono text-slate-900 leading-none">
                    108
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    Emergency Medical &amp; Ambulance
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Paramedic response &amp; trauma transport
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold tracking-wider shrink-0">
                CALL
              </span>
            </a>

            {/* 101 - Fire & Mountain Rescue */}
            <a
              href="tel:101"
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-all active:scale-[0.99] block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="text-lg font-black font-mono text-slate-900 leading-none">
                    101
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    Fire &amp; Mountain Rescue Services
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Search &amp; rescue • Road clearing units
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold tracking-wider shrink-0">
                CALL
              </span>
            </a>

            {/* 1070 - SDMA Helpline */}
            <a
              href="tel:1070"
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-all active:scale-[0.99] block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="text-lg font-black font-mono text-slate-900 leading-none">
                    1070
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    State Disaster Management Control (SDMA)
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    District collectorate emergency desks
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold tracking-wider shrink-0">
                CALL
              </span>
            </a>
          </div>

          {/* Right Column: Landslide Safety Guidance & Quick Navigation */}
          <div className="lg:col-span-6 space-y-3.5 flex flex-col justify-between">
            {/* ── 5. Landslide Safety Guidance ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 flex-1">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldAlert className="w-4 h-4 text-[#b91c1c]" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Landslide Safety Instructions
                </h2>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    <strong className="text-slate-900">Evacuate Immediately:</strong> If you hear rumbling sounds, see falling debris or unusual water runoff on slopes.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <strong className="text-slate-900">Stay Off Embankments:</strong> Avoid steep road cuts, bridge abutments, and riverbanks during intense rainfall.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    <strong className="text-slate-900">Follow Designated Corridors:</strong> Use SentinalX Safe Routes to navigate towards certified high-ground relief centers.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <span>
                    <strong className="text-slate-900">Report Blockages:</strong> Inform disaster response units via the 1-tap Report Hazard tool to update real-time road networks.
                  </span>
                </div>
              </div>
            </div>

            {/* ── 6. Emergency Navigation Actions ── */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link href="/routes" className="block">
                <button
                  type="button"
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Safe Evacuation</span>
                </button>
              </Link>
              <Link href="/shelters" className="block">
                <button
                  type="button"
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Nearest Shelters</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 6. Quick Evacuation Actions ── */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
            Evacuation &amp; Safety Hubs
          </span>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/routes"
              className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all flex flex-col justify-between block"
            >
              <Navigation className="w-4 h-4 text-emerald-600 mb-1" />
              <div>
                <div className="text-xs font-bold text-slate-900">Safe Route</div>
                <div className="text-[10px] text-slate-500 font-medium">Bypass hazard zones</div>
              </div>
            </Link>

            <Link
              href="/shelters"
              className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all flex flex-col justify-between block"
            >
              <MapPin className="w-4 h-4 text-blue-600 mb-1" />
              <div>
                <div className="text-xs font-bold text-slate-900">Shelters</div>
                <div className="text-[10px] text-slate-500 font-medium">Nearby relief camps</div>
              </div>
            </Link>
          </div>

          <Link
            href="/map"
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all block text-center leading-[44px]"
          >
            <Layers className="w-4 h-4 inline-block -mt-0.5" />
            <span>OPEN LIVE RISK MAP</span>
          </Link>
        </div>

        {/* ── 7. Footer Disclaimer ── */}
        <div className="pt-2 pb-1 text-center">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            REAL TELEPHONE DIAL LINKS ONLY • NO FAKE AUTOMATIC DISPATCH
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmergencyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
          Loading emergency assistance...
        </div>
      }
    >
      <EmergencyContent />
    </Suspense>
  );
}


