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
  RotateCw,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  Droplets,
  Shield,
  Clock,
  Radio,
} from "lucide-react";
import { useRiskIntelligence } from "@/lib/hooks/use-risk-intelligence";
import { OfflineStatus } from "@/components/OfflineStatus";
import { DataFreshness } from "@/components/DataFreshness";
import { DataSources } from "@/components/DataSources";
import { SentinalXNerMlModel } from "@/lib/ml/model";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";
import LeafletMapDynamic from "@/components/map/LeafletMapDynamic";
import { useDeviceMode } from "@/components/layout/DeviceModeContext";

export default function MonitorHomeScreen() {
  const { isMobile } = useDeviceMode();
  const {
    selectedLocation,
    setSelectedLocation,
    riskResult,
    weatherData,
    isLoading,
    isRefreshing,
    isCached,
    lastCalculatedAt,
    error,
    refresh,
    lastUpdatedText,
  } = useRiskIntelligence("tawang");

  const [showFactorBreakdown, setShowFactorBreakdown] = useState(false);

  // Derive score and level from API result
  const riskScore = riskResult ? riskResult.score : 43.2;
  const riskLevel = riskResult ? riskResult.level : "MODERATE";
  const locationName = riskResult?.location?.name ?? (selectedLocation === "gangtok" ? "Gangtok / Sevoke Corridor" : "Tawang Sector");
  const inputCoveragePercent = riskResult ? Math.round(riskResult.inputCoverageRatio * 100) : 83;

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* â”€â”€ 1. SentinalX Header Bar â”€â”€ */}
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

        {/* Right: OfflineStatus pill + Alerts Bell */}
        <div className="flex items-center gap-2.5">
          <OfflineStatus />
          <Link
            href="/alerts"
            aria-label="View early warning alerts feed"
            className="relative w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[8px] font-bold flex items-center justify-center border-2 border-white">
              3
            </span>
          </Link>
        </div>
      </header>

      {/* ── 2. Scrollable Body ── */}
      <div className="p-4 sm:p-5 flex flex-col space-y-4">
        {/* Region Subheader & Location Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
              North Eastern Region
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Multi-Source Landslide Risk Intelligence &amp; Early Warning
            </p>
          </div>

          {/* Location Selector Tabs & Refresh Action */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedLocation("tawang")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                selectedLocation === "tawang"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tawang
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
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="Refresh risk intelligence data"
              title="Refresh intelligence"
              className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center transition-all disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── 3 & 4. Primary Threat Overview & Status Metrics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 order-1">
          {/* â”€â”€ 3. Dynamic Overall Landslide Risk Threat Card â”€â”€ */}
          <div className="lg:col-span-7 flex flex-col">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center space-y-2 h-full flex flex-col justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
                <div className="text-xs font-bold text-rose-900">
                  Risk intelligence temporarily unavailable
                </div>
                <p className="text-[11px] text-rose-700 max-w-xs mx-auto">{error}</p>
                <button
                  onClick={refresh}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold self-center"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div
                className={`rounded-2xl border bg-gradient-to-br from-white p-4 sm:p-5 shadow-sm space-y-3 transition-all h-full flex flex-col justify-between ${
                  riskLevel === "CRITICAL"
                    ? "border-rose-400 via-rose-50/40 to-rose-100/50"
                    : riskLevel === "HIGH"
                    ? "border-rose-300 via-rose-50/30 to-rose-100/40"
                    : riskLevel === "MODERATE"
                    ? "border-amber-200 via-amber-50/30 to-amber-100/30"
                    : "border-emerald-200 via-emerald-50/30 to-emerald-100/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#991b1b] flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          riskLevel === "CRITICAL" || riskLevel === "HIGH"
                            ? "bg-rose-600 animate-ping"
                            : "bg-amber-500"
                        }`}
                      />
                      <span>CURRENT LANDSLIDE THREAT</span>
                    </span>
                    <DataFreshness
                      timestamp={lastCalculatedAt}
                      isRefreshing={isRefreshing}
                      isCached={isCached}
                    />
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
                      <span>{riskLevel} RISK</span>
                      <span className="text-sm sm:text-base font-bold font-mono text-[#991b1b]">
                        ({riskScore.toFixed(1)} / 100)
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#991b1b] shrink-0" />
                      <span>{locationName}</span>
                    </p>
                  </div>
                </div>

                {/* Dynamic Risk Gauge Bar */}
                <div className="space-y-1 pt-1">
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      className={`h-full w-1/4 transition-all ${
                        riskLevel === "SAFE" ? "bg-emerald-500 ring-2 ring-emerald-600" : "bg-emerald-300/80"
                      }`}
                    />
                    <div
                      className={`h-full w-1/4 transition-all ${
                        riskLevel === "MODERATE" ? "bg-amber-500 ring-2 ring-amber-600" : "bg-amber-300/80"
                      }`}
                    />
                    <div
                      className={`h-full w-1/4 transition-all ${
                        riskLevel === "HIGH" ? "bg-orange-500 ring-2 ring-orange-600" : "bg-orange-300/80"
                      }`}
                    />
                    <div
                      className={`h-full w-1/4 transition-all ${
                        riskLevel === "CRITICAL" ? "bg-rose-600 ring-2 ring-rose-700" : "bg-rose-300/80"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500 pt-0.5">
                    <span className={riskLevel === "SAFE" ? "font-bold text-emerald-700" : ""}>Safe</span>
                    <span className={riskLevel === "MODERATE" ? "font-bold text-amber-700" : ""}>Moderate</span>
                    <span className={riskLevel === "HIGH" ? "font-bold text-orange-700" : ""}>High</span>
                    <span className={riskLevel === "CRITICAL" ? "font-bold text-rose-700" : ""}>Critical</span>
                  </div>
                </div>

                {/* Primary Threat & Recommendation Box */}
                {riskResult && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-800">
                      <Shield className="w-3.5 h-3.5 text-[#991b1b] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold uppercase text-[10px] text-slate-500 block">
                          PRIMARY THREAT
                        </span>
                        <span className="font-bold">{riskResult.primaryThreat}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/70 text-[11px] text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900">Recommendation: </span>
                      {riskResult.recommendation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 4. Status Metrics Triad ── */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
            <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3 lg:grid-cols-1"} gap-2.5 flex-1`}>
              {/* Metric 1: Rainfall */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Rainfall (Open-Meteo)</span>
                  <CloudRain className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex lg:items-baseline lg:justify-between">
                  <div className="text-base sm:text-lg font-bold font-mono text-slate-900 leading-none">
                    {weatherData ? weatherData.recent.rainfall24hMm.toFixed(1) : "4.3"}{" "}
                    <span className="text-[10px] font-normal text-slate-500">mm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 lg:mt-0">24h Total</div>
                </div>
                <div
                  className={`mt-2 pt-1 border-t border-slate-100 text-[10px] font-bold ${
                    (weatherData?.recent.rainfall24hMm ?? 4.3) >= 50
                      ? "text-rose-600"
                      : (weatherData?.recent.rainfall24hMm ?? 4.3) >= 15
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {(weatherData?.recent.rainfall24hMm ?? 4.3) >= 50
                    ? "▲ Heavy Rain"
                    : (weatherData?.recent.rainfall24hMm ?? 4.3) >= 15
                    ? "▲ Moderate Rain"
                    : "● Nominal Levels"}
                </div>
              </div>

              {/* Metric 2: Soil Moisture */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Soil Saturation</span>
                  <Droplets className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex lg:items-baseline lg:justify-between">
                  <div className="text-base sm:text-lg font-bold font-mono text-slate-900 leading-none">
                    {weatherData?.soil?.moisturePercent != null ? weatherData.soil.moisturePercent.toFixed(0) : "84"}{" "}
                    <span className="text-[10px] font-normal text-slate-500">%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 lg:mt-0">Weather Model Layer</div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] font-bold text-amber-600">
                  {(weatherData?.soil.moisturePercent ?? 84) > 80 ? "▲ Elevated Saturation" : "● Nominal Index"}
                </div>
              </div>

              {/* Metric 3: Geotechnical In-Situ State */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pore Pressure &amp; Tilt</span>
                  <Mountain className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex lg:items-baseline lg:justify-between">
                  <div className="text-base sm:text-lg font-bold font-mono text-slate-900 leading-none">
                    {riskResult?.factors.porePressure.raw ? `${riskResult.factors.porePressure.raw}` : "42.1"}{" "}
                    <span className="text-[10px] font-normal text-slate-500">kPa</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 lg:mt-0">Hydrostatic Load</div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] font-bold text-amber-600">
                  Demo Telemetry
                </div>
              </div>
            </div>

            {/* Subtle Live Weather Data Source Tag */}
            <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 font-medium pt-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    weatherData && !weatherData.isFallback
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-amber-500"
                  }`}
                />
                <span className="font-semibold text-slate-600">
                  {weatherData && !weatherData.isFallback
                    ? "LIVE WEATHER MODEL (Open-Meteo)"
                    : "WEATHER MODEL FALLBACK"}
                </span>
              </div>
              <span className="text-slate-400 font-mono">{locationName}</span>
            </div>
          </div>
        </div>

        {/* ── 5. Multi-Source Risk Intelligence Breakdown (Expandable Accordion) ── */}
        <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${isMobile ? "order-4" : "order-2"}`}>
          <button
            type="button"
            onClick={() => setShowFactorBreakdown(!showFactorBreakdown)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#991b1b]" />
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 block">
                  Risk Intelligence Breakdown
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {inputCoveragePercent}% input streams configured &amp; active
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                {showFactorBreakdown ? "Hide" : "Details"}
              </span>
              {showFactorBreakdown ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {showFactorBreakdown && riskResult && (
            <div className="p-4 pt-0 border-t border-slate-100 space-y-3.5 animate-fadeIn">
              {/* Coverage Note */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-600 leading-relaxed">
                <strong>Input Coverage ({inputCoveragePercent}%):</strong> Coverage indicates how many configured
                environmental and geotechnical streams are currently active. Missing inputs are dynamically rescaled.
              </div>

              {/* 6 Factors Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Linear Weighted Factors (100% Total)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Factor 1: Rainfall (25%) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Rainfall (25% Weight)</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        {riskResult.factors.rainfall.status}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono text-[11px]">
                      <span>Score: {riskResult.factors.rainfall.score}/100</span>
                      <span className="font-bold text-slate-700">
                        Contrib: +{riskResult.factors.rainfall.contribution}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {riskResult.factors.rainfall.source}
                    </p>
                  </div>

                  {/* Factor 2: Soil Moisture (20%) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Soil Moisture (20% Weight)</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        {riskResult.factors.soilMoisture.status}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono text-[11px]">
                      <span>Score: {riskResult.factors.soilMoisture.score}/100</span>
                      <span className="font-bold text-slate-700">
                        Contrib: +{riskResult.factors.soilMoisture.contribution}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {riskResult.factors.soilMoisture.source}
                    </p>
                  </div>

                  {/* Factor 3: Pore Pressure & Tilt (20%) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Pore Pressure (20% Weight)</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                        {riskResult.factors.porePressure.status}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono text-[11px]">
                      <span>Score: {riskResult.factors.porePressure.score}/100</span>
                      <span className="font-bold text-slate-700">
                        Contrib: +{riskResult.factors.porePressure.contribution}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {riskResult.factors.porePressure.source}
                    </p>
                  </div>

                  {/* Factor 4: Slope Stability (15%) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Slope FoS (15% Weight)</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                        {riskResult.factors.slopeStability.status}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono text-[11px]">
                      <span>Score: {riskResult.factors.slopeStability.score}/100</span>
                      <span className="font-bold text-slate-700">
                        Contrib: +{riskResult.factors.slopeStability.contribution}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {riskResult.factors.slopeStability.source}
                    </p>
                  </div>

                  {/* Factor 5: Ground Motion (10%) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Ground Motion (10% Weight)</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        {riskResult.factors.groundMotion.status}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono text-[11px]">
                      <span>Score: {riskResult.factors.groundMotion.score}/100</span>
                      <span className="font-bold text-slate-700">
                        Contrib: +{riskResult.factors.groundMotion.contribution}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {riskResult.factors.groundMotion.source}
                    </p>
                  </div>

                  {/* Factor 6: Field Reports (10%) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Field Reports (10% Weight)</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                        {riskResult.factors.fieldReports.status}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono text-[11px]">
                      <span>Score: {riskResult.factors.fieldReports.score}/100</span>
                      <span className="font-bold text-slate-700">
                        Contrib: +{riskResult.factors.fieldReports.contribution}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {riskResult.factors.fieldReports.source}
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Health Stream Grid */}
              {riskResult.sourceHealth && riskResult.sourceHealth.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Source Telemetry Health
                  </span>
                  <div className="space-y-1">
                    {riskResult.sourceHealth.map((sh, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sh.status === "LIVE"
                                ? "bg-emerald-500 animate-pulse"
                                : sh.status === "DEMO"
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="font-bold text-slate-800">{sh.name}</span>
                          <span className="text-slate-400 font-mono">({sh.source})</span>
                        </div>
                        <span
                          className={`font-mono font-bold px-1.5 py-0.2 rounded text-[9px] ${
                            sh.status === "LIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : sh.status === "DEMO"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {sh.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanations (Why this risk?) */}
              {riskResult.explanations && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Why This Risk? (Key Drivers)
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {riskResult.explanations.map((exp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#991b1b] font-bold">â€¢</span>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* â”€â”€ Auxiliary ML Model Signal â”€â”€ */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Auxiliary ML Intelligence
                  </span>
                  <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    LIMITED_DATA ({SentinalXNerMlModel.DATASET_VERSION})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">Model: {SentinalXNerMlModel.MODEL_VERSION}</span>
                    <span className="font-mono text-slate-500">Dataset: {SentinalXNerMlModel.DATASET_VERSION}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Trained on real historical landslide records from GSI Bhusanket, ISRO Landslide Atlas, and NASA GLC across the 8 North Eastern Region states.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-0.5">
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <span className="text-slate-500 block">Top Driver 1:</span>
                      <span className="font-bold text-slate-800">Rainfall 24h (32%)</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <span className="text-slate-500 block">Top Driver 2:</span>
                      <span className="font-bold text-slate-800">Rainfall 72h (26%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 6. Live Terrain Risk Map (Real OpenStreetMap Tiles) ── */}
        <div className={`space-y-2 ${isMobile ? "order-2" : "order-3"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Geographic Landslide Risk Map</span>
            </span>
            <Link
              href="/map"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>Full Command GIS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-700">
                  OpenStreetMap • {locationName}
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">
                Interactive Tiles &amp; Risk Polygons
              </span>
            </div>

            <div className="relative h-64 sm:h-72 lg:h-80 w-full bg-[#edf2f7] overflow-hidden">
              <LeafletMapDynamic
                selectedLocation={selectedLocation as "tawang" | "gangtok"}
                onSelectFeature={() => {}}
                riskResult={riskResult}
              />
            </div>
          </div>
        </div>

        {/* ── 7. Quick Actions: Safe Route & Nearest Shelter ── */}
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-3 ${isMobile ? "order-3" : "order-4"}`}>
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
                    1.8 km â€¢ 8 min
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedLocation === "gangtok" ? "Sevoke Corridor â†’ High Ground" : "Tawang Sector â†’ Community Center"}
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
                  {selectedLocation === "gangtok" ? "Teesta Valley Relief Center (Open)" : "Tawang Community Center (Open)"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </Link>
        </div>

        {/* ── 8. Public Data Sources & Attribution ── */}
        <div className="order-5">
          <DataSources />
        </div>

        {/* ── 9. Disclaimer Footer ── */}
        <div className="pt-2 pb-1 text-center order-6">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
            SENTINALX EARLY WARNING SYSTEM • MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION (MDONER)
          </span>
        </div>
      </div>
    </div>
  );
}
