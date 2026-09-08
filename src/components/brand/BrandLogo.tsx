import React from "react";

export function BrandLogo({ className = "w-6 h-6", textClassName = "text-[17px] font-bold tracking-tight text-slate-900" }) {
  return (
    <div className="flex items-center gap-2 group">
      <div className={`flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-slate-900"
        >
          {/* Subtle X in background */}
          <path d="M4 4L20 20" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M20 4L4 20" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
          
          {/* Mountain / Slope */}
          <path d="M2 20L10 8L14 14" className="text-slate-900" strokeWidth="2.5" />
          
          {/* Location Pin intersecting the mountain */}
          <path d="M21 10c0 4-5 9-5 9s-5-5-5-9a5 5 0 0 1 10 0z" className="text-rose-600" strokeWidth="2" />
          
          {/* Alert dot in the pin */}
          <circle cx="16" cy="10" r="1.5" className="fill-rose-600 stroke-rose-600" />
        </svg>
      </div>
      <span className={textClassName}>
        SentinalX
      </span>
    </div>
  );
}
