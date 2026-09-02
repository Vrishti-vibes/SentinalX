"use client";

import React, { useState, useEffect } from "react";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { calculateAgeSeconds, formatAge, getFreshnessStatus } from "@/lib/utils/freshness";
import { RotateCw, WifiOff, Clock } from "lucide-react";

export interface DataFreshnessProps {
  timestamp: string | null;
  sourceStatus?: "LIVE" | "CACHED" | "DEMO" | "FALLBACK";
  isRefreshing?: boolean;
  isCached?: boolean;
  hasError?: boolean;
  className?: string;
  compact?: boolean;
}

export function DataFreshness({
  timestamp,
  sourceStatus = "LIVE",
  isRefreshing = false,
  isCached = false,
  hasError = false,
  className = "",
  compact = false,
}: DataFreshnessProps) {
  const { isOnline } = useNetworkStatus();
  const [ageSeconds, setAgeSeconds] = useState<number | null>(calculateAgeSeconds(timestamp));

  // Dynamic 1-second ticker for live freshness display
  useEffect(() => {
    setAgeSeconds(calculateAgeSeconds(timestamp));

    if (!timestamp) return;

    const interval = setInterval(() => {
      setAgeSeconds(calculateAgeSeconds(timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const freshnessStatus = getFreshnessStatus({
    lastSuccessfulUpdate: timestamp,
    isOnline,
    isRefreshing,
    isCached,
    hasError,
  });

  const ageText = formatAge(ageSeconds);

  if (isRefreshing) {
    return (
      <div
        className={`flex items-center gap-1 text-[10px] font-mono text-blue-700 ${className}`}
        aria-live="polite"
      >
        <RotateCw className="w-2.5 h-2.5 animate-spin text-blue-600" />
        <span>Updating...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        className={`flex items-center gap-1 text-[10px] font-mono text-amber-800 ${className}`}
        aria-live="polite"
      >
        <WifiOff className="w-2.5 h-2.5 text-amber-700" />
        <span>OFFLINE • Last known ({ageText})</span>
      </div>
    );
  }

  if (isCached || freshnessStatus === "CACHED") {
    return (
      <div
        className={`flex items-center gap-1 text-[10px] font-mono text-amber-700 ${className}`}
        aria-live="polite"
      >
        <Clock className="w-2.5 h-2.5 text-amber-600" />
        <span>CACHED • ({ageText})</span>
      </div>
    );
  }

  if (freshnessStatus === "STALE") {
    return (
      <div
        className={`flex items-center gap-1 text-[10px] font-mono text-slate-500 ${className}`}
        aria-live="polite"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>STALE • Updated {ageText}</span>
      </div>
    );
  }

  // LIVE Freshness State
  return (
    <div
      className={`flex items-center gap-1 text-[10px] font-mono text-slate-600 ${className}`}
      aria-live="polite"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <span>
        {compact ? `Updated ${ageText}` : `LIVE • Updated ${ageText}`}
      </span>
    </div>
  );
}
