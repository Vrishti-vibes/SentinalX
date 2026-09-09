"use client";

import React from "react";
import dynamic from "next/dynamic";

const LeafletShelterMap = dynamic(() => import("./LeafletShelterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-[#edf2f7] flex flex-col items-center justify-center text-slate-400 gap-2">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
      <span className="text-xs font-mono font-medium">Loading Interactive Shelter GIS Map...</span>
    </div>
  ),
});

import { ShelterRecord } from "@/types/shelter";

interface LeafletShelterMapDynamicProps {
  onSelectShelter?: (shelterId: string) => void;
  shelters?: ShelterRecord[];
  center?: [number, number];
  sectorName?: string;
}

export default function LeafletShelterMapDynamic(props: LeafletShelterMapDynamicProps) {
  return <LeafletShelterMap {...props} />;
}
