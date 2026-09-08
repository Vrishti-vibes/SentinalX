"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, Navigation, X, ArrowRight, Activity, MapPin } from "lucide-react";

interface RiskAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "SEVERE" | string;
  riskScore: number;
  locationName: string;
  onViewRisk?: () => void;
  isSimulated?: boolean;
}

export function RiskAlertModal({
  isOpen,
  onClose,
  riskLevel,
  riskScore,
  locationName,
  onViewRisk,
  isSimulated = false,
}: RiskAlertModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const normalizedLevel = riskLevel.toUpperCase();
  const isSevere = normalizedLevel === "CRITICAL" || normalizedLevel === "SEVERE";
  const isHigh = normalizedLevel === "HIGH";
  const isModerate = normalizedLevel === "MODERATE";
  const isLow = normalizedLevel === "SAFE" || normalizedLevel === "LOW";

  // Level specific messaging
  const levelTitle = isSevere
    ? "SEVERE RISK DETECTED"
    : isHigh
    ? "HIGH RISK ALERT"
    : isModerate
    ? "MODERATE RISK ADVISORY"
    : "LOW RISK — STABLE";

  const actionDirective = isSevere
    ? "ACTION: EVACUATE / FOLLOW AUTHORITY INSTRUCTIONS"
    : isHigh
    ? "ACTION: AVOID RISK ZONE • RESTRICT MOUNTAIN PASS TRAVEL"
    : isModerate
    ? "ACTION: STAY ALERT • MONITOR CONTINUOUS TELEMETRY"
    : "ACTION: CONTINUE MONITORING • CORRIDORS OPEN";

  const conditionSummary = isSevere
    ? "Critical shear failure & active tension displacement detected. Immediate slope failure hazard along mountain corridor."
    : isHigh
    ? "Heavy rainfall accumulation and accelerated pore pressure detected. Elevated landslide probability along hillside cut slopes."
    : isModerate
    ? "Elevated soil saturation and moderate precipitation recorded. Caution advised across vulnerable pass transit zones."
    : "Geotechnical telemetry and meteorological inputs indicate stable slope equilibrium across monitored sectors.";

  // Color schemas
  const theme = isSevere
    ? {
        border: "border-rose-500",
        badgeBg: "bg-rose-600 text-white",
        bgGradient: "from-rose-500/15 via-rose-500/5 to-white",
        iconColor: "text-rose-600",
        actionBg: "bg-rose-600 text-white hover:bg-rose-700",
        directiveBg: "bg-rose-100 text-rose-950 border-rose-300",
        scoreColor: "text-rose-700",
      }
    : isHigh
    ? {
        border: "border-orange-500",
        badgeBg: "bg-orange-600 text-white",
        bgGradient: "from-orange-500/15 via-orange-500/5 to-white",
        iconColor: "text-orange-600",
        actionBg: "bg-orange-600 text-white hover:bg-orange-700",
        directiveBg: "bg-orange-100 text-orange-950 border-orange-300",
        scoreColor: "text-orange-700",
      }
    : isModerate
    ? {
        border: "border-amber-500",
        badgeBg: "bg-amber-600 text-white",
        bgGradient: "from-amber-500/15 via-amber-500/5 to-white",
        iconColor: "text-amber-600",
        actionBg: "bg-amber-600 text-white hover:bg-amber-700",
        directiveBg: "bg-amber-100 text-amber-950 border-amber-300",
        scoreColor: "text-amber-700",
      }
    : {
        border: "border-emerald-500",
        badgeBg: "bg-emerald-600 text-white",
        bgGradient: "from-emerald-500/15 via-emerald-500/5 to-white",
        iconColor: "text-emerald-600",
        actionBg: "bg-emerald-600 text-white hover:bg-emerald-700",
        directiveBg: "bg-emerald-100 text-emerald-950 border-emerald-300",
        scoreColor: "text-emerald-700",
      };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn select-none">
      <div
        className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 ${theme.border} overflow-hidden flex flex-col`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
      >
        {/* Top Gradient Banner */}
        <div className={`p-4 sm:p-5 bg-gradient-to-b ${theme.bgGradient} border-b border-slate-100 space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 ${theme.iconColor}`}>
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">
                  SENTINALX EMERGENCY INTELLIGENCE
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {isSimulated ? "EMERGENCY DRILL BROADCAST" : "AUTOMATED SATELLITE & SENSOR WARNING"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center border border-slate-200 shadow-sm transition-colors cursor-pointer"
              title="Dismiss warning"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Level Header & Score */}
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase inline-block shadow-sm ${theme.badgeBg}`}>
                {levelTitle}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{locationName}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                RISK SCORE
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${theme.scoreColor}`}>
                  {riskScore.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-white">
          {/* Summary Note */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {conditionSummary}
          </p>

          {/* Action Directive Callout */}
          <div className={`p-3 rounded-2xl border text-xs font-black tracking-wider uppercase flex items-center gap-2 ${theme.directiveBg}`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionDirective}</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link
              href="/routes"
              onClick={onClose}
              className={`h-11 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${theme.actionBg}`}
            >
              <Navigation className="w-4 h-4" />
              <span>Safe Evacuation Route</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                if (onViewRisk) onViewRisk();
                onClose();
              }}
              className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-slate-600" />
              <span>View Risk Breakdown</span>
            </button>
          </div>

          {/* Dismiss Footer Link */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
            <span>MDoNER • SIH 2026 Disaster Management</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
            >
              Acknowledge &amp; Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
