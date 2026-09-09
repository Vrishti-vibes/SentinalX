"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { Shield, Navigation, Home, CheckCircle2 } from "lucide-react";
import "@/styles/leaflet-setup.css";
import { ShelterRecord } from "@/types/shelter";

function createShelterIcon(label: string) {
  if (typeof window === "undefined") {
    return {} as L.DivIcon;
  }
  return L.divIcon({
    className: "sentinalx-shelter-marker",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="background:#15803d;width:28px;height:28px;border-radius:50%;border:2.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/>
            <path d="M5 21V9l7-6 7 6v12"/>
            <path d="M9 21v-6a3 3 0 0 1 6 0v6"/>
          </svg>
        </div>
        <div style="background:#0f172a;color:white;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;margin-top:2px;box-shadow:0 1px 3px rgba(0,0,0,0.3);white-space:nowrap;border:1px solid rgba(255,255,255,0.4);">
          ${label}
        </div>
      </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 22],
    popupAnchor: [0, -22],
  });
}

function createOriginIcon() {
  if (typeof window === "undefined") {
    return {} as L.DivIcon;
  }
  return L.divIcon({
    className: "sentinalx-origin-marker",
    html: `
      <div style="background:#0f172a;width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#38bdf8;">
        <div style="width:8px;height:8px;border-radius:50%;background:#38bdf8;animation:pulse 2s infinite;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

export interface ShelterMapData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: string;
  capacityPercent: number;
  status: string;
  type: string;
}

const TAWANG_SHELTERS: ShelterMapData[] = [
  {
    id: "sh-1",
    name: "Tawang Community Center",
    lat: 27.592,
    lon: 91.875,
    distance: "1.2 km",
    capacityPercent: 85,
    status: "OPEN",
    type: "Community Center",
  },
  {
    id: "sh-2",
    name: "Government Relief Camp",
    lat: 27.579,
    lon: 91.848,
    distance: "2.4 km",
    capacityPercent: 62,
    status: "OPEN",
    type: "Relief Camp",
  },
  {
    id: "sh-3",
    name: "District Relief Center",
    lat: 27.595,
    lon: 91.840,
    distance: "3.1 km",
    capacityPercent: 40,
    status: "OPEN",
    type: "District Center",
  },
];

function ShelterMapBoundsController({
  shelters,
  center,
}: {
  shelters: { lat: number; lon: number }[];
  center: [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    try {
      if (shelters && shelters.length > 0) {
        const points = shelters.map((s) => [s.lat, s.lon] as [number, number]);
        points.push(center);
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14, duration: 1.0 });
      } else {
        map.flyTo(center, 13, { duration: 1.0 });
      }
    } catch {
      // ignore
    }
  }, [shelters, center, map]);
  return null;
}

interface LeafletShelterMapProps {
  onSelectShelter?: (shelterId: string) => void;
  shelters?: ShelterRecord[];
  center?: [number, number];
  sectorName?: string;
}

export default function LeafletShelterMap({
  onSelectShelter,
  shelters,
  center = [27.587, 91.858],
  sectorName = "Current Departure Sector",
}: LeafletShelterMapProps) {
  const centerCoord: [number, number] = center;
  const activeShelters: ShelterMapData[] =
    shelters && shelters.length > 0
      ? shelters.map((s) => ({
          id: s.id,
          name: s.name,
          lat: s.latitude,
          lon: s.longitude,
          distance: s.distance,
          capacityPercent: s.capacityPercent,
          status: s.status,
          type:
            s.iconType === "community"
              ? "Community Center"
              : s.iconType === "district"
              ? "District Center"
              : "Relief Camp",
        }))
      : TAWANG_SHELTERS;

  const roadLinks = activeShelters.map((s) => [centerCoord, [s.lat, s.lon] as [number, number]]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <MapContainer
        center={centerCoord}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full bg-slate-100"
        attributionControl={true}
      >
        <TileLayer
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'}
          url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`}
          maxZoom={19}
          subdomains="abcd"
        />

        <ShelterMapBoundsController shelters={activeShelters} center={centerCoord} />

        {/* Dynamic Road Links to Shelters */}
        {roadLinks.map((roadCoords, idx) => (
          <Polyline
            key={`road-${idx}`}
            positions={roadCoords}
            pathOptions={{
              color: "#15803d",
              weight: 3.5,
              opacity: 0.85,
              dashArray: "6, 4",
            }}
          />
        ))}

        {/* Current Location / Sector Marker */}
        <Marker position={centerCoord} icon={createOriginIcon()}>
          <Popup className="sentinalx-popup">
            <div className="p-1 space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">
                CURRENT SECTOR
              </span>
              <div className="font-extrabold text-xs text-slate-900">
                {sectorName} ({centerCoord[0].toFixed(3)}°N, {centerCoord[1].toFixed(3)}°E)
              </div>
              <p className="text-[10px] text-slate-500">
                Designated departure point with active emergency relief staging.
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Interactive Shelter Markers */}
        {activeShelters.map((shelter) => (
          <Marker
            key={shelter.id}
            position={[shelter.lat, shelter.lon]}
            icon={createShelterIcon(shelter.distance)}
            eventHandlers={{
              click: () => {
                if (onSelectShelter) {
                  onSelectShelter(shelter.id);
                }
              },
            }}
          >
            <Popup className="sentinalx-popup">
              <div className="p-1 space-y-2 min-w-[200px]">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    {shelter.status}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {shelter.distance}
                  </span>
                </div>

                {/* Name & Type */}
                <div>
                  <div className="font-extrabold text-xs text-slate-900 leading-tight">
                    {shelter.name}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">{shelter.type}</span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                    <span>Available Capacity</span>
                    <span className="text-emerald-700 font-mono">{shelter.capacityPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${shelter.capacityPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectShelter) onSelectShelter(shelter.id);
                    }}
                    className="h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] tracking-wider flex items-center justify-center transition-colors"
                  >
                    VIEW SHELTER
                  </button>
                  <Link
                    href={`/routes?destLat=${shelter.lat}&destLon=${shelter.lon}&destName=${encodeURIComponent(
                      shelter.name
                    )}&shelterId=${shelter.id}`}
                    className="block"
                  >
                    <button
                      type="button"
                      className="w-full h-8 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-[10px] tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>DIRECTIONS</span>
                    </button>
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Info Pill on Map */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-[10px] font-bold text-slate-700 flex items-center gap-2 select-none">
        <Home className="w-3.5 h-3.5 text-emerald-600" />
        <span>
          {sectorName} • {activeShelters.length} Active Relief Shelters
        </span>
      </div>
    </div>
  );
}
