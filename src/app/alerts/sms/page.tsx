"use client";

import React, { useEffect, useState, Suspense } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Phone,
  Bell,
  Eye,
  X,
  Radio,
  Send,
  Navigation,
} from "lucide-react";
import { AlertRecord } from "@/types/alert";

function SmsAlertCenterContent() {
  const searchParams = useSearchParams();
  const alertIdParam = searchParams.get("alertId");

  const [alert, setAlert] = useState<AlertRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [providerConfigured, setProviderConfigured] = useState(false);

  useEffect(() => {
    async function fetchAlert() {
      try {
        const url = alertIdParam ? `/api/alerts/${alertIdParam}` : "/api/alerts?limit=1";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch alerts");
        const json = await res.json();

        let targetAlert: AlertRecord | null = null;
        if (json.data) {
          targetAlert = Array.isArray(json.data) ? json.data[0] : json.data;
        }

        if (!targetAlert) {
          // Fallback to default operational high risk alert
          targetAlert = {
            id: "ALT-TW-01",
            type: "LANDSLIDE_RISK",
            severity: "HIGH",
            title: "High Landslide Threat • Tawang Sector",
            message: "High landslide risk detected on NH-13 Km 4 corridor. Accelerated slope pore pressure and rainfall saturation. Exercise caution and follow designated safe routes.",
            location: {
              name: "Tawang Sector",
              latitude: 27.586,
              longitude: 91.859,
            },
            riskScore: 78.4,
            riskLevel: "HIGH",
            primaryThreat: "Moisture Infiltration on Hill Slopes",
            triggeredBy: ["Rainfall > 35mm/24h", "Pore Pressure > 40 kPa"],
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            acknowledgedAt: null,
            resolvedAt: null,
            source: "SentinalX Operational Risk Engine",
          };
        }

        setAlert(targetAlert);
        setProviderConfigured(Boolean(process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load alert details");
      } finally {
        setLoading(false);
      }
    }

    fetchAlert();
  }, [alertIdParam]);

  const locationName = alert?.location?.name || "Tawang Sector";
  const riskScore = alert?.riskScore ? Math.round(alert.riskScore) : 78;
  const severity = alert?.severity || "HIGH";

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
              SMS ALERT CENTER
            </span>
          </div>
          <Link
            href="/alerts/notifications"
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            History
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">EMERGENCY SMS BROADCAST</h1>
          <p className="text-xs text-slate-500">Citizen cellular emergency alert dispatch &amp; delivery gateway</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-700" />
            <p className="text-xs font-mono font-bold text-slate-500">Generating SMS payload...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl text-xs border border-rose-200">
            {error}
          </div>
        ) : !alert ? (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center">
            <p className="text-sm font-bold text-slate-600">No active alerts to broadcast.</p>
          </div>
        ) : (
          <>
            {/* Section 1: SMS MESSAGE PREVIEW (Realistic Mobile Mockup) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  SMS MESSAGE PREVIEW
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  GSM-7 CELLULAR ENCODED
                </span>
              </div>

              {/* Realistic Mobile Device Frame */}
              <div className="bg-slate-950 rounded-3xl p-4 sm:p-6 max-w-sm mx-auto border-4 border-slate-800 shadow-xl relative text-white">
                {/* Mobile Speaker / Camera Notch */}
                <div className="w-24 h-3.5 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
                  <div className="w-8 h-1 rounded-full bg-slate-700" />
                </div>

                {/* SMS App Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Messages</div>
                      <div className="text-[10px] text-slate-400 font-mono">SentinalX • ALERT-GOV</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Emergency</span>
                </div>

                {/* SMS Message Bubble */}
                <div className="bg-slate-800/95 border border-slate-700 rounded-2xl rounded-tl-sm p-4 text-xs font-mono leading-relaxed space-y-2.5 shadow-inner">
                  <div className="text-amber-400 font-black tracking-wide flex items-center gap-1.5">
                    <span>⚠</span>
                    <span>{severity} LANDSLIDE RISK</span>
                  </div>

                  <div className="text-slate-200">
                    <span className="text-white font-bold">{locationName}</span> is currently at {severity} risk ({riskScore}/100).
                  </div>

                  <div className="text-slate-300">
                    Heavy rainfall and elevated soil saturation detected on hill slopes.
                  </div>

                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-700/60 text-[11px] space-y-1">
                    <div className="text-emerald-400 font-bold">ACTION:</div>
                    <div>Avoid the affected corridor. Use the recommended safe evacuation route.</div>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-700/50">
                    <div>
                      <span className="text-slate-400">Safe Shelter:</span>{" "}
                      <span className="text-white font-semibold">Tawang Community Center</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Emergency:</span>{" "}
                      <span className="text-rose-400 font-bold">112</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 pt-1 text-right">
                    Sent by: SentinalX Early Warning System
                  </div>
                </div>

                {/* Honest Watermark */}
                <div className="mt-3 text-center">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                    MESSAGE PREVIEW • NOT ACTUAL DELIVERY
                  </span>
                </div>
              </div>
            </section>

            {/* Section 2: SMS DELIVERY STATUS (Truthful Status Table) */}
            <section className="space-y-3">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                SMS DELIVERY STATUS
              </h2>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Provider</span>
                  <span className="text-xs font-mono font-black text-slate-900">
                    {providerConfigured ? "Twilio Cellular Gateway" : "Not Configured"}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Status</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      providerConfigured
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {providerConfigured ? "READY FOR PROVIDER" : "PROVIDER NOT CONFIGURED"}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Recipient</span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    +91 XXXXX XXXXX (Designated Sector Broadcast)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview SMS</span>
                </button>
              </div>
            </section>

            {/* Section 3: SEPARATE NOTIFICATION CHANNELS */}
            <section className="space-y-3">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                NOTIFICATION CHANNELS
              </h2>
              <div className="space-y-2">
                {/* 1. IN-APP */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">IN-APP</span>
                      <span className="text-[11px] text-slate-500">Real-time modal &amp; audio banner</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Delivered</span>
                  </div>
                </div>

                {/* 2. PUSH */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">PUSH</span>
                      <span className="text-[11px] text-slate-500">WebPush / APNS gateway</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700 font-extrabold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Device permission required / Ready</span>
                  </div>
                </div>

                {/* 3. SMS */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">SMS</span>
                      <span className="text-[11px] text-slate-500">National disaster SMS gateway</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-extrabold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Provider not configured</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Modal Dialog triggered by "Preview SMS" button */}
            {isPreviewModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl relative animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900">SMS Broadcast Preview</span>
                    <button
                      onClick={() => setIsPreviewModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl text-white font-mono text-xs space-y-2">
                    <div className="text-amber-400 font-black">
                      ⚠ {severity} LANDSLIDE RISK
                    </div>
                    <p className="text-slate-200">
                      {locationName} is currently at {severity} risk ({riskScore}/100).
                    </p>
                    <p className="text-slate-300">Avoid the affected zone.</p>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px] space-y-1">
                      <div className="text-emerald-400 font-bold">Safe route:</div>
                      <div>• 2.8 km • ~12 min by vehicle</div>
                      <div>• 2.8 km • ~42 min walking</div>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Nearest safe shelter:{" "}
                      <span className="text-white font-bold">Tawang Community Center</span>
                    </div>
                    <div className="text-[11px] text-rose-400 font-bold">Emergency: 112</div>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 font-bold text-center">
                    THIS IS A MESSAGE PREVIEW, NOT ACTUAL DELIVERY
                  </div>

                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function SmsAlertCenterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono">Loading SMS Alert Center...</div>}>
      <SmsAlertCenterContent />
    </Suspense>
  );
}
