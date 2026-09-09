"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { ShelterRecord } from "@/types/shelter";
import LeafletShelterMapDynamic from "@/components/map/LeafletShelterMapDynamic";
import { useDeviceMode } from "@/components/layout/DeviceModeContext";
import {
  getStoredLocationId,
  setStoredLocationId,
  getResolvedLocation,
  LOCATION_CHANGE_EVENT,
} from "@/lib/utils/location-store";
import { NER_LOCATIONS } from "@/lib/data/ner-gis-data";

// Operational shelter data for Tawang Sector
const TAWANG_SHELTERS: ShelterRecord[] = [
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
    availableCapacity: 212,
    safetyLevel: "SAFE",
    status: "OPEN",
    iconType: "community",
    address: "Upper Tawang Road, Near Monpa Cultural Complex",
    contactNumber: "+91 3794 222 201",
    supplies: "Full medical aid, drinking water, generators, blankets (Cap: 250)",
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
    availableCapacity: 248,
    safetyLevel: "SAFE",
    status: "OPEN",
    iconType: "camp",
    address: "Helipad Grounds, Lumla Road Junction",
    contactNumber: "+91 3794 222 202",
    supplies: "Emergency rations, first responder post, field beds (Cap: 400)",
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
      availableCapacity: 240,
      safetyLevel: "SAFE",
      status: "OPEN",
      iconType: "district",
      address: "DC Office Complex, High Ground Sector",
      contactNumber: "+91 3794 222 203",
      supplies: "Full logistics hub, medical teams, satellite comms (Cap: 600)",
    },
    {
      id: "sh-4",
      name: "Tawang Valley School Camp",
      sector: "tawang",
      latitude: 27.587,
      longitude: 91.860,
      distance: "1.8 km",
      distanceKm: 1.8,
      capacityPercent: 95,
      totalCapacity: 200,
      occupiedCapacity: 190,
      availableCapacity: 10,
      safetyLevel: "UNSAFE",
      status: "UNSAFE",
      iconType: "camp",
      address: "Old Market Valley Road (INSIDE SEVERE HAZARD ZONE)",
      contactNumber: "+91 3794 222 204",
      supplies: "Evacuation ordered. Do not approach.",
    },
];

// Operational shelter data for Sikkim / Gangtok Sector
const GANGTOK_SHELTERS: ShelterRecord[] = [
  {
    id: "sh-gtk-1",
    name: "Gangtok Municipal Disaster Shelter",
    sector: "gangtok",
    latitude: 27.332,
    longitude: 88.614,
    distance: "1.5 km",
    distanceKm: 1.5,
    capacityPercent: 62,
    totalCapacity: 500,
    occupiedCapacity: 190,
    availableCapacity: 310,
    safetyLevel: "SAFE",
    status: "OPEN",
    iconType: "community",
    address: "Development Area, High Ground Ridge, Gangtok",
    contactNumber: "+91 3592 202 211",
    supplies: "Full medical aid, rations, satellite communication link",
  },
  {
    id: "sh-gtk-2",
    name: "Sevoke Road Indoor Stadium",
    sector: "gangtok",
    latitude: 26.885,
    longitude: 88.472,
    distance: "4.2 km",
    distanceKm: 4.2,
    capacityPercent: 34,
    totalCapacity: 350,
    occupiedCapacity: 230,
    availableCapacity: 120,
    safetyLevel: "SAFE",
    status: "OPEN",
    iconType: "camp",
    address: "Sevoke Foothills Relief Post, Siliguri-Sikkim Arterial",
    contactNumber: "+91 3592 202 212",
    supplies: "Field cots, water purification plant, generator backup",
  },
  {
    id: "sh-gtk-3",
    name: "Ranipool Community Center",
    sector: "gangtok",
    latitude: 27.295,
    longitude: 88.588,
    distance: "5.8 km",
    distanceKm: 5.8,
    capacityPercent: 98,
    totalCapacity: 200,
    occupiedCapacity: 195,
    availableCapacity: 5,
    safetyLevel: "ADVISORY",
    status: "OPEN",
    iconType: "district",
    address: "Ranipool Bazar, NH-10 Link",
    contactNumber: "+91 3592 202 213",
    supplies: "Near capacity (5 beds remaining). Re-routing recommended.",
  },
];

