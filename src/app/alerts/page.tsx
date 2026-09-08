"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  MapPin,
  Navigation,
  RotateCw,
  ChevronRight,
  ShieldCheck,
  Clock,
  Layers,
  X,
  ShieldAlert,
  PhoneCall,
  Activity,
  CheckCircle2,
  Truck,
  WifiOff,
} from "lucide-react";
import { AlertRecord, AlertSeverity } from "@/types/alert";
import { ResponseAssignment } from "@/types/response";
import { saveAlertsSnapshot, getAlertsSnapshot, getCacheAgeMinutes } from "@/lib/offline/storage";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { REFRESH_INTERVALS } from "@/lib/config/refresh";
import { OfflineStatus } from "@/components/OfflineStatus";
import { DataFreshness } from "@/components/DataFreshness";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";

type SeverityFilter = "ALL" | "CRITICAL" | "HIGH" | "WATCH";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [responses, setResponses] = useState<ResponseAssignment[]>([]);
  const [activeSeverity, setActiveSeverity] = useState<SeverityFilter>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAlertsUpdateAt, setLastAlertsUpdateAt] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [cacheAgeText, setCacheAgeText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadOfflineAlerts = () => {
    const cached = getAlertsSnapshot();
    if (cached && cached.data && Array.isArray(cached.data)) {
      setAlerts(cached.data);
      setIsOfflineMode(true);
      const age = getCacheAgeMinutes(cached.cachedAt);
      setCacheAgeText(`${age}m ago`);
      return true;
    }
    return false;
  };

  const fetchAlertsAndResponses = async () => {
    setError(null);

    // If browser is offline, load from cache
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const loaded = loadOfflineAlerts();
      if (!loaded) {
        setError("Offline: No cached alerts available on this device.");
      }
      setIsLoading(false);
      return;
    }

    try {
      const [alertsRes, responsesRes] = await Promise.all([
        fetch("/api/alerts"),
        fetch("/api/responses"),
      ]);

      let loadedFresh = false;

      if (alertsRes.ok) {
        const json = await alertsRes.json();
        if (json.success && Array.isArray(json.data)) {
          setAlerts(json.data);
          saveAlertsSnapshot(json.data);
          setIsOfflineMode(false);
          setLastAlertsUpdateAt(new Date().toISOString());
          loadedFresh = true;
        }
      }

      if (responsesRes.ok) {
        const rJson = await responsesRes.json();
        if (rJson.success && Array.isArray(rJson.data)) {
          setResponses(rJson.data);
        }
      }

      if (!loadedFresh) {
        const loaded = loadOfflineAlerts();
        if (!loaded) {
          setError("Failed to load alert feed.");
        }
      }
    } catch (err: unknown) {
      console.error("[AlertsPage] Error loading alerts:", err);
      const loaded = loadOfflineAlerts();
      if (!loaded) {
        setError("Network connection issue while retrieving alerts.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const { isRefreshing, refreshNow } = useAutoRefresh(fetchAlertsAndResponses, {
    intervalMs: REFRESH_INTERVALS.ALERTS,
    enabled: true,
  });

  useEffect(() => {
    fetchAlertsAndResponses();
  }, []);

  const handleRefresh = () => {
    refreshNow();
  };

  // Helper to get response for an alert
  const getResponseForAlert = (alertId: string) => {
    return responses.find((r) => r.alertId === alertId);
  };

  // Filter alerts by severity and location
  const filteredAlerts = alerts.filter((alert) => {
    if (activeSeverity !== "ALL" && alert.severity !== activeSeverity) {
      return false;
    }
    if (
      selectedLocation === "tawang" &&
      !alert.location.name.toLowerCase().includes("tawang") &&
      !alert.location.name.toLowerCase().includes("zemithang")
    ) {
      return false;
    }
    if (
      selectedLocation === "gangtok" &&
      !alert.location.name.toLowerCase().includes("gangtok") &&
      !alert.location.name.toLowerCase().includes("sevoke") &&
      !alert.location.name.toLowerCase().includes("teesta")
    ) {
      return false;
    }
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── 1. Header ── */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* SentinalX Brand */}
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

        {/* Right: OfflineStatus Badge & Refresh */}
        <div className="flex items-center gap-2">
          <OfflineStatus />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh alerts feed"
            title="Refresh alert feed"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* ── 2. Content Body ── */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Offline Banner if running from cache */}
        {isOfflineMode && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-extrabold">OFFLINE MODE:</span> Displaying last-known alerts cache ({cacheAgeText}).
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
              CACHED
            </span>
          </div>
        )}

        {/* Page Title & Location Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block">
              • EARLY WARNING SYSTEM • NER DISASTER GRID
            </span>
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight mt-0.5">
              Live Alert &amp; Incident Feed
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automated multi-source early warning advisories &amp; hazard notices
            </p>
          </div>

          {/* Location Selector Tabs */}
          <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedLocation("ALL")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                selectedLocation === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All NER
            </button>
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
          </div>
        </div>

        {/* ── Severity Filter Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          {(["ALL", "CRITICAL", "HIGH", "WATCH"] as SeverityFilter[]).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setActiveSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                activeSeverity === sev
                  ? "bg-[#181d24] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {sev === "ALL" ? "All Severities" : sev}
            </button>
          ))}
        </div>

        {/* ── Alerts List ── */}
        {isLoading ? (
          <div className="py-12 text-center space-y-2">
            <RotateCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading live early warnings...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
            <div className="text-xs font-bold text-rose-900">{error}</div>
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900">No Active Warnings</h3>
            <p className="text-xs text-slate-500">
              No matching alerts found for the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {filteredAlerts.map((alert) => {
              const linkedResponse = getResponseForAlert(alert.id);

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`rounded-2xl border bg-white p-4 shadow-sm space-y-3 cursor-pointer hover:border-slate-400 transition-all ${
                    alert.severity === "CRITICAL"
                      ? "border-rose-300 ring-1 ring-rose-200"
                      : alert.severity === "HIGH"
                      ? "border-rose-200"
                      : "border-amber-200"
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-100 text-[#991b1b]"
                            : alert.severity === "HIGH"
                            ? "bg-orange-100 text-orange-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {alert.severity} ALERT
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          alert.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : alert.status === "ACKNOWLEDGED"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {alert.status}
                      </span>
                      {linkedResponse && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Truck className="w-2.5 h-2.5 text-blue-600" />
                          <span>{linkedResponse.status.replace("_", " ")}</span>
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">{alert.id}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(alert.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Title & Message */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                      {alert.message}
                    </p>
                  </div>

                  {/* Location & Score Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#991b1b]" />
                      <span className="font-semibold text-slate-700">{alert.location.name}</span>
                    </div>
                    {alert.riskScore !== null && (
                      <div className="font-mono font-bold text-slate-800">
                        Score: {alert.riskScore.toFixed(1)} / 100
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <Link
                      href="/routes"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
                    >
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      <span>Safe Route</span>
                    </Link>
                    <Link
                      href="/map"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-slate-100 transition-colors"
                    >
                      <Layers className="w-3 h-3 text-slate-600" />
                      <span>Risk Map</span>
                    </Link>
                    <Link
                      href={`/emergency?reportId=${alert.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 rounded-lg bg-rose-50 border border-rose-200 text-[#991b1b] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-rose-100 transition-colors"
                    >
                      <PhoneCall className="w-3 h-3 text-[#991b1b]" />
                      <span>Helpline</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 3. Modal Detail View ── */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 relative animate-fadeIn">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      selectedAlert.severity === "CRITICAL"
                        ? "bg-rose-100 text-[#991b1b]"
                        : selectedAlert.severity === "HIGH"
                        ? "bg-orange-100 text-orange-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {selectedAlert.severity} ALERT • {selectedAlert.id}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {selectedAlert.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {selectedAlert.message}
              </p>

              {/* Response Workflow Integration in Modal */}
              {(() => {
                const resp = getResponseForAlert(selectedAlert.id);
                if (resp) {
                  return (
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold uppercase text-[10px] text-blue-900 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-blue-600" />
                          <span>Response Deployment</span>
                        </span>
                        <span className="font-mono font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded text-[9px]">
                          {resp.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">{resp.team.name}</div>
                      <div className="text-[11px] text-slate-600">
                        Estimated Response: ~{resp.estimatedResponseMinutes} min
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Notification Channel Delivery Status */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-[10px] text-center">
                <div className="space-y-1 border-r border-slate-200 pr-2">
                  <span className="font-extrabold text-slate-600 uppercase tracking-wider block">IN-APP</span>
                  <span className="font-mono font-bold text-emerald-600 bg-emerald-100 rounded px-1 py-0.5 block">DELIVERED</span>
                </div>
                <div className="space-y-1 border-r border-slate-200 px-1">
                  <span className="font-extrabold text-slate-600 uppercase tracking-wider block">PUSH</span>
                  <span className="font-mono font-bold text-slate-400 bg-slate-100 rounded px-1 py-0.5 block flex items-center justify-center gap-1"><WifiOff className="w-2.5 h-2.5"/> NO APNS</span>
                </div>
                <div className="space-y-1 pl-1">
                  <span className="font-extrabold text-slate-600 uppercase tracking-wider block">SMS</span>
                  <span className="font-mono font-bold text-slate-400 bg-slate-100 rounded px-1 py-0.5 block flex items-center justify-center gap-1"><WifiOff className="w-2.5 h-2.5"/> NO TWILIO</span>
                </div>
              </div>

              {/* Alert Provenance Details */}
              <div className="space-y-1.5 text-[10px] sm:text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Location:</span>
                  <span className="font-bold text-slate-900">{selectedAlert.location.name}</span>
                </div>
                {selectedAlert.riskScore !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Risk Score:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {selectedAlert.riskScore.toFixed(1)} / 100 ({selectedAlert.riskLevel})
                    </span>
                  </div>
                )}
                {selectedAlert.primaryThreat && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Threat:</span>
                    <span className="font-bold text-slate-900">{selectedAlert.primaryThreat}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Alert Engine:</span>
                  <span className="font-bold text-slate-700">{selectedAlert.source}</span>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link href="/routes" className="block">
                  <button
                    type="button"
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open Safe Route</span>
                  </button>
                </Link>
                <Link href="/shelters" className="block">
                  <button
                    type="button"
                    className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>View Shelters</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Prototype Disclaimer Footer ── */}
        <div className="pt-2 pb-1 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
            {PROTOTYPE_DISCLAIMER}
          </span>
        </div>
      </div>
    </div>
  );
}


