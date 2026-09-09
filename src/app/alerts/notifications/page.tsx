"use client";

import React, { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import Link from "next/link";
import { Loader2, ArrowLeft, Bell, Smartphone, Phone, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { NotificationDeliveryItem } from "@/lib/db/notifications.repository";

function formatTimestamp(isoString?: string): string {
  if (!isoString) return "--:--";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "--:--";
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export default function NotificationDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<NotificationDeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDeliveries = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.notifications)
        ? json.notifications
        : Array.isArray(json)
        ? json
        : [];
      setDeliveries(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const getChannelBadge = (channel: string) => {
    switch (channel?.toUpperCase()) {
      case "IN_APP":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PUSH":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SMS":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
      case "SENT":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PENDING":
      case "QUEUED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PROVIDER_NOT_CONFIGURED":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "FAILED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "Delivered";
      case "PENDING":
        return "Pending";
      case "PROVIDER_NOT_CONFIGURED":
        return "Provider Not Configured";
      case "FAILED":
        return "Delivery Failed";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/alerts" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BrandLogo />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              NOTIFICATIONS
            </span>
          </div>
          <button
            onClick={fetchDeliveries}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">MULTI-CHANNEL DISPATCH LOG</h1>
            <p className="text-xs text-slate-500">Live delivery records from notification_deliveries table</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/alerts/history"
              className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Alert Log
            </Link>
            <Link
              href="/alerts/sms"
              className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
            >
              SMS Center
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-700" />
            <p className="text-xs font-mono font-bold text-slate-500">Querying notification_deliveries...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl text-xs border border-rose-200">
            <p className="font-bold">Error querying deliveries</p>
            <p className="font-mono">{error}</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <Bell className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-slate-900 font-bold mb-1">No notification deliveries recorded</p>
            <p className="text-slate-500 text-xs">Deliveries are created when alerts are triggered or evaluated.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((item) => {
              const channel = item.channel || "IN_APP";
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getChannelBadge(
                            channel
                          )}`}
                        >
                          {channel.replace("_", "-")}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {item.notificationTitle || "High Risk Alert"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Recipient: <span className="font-mono text-slate-700">{item.recipient}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-black text-slate-900">
                        {formatTimestamp(item.timestamp)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {item.provider || "System"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono leading-relaxed">
                    {item.messagePreview}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
