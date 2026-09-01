"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  MapPin,
  BellRing,
  FilePlus2,
  LifeBuoy,
  Building2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Overview",
    href: "/",
    icon: Activity,
    badge: undefined,
  },
  {
    name: "Live Risk Map",
    href: "/map",
    icon: MapPin,
    badge: "GIS",
  },
  {
    name: "Early Warnings",
    href: "/alerts",
    icon: BellRing,
    badge: "3 Active",
    badgeVariant: "severe" as const,
  },
  {
    name: "Report Hazard",
    href: "/report",
    icon: FilePlus2,
    badge: undefined,
  },
  {
    name: "Emergency Hub",
    href: "/emergency",
    icon: LifeBuoy,
    badge: "SOS",
    badgeVariant: "severe" as const,
  },
  {
    name: "Authority Ops",
    href: "/authority",
    icon: Building2,
    badge: "Control",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-850 h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-850 gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-white text-base">SentinalX</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              NER
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">Landslide Early Warning</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-slate-850 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                    item.badgeVariant === "severe"
                      ? "bg-rose-950/80 text-rose-300 border-rose-600/60 animate-pulse"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Regional Status Card Footer */}
      <div className="p-3 border-t border-slate-850">
        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400">NER Region Status</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              WATCH
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            High monsoonal precipitation active along NH-10 & NH-06 corridors.
          </p>
        </div>
      </div>
    </aside>
  );
}
