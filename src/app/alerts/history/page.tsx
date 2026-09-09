"use client";

import React, { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import Link from "next/link";
import { Loader2, ArrowLeft, AlertTriangle, ShieldAlert, Bell, Radio, CheckCircle2 } from "lucide-react";
import { AlertRecord } from "@/types/alert";

function formatAlertDate(isoString?: string): string {
  if (!isoString) return "Recently";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "Recently";

  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");

  return `${day} ${month} ${year} • ${hours}:${mins}`;
}

export default function AlertHistoryPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.alerts)
        ? json.alerts
        : Array.isArray(json)
        ? json
        : [];
      setAlerts(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load alert history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
      case "SEVERE":
        return "bg-rose-100 text-rose-900 border-rose-300";
      case "HIGH":
        return "bg-orange-100 text-orange-900 border-orange-300";
      case "WATCH":
      case "MODERATE":
        return "bg-amber-100 text-amber-900 border-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/alerts" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BrandLogo />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              ALERT HISTORY
            </span>
          </div>
          <button
            onClick={fetchAlerts}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">OPERATIONAL ALERT LOG</h1>
            <p className="text-xs text-slate-500">Historical geotechnical and early warning trigger records</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/alerts/sms"
              className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
            >
              SMS Center
            </Link>
            <Link
              href="/alerts/notifications"
              className="text-xs font-extrabold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Deliveries
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-700" />
            <p className="text-xs font-mono font-bold text-slate-500">Retrieving alert event stream...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl text-xs border border-rose-200 space-y-2">
            <p className="font-bold">Failed to load alerts</p>
            <p className="font-mono">{error}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-900 font-bold mb-1">No alerts recorded</p>
            <p className="text-slate-500 text-xs">All monitored sectors are currently within nominal safety limits.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const locationName = alert.location?.name || "Tawang Sector";
              const scoreText = alert.riskScore ? `${Math.round(alert.riskScore)}/100` : "Nominal";
              const isActive = alert.status === "ACTIVE";

              return (
                <div
                  key={alert.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                            alert.severity
                          )}`}
                        >
                          {alert.severity} LANDSLIDE RISK
                        </span>
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {scoreText}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 mt-1">{alert.title}</h3>
                      <p className="text-xs font-semibold text-slate-600">{locationName}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          isActive
                            ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {alert.status || "ACTIVE"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatAlertDate(alert.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {alert.message}
                  </p>

                  {alert.triggeredBy && alert.triggeredBy.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {alert.triggeredBy.map((factor, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          • {factor}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-400">ID: {alert.id}</span>
                    <Link
                      href={`/alerts/sms?alertId=${alert.id}`}
                      className="font-bold text-blue-700 hover:text-blue-800 text-[11px] flex items-center gap-1"
                    >
                      <span>Preview SMS Broadcast</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
