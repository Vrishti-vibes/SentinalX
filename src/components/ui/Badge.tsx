import React from "react";
import { cn } from "@/lib/utils";
import { RiskLevel } from "@/types/risk";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "low" | "moderate" | "high" | "severe" | "outline" | "subtle";
  riskLevel?: RiskLevel;
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "default",
  riskLevel,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  // If riskLevel is provided, map it to variant
  let resolvedVariant = variant;
  if (riskLevel) {
    switch (riskLevel) {
      case "LOW":
        resolvedVariant = "low";
        break;
      case "MODERATE":
        resolvedVariant = "moderate";
        break;
      case "HIGH":
        resolvedVariant = "high";
        break;
      case "SEVERE":
        resolvedVariant = "severe";
        break;
    }
  }

  const variantStyles = {
    default: "bg-slate-800 text-slate-200 border-slate-700",
    subtle: "bg-slate-800/60 text-slate-300 border-slate-700/50",
    low: "bg-emerald-950/70 text-emerald-300 border-emerald-700/60",
    moderate: "bg-amber-950/70 text-amber-300 border-amber-700/60",
    high: "bg-orange-950/70 text-orange-300 border-orange-700/60",
    severe: "bg-rose-950/80 text-rose-300 border-rose-600/70",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variantStyles[resolvedVariant] || variantStyles.default,
        pulse && resolvedVariant === "severe" && "animate-pulse ring-1 ring-rose-500/50",
        className
      )}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            resolvedVariant === "severe"
              ? "bg-rose-400 animate-ping"
              : resolvedVariant === "high"
              ? "bg-orange-400"
              : resolvedVariant === "moderate"
              ? "bg-amber-400"
              : "bg-emerald-400"
          )}
        />
      )}
      {children}
    </span>
  );
}
