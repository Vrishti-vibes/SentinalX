"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, AlertTriangle, Radio, Wifi, WifiOff } from "lucide-react";
import { StatusDot } from "@/components/ui/StatusDot";
import { Badge } from "@/components/ui/Badge";

export function Navbar() {
  // Demo online state indicator
  const isOnline = true;

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-850 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Mobile Brand / Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-white text-base">SentinalX</span>
        </div>

        {/* Live Network & Sensor Telemetry Feed Indicator */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <StatusDot status="ONLINE" />
          <span className="text-slate-300 font-medium">NER Sensor Grid</span>
          <span className="text-slate-400">•</span>
          <span className="text-emerald-400 font-mono text-[11px]">18 Stations Active</span>
        </div>
      </div>

      {/* Right Controls: Threat Ticker + Emergency Quick Link */}
      <div className="flex items-center gap-3">
        {/* Active Threat Warning Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-600/50 text-xs text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Red Alert: NH-10 Sikkim (Km 29)</span>
        </div>

        {/* Connectivity Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Offline Mode</span>
            </>
          )}
        </div>

        {/* SOS Action Button */}
        <Link
          href="/emergency"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-rose-950/40 border border-rose-500/40"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>SOS</span>
        </Link>
      </div>
    </header>
  );
}
