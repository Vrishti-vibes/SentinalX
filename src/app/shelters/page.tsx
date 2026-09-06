"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Info,
  Home,
  Tent,
  Landmark,
  RotateCw,
  Navigation,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { ShelterRecord } from "@/types/shelter";
import LeafletShelterMapDynamic from "@/components/map/LeafletShelterMapDynamic";
import { useDeviceMode } from "@/components/layout/DeviceModeContext";

// Exact SIH demo shelter data for Tawang Sector
const DEFAULT_TAWANG_SHELTERS: ShelterRecord[] = [
  {
    id: "sh-1",
    name: "Tawang Community Center",
    sector: "tawang",
    latitude: 27.592,
    longitude: 91.875,
    distance: "1.2 km",
    distanceKm: 1.2,
    capacityPercent: 85,
    totalCapacity: 250,
    occupiedCapacity: 38,
    status: "OPEN",
    iconType: "community",
    address: "Upper Tawang Road, Near Monpa Cultural Complex",
    contactNumber: "+91 3794 222 201",
    supplies: "Full medical aid, drinking water, generators, blankets (Cap: 250)",
    isDemo: true,
  },
  {
    id: "sh-2",
    name: "Government Relief Camp",
    sector: "tawang",
    latitude: 27.579,
    longitude: 91.848,
    distance: "2.4 km",
    distanceKm: 2.4,
    capacityPercent: 62,
    totalCapacity: 400,
    occupiedCapacity: 152,
    status: "OPEN",
    iconType: "camp",
    address: "Helipad Grounds, Lumla Road Junction",
    contactNumber: "+91 3794 222 202",
    supplies: "Emergency rations, first responder post, field beds (Cap: 400)",
    isDemo: true,
  },
  {
    id: "sh-3",
    name: "District Relief Center",
    sector: "tawang",
    latitude: 27.595,
    longitude: 91.840,
    distance: "3.1 km",
    distanceKm: 3.1,
    capacityPercent: 40,
    totalCapacity: 600,
    occupiedCapacity: 360,
    status: "OPEN",
    iconType: "district",
    address: "DC Office Complex, High Ground Sector",
    contactNumber: "+91 3794 222 203",
    supplies: "Disaster management command post, communication hub (Cap: 600)",
    isDemo: true,
  },
];

export default function SheltersScreen() {
  const { isMobile } = useDeviceMode();
  const [shelters, setShelters] = useState<ShelterRecord[]>(DEFAULT_TAWANG_SHELTERS);
  const [selectedLocation, setSelectedLocation] = useState<string>("tawang");
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchShelters = async (sector: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/shelters?sector=${sector}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setShelters(json.data);
        } else {
          setShelters(DEFAULT_TAWANG_SHELTERS);
        }
      } else {
        setShelters(DEFAULT_TAWANG_SHELTERS);
      }
    } catch {
      setShelters(DEFAULT_TAWANG_SHELTERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters(selectedLocation);
  }, [selectedLocation]);

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Red Diamond Logo + SentinalX */}
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
            SentinalX
          </span>
        </Link>

        {/* Right: Refresh & Sector Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
            SHELTER DIRECTORY
          </span>
          <button
            type="button"
            onClick={() => fetchShelters(selectedLocation)}
            disabled={isLoading}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Refresh Shelters"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-4 max-w-7xl w-full mx-auto">
        {/* 2. Page Subheader + Location Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>NORTH EASTERN REGION • EMERGENCY RELIEF NETWORK</span>
            </div>
            <h1 className="text-[22px] sm:text-2xl font-black text-[#0f172a] tracking-tight leading-tight">
              NEAREST SHELTERS
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Tawang Sector, Arunachal Pradesh (Primary SIH Demo)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedLocation("tawang")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedLocation === "tawang"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tawang Sector
            </button>
            <button
              type="button"
              onClick={() => setSelectedLocation("gangtok")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedLocation === "gangtok"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sikkim / NH-10
            </button>
          </div>
        </div>

        {/* 3. Real Interactive GIS Shelter Map (CARTO Voyager Basemap) */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Interactive Relief Geography • Tawang Sector</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              CARTO Voyager Basemap • Leaflet GIS
            </span>
          </div>

          {/* Map Canvas: 300-340px on mobile, 420-480px on desktop */}
          <div className="relative h-[320px] sm:h-[400px] lg:h-[460px] w-full bg-[#edf2f7] overflow-hidden">
            <LeafletShelterMapDynamic onSelectShelter={setSelectedShelterId} />
          </div>
        </div>

        {/* 4. Shelter Cards (3 Cards below map in Desktop Grid / Single Column Mobile) */}
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"} gap-4 pt-1`}>
          {shelters.map((shelter) => {
            const isSelected = selectedShelterId === shelter.id;

            return (
              <div
                key={shelter.id}
                className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-3.5 transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Icon + Name + Distance + OPEN Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                        {shelter.iconType === "community" && <Home className="w-5 h-5 stroke-[2.2]" />}
                        {shelter.iconType === "camp" && <Tent className="w-5 h-5 stroke-[2.2]" />}
                        {shelter.iconType === "district" && <Landmark className="w-5 h-5 stroke-[2.2]" />}
                      </div>

                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-snug">
                          {shelter.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold mt-0.5 font-mono">
                          {shelter.distance}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-black shrink-0">
                      {shelter.status}
                    </span>
                  </div>

                  {/* Capacity Bar & Percentage */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Available Capacity:</span>
                      <span className="font-mono text-emerald-700 font-black">
                        {shelter.capacityPercent}% OPEN
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${shelter.capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Details preview */}
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500 leading-tight">
                      <strong>Address:</strong> {shelter.address}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      <strong>Supplies:</strong> {shelter.supplies}
                    </p>
                  </div>
                </div>

                {/* Buttons: VIEW SHELTER & GET DIRECTIONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedShelterId(isSelected ? null : shelter.id)}
                    className="w-full h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs tracking-wider flex items-center justify-center transition-all"
                  >
                    <span>{isSelected ? "HIDE DETAILS" : "VIEW SHELTER"}</span>
                  </button>

                  <Link href="/routes" className="block w-full">
                    <button
                      type="button"
                      className="w-full h-10 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>DIRECTIONS</span>
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. Guidance Notice Box */}
        <div className="rounded-xl bg-[#dbeafe]/70 border border-[#bfdbfe]/80 p-3.5 flex items-center gap-2.5 text-xs text-slate-700 shadow-sm">
          <Info className="w-4 h-4 text-blue-700 shrink-0" />
          <p className="flex-1 font-medium text-slate-800 leading-snug">
            All designated relief centers are equipped with continuous backup power, satellite communications, and emergency first-aid supplies.
          </p>
        </div>

        {/* 6. Primary Action: GET DIRECTIONS */}
        <div className="pt-1">
          <Link href="/routes" className="block w-full">
            <button
              type="button"
              className="w-full h-12 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-extrabold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
            >
              <Navigation className="w-4 h-4" />
              <span>NAVIGATE TO NEAREST OPEN SHELTER (SAFE ROUTE)</span>
            </button>
          </Link>
        </div>

        {/* 7. Demo / Prototype Footer Note */}
        <div className="pt-2 pb-1 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
            SENTINALX DISASTER RELIEF DIRECTORY • SIH26001 DEMO
          </span>
        </div>
      </div>
    </div>
  );
}