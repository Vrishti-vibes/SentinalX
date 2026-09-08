"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Camera,
  AlertTriangle,
  RotateCw,
  Phone,
  Timer,
  ExternalLink,
  Check,
  ShieldCheck,
  WifiOff,
  CloudUpload,
} from "lucide-react";
import { queuePendingReport } from "@/lib/offline/storage";
import { OfflineStatus } from "@/components/OfflineStatus";

export default function FieldReportScreen() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);

  // Form State
  const [hazardType, setHazardType] = useState("Landslide");
  const [severity, setSeverity] = useState<"Low" | "Moderate" | "High" | "Critical">("High");
  const [description, setDescription] = useState(
    "Observed rockfall and debris accumulation on highway shoulder near Km 4. Road partially blocked."
  );
  const [location, setLocation] = useState("Tawang Sector, North Eastern Region");
  const [photoSelected, setPhotoSelected] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated Report ID
  const [reportId, setReportId] = useState("SX-LS-2048");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      hazardType: hazardType as "Landslide" | "Flooding" | "Road Blockage" | "Other Hazard",
      severity,
      description,
      locationName: location,
      photoUrl: photoSelected ? "https://demo.sentinalx.ner/evidence/Hazard_Evidence.jpg" : null,
    };

    // 1. If browser is offline, queue locally immediately
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const pending = queuePendingReport(payload);
      setReportId(pending.localReportId);
      setIsOfflineQueued(true);
      setIsSubmitting(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 2. If online, attempt server submission
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.reportId) {
          setReportId(json.reportId);
        }
        setIsOfflineQueued(false);
      } else {
        // Fallback to offline queue on server error
        const pending = queuePendingReport(payload);
        setReportId(pending.localReportId);
        setIsOfflineQueued(true);
      }
    } catch (err) {
      console.warn("Report API submission error, queueing offline:", err);
      const pending = queuePendingReport(payload);
      setReportId(pending.localReportId);
      setIsOfflineQueued(true);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Red Diamond Logo + SentinalX */}
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

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4 max-w-2xl mx-auto w-full">
        {/* ========================================================= */}
        {/* STATE A: REPORT SUBMITTED CONFIRMATION */}
        {/* ========================================================= */}
        {isSubmitted ? (
          <div className="space-y-4 animate-fadeIn">
            {/* 1. Success Hero Checkmark & Title */}
            <div className="flex flex-col items-center text-center pt-2 pb-1">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg mb-3 ${
                  isOfflineQueued ? "bg-amber-600" : "bg-[#065f46]"
                }`}
              >
                {isOfflineQueued ? (
                  <CloudUpload className="w-8 h-8 stroke-[2.5]" />
                ) : (
                  <Check className="w-8 h-8 stroke-[3]" />
                )}
              </div>
              <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">
                {isOfflineQueued ? "REPORT SAVED OFFLINE" : "REPORT SUBMITTED"}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-1 max-w-xs">
                {isOfflineQueued
                  ? "Your report is stored safely on this device and will sync automatically when network returns."
                  : "Your critical report has been logged and forwarded to emergency authorities."}
              </p>
            </div>

            {/* 2. Report ID / Status / Location Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
              {/* Row 1: Report ID */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">
                  {isOfflineQueued ? "LOCAL TEMPORARY ID" : "REPORT ID"}
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {reportId}
                </span>
              </div>

              {/* Row 2: Status */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">
                  STATUS
                </span>
                <span
                  className={`font-black uppercase tracking-wider ${
                    isOfflineQueued ? "text-amber-700" : "text-[#b91c1c]"
                  }`}
                >
                  {isOfflineQueued ? "QUEUED FOR SYNC (OFFLINE)" : "AUTHORITIES NOTIFIED"}
                </span>
              </div>

              {/* Row 3: Location */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">
                  LOCATION
                </span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">
                  {location}
                </span>
              </div>
            </div>

            {/* 3. Red Warning Card */}
            <div className="rounded-2xl bg-[#b91c1c] p-4 text-white shadow-md flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6 text-white stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider">
                  {isOfflineQueued ? "SAFETY FIRST" : "AUTHORITIES NOTIFIED"}
                </div>
                <div className="text-xs font-bold text-white/95 leading-snug">
                  {isOfflineQueued
                    ? "STAY AWAY FROM UNSTABLE SLOPES. Move towards safe ground or designated shelters."
                    : "STAY AWAY FROM THE AREA. An active hazard zone is undergoing response."}
                </div>
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <Link
                href={`/report/track?id=${reportId}`}
                className="w-full h-12 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
              >
                <span>Track Report Status</span>
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setIsOfflineQueued(false);
                }}
                className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs tracking-wider flex items-center justify-center transition-all active:scale-[0.99]"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* STATE B: CITIZEN REPORT FORM */
          /* ========================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Section */}
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block">
                • CITIZEN FIELD OBSERVATION •
              </span>
              <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight mt-0.5">
                Report Landslide Hazard
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Log real-time observations to update geotechnical risk models
              </p>
            </div>

            {/* Form Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              {/* Field 1: Hazard Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Hazard Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Landslide", "Flooding", "Road Blockage", "Other Hazard"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHazardType(type)}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                        hazardType === type
                          ? "bg-[#181d24] text-white border-[#181d24] shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Severity Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Observed Severity
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["Low", "Moderate", "High", "Critical"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`h-9 rounded-xl text-[11px] font-bold border transition-all ${
                        severity === lvl
                          ? lvl === "Critical"
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : lvl === "High"
                            ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                            : lvl === "Moderate"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Location / Sector
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-400"
                    placeholder="e.g. NH-13 Km 4, Tawang"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Field 4: Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Hazard Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400 leading-relaxed"
                  placeholder="Describe slope movement, road obstruction, water runoff..."
                />
              </div>

              {/* Field 5: Photo Evidence */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Photo Evidence
                </label>
                <div
                  onClick={() => setPhotoSelected(!photoSelected)}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                    photoSelected
                      ? "border-emerald-300 bg-emerald-50/40 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Camera className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                  <span className="text-xs font-bold block">
                    {photoSelected ? "Hazard_Evidence_Attached.jpg (Click to change)" : "Attach Photo Evidence"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Images are queued locally if submitted offline
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>LOGGING REPORT...</span>
                </>
              ) : (
                <span>SUBMIT FIELD REPORT</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


