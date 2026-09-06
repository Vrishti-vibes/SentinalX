"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { GisMapFeature, LayerFilter, LayerVisibility } from "@/types/gis-map";
import { RiskEngineResult } from "@/types/risk";
import { IncidentReportRecord, SensorReadingRecord } from "@/types/database";

interface LeafletMapDynamicProps {
  selectedLocation: "tawang" | "gangtok";
  activeFilter?: LayerFilter;
  layerVisibility?: LayerVisibility;
  onSelectFeature: (feature: GisMapFeature) => void;
  riskResult: RiskEngineResult | null;
  reports?: IncidentReportRecord[];
  sensors?: SensorReadingRecord[];
}

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#edf2f7] flex flex-col items-center justify-center text-slate-400 gap-2">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-rose-600 rounded-full animate-spin" />
      <span className="text-xs font-mono font-medium">Initializing Interactive GIS Map...</span>
    </div>
  ),
});

export default function LeafletMapDynamic(props: LeafletMapDynamicProps) {
  return <LeafletMap {...props} />;
}
