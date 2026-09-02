"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthority = pathname?.startsWith("/authority");

  if (isAuthority) {
    return (
      <div className="min-h-screen bg-[#1e242c] flex items-start justify-center p-0 sm:p-4 md:p-6 antialiased selection:bg-emerald-500/20 selection:text-emerald-900 font-sans">
        {/* Authority Expanded Desktop/Tablet Console Container */}
        <div className="w-full max-w-6xl min-h-screen bg-[#f8fafc] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border-0 sm:border border-slate-700/60">
          <main className="flex-1 w-full pb-8 bg-[#f8fafc] overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2c333d] flex items-center justify-center p-0 sm:p-4 md:p-6 antialiased selection:bg-emerald-500/20 selection:text-emerald-900 font-sans">
      {/* Mobile-Style Phone Mockup Container (Responsive for Mobile, Tablet & Desktop presentation) */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-[440px] min-h-screen sm:min-h-[844px] bg-white sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col relative border-0 sm:border-[8px] sm:border-[#38414e]">
        {/* Main Screen View Content */}
        <main className="flex-1 w-full pb-6 bg-[#f8fafc] overflow-y-auto">
          {children}
        </main>

        {/* Mobile-Style Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
