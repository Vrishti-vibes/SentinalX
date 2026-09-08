"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  ShieldAlert,
  AlertTriangle,
  Clock,
  MapPin,
  Navigation,
  Sparkles,
  ChevronRight,
  Radio,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { AlertRecord, AlertSeverity } from "@/types/alert";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateAlert?: () => void;
  unreadCount: number;
  onMarkAllRead?: () => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  onSimulateAlert,
  unreadCount,
  onMarkAllRead,
}: NotificationDrawerProps) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedAlerts, setSimulatedAlerts] = useState<AlertRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAlerts(json.data);
        }
      }
    } catch (e) {
      console.error("Failed to load alerts:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSimulatedAlert = () => {
    const newDemoAlert: AlertRecord = {
      id: `DEMO-ALERT-${Date.now()}`,
      type: "LANDSLIDE_RISK",
      severity: "CRITICAL",
      title: "Critical Slope Rupture Watch • Zemithang Sector",
      message:
        "Field sensor inclinometer displacement exceeded 4.5 mm/hr. Pore pressure surge detected. Emergency diversion to NH-13 Safe Bypass advised.",
      location: {
        name: "Tawang Sector (Zemithang-Lumla Cut)",
        latitude: 27.586,
        longitude: 91.859,
      },
      riskScore: 89.2,
      riskLevel: "CRITICAL",
      primaryThreat: "Active Tension Slip Plane Rupture",
      triggeredBy: ["Inclinometer Tilt > 10.2°", "Antecedent Rainfall 78mm/24h", "Geotechnical Model FoS 0.84"],
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null,
      source: "SIH 2026 Controlled Demo Feed",
    };

    setSimulatedAlerts((prev) => [newDemoAlert, ...prev]);
    if (onSimulateAlert) {
      onSimulateAlert();
    }
  };

  if (!isOpen) return null;

  const combinedAlerts = [...simulatedAlerts, ...alerts];

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn select-none">
      <div
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slideInRight"
        role="dialog"
        aria-label="Early Warning Notification Center"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="w-5 h-5 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider">
                Emergency Alert Center
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {combinedAlerts.length} Active Intelligence Bulletins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Alert Center"
            aria-label="Close Alert Center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Operational Emergency Drill Bar */}
        <div className="p-3 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-blue-500/10 border-b border-rose-200/80 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black tracking-wider text-rose-900 uppercase flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-rose-600" />
                <span>OPERATIONAL TEST PROTOCOL</span>
              </span>
              <span className="text-[10px] text-slate-600 font-medium block">
                Broadcast test evacuation alert across emergency channels
              </span>
            </div>
            <button
              type="button"
              onClick={handleTriggerSimulatedAlert}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Broadcast Test</span>
            </button>
          </div>
          <span className="text-[9px] text-slate-400 font-mono mt-1 block">
            * Standardized emergency drill dispatch for incident response verification
          </span>
        </div>

        {/* Alert List Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 divide-y divide-slate-100">
          {isLoading && alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-500" />
              <p>Fetching active early warnings...</p>
            </div>
          ) : combinedAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="font-bold text-slate-700">No active severe alerts</p>
              <p className="text-[11px]">All regional sectors currently within nominal monitoring thresholds.</p>
            </div>
          ) : (
            combinedAlerts.map((alert, idx) => {
              const isCrit = alert.severity === "CRITICAL";
              const isHigh = alert.severity === "HIGH";
              const isWatch = alert.severity === "WATCH";

              const badgeColor = isCrit
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : isHigh
                ? "bg-orange-100 text-orange-800 border-orange-200"
                : "bg-amber-100 text-amber-800 border-amber-200";

              const dotColor = isCrit ? "bg-rose-600 animate-ping" : isHigh ? "bg-orange-500" : "bg-amber-500";

              return (
                <div key={alert.id || idx} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border tracking-wider uppercase ${badgeColor}`}>
                        {alert.severity} — {alert.type.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-snug">
                      {alert.title}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{alert.location.name}</span>
                      {alert.riskScore && (
                        <span className="font-mono text-rose-700 font-bold ml-1">
                          • Risk: {alert.riskScore.toFixed(0)}/100
                        </span>
                      )}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {alert.message}
                  </p>

                  {alert.triggeredBy && alert.triggeredBy.length > 0 && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-mono space-y-0.5">
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">Triggers &amp; Telemetry:</span>
                      {alert.triggeredBy.slice(0, 2).map((trig, tIdx) => (
                        <div key={tIdx} className="text-slate-700 flex items-center gap-1">
                          <span className="text-slate-400">•</span>
                          <span>{trig}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between gap-2">
                    <Link
                      href="/routes"
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Safe Bypass</span>
                    </Link>

                    <Link
                      href="/map"
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors border border-slate-200"
                    >
                      <span>Locate on GIS</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <Link
            href="/alerts"
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
          >
            <span>Open Full Alert Feed</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
            SENTINALX EARLY WARNING
          </span>
        </div>
      </div>
    </div>
  );
}
