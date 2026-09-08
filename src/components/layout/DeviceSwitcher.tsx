"use client";

import React from "react";
import { Monitor, Tablet, Smartphone, Sparkles } from "lucide-react";

export type DevicePreviewMode = "desktop" | "tablet" | "mobile";

interface DeviceSwitcherProps {
  currentMode: DevicePreviewMode;
  onChange: (mode: DevicePreviewMode) => void;
}

const MODES: {
  id: DevicePreviewMode;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "desktop",
    label: "Desktop",
    sublabel: "Wide",
    icon: Monitor,
  },
  {
    id: "tablet",
    label: "Tablet",
    sublabel: "768px",
    icon: Tablet,
  },
  {
    id: "mobile",
    label: "Mobile",
    sublabel: "Phone",
    icon: Smartphone,
  },
];

export function DeviceSwitcher({ currentMode, onChange }: DeviceSwitcherProps) {
  return (
    <aside
      aria-label="Responsive Viewport Switcher"
      className="z-[100] mx-auto flex items-center gap-1.5 p-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl shadow-black/40 text-slate-300 select-none transition-all"
    >
      <div className="flex items-center pl-2.5 pr-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
        <span className="hidden sm:inline">Preview:</span>
      </div>

      <div className="flex items-center gap-1">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-bold scale-[1.02]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              }`}
              title={`Switch to ${mode.label} viewport (${mode.sublabel})`}
              aria-pressed={isActive}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{mode.label}</span>
              <span
                className={`hidden md:inline text-[9px] px-1 py-0.2 rounded ${
                  isActive ? "bg-emerald-600/30 text-emerald-950" : "text-slate-500"
                }`}
              >
                {mode.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Operational System Status Pill */}
      <div className="hidden lg:flex items-center gap-1.5 pl-2 pr-2.5 py-0.5 ml-1 border-l border-slate-700/70 text-[10px] font-mono text-emerald-300 font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>SYSTEM READY • SIH 2026</span>
      </div>
    </aside>
  );
}