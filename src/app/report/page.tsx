"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Camera,
  Info,
  Phone,
  Compass,
  Upload,
  Check,
  Mountain,
  Droplets,
  ShieldAlert,
} from "lucide-react";

type HazardType = "Landslide" | "Flooding" | "Road Blockage" | "Other Hazard";
type SeverityLevel = "Low" | "Moderate" | "High" | "Critical";

export default function FieldReportScreen() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [hazardType, setHazardType] = useState<HazardType>("Landslide");
  const [severity, setSeverity] = useState<SeverityLevel>("High");
  const [description, setDescription] = useState(
    "Observed rockfall and debris accumulation on highway shoulder near Km 4. Road partially blocked."
  );
  const [location, setLocation] = useState("Tawang Sector, North Eastern Region");
  const [photoSelected, setPhotoSelected] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated Report ID
  const reportId = "SX-LS-2048";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Red Diamond Logo + SentinelX */}
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
            SentinelX
          </span>
        </Link>

        {/* Right: Regional Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[#991b1b] tracking-wide">
            Regional: Stable
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* ========================================================= */}
        {/* STATE A: REPORT SUBMITTED CONFIRMATION (MATCHES SCREENSHOT) */}
        {/* ========================================================= */}
        {isSubmitted ? (
          <div className="space-y-4 animate-fadeIn">
            {/* 1. Success Hero Checkmark & Title */}
            <div className="flex flex-col items-center text-center pt-2 pb-1">
              <div className="w-14 h-14 rounded-full bg-[#065f46] flex items-center justify-center text-white shadow-lg mb-3">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">
                REPORT SUBMITTED
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-1 max-w-xs">
                Your critical report has been logged and forwarded.
              </p>
            </div>

            {/* 2. Report ID / Status / Location Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
              {/* Row 1: Report ID */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">
                  REPORT ID
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
                <span className="font-extrabold text-[#065f46] flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#065f46] text-white flex items-center justify-center text-[9px]">
                    ✓
                  </span>
                  <span>VERIFIED • RECEIVED</span>
                </span>
              </div>

              {/* Row 3: Location */}
              <div className="flex items-start justify-between text-xs pt-1 border-t border-slate-100 gap-3">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">
                  LOCATION
                </span>
                <span className="font-bold text-slate-900 text-right leading-tight">
                  {location}
                </span>
              </div>
            </div>

            {/* 3. Progress Checklist & Estimated Response Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
              {/* 4 Verified Checklist Items */}
              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#065f46] stroke-[2.5] shrink-0" />
                  <span>Report submitted</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#065f46] stroke-[2.5] shrink-0" />
                  <span>Verified by response system</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#065f46] stroke-[2.5] shrink-0" />
                  <span>Authorities notified</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#065f46] stroke-[2.5] shrink-0" />
                  <span>Response team assigned</span>
                </div>
              </div>

              {/* Estimated Response Box */}
              <div className="p-3 rounded-xl bg-[#e2e8f0]/60 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  ESTIMATED RESPONSE
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-[#991b1b]">
                  10–20 min
                </span>
              </div>
            </div>

            {/* 4. Warning Box: AUTHORITIES NOTIFIED — STAY AWAY */}
            <div className="p-3.5 rounded-xl bg-[#fee2e2]/70 border border-[#fca5a5]/80 flex items-center gap-3">
              {/* Solid Red Warning Triangle */}
              <div className="w-6 h-6 flex items-center justify-center text-[#b91c1c] shrink-0">
                <AlertTriangle className="w-6 h-6 fill-[#b91c1c] stroke-white stroke-[1.5]" />
              </div>
              <div className="text-[#991b1b] font-extrabold text-xs uppercase tracking-wide leading-snug">
                AUTHORITIES NOTIFIED — STAY AWAY
              </div>
            </div>

            {/* 5. Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Track Report */}
              <Link href="/report/track" className="block w-full">
                <button
                  type="button"
                  className="w-full h-11 rounded-xl bg-[#475569] hover:bg-[#334155] text-white font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                >
                  <Compass className="w-4 h-4" />
                  <span>TRACK REPORT</span>
                </button>
              </Link>

              {/* Return to Monitor */}
              <Link href="/" className="block w-full">
                <button
                  type="button"
                  className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center transition-all active:scale-[0.99]"
                >
                  <span>RETURN TO MONITOR</span>
                </button>
              </Link>

              {/* Call Emergency Services */}
              <a
                href="tel:1070"
                className="w-full h-11 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] block text-center leading-[44px]"
              >
                <div className="flex items-center justify-center gap-2 h-full">
                  <Phone className="w-4 h-4 fill-white" />
                  <span>CALL EMERGENCY SERVICES</span>
                </div>
              </a>
            </div>

            {/* 6. Demo / Prototype Data Footer */}
            <div className="pt-2 pb-1 text-center">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
                DEMO / PROTOTYPE DATA
              </span>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* STATE B: FIELD REPORT INPUT FORM                          */
          /* ========================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header Subtitle */}
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                <span>NORTH EASTERN REGION • FIELD REPORT</span>
              </div>
              <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
                REPORT A HAZARD
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Log ground truth landslide, flood, or blockage to alert responders.
              </p>
            </div>

            {/* 1. Report Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Report Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: "Landslide" as HazardType, icon: Mountain },
                  { type: "Flooding" as HazardType, icon: Droplets },
                  { type: "Road Blockage" as HazardType, icon: ShieldAlert },
                  { type: "Other Hazard" as HazardType, icon: AlertTriangle },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = hazardType === item.type;

                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setHazardType(item.type)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-1 ring-emerald-500"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? "text-emerald-700" : "text-slate-500"
                        }`}
                      />
                      <span className="text-xs font-bold">{item.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Severity Level Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Severity Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["Low", "Moderate", "High", "Critical"] as SeverityLevel[]).map((level) => {
                  const isSelected = severity === level;
                  const colors = {
                    Low: "bg-emerald-100 text-emerald-800 border-emerald-400",
                    Moderate: "bg-amber-100 text-amber-800 border-amber-400",
                    High: "bg-orange-100 text-orange-800 border-orange-400",
                    Critical: "bg-rose-100 text-rose-800 border-rose-400",
                  };

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className={`py-2 px-1 rounded-xl border text-center text-xs font-bold transition-all ${
                        isSelected
                          ? `${colors[level]} ring-2 ring-slate-800 font-extrabold`
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Current Location Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Current Location
              </label>
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{location}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-bold">
                  GPS Locked
                </span>
              </div>
            </div>

            {/* 4. Description Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Description & Observations
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe rock size, road condition, tension fissures, or trapped vehicles..."
                className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 5. Photo Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Photo / Evidence
              </label>
              <div
                onClick={() => setPhotoSelected(!photoSelected)}
                className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                {photoSelected ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hazard_Evidence_Tawang_Km4.jpg (2.4 MB Attached)</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">
                      Tap to capture or upload photo
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Supports offline queueing if network is weak
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 6. Guidance Notice */}
            <div className="rounded-xl bg-[#dbeafe]/70 border border-[#bfdbfe]/80 p-3 flex items-center gap-2.5 text-xs text-slate-700 shadow-sm">
              <Info className="w-4 h-4 text-slate-700 shrink-0" />
              <p className="font-medium text-slate-700 leading-snug">
                Your report will be automatically cross-verified with regional geotechnical sensor grid.
              </p>
            </div>

            {/* 7. Submit Report Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#00b074] hover:bg-[#009b66] text-white font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>SUBMITTING REPORT...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>SUBMIT REPORT</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="pt-2 pb-1 text-center">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
                DEMO / PROTOTYPE DATA
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
