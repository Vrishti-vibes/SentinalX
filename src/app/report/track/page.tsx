"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  AlertTriangle,
  RotateCw,
  Phone,
  Timer,
  ExternalLink,
  Check,
  ShieldCheck,
  Clock,
  Truck,
  Navigation,
  Layers,
} from "lucide-react";
import { IncidentReportRecord, ReportStatusHistoryRecord } from "@/types/database";
import { ResponseAssignment } from "@/types/response";
import { getPendingReports } from "@/lib/offline/storage";
import { OfflineStatus } from "@/components/OfflineStatus";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";

function TrackReportContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id") || "SX-LS-2048";

  const [reportId, setReportId] = useState<string>(queryId);
  const [report, setReport] = useState<IncidentReportRecord | null>(null);
  const [response, setResponse] = useState<ResponseAssignment | null>(null);
  const [history, setHistory] = useState<ReportStatusHistoryRecord[]>([]);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const fetchReportData = async (targetId: string) => {
    // Check if targetId is an offline local report
    if (targetId.startsWith("SX-OFFLINE-")) {
      const pendingList = getPendingReports();
      const match = pendingList.find((p) => p.localReportId === targetId);
      if (match) {
        setReport({
          id: match.localReportId,
          reportId: match.localReportId,
          hazardType: match.payload.hazardType,
          locationName: match.payload.locationName || "Tawang Sector, North Eastern Region",
          latitude: match.payload.latitude || 27.586,
          longitude: match.payload.longitude || 91.859,
          severity: typeof match.payload.severity === "number" ? match.payload.severity : 4,
          description: match.payload.description,
          photoUrl: match.payload.photoUrl,
          submittedAt: match.queuedAt,
          verificationStatus: "PENDING_VERIFICATION",
          responseStatus: "SUBMITTED",
          assignedTeam: null,
          estimatedResponseMinutes: 20,
          storage: "DEMO_IN_MEMORY",
        });
        setHistory([
          {
            id: `hist-off-${Date.now()}`,
            reportId: match.localReportId,
            status: "SUBMITTED",
            message: "Report saved offline on this device. Awaiting internet connection for sync.",
            timestamp: match.queuedAt,
          },
        ]);
        setReportId(match.localReportId);
        setIsOfflineQueued(true);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
    }

    try {
      const [reportRes, responseRes] = await Promise.all([
        fetch(`/api/reports/${targetId}`),
        fetch(`/api/responses?reportId=${targetId}`),
      ]);

      if (reportRes.ok) {
        const json = await reportRes.json();
        if (json.success && json.data) {
          setReport(json.data);
          setHistory(json.history || []);
          setReportId(json.reportId);
          setIsOfflineQueued(false);
          setIsFallback(false);
        }
      } else {
        // Fallback to seed
        const fallbackRes = await fetch("/api/reports/SX-LS-2048");
        if (fallbackRes.ok) {
          const fallbackJson = await fallbackRes.json();
          if (fallbackJson.success) {
            setReport(fallbackJson.data);
            setHistory(fallbackJson.history || []);
            setReportId(fallbackJson.reportId);
            setIsFallback(true);
          }
        }
      }

      if (responseRes.ok) {
        const rJson = await responseRes.json();
        if (rJson.success && Array.isArray(rJson.data) && rJson.data.length > 0) {
          setResponse(rJson.data[0]);
        }
      }
    } catch (err) {
      console.warn("Could not fetch report details, using fallback:", err);
      setIsFallback(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportData(queryId);
  }, [queryId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchReportData(reportId);
  };

  // Format timestamp helper
  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  const isVerified = report?.verificationStatus === "VERIFIED";
  const submittedStep = history.find((h) => h.status === "SUBMITTED");
  const verifiedStep = history.find((h) => h.status === "VERIFIED");
  const authoritiesStep = history.find(
    (h) => h.status === "AUTHORITIES_NOTIFIED" || h.status === "RESPONSE_ASSIGNED" || h.status === "RESOLVED"
  );
  const assignedStep = history.find(
    (h) => h.status === "RESPONSE_ASSIGNED" || h.status === "RESOLVED"
  );
  const resolvedStep = history.find((h) => h.status === "RESOLVED");

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── 1. Top Header ── */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* SentinalX Brand Logo */}
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

        {/* Right: OfflineStatus Badge */}
        <div className="flex items-center gap-1.5">
          <OfflineStatus />
        </div>
      </header>

      {/* ── 2. Content Body ── */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Offline notice if viewing locally queued report */}
        {isOfflineQueued && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-extrabold">LOCAL REPORT:</span> Stored on this device. Will sync automatically when connection returns.
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
              QUEUED
            </span>
          </div>
        )}

        {/* Page title area */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">
            • CITIZEN RESPONSE TRACKER •
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">
            Incident Status &amp; Response Tracking
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Real-time verification and response unit deployment
          </p>
        </div>

        {/* Incident ID & Verification Status card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              REPORT ID
            </span>
            {isVerified ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#6ee7b7] text-[#064e3b] text-xs font-extrabold flex items-center gap-1">
                <span>✓</span>
                <span>VERIFIED</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>PENDING VERIFICATION</span>
              </span>
            )}
          </div>
          <div className="text-2xl font-black font-mono text-[#0f172a] tracking-tight">
            {reportId}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-semibold">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{report?.locationName || "Tawang Sector"}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {report?.hazardType || "Landslide"}
            </span>
          </div>
        </div>

        {/* Dynamic Alert Banner */}
        {authoritiesStep || isVerified ? (
          <div className="rounded-2xl bg-[#b91c1c] p-4 text-white shadow-md flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-extrabold uppercase tracking-wider">
                AUTHORITIES NOTIFIED
              </div>
              <div className="text-xs font-bold text-white/95 leading-snug">
                STAY AWAY FROM THE AREA. An active hazard zone is undergoing response.
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#1e293b] p-4 text-white shadow-md flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                REPORT LOGGED &amp; QUEUED
              </div>
              <div className="text-xs font-medium text-slate-200 leading-snug">
                Telemetry cross-check in progress. Monitoring regional sensor feeds.
              </div>
            </div>
          </div>
        )}

        {/* ── Linked Response Workflow Card (Task 14) ── */}
        {response && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>RESPONSE DEPLOYMENT</span>
              </span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-blue-100 text-blue-800">
                {response.status.replace("_", " ")}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-900">{response.team.name}</h3>
              <p className="text-[11px] text-slate-600 mt-0.5">{response.notes}</p>
            </div>

            <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>ETA: ~{response.estimatedResponseMinutes}m (Prototype Estimate)</span>
              <span className="uppercase text-blue-800 font-bold">PROTOTYPE WORKFLOW</span>
            </div>
          </div>
        )}

        {/* Dynamic Response Timeline */}
        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm space-y-4">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            RESPONSE TIMELINE
          </div>

          <div className="relative pl-7 space-y-5">
            {/* vertical connecting line */}
            <div className="absolute left-2.5 top-2 bottom-3 w-[2px] bg-slate-200" />

            {/* Step 1: Report Submitted */}
            <div className="relative">
              <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                <span className="text-[10px] font-bold">✓</span>
              </div>
              <div className="text-xs font-bold text-slate-900">Report Submitted</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {formatTime(submittedStep?.timestamp || report?.submittedAt)}
              </div>
            </div>

            {/* Step 2: Verified */}
            <div className="relative">
              {verifiedStep ? (
                <>
                  <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className="text-[10px] font-bold">✓</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Verified</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {formatTime(verifiedStep.timestamp)}
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                  <div className="text-xs font-bold text-slate-500">Verification</div>
                  <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                    Sensor Cross-Check In Progress...
                  </div>
                </>
              )}
            </div>

            {/* Step 3: Authorities Notified */}
            <div className="relative">
              {authoritiesStep ? (
                <>
                  <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className="text-[10px] font-bold">✓</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Authorities Notified</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {formatTime(authoritiesStep.timestamp)}
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                    <span className="text-[9px]">3</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-400">Authorities Notified</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">Pending verification</div>
                </>
              )}
            </div>

            {/* Step 4: Response Team Assigned / In Progress */}
            <div className="relative">
              {resolvedStep ? (
                <>
                  <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className="text-[10px] font-bold">✓</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Hazard Cleared / Resolved</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    {resolvedStep.message}
                  </div>
                </>
              ) : assignedStep ? (
                <>
                  <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-white border-2 border-[#b91c1c] flex items-center justify-center shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#b91c1c] animate-ping absolute" />
                    <span className="w-2 h-2 rounded-full bg-[#b91c1c]" />
                  </div>
                  <div className="text-xs font-bold text-[#b91c1c]">Response Team Assigned</div>
                  <div className="text-[10px] text-[#b91c1c] font-semibold mt-0.5">
                    {report?.assignedTeam || response?.team.name || "In Progress..."}
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                    <span className="text-[9px]">4</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-400">Response Team Dispatch</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">Awaiting dispatch</div>
                </>
              )}
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
              {response?.estimatedResponseMinutes
                ? `${response.estimatedResponseMinutes} min`
                : report?.estimatedResponseMinutes
                ? `${report.estimatedResponseMinutes} min`
                : "10–20 min"}
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
            <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
              <path d="M-20,25  Q90,5  190,45 T390,35" fill="none" stroke="#64748b" strokeWidth="1" />
              <path d="M-20,60  Q110,35 230,75 T430,65" fill="none" stroke="#64748b" strokeWidth="1" />
              <path d="M-20,100 Q130,75 250,115 T450,105" fill="none" stroke="#64748b" strokeWidth="1" />
              <path d="M-20,140 Q150,115 270,155 T470,145" fill="none" stroke="#64748b" strokeWidth="1" />
              <path d="M-20,180 Q170,155 290,195 T490,185" fill="none" stroke="#64748b" strokeWidth="1" />
            </svg>

            {/* Red hazard polygon */}
            <div
              className="absolute top-5 left-10 w-44 h-32 bg-[#fca5a5]/30 border-2 border-[#ef4444]/55"
              style={{ clipPath: "polygon(45% 0%, 90% 12%, 100% 65%, 85% 95%, 28% 100%, 0% 70%, 15% 25%)" }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#b91c1c]">
                  <path d="M12 3L2 21H22L12 3Z" />
                  <path d="M12 9V14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1.2" fill="#fff" />
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
        <div className="grid grid-cols-2 gap-2">
          <Link href="/routes" className="block">
            <button
              type="button"
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Safe Route</span>
            </button>
          </Link>

          <Link href="/shelters" className="block">
            <button
              type="button"
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Shelters</span>
            </button>
          </Link>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "REFRESHING..." : "Refresh Status"}</span>
          </button>

          <a
            href="tel:1070"
            className="w-full h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#991b1b] font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all block text-center leading-10"
          >
            <Phone className="w-3.5 h-3.5 text-[#991b1b] inline mr-1" />
            <span>Call State Emergency Helpline (1070)</span>
          </a>
        </div>

        {/* Footer note */}
        <div className="pt-2 pb-1 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            {PROTOTYPE_DISCLAIMER}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TrackReportScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
          Loading report tracking...
        </div>
      }
    >
      <TrackReportContent />
    </Suspense>
  );
}
