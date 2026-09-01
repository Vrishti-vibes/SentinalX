import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "accent" | "danger" | "warning";
}

export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-slate-900/80 border-slate-800 backdrop-blur-sm",
    elevated: "bg-slate-900 border-slate-750 shadow-lg shadow-black/40",
    accent: "bg-slate-900/90 border-emerald-500/30 shadow-sm shadow-emerald-950/20",
    danger: "bg-slate-900/90 border-rose-500/40 shadow-sm shadow-rose-950/30",
    warning: "bg-slate-900/90 border-amber-500/40 shadow-sm shadow-amber-950/30",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 text-slate-100 transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-slate-100 tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-400 mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}
