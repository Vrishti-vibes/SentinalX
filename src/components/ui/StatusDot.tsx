import React from "react";
import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "CRITICAL";
  showLabel?: boolean;
  className?: string;
}

export function StatusDot({
  status,
  showLabel = false,
  className,
}: StatusDotProps) {
  const statusConfig = {
    ONLINE: {
      color: "bg-emerald-400",
      pingColor: "bg-emerald-500",
      label: "Live Telemetry",
    },
    DEGRADED: {
      color: "bg-amber-400",
      pingColor: "bg-amber-500",
      label: "Delayed",
    },
    OFFLINE: {
      color: "bg-slate-500",
      pingColor: "bg-transparent",
      label: "Offline",
    },
    CRITICAL: {
      color: "bg-rose-500",
      pingColor: "bg-rose-600",
      label: "Critical Threat",
    },
  };

  const current = statusConfig[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-mono", className)}>
      <span className="relative flex h-2 w-2">
        {status !== "OFFLINE" && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              current.pingColor
            )}
          />
        )}
        <span
          className={cn("relative inline-flex rounded-full h-2 w-2", current.color)}
        />
      </span>
      {showLabel && <span className="text-slate-300 font-sans">{current.label}</span>}
    </span>
  );
}
