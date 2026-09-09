"use client";

import React, { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import Link from "next/link";
import { Loader2, ArrowLeft, Clock, FileText, ChevronRight, PlusCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { IncidentReportRecord } from "@/types/database";

function formatRelativeTime(isoDate?: string): string {
  if (!isoDate) return "Just now";
  const ms = Date.now() - new Date(isoDate).getTime();
  if (isNaN(ms)) return "Recently";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getSeverityBadge(severity: number | string) {
  const num = typeof severity === "number" ? severity : parseInt(String(severity), 10);
  if (num >= 4 || String(severity).toUpperCase() === "HIGH" || String(severity).toUpperCase() === "CRITICAL") {
    return "bg-rose-100 text-rose-800 border-rose-200";
  }
  if (num === 3 || String(severity).toUpperCase() === "MODERATE") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function getStatusBadge(status?: string) {
  const s = (status || "SUBMITTED").toUpperCase();
  if (s === "RESOLVED") return "bg-slate-100 text-slate-700 border-slate-300";
  if (s === "RESPONSE_ASSIGNED" || s === "DISPATCHED") return "bg-blue-100 text-blue-800 border-blue-200";
  if (s === "VERIFIED") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "AUTHORITIES_NOTIFIED") return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<IncidentReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.reports)
        ? json.reports
        : Array.isArray(json)
        ? json
        : [];
      setReports(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/report" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BrandLogo />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              MY REPORTS
            </span>
          </div>
          <Link
            href="/report"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">MY INCIDENT REPORTS</h1>
            <p className="text-xs text-slate-500">Live field observation registry &amp; status tracking</p>
          </div>
          <button
            onClick={fetchReports}
            className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors shadow-xs"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-700" />
            <p className="text-xs font-mono font-bold">Querying persistent incident repository...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl text-xs border border-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Database query failed</span>
            </div>
            <p className="font-mono">{error}</p>
            <button
              onClick={fetchReports}
              className="text-xs font-bold text-rose-900 underline mt-1 block"
            >
              Retry
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-bold mb-1">No field reports submitted yet</h3>
            <p className="text-slate-500 text-xs mb-4 max-w-sm">
              When you submit a hazard observation in the field, it will persist here with real-time response dispatch status.
            </p>
            <Link
              href="/report"
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Submit First Report
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const reportId = report.reportId || report.id;
              const severityText =
                report.severity === 4 || report.severity === 5
                  ? "HIGH"
                  : report.severity === 3
                  ? "MODERATE"
                  : "LOW";

              return (
                <Link
                  key={reportId}
                  href={`/report/track?id=${reportId}`}
                  className="block group"
                >
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all active:scale-[0.99] flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {reportId}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                              report.severity
                            )}`}
                          >
                            {severityText}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-900 transition-colors">
                          {report.hazardType || "Landslide"}
                        </h3>
                        <p className="text-slate-500 text-xs truncate mt-0.5">
                          {report.locationName || "Tawang Sector"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusBadge(
                            report.responseStatus || report.verificationStatus
                          )}`}
                        >
                          {(report.responseStatus || report.verificationStatus || "SUBMITTED").replace("_", " ")}
                        </span>
                        <div className="flex items-center text-slate-400 text-[11px] font-medium">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{formatRelativeTime(report.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Storage: {report.storage || "PERSISTENT_STORE"}</span>
                      </span>
                      <span className="text-blue-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Track Timeline</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
