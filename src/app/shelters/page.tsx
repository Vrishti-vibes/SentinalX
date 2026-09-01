"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Info,
  Home,
  Tent,
  Landmark,
  CheckCircle,
} from "lucide-react";

interface ShelterItem {
  id: string;
  name: string;
  distance: string;
  capacityPercent: number;
  status: "OPEN" | "FULL" | "STANDBY";
  iconType: "community" | "camp" | "district";
  address: string;
  supplies: string;
}

const SHELTERS_DATA: ShelterItem[] = [
  {
    id: "shelter-1",
    name: "TAWANG COMMUNITY CENTER",
    distance: "1.2 km away",
    capacityPercent: 85,
    status: "OPEN",
    iconType: "community",
    address: "Monastery Ridge Rd, Tawang",
    supplies: "Emergency First Aid, Food Rations, Generator Power",
  },
  {
    id: "shelter-2",
    name: "GOVERNMENT RELIEF CAMP",
    distance: "2.4 km away",
    capacityPercent: 62,
    status: "OPEN",
    iconType: "camp",
    address: "Old Market Complex, Tawang",
    supplies: "Sleeping Mats, Clean Water, Medical Support",
  },
  {
    id: "shelter-3",
    name: "DISTRICT RELIEF CENTER",
    distance: "3.1 km away",
    capacityPercent: 40,
    status: "OPEN",
    iconType: "district",
    address: "DC Office Sector, Tawang",
    supplies: "Satellite Communications, Warm Blankets",
  },
];

