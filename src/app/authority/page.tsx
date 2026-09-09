"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";

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

  // Prototype Response Teams list
  const PROTOTYPE_RESPONSE_TEAMS = [
    "Tawang Response Unit",
    "Gangtok Highway Response Unit",
    "Shillong Field Unit",
    "Guwahati Emergency Unit",
    "Kohima Terrain Unit",
  ] as const;

  // Form states for assignment
  const [assignTeamName, setAssignTeamName] = useState<string>("Tawang Response Unit");
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
          } else if (reportsJson.data.length > 0) {
            handleSelectReport(reportsJson.data[0]);
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
    if (report.assignedTeam) {
      setAssignTeamName(report.assignedTeam);
    } else {
      setAssignTeamName(PROTOTYPE_RESPONSE_TEAMS[0]);
    }
    setActionMessage(null);
    try {
      const res = await fetch(`/api/reports/${report.reportId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (json.data) setSelectedReport(json.data);
          if (Array.isArray(json.history)) setSelectedHistory(json.history);
        }
      }
    } catch (err) {
      console.warn("Could not fetch report history:", err);
    }
  };

  // 3. Authority Workflow Status Updates for Reports
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
          statusMessage: "Hazard verified by authority command.",
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Report ${reportId} successfully verified!`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      } else {
        setActionMessage(json.error || "Failed to verify report.");
      }
    } catch (err) {
      console.error("Error verifying report:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRejectReport = async (reportId: string) => {
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
          verificationStatus: "REJECTED",
          responseStatus: "REJECTED",
          statusMessage: "Report rejected upon field investigation.",
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Report ${reportId} marked as REJECTED.`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      } else {
        setActionMessage(json.error || "Failed to reject report.");
      }
    } catch (err) {
      console.error("Error rejecting report:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignTeam = async (reportId: string) => {
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
          assignedTeam: assignTeamName,
          statusMessage: `Response team ${assignTeamName} assigned to incident.`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Response team ${assignTeamName} assigned to ${reportId}!`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      } else {
        setActionMessage(json.error || "Failed to assign team.");
      }
    } catch (err) {
      console.error("Error assigning team:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDispatchReport = async (reportId: string) => {
    if (!isOnline) {
      setActionMessage("Connection required for authority actions. Please reconnect to network.");
      return;
    }
    setIsUpdatingStatus(true);
    const teamToDispatch = assignTeamName || selectedReport?.assignedTeam || PROTOTYPE_RESPONSE_TEAMS[0];
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseStatus: "DISPATCHED",
          assignedTeam: teamToDispatch,
          estimatedResponseMinutes: assignMinutes || 15,
          statusMessage: `${teamToDispatch} dispatched from sector command base. ETA: ${assignMinutes || 15} min.`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Response unit ${teamToDispatch} dispatched for ${reportId}!`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      } else {
        setActionMessage(json.error || "Failed to dispatch unit.");
      }
    } catch (err) {
      console.error("Error dispatching unit:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOnSiteReport = async (reportId: string) => {
    if (!isOnline) {
      setActionMessage("Connection required for authority actions. Please reconnect to network.");
      return;
    }
    setIsUpdatingStatus(true);
    const team = selectedReport?.assignedTeam || assignTeamName || "Response Unit";
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseStatus: "ON_SITE",
          statusMessage: `${team} confirmed on site and operating.`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Response unit marked ON SITE for ${reportId}!`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      } else {
        setActionMessage(json.error || "Failed to update status to On Site.");
      }
    } catch (err) {
      console.error("Error marking on site:", err);
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
          statusMessage: "Hazard cleared by road maintenance & response units. Road corridor open.",
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Incident ${reportId} marked as RESOLVED.`);
        if (json.data) setSelectedReport(json.data);
        if (json.history) setSelectedHistory(json.history);
        await fetchDashboardData();
      } else {
        setActionMessage(json.error || "Failed to resolve incident.");
      }
    } catch (err) {
      console.error("Error resolving report:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 4. Authority Status Updates for Early Warning Alerts
  const handleTriggerEmergencyBroadcast = async () => {
    if (!isOnline) {
      setActionMessage("Network connection required to evaluate alerts.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/alerts/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rainfallMm: 58.4,
          porePressureKpa: 56.2,
          tiltDeg: 9.4,
          soilMoisturePercent: 88,
        }),
      });
      if (res.ok) {
        setActionMessage("Emergency Alert Event evaluated and dispatched across regional early warning grid!");
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error triggering broadcast:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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

  // 6 Dynamic Dashboard KPI Calculations from Reports (Requirement 7)
  const totalReportsCount = reports.length;
  const pendingCount = reports.filter(
    (r) =>
      r.responseStatus === "NEW" ||
      r.responseStatus === "UNDER_REVIEW" ||
      r.responseStatus === "SUBMITTED" ||
      r.verificationStatus === "PENDING_VERIFICATION"
  ).length;
  const verifiedCount = reports.filter(
    (r) =>
      r.responseStatus === "VERIFIED" ||
      (r.verificationStatus === "VERIFIED" &&
        r.responseStatus !== "DISPATCHED" &&
        r.responseStatus !== "ON_SITE" &&
        r.responseStatus !== "RESOLVED" &&
        r.responseStatus !== "REJECTED")
  ).length;
  const dispatchedCount = reports.filter(
    (r) => r.responseStatus === "DISPATCHED" || r.responseStatus === "RESPONSE_ASSIGNED"
  ).length;
  const onSiteCount = reports.filter((r) => r.responseStatus === "ON_SITE").length;
  const resolvedCount = reports.filter((r) => r.responseStatus === "RESOLVED").length;

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

        {/* ── 3. Dynamic Operational KPI Hex (Requirement 7) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* KPI 1: Total Reports */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Reports</span>
              <Layers className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{totalReportsCount}</div>
            <div className="text-[10px] text-slate-500 font-medium">All NER Corridors</div>
          </div>

          {/* KPI 2: Pending */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-800">{pendingCount}</div>
            <div className="text-[10px] text-amber-700 font-semibold">Awaiting Review</div>
          </div>

          {/* KPI 3: Verified */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Verified</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-800">{verifiedCount}</div>
            <div className="text-[10px] text-emerald-700 font-semibold">Telemetry Confirmed</div>
          </div>

          {/* KPI 4: Dispatched */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-800 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Dispatched</span>
              <Truck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-black font-mono text-blue-800">{dispatchedCount}</div>
            <div className="text-[10px] text-blue-700 font-semibold">En Route to Site</div>
          </div>

          {/* KPI 5: On Site */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-800 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">On Site</span>
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-2xl font-black font-mono text-purple-800">{onSiteCount}</div>
            <div className="text-[10px] text-purple-700 font-semibold">Active Response</div>
          </div>

          {/* KPI 6: Resolved */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-teal-800 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Resolved</span>
              <Check className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-2xl font-black font-mono text-teal-800">{resolvedCount}</div>
            <div className="text-[10px] text-teal-700 font-semibold">Sector Cleared</div>
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

        {/* ── 6. Citizen Incident Triage Queue & Console (Requirement 1) ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden w-full max-w-full">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Citizen Incident Report Queue
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Select an incident to review telemetry, verify status, assign teams &amp; dispatch units
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {reports.length} Reports
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                No incidents in queue. All corridors clear.
              </div>
            ) : (
              reports.map((report) => {
                const isSelected = selectedReport?.reportId === report.reportId;
                const statusColor =
                  report.responseStatus === "RESOLVED"
                    ? "bg-teal-100 text-teal-800 border-teal-200"
                    : report.responseStatus === "ON_SITE"
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : report.responseStatus === "DISPATCHED" || report.responseStatus === "RESPONSE_ASSIGNED"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : report.responseStatus === "VERIFIED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : report.responseStatus === "REJECTED"
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : "bg-amber-100 text-amber-800 border-amber-200";

                return (
                  <div
                    key={report.id || report.reportId}
                    data-testid={`report-card-${report.reportId}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectReport(report)}
                    className={`p-3.5 sm:p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0 ${
                      isSelected ? "bg-blue-50/60 ring-2 ring-blue-500/20" : ""
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Top Badges Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {report.reportId}
                        </span>
                        <span className="font-extrabold text-xs text-slate-800">
                          {report.hazardType}
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
                          Sev {report.severity} • {report.severity >= 4 ? "High Risk" : report.severity === 3 ? "Moderate" : "Low"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide border uppercase ${statusColor}`}>
                          {report.responseStatus.replace("_", " ")}
                        </span>
                      </div>

                      {/* Location & Team Row */}
                      <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold flex-wrap">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{report.locationName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-normal">
                          <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{report.assignedTeam || "Unassigned"}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-600 line-clamp-1 break-words">
                        {report.description}
                      </p>
                    </div>

                    {/* Right side: Time & select arrow */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {report.submittedAt
                            ? new Date(report.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "--"}
                        </span>
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                        <span>{isSelected ? "Selected" : "Review"}</span>
                        <ChevronRight className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 7. Selected Incident Detail & Authority Workflow Console (Requirement 2, 3, 4, 5) ── */}
        {selectedReport && (
          <div className="rounded-2xl border-2 border-blue-200 bg-white p-4 sm:p-6 shadow-md space-y-5 animate-fadeIn w-full max-w-full">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold uppercase text-blue-900 tracking-wider">
                    INCIDENT REPORT DOSSIER
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedReport.reportId}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 break-words">
                  {selectedReport.hazardType} • {selectedReport.locationName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs shrink-0 transition-colors"
                title="Close details"
              >
                ✕
              </button>
            </div>

            {/* Core Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5 min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">Severity</span>
                <div className="font-extrabold text-slate-900 truncate">
                  Level {selectedReport.severity} ({selectedReport.severity >= 4 ? "High Risk" : selectedReport.severity === 3 ? "Moderate" : "Low"})
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5 min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">Current Status</span>
                <div className="font-extrabold text-blue-700 uppercase truncate">
                  {selectedReport.responseStatus.replace("_", " ")}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5 min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">Assigned Team</span>
                <div className="font-extrabold text-slate-900 truncate">
                  {selectedReport.assignedTeam || "None Assigned"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5 min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">Coordinates</span>
                <div className="font-mono text-slate-700 font-bold truncate">
                  {selectedReport.latitude.toFixed(4)}°N, {selectedReport.longitude.toFixed(4)}°E
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Citizen Description</span>
              <p className="text-xs text-slate-700 leading-relaxed break-words">{selectedReport.description}</p>
            </div>

            {/* ── Action Buttons Control Console ── */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Authority Command Actions</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Step-by-step verified workflow
                </span>
              </div>

              {/* State Transition Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* 1. VERIFY Button */}
                {(() => {
                  const canVerify =
                    selectedReport.responseStatus === "NEW" ||
                    selectedReport.responseStatus === "UNDER_REVIEW" ||
                    selectedReport.responseStatus === "SUBMITTED" ||
                    selectedReport.verificationStatus === "PENDING_VERIFICATION";
                  return (
                    <button
                      type="button"
                      data-testid="btn-verify-report"
                      disabled={isUpdatingStatus || !canVerify}
                      onClick={() => handleVerifyReport(selectedReport.reportId)}
                      className={`h-11 px-3 rounded-xl font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs ${
                        canVerify
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isUpdatingStatus ? "UPDATING..." : "VERIFY"}</span>
                    </button>
                  );
                })()}

                {/* 2. REJECT Button */}
                {(() => {
                  const canReject =
                    selectedReport.responseStatus !== "RESOLVED" &&
                    selectedReport.responseStatus !== "REJECTED";
                  return (
                    <button
                      type="button"
                      data-testid="btn-reject-report"
                      disabled={isUpdatingStatus || !canReject}
                      onClick={() => handleRejectReport(selectedReport.reportId)}
                      className={`h-11 px-3 rounded-xl font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs ${
                        canReject
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 cursor-pointer"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>REJECT</span>
                    </button>
                  );
                })()}

                {/* 3. DISPATCH Button */}
                {(() => {
                  const canDispatch =
                    selectedReport.responseStatus === "VERIFIED" ||
                    (selectedReport.verificationStatus === "VERIFIED" &&
                      selectedReport.responseStatus !== "DISPATCHED" &&
                      selectedReport.responseStatus !== "ON_SITE" &&
                      selectedReport.responseStatus !== "RESOLVED" &&
                      selectedReport.responseStatus !== "REJECTED");
                  return (
                    <button
                      type="button"
                      data-testid="btn-dispatch-report"
                      disabled={isUpdatingStatus || !canDispatch}
                      onClick={() => handleDispatchReport(selectedReport.reportId)}
                      className={`h-11 px-3 rounded-xl font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs ${
                        canDispatch
                          ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>DISPATCH</span>
                    </button>
                  );
                })()}

                {/* 4. ON SITE Button */}
                {(() => {
                  const canOnSite =
                    selectedReport.responseStatus === "DISPATCHED" ||
                    selectedReport.responseStatus === "RESPONSE_ASSIGNED";
                  return (
                    <button
                      type="button"
                      data-testid="btn-onsite-report"
                      disabled={isUpdatingStatus || !canOnSite}
                      onClick={() => handleOnSiteReport(selectedReport.reportId)}
                      className={`h-11 px-3 rounded-xl font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs ${
                        canOnSite
                          ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>ON SITE</span>
                    </button>
                  );
                })()}

                {/* 5. RESOLVE Button */}
                {(() => {
                  const canResolve =
                    selectedReport.responseStatus === "ON_SITE" ||
                    selectedReport.responseStatus === "DISPATCHED" ||
                    selectedReport.responseStatus === "RESPONSE_ASSIGNED";
                  return (
                    <button
                      type="button"
                      data-testid="btn-resolve-report"
                      disabled={isUpdatingStatus || !canResolve}
                      onClick={() => handleResolveReport(selectedReport.reportId)}
                      className={`h-11 px-3 rounded-xl font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs ${
                        canResolve
                          ? "bg-teal-700 hover:bg-teal-800 text-white cursor-pointer"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>RESOLVE</span>
                    </button>
                  );
                })()}
              </div>

              {/* Team Assignment Box (Requirement 3) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-600 block">
                  Select &amp; Assign Prototype Response Team (Requirement 3)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={assignTeamName}
                    onChange={(e) => setAssignTeamName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
                  >
                    {PROTOTYPE_RESPONSE_TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    data-testid="btn-assign-team"
                    disabled={isUpdatingStatus || selectedReport.responseStatus === "REJECTED" || selectedReport.responseStatus === "RESOLVED"}
                    onClick={() => handleAssignTeam(selectedReport.reportId)}
                    className="h-9 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ASSIGN TEAM</span>
                  </button>
                </div>
              </div>

              {/* Direct Link to Citizen Track Report View */}
              <Link
                href={`/report/track?id=${selectedReport.reportId}`}
                target="_blank"
                className="w-full h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all block text-center leading-10 shadow-2xs"
              >
                <ExternalLink className="w-4 h-4 text-blue-700" />
                <span>OPEN CITIZEN TRACK REPORT VIEW</span>
              </Link>
            </div>

            {/* ── Status History Timeline (Requirement 5) ── */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Status Audit History (Timestamped)
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-bold">
                  {selectedHistory.length} Events
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {selectedHistory.length === 0 ? (
                  <div className="text-xs text-slate-500 p-2">No history recorded yet.</div>
                ) : (
                  selectedHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] text-blue-700 uppercase">
                            [{item.status}]
                          </span>
                          <span className="text-[11px] font-semibold text-slate-800 break-words">
                            {item.message}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ 8. Notification Outbox (Honest Prototype) â”€â”€ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <RadioTower className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Notification Dispatch Outbox (Multi-Channel Routing)
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


