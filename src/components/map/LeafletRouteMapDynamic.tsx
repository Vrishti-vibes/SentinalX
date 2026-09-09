"use client";

import React from "react";
import dynamic from "next/dynamic";
import { RouteResponse } from "@/types/routing";

interface LeafletRouteMapDynamicProps {
  routeData: RouteResponse | null;
  originLat?: number;
  originLon?: number;
  destLat?: number;
  destLon?: number;
  originName?: string;
  destName?: string;
  hazardName?: string;
}

const LeafletRouteMap = dynamic(() => import("./LeafletRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[320px] bg-[#edf2f7] flex flex-col items-center justify-center text-slate-400 gap-2">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
      <span className="text-xs font-mono font-medium">Loading OSM Road Route GIS...</span>
    </div>
  ),
});

export default function LeafletRouteMapDynamic(props: LeafletRouteMapDynamicProps) {
  return <LeafletRouteMap {...props} />;
}