export default function SheltersScreen() {
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Red Diamond Logo + SentinelX */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-[#b91c1c]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 12L12 22L22 12L12 2Z" />
              <line x1="12" y1="8" x2="12" y2="13" strokeWidth="2.5" />
              <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <span className="text-[17px] font-bold text-[#991b1b] tracking-tight">
            SentinelX
          </span>
        </Link>

        {/* Right: LIVE status text */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[#991b1b] tracking-wider">
            LIVE
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* 2. Page Subheader */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span>NORTH EASTERN REGION • ONLINE</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
            NEAREST SHELTERS
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Tawang Sector</span>
          </div>
        </div>

        {/* 3. Shelter Map Card */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-[#eef7ee] shadow-sm h-48 sm:h-52">
          {/* Topographic Terrain Background Visual */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-85"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at center, rgba(220, 245, 220, 0.4) 0%, rgba(200, 235, 205, 0.9) 100%), linear-gradient(135deg, #e4f4e4 0%, #d5ebd5 100%)",
            }}
          />

          {/* Contour Lines and River / Road Vectors */}
          <svg
            className="absolute inset-0 w-full h-full opacity-40"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Topo lines */}
            <path d="M-20,40 Q60,10 140,50 T300,30 T460,40" fill="none" stroke="#608b60" strokeWidth="0.8" />
            <path d="M-20,80 Q80,50 180,90 T340,70 T480,80" fill="none" stroke="#608b60" strokeWidth="0.8" />
            <path d="M-20,120 Q100,90 220,130 T380,110" fill="none" stroke="#608b60" strokeWidth="0.8" />
            <path d="M-20,160 Q120,130 260,170 T420,150" fill="none" stroke="#608b60" strokeWidth="0.8" />

            {/* River / Blue Path */}
            <path
              d="M 180,0 Q 170,80 150,120 T 130,200"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.5"
              className="opacity-70"
            />

            {/* Main Road Line */}
            <path
              d="M 80,180 Q 140,140 180,90 T 260,30"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Map Geographic Labels matching Stitch */}
          <div className="absolute top-4 right-16 text-[9px] font-bold text-slate-700 font-sans">
            Zemithang HQ
          </div>
          <div className="absolute top-10 right-28 text-[8px] font-semibold text-slate-600 text-center leading-tight">
            Zemithang<br />Lumpo
          </div>
          <div className="absolute top-14 left-16 text-[8px] font-semibold text-slate-600 flex items-center gap-1">
            <span>Gorsam Chorten</span>
            <span className="w-2.5 h-2.5 rounded-full border border-slate-500 inline-block text-[6px] text-center">☸</span>
          </div>
          <div className="absolute bottom-3 right-16 text-[8px] font-semibold text-slate-600">
            Khelengteng
          </div>

          {/* User Location Pin on Map */}
          <div className="absolute top-24 left-36 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-blue-500/25 animate-ping absolute" />
            <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow flex items-center justify-center text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Shelter Pin 1 (Zemithang / Tawang Community Center) */}
          <div className="absolute top-16 right-20 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-5 h-5 rounded-full bg-[#16a34a] border-2 border-white shadow flex items-center justify-center text-white text-[8px]">
              ⛺
            </div>
          </div>

          {/* Floating Legend Overlay Box in bottom-left */}
          <div className="absolute bottom-2.5 left-2.5 z-10 space-y-1">
            <div className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-sm flex items-center gap-1.5 text-[9px] font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
              <span>YOUR LOCATION</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-sm flex items-center gap-1.5 text-[9px] font-bold text-[#065f46]">
              <Home className="w-3 h-3 text-[#065f46]" />
              <span>SHELTER LOCATIONS</span>
            </div>
          </div>
        </div>

        {/* 4. Shelter Cards List */}
        <div className="space-y-3">
          {SHELTERS_DATA.map((shelter) => {
            const isSelected = selectedShelterId === shelter.id;

            return (
              <div
                key={shelter.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 transition-all"
              >
                {/* Top Row: Icon + Name/Distance + OPEN Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3">
                    {/* Mint/Aquamarine Square Icon Container */}
                    <div className="w-10 h-10 rounded-xl bg-[#a7f3d0]/70 border border-[#6ee7b7]/60 flex items-center justify-center text-[#065f46] shrink-0 mt-0.5">
                      {shelter.iconType === "community" && (
                        <Home className="w-5 h-5 stroke-[2.2]" />
                      )}
                      {shelter.iconType === "camp" && (
                        <Tent className="w-5 h-5 stroke-[2.2]" />
                      )}
                      {shelter.iconType === "district" && (
                        <Landmark className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 tracking-tight leading-snug">
                        {shelter.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {shelter.distance}
                      </p>
                    </div>
                  </div>

                  {/* OPEN Status Badge */}
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-300 text-[11px] font-bold shrink-0">
                    {shelter.status}
                  </span>
                </div>

                {/* Capacity Progress Bar with Percentage */}
                <div className="flex items-center gap-2.5 pt-0.5">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#065f46] rounded-full transition-all duration-300"
                      style={{ width: `${shelter.capacityPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium shrink-0 w-8 text-right">
                    {shelter.capacityPercent}%
                  </span>
                </div>

                {/* Expandable Details if selected */}
                {isSelected && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Address:</span>
                      <span>{shelter.address}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-800">Supplies:</span> {shelter.supplies}
                    </div>
                  </div>
                )}

                {/* VIEW SHELTER Action Button */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedShelterId(isSelected ? null : shelter.id)
                  }
                  className="w-full h-10 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center transition-all active:scale-[0.99]"
                >
                  <span>{isSelected ? "HIDE DETAILS" : "VIEW SHELTER"}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* 5. Guidance Notice Box */}
        <div className="rounded-xl bg-[#dbeafe]/70 border border-[#bfdbfe]/80 p-3.5 flex items-center gap-2.5 text-xs text-slate-700 shadow-sm">
          <div className="w-4 h-4 flex items-center justify-center text-slate-700 shrink-0">
            <Info className="w-4 h-4 stroke-[2]" />
          </div>
          <p className="flex-1 font-medium text-slate-700 leading-snug">
            Choose the nearest open shelter and follow the recommended safe route.
          </p>
        </div>

        {/* 6. Primary Action Button: GET DIRECTIONS */}
        <div className="pt-1">
          <Link href="/routes" className="block w-full">
            <button
              type="button"
              className="w-full h-12 rounded-xl bg-[#ea3838] hover:bg-[#d62b2b] text-white font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
            >
              {/* Route turn icon */}
              <div className="w-4 h-4 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-white"
                >
                  <path d="M18 8L22 12L18 16" />
                  <path d="M2 12H22" />
                  <path d="M6 16L2 12L6 8" />
                </svg>
              </div>
              <span>GET DIRECTIONS</span>
            </button>
          </Link>
        </div>

        {/* 7. Demo / Prototype Footer Note */}
        <div className="pt-2 pb-1 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
            DEMO / PROTOTYPE DATA
          </span>
        </div>
      </div>
    </div>
  );
}
