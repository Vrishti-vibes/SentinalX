"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  RotateCw,
  MapPin,
  CheckCircle2,
  Clock,
  Radio,
  Send,
  Check,
  X,
  ExternalLink,
  Layers,
  ChevronRight,
  Shield,
  Activity,
  PhoneCall,
  UserCheck,
  BellRing,
  Smartphone,
  RadioTower,
  Truck,
  Flame,
  AlertTriangle,
  WifiOff,
} from "lucide-react";
import { IncidentReportRecord, ReportStatusHistoryRecord, SensorReadingRecord } from "@/types/database";
import { AlertRecord, NotificationEvent } from "@/types/alert";
import { ResponseAssignment, ResponseStatus } from "@/types/response";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { REFRESH_INTERVALS } from "@/lib/config/refresh";
import { OfflineStatus } from "@/components/OfflineStatus";
import { DataFreshness } from "@/components/DataFreshness";
import { PROTOTYPE_DISCLAIMER } from "@/lib/services/risk.service";
import LeafletMapDynamic from "@/components/map/LeafletMapDynamic";

export default function AuthorityDashboard() {
  const { isOnline } = useNetworkStatus();
  const [reports, setReports] = useState<IncidentReportRecord[]>([]);
  const [sensors, setSensors] = useState<SensorReadingRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [responses, setResponses] = useState<ResponseAssignment[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [selectedReport, setSelectedReport] = useState<IncidentReportRecord | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<ReportStatusHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDashboardUpdateAt, setLastDashboardUpdateAt] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Form states for assignment
  const [assignTeamName, setAssignTeamName] = useState("SDRF Mountain Rescue Unit 2");
  const [assignMinutes, setAssignMinutes] = useState(15);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // 1. Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const [reportsRes, sensorsRes, alertsRes, responsesRes, notifsRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/sensors"),
        fetch("/api/alerts"),
        fetch("/api/responses"),
        fetch("/api/notifications"),
      ]);

      if (reportsRes.ok) {
        const reportsJson = await reportsRes.json();
        if (reportsJson.success && Array.isArray(reportsJson.data)) {
          setReports(reportsJson.data);
          if (selectedReport) {
            const updated = reportsJson.data.find(
              (r: IncidentReportRecord) => r.reportId === selectedReport.reportId
            );
            if (updated) setSelectedReport(updated);
          }
        }
      }

      if (sensorsRes.ok) {
        const sensorsJson = await sensorsRes.json();
        if (sensorsJson.success && Array.isArray(sensorsJson.data)) {
          setSensors(sensorsJson.data);
        }
      }

      if (alertsRes.ok) {
        const alertsJson = await alertsRes.json();
        if (alertsJson.success && Array.isArray(alertsJson.data)) {
          setAlerts(alertsJson.data);
        }
      }

      if (responsesRes.ok) {
        const respJson = await responsesRes.json();
        if (respJson.success && Array.isArray(respJson.data)) {
          setResponses(respJson.data);
        }
      }

      if (notifsRes.ok) {
        const notifsJson = await notifsRes.json();
        if (notifsJson.success && Array.isArray(notifsJson.data)) {
          setNotifications(notifsJson.data);
        }
      }
      setLastDashboardUpdateAt(new Date().toISOString());
    } catch (err) {
      console.warn("[AuthorityDashboard] Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const { isRefreshing, refreshNow } = useAutoRefresh(fetchDashboardData, {
    intervalMs: REFRESH_INTERVALS.AUTHORITY_DASHBOARD,
    enabled: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    refreshNow();
  };

  // 2. Select a report to view details and history
  const handleSelectReport = async (report: IncidentReportRecord) => {
    setSelectedReport(report);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/reports/${report.reportId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.history)) {
          setSelectedHistory(json.history);
        }
      }
    } catch (err) {
      console.warn("Could not fetch report history:", err);
    }
  };

  // 3. Authority Status Updates for Reports
  const handleVerifyReport = async (reportId: string) => {
    if (!isOnline) {
      setActionMessage("Connection required for authority actions. Please reconnect to network.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "VERIFIED",
          responseStatus: "VERIFIED",
          statusMessage: "Cross-verified with Geotechnical Sensor telemetry & field supervisor inspection.",
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setActionMessage(`Report ${reportId} successfully verified!`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error verifying report:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignResponse = async (reportId: string) => {
    if (!isOnline) {
      setActionMessage("Connection required for authority actions. Please reconnect to network.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseStatus: "RESPONSE_ASSIGNED",
          assignedTeam: assignTeamName,
          estimatedResponseMinutes: assignMinutes,
          statusMessage: `${assignTeamName} dispatched from sector command base. ETA: ${assignMinutes} min.`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setActionMessage(`Response team dispatched for ${reportId}!`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error assigning response:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    if (!isOnline) {
      setActionMessage("Connection required for authority actions. Please reconnect to network.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseStatus: "RESOLVED",
          statusMessage: "Hazard cleared by road maintenance & SDRF units. Road corridor open.",
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setActionMessage(`Incident ${reportId} marked as RESOLVED.`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error resolving report:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 4. Authority Status Updates for Early Warning Alerts
  const handleUpdateAlertStatus = async (alertId: string, newStatus: "ACKNOWLEDGED" | "RESOLVED") => {
    if (!isOnline) {
      setActionMessage("Connection required for authority actions. Please reconnect to network.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setActionMessage(`Alert ${alertId} updated to ${newStatus}.`);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error updating alert status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 5. Authority Response Workflow State Transitions
  const handleUpdateResponseStatus = async (
    responseId: string,
    newStatus: ResponseStatus,
    notes?: string
  ) => {
    if (!isOnline) {
      setActionMessage("Connection required for authority actions. Please reconnect to network.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/responses/${responseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      if (res.ok) {
        setActionMessage(`Response assignment ${responseId} transitioned to ${newStatus}.`);
        await fetchDashboardData();
      } else {
        const errJson = await res.json();
        setActionMessage(`Failed to update response: ${errJson.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error updating response assignment status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // KPI Calculations
  const totalIncidents = reports.length;
  const activeAlertsCount = alerts.filter((a) => a.status === "ACTIVE").length;
  const activeResponsesCount = responses.filter(
    (r) => r.status === "ASSIGNED" || r.status === "EN_ROUTE" || r.status === "ON_SITE" || r.status === "PENDING"
  ).length;
  const pendingVerificationCount = reports.filter(
    (r) => r.verificationStatus === "PENDING_VERIFICATION"
  ).length;

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* â”€â”€ 1. Top Header â”€â”€ */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Brand Logo + SentinalX */}
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

        {/* Right: OfflineStatus + Authority Console Pill + Refresh */}
        <div className="flex items-center gap-2">
          <OfflineStatus />
          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold tracking-wider uppercase">
            AUTHORITY OPS
          </span>
          <button
            onClick={handleRefresh}
            title="Refresh dashboard data"
            aria-label="Refresh dashboard"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* â”€â”€ 2. Scrollable Body â”€â”€ */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Offline Banner if running offline */}
        {!isOnline && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-extrabold">OFFLINE MODE:</span> Server connection required to verify reports or dispatch response units.
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
              READ ONLY
            </span>
          </div>
        )}

        {/* Page Title & Operational Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#991b1b] uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>DISASTER MANAGEMENT &amp; RESPONSE ORCHESTRATION</span>
            </div>
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight mt-0.5">
              Authority Operations Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-slate-500 font-medium">
                SDMA Command: early warning triage, unit dispatch &amp; response status lifecycle
              </p>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ML STATUS: LIMITED_DATA (NER-v3)
              </span>
            </div>
          </div>
          <DataFreshness
            timestamp={lastDashboardUpdateAt}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* Action Feedback Banner */}
        {actionMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs"
            >
              âœ•
            </button>
          </div>
        )}

        {/* â”€â”€ 3. Operational KPI Quad â”€â”€ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* KPI 1: Active Response Deployments */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Responses</span>
              <Truck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-black font-mono text-blue-700">{activeResponsesCount}</div>
            <div className="text-[10px] text-blue-600 font-semibold">Units In Field</div>
          </div>

          {/* KPI 2: Active Early Warning Alerts */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Alerts</span>
              <BellRing className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-2xl font-black font-mono text-rose-700">{activeAlertsCount}</div>
            <div className="text-[10px] text-rose-600 font-semibold">Live Warnings</div>
          </div>

          {/* KPI 3: Citizen Reports */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Reports</span>
              <Layers className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{totalIncidents}</div>
            <div className="text-[10px] text-slate-500 font-medium">Citizen Logged</div>
          </div>

          {/* KPI 4: Pending Verification */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-800">
              {pendingVerificationCount}
            </div>
            <div className="text-[10px] text-amber-700 font-semibold">Awaiting review</div>
          </div>
        </div>

        {/* ── 3.5. Command GIS Interactive Spatial Map ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold uppercase tracking-wider text-slate-800">
                NER Disaster Command GIS Map
              </span>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                INCIDENTS &bull; SHELTERS &bull; RISK ZONES
              </span>
            </div>
            <Link
              href="/map"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Full Screen GIS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="relative h-72 sm:h-80 lg:h-[420px] w-full bg-[#edf2f7] overflow-hidden">
            <LeafletMapDynamic
              selectedLocation="tawang"
              reports={reports}
              sensors={sensors}
              onSelectFeature={(feature) => {
                if (feature.type === "report") {
                  const match = reports.find((r) => r.reportId === feature.id || r.id === feature.id);
                  if (match) handleSelectReport(match);
                }
              }}
              riskResult={null}
            />
          </div>
        </div>

        {/* ── 4. Active Response Deployment & Unit Operations ── */}
        <div className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Active Response Deployments</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Multi-agency dispatch, clearance units &amp; site triage lifecycle
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-700">
              {responses.length} Assignments
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {responses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active response assignments in queue.
              </div>
            ) : (
              responses.map((resp) => (
                <div
                  key={resp.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-900">
                        {resp.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          resp.priority === "CRITICAL"
                            ? "bg-rose-100 text-[#991b1b]"
                            : resp.priority === "HIGH"
                            ? "bg-orange-100 text-orange-900"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {resp.priority} Priority
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          resp.status === "EN_ROUTE"
                            ? "bg-blue-100 text-blue-800"
                            : resp.status === "ON_SITE"
                            ? "bg-emerald-100 text-emerald-800 animate-pulse"
                            : resp.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        â— {resp.status.replace("_", " ")}
                      </span>
                      {resp.estimatedResponseMinutes && (
                        <span className="text-[10px] font-mono text-slate-500">
                          ETA: ~{resp.estimatedResponseMinutes}m
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{resp.team.name}</span>
                      <span className="text-[10px] font-normal text-slate-500 font-mono">
                        ({resp.team.type})
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{resp.location.name}</span>
                      {resp.alertId && (
                        <span className="font-mono text-[10px] text-slate-400 pl-1">
                          [Linked: {resp.alertId}]
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Transition Buttons for Authority */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto flex-wrap">
                    {resp.status === "PENDING" && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateResponseStatus(resp.id, "ASSIGNED")}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] tracking-wider transition-colors"
                      >
                        ASSIGN UNIT
                      </button>
                    )}
                    {resp.status === "ASSIGNED" && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateResponseStatus(resp.id, "EN_ROUTE")}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] tracking-wider transition-colors"
                      >
                        DISPATCH EN ROUTE
                      </button>
                    )}
                    {resp.status === "EN_ROUTE" && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateResponseStatus(resp.id, "ON_SITE")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] tracking-wider transition-colors"
                      >
                        MARK ON SITE
                      </button>
                    )}
                    {resp.status === "ON_SITE" && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateResponseStatus(resp.id, "COMPLETED")}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] tracking-wider transition-colors"
                      >
                        MARK COMPLETED
                      </button>
                    )}
                    {resp.reportId && (
                      <Link
                        href={`/report/track?id=${resp.reportId}`}
                        target="_blank"
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px]"
                      >
                        TRACK
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* â”€â”€ 5. Early Warning Alerts & Incident Feed â”€â”€ */}
        <div className="rounded-2xl border border-rose-200 bg-white shadow-sm overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#991b1b]" />
                <span>Live Early Warning Advisories</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Automated multi-source threshold triggers in NER sectors
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-600">
              {alerts.length} Warnings
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active early warning advisories.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-100 text-[#991b1b]"
                            : alert.severity === "HIGH"
                            ? "bg-orange-100 text-orange-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {alert.severity} â€¢ {alert.id}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          alert.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : alert.status === "ACKNOWLEDGED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {alert.status}
                      </span>
                      {alert.riskScore !== null && (
                        <span className="text-[10px] font-mono text-slate-600">
                          Score: {alert.riskScore.toFixed(1)}/100
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{alert.title}</h3>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{alert.message}</p>
                  </div>

                  {/* Quick Action Buttons for Authority */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                    {alert.status === "ACTIVE" && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateAlertStatus(alert.id, "ACKNOWLEDGED")}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] tracking-wider transition-colors"
                      >
                        ACKNOWLEDGE
                      </button>
                    )}
                    {alert.status !== "RESOLVED" && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateAlertStatus(alert.id, "RESOLVED")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] tracking-wider transition-colors"
                      >
                        RESOLVE
                      </button>
                    )}
                    <Link
                      href="/map"
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px]"
                    >
                      MAP
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* â”€â”€ 6. Citizen Incident Triage Queue & Console â”€â”€ */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Citizen Incident Triage Queue
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Select an incident to review telemetry, verify &amp; dispatch units
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              {reports.length} Incidents
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                No incidents in queue. All corridors clear.
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  className={`p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    selectedReport?.reportId === report.reportId ? "bg-rose-50/50 ring-1 ring-rose-200" : ""
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-900">
                        {report.reportId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          report.severity >= 4
                            ? "bg-rose-100 text-rose-800"
                            : report.severity === 3
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        Sev {report.severity} â€¢ {report.severity >= 4 ? "High Risk" : report.severity === 3 ? "Moderate" : "Low"}
                      </span>

                      {report.verificationStatus === "VERIFIED" ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          âœ“ Verified
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          â— Pending
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{report.locationName}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-1">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {report.responseStatus.replace("_", " ")}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* â”€â”€ 7. Selected Incident Detail & Triage Action Console â”€â”€ */}
        {selectedReport && (
          <div className="rounded-2xl border-2 border-rose-200 bg-white p-4 sm:p-5 shadow-md space-y-4 animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase text-[#991b1b] tracking-wider">
                    INCIDENT DETAILS
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900">
                    {selectedReport.reportId}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedReport.hazardType} â€¢ {selectedReport.locationName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs"
              >
                âœ•
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">Severity</span>
                <div className="font-bold text-slate-900">
                  Level {selectedReport.severity} ({selectedReport.severity >= 4 ? "High Risk" : "Moderate"})
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">Verification</span>
                <div className={`font-bold ${selectedReport.verificationStatus === "VERIFIED" ? "text-emerald-700" : "text-amber-700"}`}>
                  {selectedReport.verificationStatus.replace("_", " ")}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Citizen Description</span>
              <p className="text-xs text-slate-700 leading-relaxed">{selectedReport.description}</p>
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
                Authority Triage Actions
              </span>

              {selectedReport.verificationStatus === "PENDING_VERIFICATION" && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleVerifyReport(selectedReport.reportId)}
                  className="w-full h-10 rounded-xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isUpdatingStatus ? "VERIFYING..." : "VERIFY HAZARD REPORT"}</span>
                </button>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-600">
                    Assign Response Unit
                  </label>
                  <input
                    type="text"
                    value={assignTeamName}
                    onChange={(e) => setAssignTeamName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900"
                    placeholder="Team name"
                  />
                </div>

                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleAssignResponse(selectedReport.reportId)}
                  className="w-full h-9 rounded-lg bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isUpdatingStatus ? "DISPATCHING..." : "DISPATCH & ASSIGN TEAM"}</span>
                </button>
              </div>

              {selectedReport.responseStatus !== "RESOLVED" && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleResolveReport(selectedReport.reportId)}
                  className="w-full h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>MARK HAZARD RESOLVED / CLEARED</span>
                </button>
              )}

              <Link
                href={`/report/track?id=${selectedReport.reportId}`}
                target="_blank"
                className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all block text-center leading-9"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OPEN CITIZEN TRACK REPORT VIEW</span>
              </Link>
            </div>
          </div>
        )}

        {/* â”€â”€ 8. Notification Outbox (Honest Prototype) â”€â”€ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <RadioTower className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Notification Outbox (Simulated Prototype)
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              {notifications.length} Events Queued
            </span>
          </div>

          <div className="space-y-1.5">
            {notifications.slice(0, 4).map((notif) => (
              <div
                key={notif.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 font-mono text-[10px]">
                      [{notif.channel}]
                    </span>
                    <span className="font-semibold text-slate-700 truncate">{notif.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{notif.simulatedDeliveryNote}</p>
                </div>
                <span
                  className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    notif.status === "QUEUED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {notif.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* â”€â”€ 9. Geotechnical Sensor Network Telemetry Grid â”€â”€ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Geotechnical Sensor Network
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {sensors.filter((s) => s.status === "ONLINE").length}/{sensors.length} ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sensors.map((sensor) => (
              <div
                key={sensor.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 font-mono">{sensor.sensorId}</span>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{sensor.status}</span>
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-700 truncate">
                  {sensor.stationName}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                  <span>Pore: {sensor.porePressure.toFixed(1)} kPa</span>
                  <span>Moist: {sensor.soilMoisture.toFixed(0)}%</span>
                  <span>Tilt: {sensor.tiltAngle.toFixed(1)}Â°</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              DEMO SENSORS â€¢ PROTOTYPE GEOTECHNICAL GRID
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="pt-2 text-center">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            "SENTINALX DISASTER MANAGEMENT CONSOLE • GOVT OF INDIA / MDONER (SIH26001)"
          </p>
        </div>
      </div>
    </div>
  );
}
