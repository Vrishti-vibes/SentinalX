"use client";

import React from "react";
import { BottomNav } from "@/components/layout/BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#2c333d] flex items-center justify-center p-0 sm:p-4 md:p-6 antialiased selection:bg-emerald-500/20 selection:text-emerald-900 font-sans">
      {/* Phone Mockup Frame Container */}
      <div className="w-full max-w-sm sm:max-w-md min-h-screen sm:min-h-[844px] bg-white sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col relative border-0 sm:border-[8px] sm:border-[#38414e]">
        {/* Main Screen View Content */}
        <main className="flex-1 w-full pb-20 bg-[#f8fafc] overflow-y-auto">
          {children}
        </main>

        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