export default function SheltersScreen() {
  const { isMobile } = useDeviceMode();
  const [selectedLocation, setSelectedLocation] = useState<string>(() => getStoredLocationId("tawang"));
  const [shelters, setShelters] = useState<ShelterRecord[]>(TAWANG_SHELTERS);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleLocationChange = (e: any) => {
      if (e.detail && e.detail !== selectedLocation) {
        setSelectedLocation(e.detail);
      }
    };
    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
    return () => window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
  }, [selectedLocation]);

  const resolvedLocation = getResolvedLocation(selectedLocation);

  const handleSelectLocation = (locId: string) => {
    setSelectedLocation(locId);
    setStoredLocationId(locId);
  };

  const fetchShelters = async (sector: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/shelters?sector=${encodeURIComponent(sector)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setShelters(json.data);
          return;
        }
      }
      setShelters(sector === "gangtok" ? GANGTOK_SHELTERS : TAWANG_SHELTERS);
    } catch {
      setShelters(sector === "gangtok" ? GANGTOK_SHELTERS : TAWANG_SHELTERS);
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
        <Link href="/">
          <BrandLogo textClassName="text-[17px] font-bold tracking-tight text-[#0f172a]" />
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
        {/* Sector Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: "tawang", label: "Tawang (AR)" },
            { id: "gangtok", label: "Gangtok (SK)" },
            { id: "guwahati", label: "Guwahati (AS)" },
            { id: "shillong", label: "Shillong (ML)" },
            { id: "cherrapunji", label: "Cherrapunji (ML)" },
            { id: "haflong", label: "Haflong (AS)" },
            { id: "kohima", label: "Kohima (NL)" },
            { id: "imphal", label: "Imphal (MN)" },
            { id: "aizawl", label: "Aizawl (MZ)" },
            { id: "agartala", label: "Agartala (TR)" },
            { id: "itanagar", label: "Itanagar (AR)" },
            { id: "ner", label: "NER All" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectLocation(item.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                selectedLocation.toLowerCase() === item.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 2. Page Subheader */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>NORTH EASTERN REGION • EMERGENCY RELIEF NETWORK</span>
            </div>
            <h1 className="text-[22px] sm:text-2xl font-black text-[#0f172a] tracking-tight leading-tight">
              DESIGNATED RELIEF SHELTERS
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {resolvedLocation.name}, {resolvedLocation.state}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Real Interactive GIS Shelter Map */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Interactive Relief Geography • {resolvedLocation.name}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              CARTO Voyager Basemap • Leaflet GIS
            </span>
          </div>

          {/* Map Canvas */}
          <div className="relative h-[320px] sm:h-[400px] lg:h-[460px] w-full bg-[#edf2f7] overflow-hidden">
            <LeafletShelterMapDynamic
              shelters={shelters}
              center={resolvedLocation.latLng}
              sectorName={resolvedLocation.name}
              onSelectShelter={setSelectedShelterId}
            />
          </div>
        </div>

        {/* 4. Shelter Cards (Grid / Single Column Mobile) */}
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"} gap-4 pt-1`}>
          {shelters.map((shelter) => {
            const isSelected = selectedShelterId === shelter.id;
            const occupied = shelter.occupiedCapacity ?? Math.round(shelter.totalCapacity * 0.4);
            const available = shelter.availableCapacity ?? (shelter.totalCapacity - occupied);
            const isSafe = (shelter.safetyLevel ?? "SAFE") === "SAFE";
            const isAdvisory = (shelter.safetyLevel ?? "SAFE") === "ADVISORY";

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
                  {/* Top Row: Icon + Name + Distance + Status Badges */}
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

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-black">
                        {shelter.status}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                          isSafe
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : isAdvisory
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {shelter.safetyLevel ?? "SAFE"}
                      </span>
                    </div>
                  </div>

                  {/* Available Capacity Breakdown */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Available Capacity:</span>
                      <span className="font-mono text-emerald-700 font-black">
                        {available} beds free ({shelter.capacityPercent}% Open)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${shelter.capacityPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-0.5">
                      <span>Occupied: {occupied} / {shelter.totalCapacity}</span>
                      <span className="font-bold text-emerald-700">{available} Available</span>
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

                {/* Buttons: VIEW SHELTER & GET DIRECTIONS (Routes straight to this shelter) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedShelterId(isSelected ? null : shelter.id)}
                    className="w-full h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs tracking-wider flex items-center justify-center transition-all"
                  >
                    <span>{isSelected ? "HIDE DETAILS" : "VIEW SHELTER"}</span>
                  </button>

                  <Link
                    href={`/routes?destLat=${shelter.latitude}&destLon=${shelter.longitude}&destName=${encodeURIComponent(
                      shelter.name
                    )}&shelterId=${shelter.id}&loc=${selectedLocation}`}
                    className="block w-full"
                  >
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
      </div>
    </div>
  );
}


