"use client";

import React, { useState, useEffect } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { DeviceSwitcher, DevicePreviewMode } from "@/components/layout/DeviceSwitcher";
import { DeviceModeContext } from "@/components/layout/DeviceModeContext";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Default to desktop mode
  const [deviceMode, setDeviceMode] = useState<DevicePreviewMode>("desktop");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("sentinalx_device_preview_mode") as DevicePreviewMode;
      if (saved && (saved === "desktop" || saved === "tablet" || saved === "mobile")) {
        setDeviceMode(saved);
        document.documentElement.setAttribute("data-device-mode", saved);
      } else {
        document.documentElement.setAttribute("data-device-mode", "desktop");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDeviceChange = (mode: DevicePreviewMode) => {
    setDeviceMode(mode);
    try {
      localStorage.setItem("sentinalx_device_preview_mode", mode);
      document.documentElement.setAttribute("data-device-mode", mode);
    } catch {
      // ignore
    }
  };

  const isMobile = deviceMode === "mobile";
  const isTablet = deviceMode === "tablet";
  const isDesktop = deviceMode === "desktop";

  const contextValue = {
    deviceMode,
    isMobile,
    isTablet,
    isDesktop,
  };

  return (
    <DeviceModeContext.Provider value={contextValue}>
      <div
        className={`min-h-screen w-full ${
          isDesktop ? "bg-[#f8fafc]" : "bg-slate-950"
        } text-slate-900 font-sans antialiased flex flex-col`}
        data-device-mode={deviceMode}
      >
        {/* Device Switcher Controls Bar */}
        <header className="w-full bg-slate-900/95 py-2 px-3 flex items-center justify-center shrink-0 border-b border-slate-800 z-50">
          <DeviceSwitcher currentMode={deviceMode} onChange={handleDeviceChange} />
        </header>

        {/* ── Desktop Full-Width Viewport ── */}
        {isDesktop && (
          <div className="flex-1 w-full flex flex-col" data-device-mode="desktop">
            <main className="flex-1 w-full max-w-full mx-auto pb-[96px] bg-[#f8fafc]">
              {children}
            </main>
            <BottomNav deviceMode="desktop" isInsideChassis={false} />
          </div>
        )}

        {/* ── Mobile Phone Preview Chassis (390px) ── */}
        {isMobile && (
          <div className="flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-4 min-h-[calc(100vh-56px)]">
            <div
              className="w-[390px] max-w-[calc(100vw-20px)] h-[calc(100vh-80px)] min-h-[640px] max-h-[844px] bg-white rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[12px] border-slate-800 ring-1 ring-slate-700/60 flex flex-col relative overflow-hidden my-auto"
              data-device-frame="mobile"
            >
              {/* Dynamic Island / Phone Top Notch */}
              <div className="w-full h-7 bg-white shrink-0 flex items-center justify-center pt-1.5 z-50 select-none border-b border-slate-100">
                <div className="w-24 h-3.5 bg-slate-900 rounded-full flex items-center justify-end pr-2 gap-1 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-slate-700" />
                  <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Scrollable Mobile App Viewport */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden relative w-full bg-[#f8fafc] scroll-smooth app-container pb-[76px]"
                data-device-mode="mobile"
              >
                {children}
              </div>

              {/* Docked Mobile BottomNav Inside the Phone */}
              <BottomNav deviceMode="mobile" isInsideChassis={true} />

              {/* iPhone Bottom Home Indicator */}
              <div className="w-full bg-white shrink-0 py-1 flex justify-center z-50 select-none">
                <div className="w-28 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* ── Tablet Preview Chassis (768px) ── */}
        {isTablet && (
          <div className="flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-4 min-h-[calc(100vh-56px)]">
            <div
              className="w-[768px] max-w-[calc(100vw-24px)] h-[calc(100vh-80px)] min-h-[700px] max-h-[1024px] bg-white rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[10px] border-slate-800 ring-1 ring-slate-700/60 flex flex-col relative overflow-hidden my-auto"
              data-device-frame="tablet"
            >
              {/* Tablet Camera Notch */}
              <div className="w-full h-6 bg-white shrink-0 flex items-center justify-center pt-1 z-50 select-none border-b border-slate-100">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 shadow-inner" />
              </div>

              {/* Scrollable Tablet App Viewport */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden relative w-full bg-[#f8fafc] scroll-smooth app-container pb-[76px]"
                data-device-mode="tablet"
              >
                {children}
              </div>

              {/* Docked Tablet BottomNav Inside the Tablet */}
              <BottomNav deviceMode="tablet" isInsideChassis={true} />

              {/* Tablet Bottom Home Indicator */}
              <div className="w-full bg-white shrink-0 py-1 flex justify-center z-50 select-none">
                <div className="w-36 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </DeviceModeContext.Provider>
  );
}