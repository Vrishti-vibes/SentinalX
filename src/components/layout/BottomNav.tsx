"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Shield,
  AlertCircle,
  Clock,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Do not show bottom nav on authority dashboard
  if (pathname?.startsWith("/authority")) {
    return null;
  }

  const isMonitor = pathname === "/";
  const isRoutes = pathname === "/routes" || pathname?.startsWith("/routes");
  const isShelters = pathname === "/shelters" || pathname?.startsWith("/shelters");
  const isReport = pathname === "/report" || pathname?.startsWith("/report");

  return (
    <nav className="sticky bottom-0 left-0 right-0 h-[72px] bg-white border-t border-slate-200 px-3 flex items-center justify-around z-50 w-full shadow-sm shrink-0">
      {/* 1. Monitor */}
      <Link
        href="/"
        className="flex flex-col items-center justify-center flex-1 py-1 text-center group"
      >
        {isMonitor ? (
          <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl bg-[#6ee7b7] text-emerald-950 transition-all shadow-sm">
            <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
            <span className="text-[11px] font-bold text-emerald-950 mt-0.5">Monitor</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900">
            <LayoutGrid className="w-5 h-5 stroke-[2]" />
            <span className="text-[11px] font-medium mt-1">Monitor</span>
          </div>
        )}
      </Link>

      {/* 2. Routes */}
      <Link
        href="/routes"
        className="flex flex-col items-center justify-center flex-1 py-1 text-center group"
      >
        {isRoutes ? (
          <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl bg-[#6ee7b7] text-emerald-950 transition-all shadow-sm">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-emerald-950"
              >
                <path d="M18 8L22 12L18 16" />
                <path d="M2 12H22" />
                <path d="M6 16L2 12L6 8" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-emerald-950 mt-0.5">Routes</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-slate-600"
              >
                <path d="M18 8L22 12L18 16" />
                <path d="M2 12H22" />
                <path d="M6 16L2 12L6 8" />
              </svg>
            </div>
            <span className="text-[11px] font-medium mt-1">Routes</span>
          </div>
        )}
      </Link>

      {/* 3. Shelters */}
      <Link
        href="/shelters"
        className="flex flex-col items-center justify-center flex-1 py-1 text-center group"
      >
        {isShelters ? (
          <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl bg-[#6ee7b7] text-emerald-950 transition-all shadow-sm">
            <div className="relative">
              <Shield className="w-4 h-4 stroke-[2.5]" />
              <Clock className="w-2 h-2 absolute top-1 left-1 stroke-[3]" />
            </div>
            <span className="text-[11px] font-bold text-emerald-950 mt-0.5">Shelters</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900">
            <div className="relative">
              <Shield className="w-5 h-5 stroke-[2]" />
              <Clock className="w-2.5 h-2.5 absolute top-1.5 left-1.5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-medium mt-1">Shelters</span>
          </div>
        )}
      </Link>

      {/* 4. Report */}
      <Link
        href="/report"
        className="flex flex-col items-center justify-center flex-1 py-1 text-center group"
      >
        {isReport ? (
          <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl bg-[#6ee7b7] text-emerald-950 transition-all shadow-sm">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            <span className="text-[11px] font-bold text-emerald-950 mt-0.5">Report</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900">
            <AlertCircle className="w-5 h-5 stroke-[2]" />
            <span className="text-[11px] font-medium mt-1">Report</span>
          </div>
        )}
      </Link>
    </nav>
  );
}
