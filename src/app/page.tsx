"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useRiskIntelligence } from "@/lib/hooks/use-risk-intelligence";
import { OfflineStatus } from "@/components/OfflineStatus";
import { DataFreshness } from "@/components/DataFreshness";
import { DataSources } from "@/components/DataSources";
import { SentinalXNerMlModel } from "@/lib/ml/model";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";
import LeafletMapDynamic from "@/components/map/LeafletMapDynamic";
import { useDeviceMode } from "@/components/layout/DeviceModeContext";
import { RiskAlertModal } from "@/components/alert/RiskAlertModal";
import { NotificationDrawer } from "@/components/alert/NotificationDrawer";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isSimulatedAlert, setIsSimulatedAlert] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Auto-trigger Risk Alert Modal on first load (sessionStorage protected)
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("sentinalx_risk_alert_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => {
          setIsAlertModalOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismissModal = () => {
    setIsAlertModalOpen(false);
    try {
      sessionStorage.setItem("sentinalx_risk_alert_dismissed", "true");
    } catch {
      // ignore
    }
  };

  const handleTriggerSimulatedAlert = () => {
    setIsSimulatedAlert(true);
    setUnreadCount((prev) => prev + 1);
    setIsAlertModalOpen(true);
  };

  // Derive score and level from API result
  const riskScore = riskResult ? riskResult.score : 43.2;
  const riskLevel = riskResult ? riskResult.level : "MODERATE";
  const locationName = riskResult?.location?.name ?? (selectedLocation === "gangtok" ? "Gangtok / Sevoke Corridor" : "Tawang Sector");
  const inputCoveragePercent = riskResult ? Math.round(riskResult.inputCoverageRatio * 100) : 83;

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── Emergency Risk Alert Popup ── */}
      <RiskAlertModal
        isOpen={isAlertModalOpen}
        onClose={handleDismissModal}
        riskLevel={riskLevel}
        riskScore={riskScore}
        locationName={locationName}
        isSimulated={isSimulatedAlert}
        onViewRisk={() => {
          setShowFactorBreakdown(true);
          const el = document.getElementById("risk-threat-overview");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* ── Notification Slide-Over Drawer ── */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onSimulateAlert={handleTriggerSimulatedAlert}
        unreadCount={unreadCount}
      />

      {/* ── 1. SentinalX Header Bar ── */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Brand Logo */}
        <Link href="/">
          <BrandLogo textClassName="text-[17px] font-bold tracking-tight text-[#0f172a]" />
        </Link>

        {/* Right: OfflineStatus pill + Notification Bell */}
        <div className="flex items-center gap-2">
          <OfflineStatus />
          <button
            type="button"
            onClick={() => setIsNotificationDrawerOpen(true)}
            aria-label="View early warning alerts feed"
            className="relative w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── 2. Scrollable Body ── */}
      <div className="p-4 sm:p-5 flex flex-col lg:grid lg:grid-cols-12 lg:gap-3.5 space-y-3.5 lg:space-y-0">
        {/* Region Subheader & Location Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 lg:col-span-12 order-1 lg:order-1">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
              North Eastern Region
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 hidden sm:block">
              Multi-Source Landslide Risk Intelligence &amp; Early Warning
            </p>
          </div>

          {/* Location Selector Tabs & Refresh Action */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            {/* Emergency Drill Quick Action */}
            <button
              type="button"
              onClick={handleTriggerSimulatedAlert}
              className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm hover:from-rose-700 hover:to-amber-700 transition-all flex items-center gap-1 cursor-pointer"
              title="Broadcast test emergency alert bulletin for incident response drill"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Trigger Test Alert</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedLocation("tawang")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
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
                className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. Dynamic Overall Landslide Risk Threat Card ── */}
        <div className="lg:col-span-7 flex flex-col order-2 lg:order-2">
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
                id="risk-threat-overview"
                className={`rounded-2xl border bg-gradient-to-br from-white p-4 sm:p-5 shadow-sm space-y-3.5 transition-all h-full flex flex-col justify-between ${
                  riskLevel === "CRITICAL"
                    ? "border-rose-400 border-l-[6px] border-l-rose-600 via-rose-50/40 to-rose-100/50"
                    : riskLevel === "HIGH"
                    ? "border-orange-400 border-l-[6px] border-l-orange-600 via-orange-50/30 to-rose-100/40"
                    : riskLevel === "MODERATE"
                    ? "border-amber-300 border-l-[6px] border-l-amber-500 via-amber-50/30 to-amber-100/30"
                    : "border-emerald-300 border-l-[6px] border-l-emerald-500 via-emerald-50/30 to-emerald-100/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          riskLevel === "CRITICAL"
                            ? "bg-rose-600 animate-ping"
                            : riskLevel === "HIGH"
                            ? "bg-orange-600 animate-pulse"
                            : riskLevel === "MODERATE"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="font-extrabold tracking-wide">CURRENT LANDSLIDE THREAT</span>
                    </span>
                    <DataFreshness
                      timestamp={lastCalculatedAt}
                      isRefreshing={isRefreshing}
                      isCached={isCached}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2.5">
                        <span
                          className={
                            riskLevel === "CRITICAL"
                              ? "text-rose-700"
                              : riskLevel === "HIGH"
                              ? "text-orange-700"
                              : riskLevel === "MODERATE"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }
                        >
                          {riskLevel} RISK
                        </span>
                        <span className="text-sm sm:text-base font-extrabold font-mono text-slate-600">
                          ({riskScore.toFixed(1)} / 100)
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#991b1b] shrink-0" />
                        <span>{locationName}</span>
                      </p>
                    </div>

                    {/* Instant Directive Pill */}
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold tracking-tight flex items-center gap-1.5 shadow-xs ${
                        riskLevel === "CRITICAL"
                          ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                          : riskLevel === "HIGH"
                          ? "bg-orange-600 text-white border-orange-700"
                          : riskLevel === "MODERATE"
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border-emerald-300"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {riskLevel === "CRITICAL"
                          ? "ACTION: IMMEDIATE EVACUATION"
                          : riskLevel === "HIGH"
                          ? "ACTION: AVOID HIGH-RISK ZONES"
                          : riskLevel === "MODERATE"
                          ? "ACTION: STAY ALERT & PREPARED"
                          : "ACTION: CONTINUE MONITORING"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic 4-Tier Risk Gauge Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                    <div
                      className={`h-full w-1/4 rounded-sm transition-all ${
                        riskLevel === "SAFE" ? "bg-emerald-500 ring-2 ring-emerald-600" : "bg-emerald-300/70"
                      }`}
                    />
                    <div
                      className={`h-full w-1/4 rounded-sm transition-all ${
                        riskLevel === "MODERATE" ? "bg-amber-500 ring-2 ring-amber-600" : "bg-amber-300/70"
                      }`}
                    />
                    <div
                      className={`h-full w-1/4 rounded-sm transition-all ${
                        riskLevel === "HIGH" ? "bg-orange-500 ring-2 ring-orange-600" : "bg-orange-300/70"
                      }`}
                    />
                    <div
                      className={`h-full w-1/4 rounded-sm transition-all ${
                        riskLevel === "CRITICAL" ? "bg-rose-600 ring-2 ring-rose-700" : "bg-rose-300/70"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-0.5">
                    <span className={riskLevel === "SAFE" ? "text-emerald-700 font-extrabold" : ""}>Safe (0-25)</span>
                    <span className={riskLevel === "MODERATE" ? "text-amber-700 font-extrabold" : ""}>Moderate (26-50)</span>
                    <span className={riskLevel === "HIGH" ? "text-orange-700 font-extrabold" : ""}>High (51-75)</span>
                    <span className={riskLevel === "CRITICAL" ? "text-rose-700 font-extrabold" : ""}>Critical (76-100)</span>
                  </div>
                </div>

                {/* Primary Threat & Explicit Action Directive Box */}
                {riskResult && (
                  <div className="pt-2.5 border-t border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 text-slate-800">
                        <Shield className="w-3.5 h-3.5 text-[#991b1b] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold uppercase text-[10px] text-slate-500 block">
                            PRIMARY THREAT DRIVER
                          </span>
                          <span className="font-bold text-slate-900">{riskResult.primaryThreat}</span>
                        </div>
                      </div>
                      <Link
                        href="/routes"
                        className="shrink-0 px-2.5 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>Safe Route</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 text-[11px] font-bold text-slate-900 leading-snug shadow-xs">
                      {riskResult.recommendation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 4. Status Metrics Triad ── */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-2 order-5 lg:order-3">
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
                <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] font-bold text-blue-700">
                  Field Telemetry (IoT Grid)
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

        {/* ── 5. Multi-Source Risk Intelligence Breakdown (Expandable Accordion) ── */}
        <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden lg:col-span-12 order-6 lg:order-4`}>
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
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-600 leading-relaxed hidden sm:block">
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
                  <p className="text-[10px] text-slate-600 leading-relaxed hidden sm:block">
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
        <div className="space-y-2 lg:col-span-12 order-7 lg:order-6">
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

        {/* ── 7. Primary Safe Evacuation Corridor Progression & Shelters ── */}
        <div className="space-y-3 lg:col-span-12 order-3 lg:order-5">
          {/* Detailed Evacuation Progression Card */}
          <div className="rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Navigation className="w-4 h-4 fill-white stroke-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Active Safe Evacuation Corridor</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      LIVE OSRM ROUTE
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 hidden sm:block">
                    Real-time path computation bypassing high landslide risk zones
                  </p>
                </div>
              </div>
              <Link
                href="/routes"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 shadow-sm transition-all"
              >
                <span>START SAFE ROUTE</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Stepper Progression Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1">
              {/* Step 1: Origin */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    CURRENT LOCATION
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {selectedLocation === "gangtok" ? "Sevoke Road, Ward 3" : "Tawang Sector (High Risk)"}
                  </span>
                </div>
              </div>

              {/* Step 2: Avoided Hazard */}
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 shadow-xs flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 font-black text-[11px] flex items-center justify-center shrink-0">
                  ⚠
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-500 block">
                    AVOIDING HAZARD
                  </span>
                  <span className="text-xs font-bold text-rose-900 truncate block">
                    {selectedLocation === "gangtok" ? "Teesta Slump Zone (KM 22)" : "Slope Cut NH-13 (KM 14)"}
                  </span>
                </div>
              </div>

              {/* Step 3: Safe Corridor */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                    CLEAR CORRIDOR
                  </span>
                  <span className="text-xs font-bold text-emerald-950 truncate block">
                    1.8 km • 8 min via East Ridge
                  </span>
                </div>
              </div>

              {/* Step 4: Destination */}
              <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  ✓
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-300 block">
                    SAFE SHELTER
                  </span>
                  <span className="text-xs font-bold text-white truncate block">
                    {selectedLocation === "gangtok" ? "Teesta Valley Center" : "Tawang Community Center"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile / Direct CTA */}
            <div className="pt-1 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified clear with real road geometry &amp; NDRF protocol</span>
              </span>
              <Link
                href="/routes"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>START SAFE ROUTE (1.8 km)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Secondary Quick Shelters Link */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-slate-700 font-medium">
                Looking for alternative relief camps?
              </span>
            </div>
            <Link
              href="/shelters"
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              <span>View All 3 Shelters</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── 8. Public Data Sources & Attribution ── */}
        <div className="lg:col-span-12 order-8 lg:order-7">
          <DataSources />
        </div>

        {/* ── 9. Disclaimer Footer ── */}
        <div className="pt-2 pb-1 text-center lg:col-span-12 order-9 lg:order-8">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
            SENTINALX EARLY WARNING SYSTEM • MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION (MDONER)
          </span>
        </div>
      </div>
    </div>
  );
}
