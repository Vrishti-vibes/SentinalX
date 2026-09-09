"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { GisMapFeature, LayerFilter, LayerVisibility, NerLocationItem } from "@/types/gis-map";
import { RiskEngineResult } from "@/types/risk";
import { IncidentReportRecord, SensorReadingRecord } from "@/types/database";

export interface LeafletMapDynamicProps {
  selectedLocation: string;
  selectedLocationData?: NerLocationItem | null;
  activeFilter?: LayerFilter;
  layerVisibility?: LayerVisibility;
  onSelectFeature: (feature: GisMapFeature) => void;
  onSelectLocation?: (locationId: string) => void;
  riskResult?: RiskEngineResult | null;
  reports?: IncidentReportRecord[];
  sensors?: SensorReadingRecord[];
}

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-3">
      <div className="w-8 h-8 border-3 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase block">
          INITIALIZING NER GIS ENGINE
        </span>
        <span className="text-[11px] text-slate-400 font-sans">
          Loading 8-state topographic and telemetry layers...
        </span>
      </div>
    </div>
  ),
});

export default function LeafletMapDynamic(props: LeafletMapDynamicProps) {
  return <LeafletMap {...props} />;
}

