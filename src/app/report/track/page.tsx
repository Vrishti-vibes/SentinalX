"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
          responseStatus: "NEW",
          assignedTeam: null,
          estimatedResponseMinutes: 20,
          storage: "DEMO_IN_MEMORY",
        });
        setHistory([
          {
            id: `hist-off-${Date.now()}`,
            reportId: match.localReportId,
            status: "NEW",
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

  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  const statusOrder: Record<string, number> = {
    SUBMITTED: 1,
    NEW: 1,
    UNDER_REVIEW: 1.5,
    VERIFIED: 2,
    AUTHORITIES_NOTIFIED: 2,
    DISPATCHED: 3,
    RESPONSE_ASSIGNED: 3,
    ON_SITE: 4,
    RESOLVED: 5,
    REJECTED: -1,
  };

  const currentStatus = report?.responseStatus || "NEW";
  const currentRank = statusOrder[currentStatus] ?? 1;
  const isRejected = currentStatus === "REJECTED";
  const isResolved = currentStatus === "RESOLVED";
  const isOnSite = currentStatus === "ON_SITE";
  const isDispatched = currentStatus === "DISPATCHED" || currentRank >= 3;
  const isVerified = currentRank >= 2;

  const getHistoryTime = (statusKey: string) => {
    const item = history.find((h) => h.status === statusKey);
    return item?.timestamp ? formatTime(item.timestamp) : null;
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
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
        <div className="flex items-center gap-1.5">
          <OfflineStatus />
        </div>
      </header>

      <div className="p-4 sm:p-5 space-y-4 max-w-7xl mx-auto w-full">
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">
              • CITIZEN RESPONSE TRACKER •
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">
              Incident Status &amp; Response Tracking
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Real-time verification and response unit deployment across NER sectors
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="self-start sm:self-auto h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "SYNCING..." : "SYNC STATUS"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  REPORT ID
                </span>
                {isRejected ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold flex items-center gap-1">
                    <span>✕</span>
                    <span>REJECTED</span>
                  </span>
                ) : isResolved ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
                    <span>✓</span>
                    <span>RESOLVED</span>
                  </span>
                ) : isOnSite ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    <span>ON SITE</span>
                  </span>
                ) : isDispatched ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold flex items-center gap-1">
                    <Truck className="w-3 h-3 text-blue-700" />
                    <span>DISPATCHED</span>
                  </span>
                ) : isVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
                    <span>✓</span>
                    <span>VERIFIED</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>PENDING VERIFICATION</span>
                  </span>
                )}
              </div>

              <div className="text-2xl sm:text-3xl font-black font-mono text-[#0f172a] tracking-tight">
                {reportId}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-semibold">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{report?.locationName || "Tawang Sector"}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 uppercase font-bold">
                  {report?.hazardType || "Landslide"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 font-mono">
                <div>
                  <span className="font-sans font-bold text-slate-700">Team: </span>
                  <span className="text-blue-700 font-bold">
                    {report?.assignedTeam || response?.team.name || "Awaiting Assignment"}
                  </span>
                </div>
                <div>
                  GPS: {report?.latitude?.toFixed(4) || "27.5860"}, {report?.longitude?.toFixed(4) || "91.8590"}
                </div>
              </div>
            </div>

            {isRejected ? (
              <div className="rounded-2xl bg-slate-800 p-4 text-white shadow-md flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6 text-rose-400 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                    REPORT REJECTED / DUPLICATE
                  </div>
                  <div className="text-xs font-medium text-slate-200 leading-snug">
                    Authorities reviewed this report and marked it as invalid, duplicate, or cleared.
                  </div>
                </div>
              </div>
            ) : isResolved ? (
              <div className="rounded-2xl bg-[#065f46] p-4 text-white shadow-md flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <ShieldCheck className="w-6 h-6 text-emerald-200 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                    INCIDENT RESOLVED &amp; AREA CLEARED
                  </div>
                  <div className="text-xs font-bold text-white/95 leading-snug">
                    Field operations completed. Roadway and hazardous perimeter have been remediated.
                  </div>
                </div>
              </div>
            ) : isOnSite ? (
              <div className="rounded-2xl bg-[#312e81] p-4 text-white shadow-md flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <Truck className="w-6 h-6 text-indigo-300 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">
                    RESPONSE TEAM ON SITE
                  </div>
                  <div className="text-xs font-bold text-white/95 leading-snug">
                    {report?.assignedTeam || "Assigned Response Unit"} is on scene actively performing stabilization and rescue.
                  </div>
                </div>
              </div>
            ) : isDispatched ? (
              <div className="rounded-2xl bg-[#1e40af] p-4 text-white shadow-md flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <Truck className="w-6 h-6 text-blue-200 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
                    RESPONSE TEAM DISPATCHED
                  </div>
                  <div className="text-xs font-bold text-white/95 leading-snug">
                    {report?.assignedTeam || "Emergency Unit"} is en route to this coordinate. Please maintain clear access corridors.
                  </div>
                </div>
              </div>
            ) : isVerified ? (
              <div className="rounded-2xl bg-[#b91c1c] p-4 text-white shadow-md flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6 text-white stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider">
                    AUTHORITIES NOTIFIED &amp; VERIFIED
                  </div>
                  <div className="text-xs font-bold text-white/95 leading-snug">
                    STAY AWAY FROM THE AREA. Active hazard confirmed by regional disaster command.
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

            <div className="rounded-2xl bg-[#181d24] p-4 text-white shadow-md flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  ESTIMATED RESPONSE
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                  {isResolved
                    ? "Completed"
                    : isOnSite
                    ? "On Site Now"
                    : response?.estimatedResponseMinutes
                    ? `${response.estimatedResponseMinutes} min`
                    : report?.estimatedResponseMinutes
                    ? `${report.estimatedResponseMinutes} min`
                    : "10–20 min"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex-1 flex flex-col">
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Incident Location</span>
                <Link href="/routes" className="text-slate-500 hover:text-slate-800">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              <div className="relative h-52 sm:h-56 lg:h-full min-h-[200px] w-full bg-[#eef2f7] overflow-hidden">
                <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
                  <path d="M-20,25  Q90,5  190,45 T390,35" fill="none" stroke="#64748b" strokeWidth="1" />
                  <path d="M-20,60  Q110,35 230,75 T430,65" fill="none" stroke="#64748b" strokeWidth="1" />
                  <path d="M-20,100 Q130,75 250,115 T450,105" fill="none" stroke="#64748b" strokeWidth="1" />
                  <path d="M-20,140 Q150,115 270,155 T470,145" fill="none" stroke="#64748b" strokeWidth="1" />
                  <path d="M-20,180 Q170,155 290,195 T490,185" fill="none" stroke="#64748b" strokeWidth="1" />
                </svg>

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

                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    d="M 165,220 Q 220,160 238,108 Q 250,75 265,50"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute bottom-10 left-[88px]">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#2563eb] border-2 border-white shadow" />
                </div>

                <div className="absolute top-8 right-14">
                  <div className="w-6 h-6 rounded-full bg-[#16a34a] border-2 border-white shadow flex items-center justify-center text-[9px]">
                    ⛺
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            {report?.assignedTeam && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>ASSIGNED RESPONSE UNIT</span>
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-blue-100 text-blue-800">
                    {currentStatus.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900">{report.assignedTeam}</h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isOnSite
                      ? "Unit deployed on site — operational zone secured."
                      : isDispatched
                      ? "Emergency unit dispatched to coordinates."
                      : "Unit designated for field dispatch upon approval."}
                  </p>
                </div>

                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px] font-mono text-slate-600">
                  <span>STATUS: {currentStatus}</span>
                  <span className="uppercase text-blue-800 font-bold">FIELD PROTOCOL ACTIVE</span>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  AUTHORITY RESPONSE TIMELINE
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  STAGE {currentRank > 0 ? Math.min(5, Math.floor(currentRank)) : 0} / 5
                </span>
              </div>

              <div className="relative pl-7 space-y-4">
                <div className="absolute left-2.5 top-2 bottom-3 w-[2px] bg-slate-200" />

                <div className="relative">
                  <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className="text-[10px] font-bold">✓</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Report Submitted</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {getHistoryTime("SUBMITTED") || getHistoryTime("NEW") || formatTime(report?.submittedAt)}
                  </div>
                </div>

                <div className="relative">
                  {currentRank >= 2 ? (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                        <span className="text-[10px] font-bold">✓</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">Verified by Authority</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {getHistoryTime("VERIFIED") || "Confirmed by Operator"}
                      </div>
                    </>
                  ) : currentRank === 1.5 ? (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      </div>
                      <div className="text-xs font-bold text-amber-700">Under Review</div>
                      <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                        Authority assessing telemetry and imagery...
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                        <span className="text-[9px]">2</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-400">Verification</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Sensor cross-check &amp; triage queued
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  {currentRank >= 3 ? (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                        <span className="text-[10px] font-bold">✓</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">Response Unit Dispatched</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {getHistoryTime("DISPATCHED") || (report?.assignedTeam ? `Dispatched ${report.assignedTeam}` : "Dispatched")}
                      </div>
                    </>
                  ) : currentRank === 2 && report?.assignedTeam ? (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      </div>
                      <div className="text-xs font-bold text-blue-700">Team Assigned — Awaiting Dispatch</div>
                      <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                        Assigned: {report.assignedTeam}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                        <span className="text-[9px]">3</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-400">Team Dispatch</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Awaiting team assignment and dispatch order
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  {currentRank >= 4 ? (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                        <span className="text-[10px] font-bold">✓</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">Response Team On Site</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {getHistoryTime("ON_SITE") || "Active field stabilization in progress"}
                      </div>
                    </>
                  ) : currentRank === 3 ? (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping absolute" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      </div>
                      <div className="text-xs font-bold text-indigo-700">Unit En Route</div>
                      <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                        ETA: ~{report?.estimatedResponseMinutes || 15} mins
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                        <span className="text-[9px]">4</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-400">On Site Operations</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Field stabilization &amp; clearance
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  {currentRank >= 5 ? (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-sm">
                        <span className="text-[10px] font-bold">✓</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">Hazard Cleared / Resolved</div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        {getHistoryTime("RESOLVED") || "All safety checks passed"}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                        <span className="text-[9px]">5</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-400">Hazard Resolution</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Final route reopening and signoff
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Live Status History &amp; Audit Log
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {history.length} {history.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 font-mono">
                    No status transitions logged yet.
                  </div>
                ) : (
                  history.map((h, idx) => (
                    <div
                      key={h.id || idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                            {h.status}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-800">
                            {h.message}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatTime(h.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
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

              <a
                href="tel:1070"
                className="w-full h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#991b1b] font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all block text-center leading-10"
              >
                <Phone className="w-3.5 h-3.5 text-[#991b1b] inline mr-1" />
                <span>Call State Emergency Helpline (1070)</span>
              </a>
            </div>
          </div>
        </div>

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
