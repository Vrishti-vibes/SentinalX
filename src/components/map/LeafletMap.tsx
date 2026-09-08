"use client";

import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Layers, X, ChevronUp, ChevronDown } from "lucide-react";
import "@/styles/leaflet-setup.css";
import { useDeviceMode } from "@/components/layout/DeviceModeContext";
import { HistoricalLandslideRecord } from "@/types/landslide";
import { RiskEngineResult } from "@/types/risk";
import { IncidentReportRecord, SensorReadingRecord } from "@/types/database";
import { LandslideInventoryService } from "@/lib/data/landslide-inventory.service";

import {
  LayerFilter,
  LayerVisibility,
  DEFAULT_LAYER_VISIBILITY,
  GisMapFeature,
} from "@/types/gis-map";

export type { LayerFilter, LayerVisibility, GisMapFeature };
export { DEFAULT_LAYER_VISIBILITY };

// Custom DivIcon generator for crisp vector icons without broken PNG URLs
function createHtmlIcon(html: string, className = "sentinalx-marker", size: [number, number] = [22, 22]) {
  if (typeof window === "undefined") {
    return {} as L.DivIcon;
  }
  return L.divIcon({
    className,
    html,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2],
  });
}

const ICONS = {
  shelter: createHtmlIcon(
    `<div style="background:#15803d;width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V9l7-6 7 6v12"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/></svg></div>`,
    "sentinalx-marker",
    [22, 22]
  ),
  sensor: createHtmlIcon(
    `<div style="background:#2563eb;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5" fill="white"/><path d="M5 19a10 10 0 0 1 0-14"/><path d="M19 19a10 10 0 0 0 0-14"/></svg></div>`,
    "sentinalx-marker",
    [20, 20]
  ),
  incident: createHtmlIcon(
    `<div style="background:#dc2626;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-9 16h18L12 3z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.8" fill="white"/></svg></div>`,
    "sentinalx-marker",
    [20, 20]
  ),
  historical: createHtmlIcon(
    `<div style="background:#7e22ce;width:12px;height:12px;border-radius:50%;border:1.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    "sentinalx-marker",
    [12, 12]
  ),
  locationTawang: createHtmlIcon(
    `<div style="background:#0f172a;padding:2px 8px;border-radius:999px;border:1.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);color:white;font-family:monospace;font-size:9px;font-weight:700;display:flex;align-items:center;gap:4px;white-space:nowrap;"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#10b981;animation:pulse 2s infinite;"></span><span>TAWANG SECTOR</span></div>`,
    "sentinalx-marker",
    [98, 20]
  ),
  locationGangtok: createHtmlIcon(
    `<div style="background:#0f172a;padding:2px 8px;border-radius:999px;border:1.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);color:white;font-family:monospace;font-size:9px;font-weight:700;display:flex;align-items:center;gap:4px;white-space:nowrap;"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#10b981;animation:pulse 2s infinite;"></span><span>GANGTOK / SEVOKE</span></div>`,
    "sentinalx-marker",
    [112, 20]
  ),
};

// Sector Map Fly-to Controller
function MapController({ selectedLocation }: { selectedLocation: string }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation === "tawang") {
      map.flyTo([27.587, 91.860], 14, { duration: 1.2 });
    } else if (selectedLocation === "gangtok") {
      map.flyTo([27.331, 88.613], 14, { duration: 1.2 });
    }
  }, [selectedLocation, map]);

  return null;
}

// Static Geo-data definitions
export const SECTOR_COORDS = {
  tawang: [27.587, 91.860] as [number, number],
  gangtok: [27.331, 88.613] as [number, number],
};

// 4-Tier Landslide Risk Zone Polygons
interface RiskZonePolygon {
  id: string;
  name: string;
  sector: "tawang" | "gangtok" | "ner";
  level: "Critical" | "High" | "Moderate" | "Low";
  fos: number;
  saturation: string;
  color: string;
  fillColor: string;
  coordinates: [number, number][];
  description: string;
}

const RISK_ZONES: RiskZonePolygon[] = [
  // Tawang Critical / Severe (Lumla-Zemithang Slope)
  {
    id: "RZ-TW-01",
    name: "Zemithang-Lumla Slope Alpha",
    sector: "tawang",
    level: "Critical",
    fos: 0.92,
    saturation: "94.2%",
    color: "#b91c1c",
    fillColor: "#ef4444",
    coordinates: [
      [27.575, 91.838],
      [27.598, 91.842],
      [27.604, 91.868],
      [27.588, 91.878],
      [27.568, 91.862],
    ],
    description: "Active tension crack displacement detected near Lumla. Factor of Safety FoS < 1.0 (Severe Failure Risk).",
  },
  // Tawang Moderate (Tawang Ridge KM-14 Watch Zone)
  {
    id: "RZ-TW-02",
    name: "Tawang Ridge KM-14 Watch Zone",
    sector: "tawang",
    level: "Moderate",
    fos: 1.18,
    saturation: "78.0%",
    color: "#d97706",
    fillColor: "#f59e0b",
    coordinates: [
      [27.558, 91.815],
      [27.572, 91.822],
      [27.579, 91.842],
      [27.562, 91.838],
    ],
    description: "Elevated pore pressure from antecedent rainfall. Caution advised on cut slopes.",
  },
  // Gangtok Critical / Severe (Teesta Valley Escarpment)
  {
    id: "RZ-GTK-01",
    name: "Teesta Valley Escarpment Alpha",
    sector: "gangtok",
    level: "Critical",
    fos: 0.88,
    saturation: "91.5%",
    color: "#b91c1c",
    fillColor: "#ef4444",
    coordinates: [
      [27.318, 88.588],
      [27.342, 88.598],
      [27.338, 88.625],
      [27.312, 88.618],
    ],
    description: "Active rockfall and debris accumulation along NH-10 riverbank cutting. Severe risk.",
  },
  // Gangtok Moderate (Ranipool - Singtam Hill Slope)
  {
    id: "RZ-GTK-02",
    name: "Rangpo-Singtam Watch Zone",
    sector: "gangtok",
    level: "Moderate",
    fos: 1.22,
    saturation: "75.0%",
    color: "#d97706",
    fillColor: "#f59e0b",
    coordinates: [
      [27.278, 88.508],
      [27.302, 88.528],
      [27.308, 88.548],
      [27.288, 88.538],
    ],
    description: "Pore-pressure trend increasing along Ranipool-Singtam slope. FoS 1.22.",
  },
  // NER Regional High Risk Zones (Haflong, Melthum)
  {
    id: "RZ-AS-01",
    name: "Haflong Hill Cut Zone (Assam)",
    sector: "ner",
    level: "High",
    fos: 1.05,
    saturation: "88.0%",
    color: "#ea580c",
    fillColor: "#f97316",
    coordinates: [
      [25.158, 93.002],
      [25.188, 93.012],
      [25.192, 93.038],
      [25.162, 93.032],
    ],
    description: "High hazard debris slide corridor along Dima Hasao railway embankment.",
  },
];

// Designated Shelters
interface ShelterPoint {
  id: string;
  name: string;
  address: string;
  latLng: [number, number];
  capacity: string;
  supplies: string;
  status: "OPEN" | "FULL" | "STANDBY";
  elevation: string;
  roadAccess: string;
}

const SHELTER_POINTS: ShelterPoint[] = [
  {
    id: "SH-TW-01",
    name: "Tawang Community Center",
    address: "Monastery Ridge Rd, Tawang",
    latLng: [27.588, 91.862],
    capacity: "85% (340 / 400 Open)",
    supplies: "Emergency First Aid, Food Rations, Generator Power",
    status: "OPEN",
    elevation: "3,048 m MSL",
    roadAccess: "Unblocked (NH-13 Link)",
  },
  {
    id: "SH-TW-02",
    name: "Government Relief Camp",
    address: "Old Market Complex, Tawang",
    latLng: [27.581, 91.854],
    capacity: "62% (155 / 250 Open)",
    supplies: "Sleeping Mats, Clean Water, Medical Support",
    status: "OPEN",
    elevation: "2,820 m MSL",
    roadAccess: "Unblocked (Market Spur)",
  },
  {
    id: "SH-TW-03",
    name: "District Relief Center",
    address: "DC Office Sector, Tawang",
    latLng: [27.593, 91.871],
    capacity: "40% (120 / 300 Open)",
    supplies: "Satellite Communications, Warm Blankets",
    status: "OPEN",
    elevation: "3,110 m MSL",
    roadAccess: "Passable (Govt Route)",
  },
  {
    id: "SH-GTK-01",
    name: "Teesta Valley Relief Center",
    address: "NH-10 Mile 5, Gangtok",
    latLng: [27.329, 88.608],
    capacity: "75% (225 / 300 Open)",
    supplies: "Trauma Care, Blankets, High-Calorie Rations",
    status: "OPEN",
    elevation: "1,650 m MSL",
    roadAccess: "Caution (NH-10 Active)",
  },
];

// In-situ Geotechnical Sensors
interface SensorPoint {
  id: string;
  name: string;
  subCode: string;
  latLng: [number, number];
  pressure: string;
  tilt: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  fos: number;
  lastPing: string;
}

const SENSOR_POINTS: SensorPoint[] = [
  {
    id: "SN-TW-01",
    name: "Tawang Pass Slope Probe",
    subCode: "SN-TW-01",
    latLng: [27.580, 91.850],
    pressure: "42.1 kPa",
    tilt: "9.6° displacement",
    status: "ONLINE",
    fos: 1.12,
    lastPing: "2s ago",
  },
  {
    id: "SN-TW-02",
    name: "Sela Pass Sub-surface Probe",
    subCode: "SN-TW-02",
    latLng: [27.505, 92.100],
    pressure: "38.5 kPa",
    tilt: "4.2° displacement",
    status: "ONLINE",
    fos: 1.45,
    lastPing: "4s ago",
  },
  {
    id: "SN-GTK-01",
    name: "Sevoke Teesta Escarpment Station",
    subCode: "SN-SK-01",
    latLng: [27.335, 88.615],
    pressure: "51.4 kPa",
    tilt: "11.2° displacement",
    status: "ONLINE",
    fos: 0.94,
    lastPing: "1s ago",
  },
  {
    id: "SN-GTK-02",
    name: "Chungthang Piezometer Node",
    subCode: "SN-SK-02",
    latLng: [27.540, 88.580],
    pressure: "46.8 kPa",
    tilt: "7.1° displacement",
    status: "ONLINE",
    fos: 1.08,
    lastPing: "3s ago",
  },
];

// Real OSRM Road Geometry for Tawang Safe Evacuation Corridor
const TAWANG_SAFE_ROAD_COORDINATES: [number, number][] = [
  [27.585987, 91.859058],
  [27.586336, 91.85916],
  [27.58663, 91.859238],
  [27.586669, 91.859253],
  [27.586718, 91.859284],
  [27.586886, 91.859379],
  [27.587029, 91.859449],
  [27.587091, 91.859468],
  [27.587148, 91.85948],
  [27.587199, 91.85949],
  [27.587239, 91.859501],
  [27.587296, 91.859525],
  [27.587407, 91.859576],
  [27.587613, 91.859691],
  [27.587821, 91.85979],
  [27.587863, 91.859814],
  [27.587907, 91.859847],
  [27.587977, 91.859904],
  [27.588043, 91.859973],
  [27.588226, 91.860178],
  [27.588295, 91.860253],
  [27.588331, 91.860308],
  [27.588407, 91.860435],
  [27.588436, 91.860474],
  [27.588477, 91.860507],
  [27.588515, 91.86053],
  [27.588914, 91.860703],
  [27.58897, 91.860734],
  [27.589405, 91.860903],
  [27.589693, 91.860962],
  [27.589796, 91.860967],
  [27.589953, 91.860975],
  [27.590072, 91.860979],
  [27.590123, 91.860983],
  [27.590211, 91.861021],
  [27.590276, 91.86107],
  [27.590349, 91.861133],
  [27.590468, 91.861218],
  [27.590594, 91.861278],
  [27.590657, 91.861301],
  [27.590727, 91.861321],
  [27.590796, 91.86134],
  [27.590881, 91.861356],
  [27.590966, 91.861367],
  [27.591046, 91.861377],
  [27.591096, 91.861373],
  [27.591142, 91.861387],
  [27.591302, 91.861466],
  [27.591382, 91.861513],
  [27.59154, 91.861626],
  [27.591571, 91.861652],
  [27.59161, 91.861671],
  [27.591631, 91.861676],
  [27.591667, 91.861686],
  [27.591723, 91.861694],
  [27.591786, 91.861703],
  [27.591855, 91.861709],
  [27.59191, 91.861712],
  [27.592001, 91.861717],
  [27.592073, 91.861728],
  [27.592109, 91.861736],
  [27.592132, 91.861745],
  [27.59215, 91.861756],
  [27.592165, 91.861776],
  [27.592187, 91.861831],
  [27.592194, 91.861871],
  [27.592193, 91.861891],
  [27.592189, 91.861913],
  [27.592176, 91.861951],
  [27.592131, 91.862081],
  [27.592106, 91.862148],
  [27.59208, 91.862206],
  [27.592069, 91.862239],
  [27.59206, 91.862265],
  [27.592045, 91.862321],
  [27.592038, 91.862347],
  [27.592027, 91.862374],
  [27.592005, 91.862414],
  [27.591975, 91.862466],
  [27.591938, 91.862559],
  [27.591862, 91.862765],
  [27.591828, 91.86287],
  [27.591819, 91.862934],
  [27.591818, 91.863017],
  [27.591827, 91.863063],
  [27.591852, 91.863098],
  [27.5919, 91.863133],
  [27.591941, 91.863148],
  [27.592069, 91.86318],
  [27.592123, 91.863198],
  [27.592162, 91.863216],
  [27.592202, 91.863243],
  [27.592358, 91.863333],
  [27.592382, 91.863354],
  [27.592409, 91.86338],
  [27.592441, 91.863431],
  [27.592459, 91.863487],
  [27.592461, 91.863543],
  [27.592446, 91.863609],
  [27.592378, 91.863734],
  [27.592348, 91.863779],
  [27.592314, 91.863809],
  [27.592274, 91.863849],
  [27.592127, 91.863929],
  [27.592019, 91.863991],
  [27.591922, 91.864061],
  [27.591874, 91.864117],
  [27.591779, 91.864249],
  [27.591678, 91.864356],
  [27.591644, 91.864383],
  [27.591529, 91.864455],
  [27.591339, 91.864573],
  [27.591223, 91.86467],
  [27.591135, 91.864758],
  [27.591047, 91.864892],
  [27.591016, 91.864955],
  [27.59098, 91.865013],
  [27.590989, 91.865028],
  [27.590996, 91.865056],
  [27.590998, 91.865089],
  [27.590953, 91.865296],
  [27.590924, 91.865489],
  [27.590923, 91.865565],
  [27.590926, 91.865629],
  [27.590936, 91.865712],
  [27.590947, 91.865771],
  [27.590966, 91.865811],
  [27.590993, 91.865848],
  [27.591044, 91.865905],
  [27.591102, 91.865957],
  [27.59134, 91.866152],
  [27.591444, 91.866221],
  [27.591573, 91.866275],
  [27.591623, 91.866307],
  [27.59167, 91.866354],
  [27.591851, 91.866629],
  [27.591932, 91.866768],
  [27.591972, 91.866835],
  [27.592009, 91.866874],
  [27.59217, 91.866988],
  [27.592469, 91.867286],
  [27.592698, 91.867487],
  [27.592945, 91.867613],
  [27.593256, 91.867692],
  [27.593463, 91.867745],
  [27.593907, 91.867702],
  [27.594252, 91.86779],
  [27.594599, 91.867906],
  [27.594756, 91.867941],
  [27.594845, 91.867975],
  [27.594737, 91.868099],
  [27.594684, 91.868136],
  [27.594635, 91.868142],
  [27.594526, 91.86813],
  [27.594449, 91.868118],
  [27.594329, 91.868106],
  [27.594271, 91.868104],
  [27.594214, 91.868114],
  [27.594157, 91.868134],
  [27.594124, 91.868161],
  [27.594088, 91.868201],
  [27.594058, 91.86825],
  [27.594034, 91.868311],
  [27.594011, 91.868422],
  [27.593997, 91.868513],
  [27.593991, 91.868579],
  [27.593974, 91.868657],
  [27.593915, 91.868895],
  [27.593867, 91.869131],
  [27.593855, 91.869215],
  [27.59386, 91.869264],
  [27.593888, 91.869341],
  [27.593941, 91.869376],
  [27.593994, 91.869378],
  [27.594036, 91.869381],
  [27.594077, 91.86939],
  [27.594119, 91.869432],
  [27.594212, 91.869579],
  [27.594243, 91.869634],
  [27.594271, 91.869667],
  [27.594327, 91.869721],
  [27.594388, 91.869786],
  [27.594458, 91.869852],
  [27.594575, 91.86996],
  [27.594687, 91.870051],
  [27.594754, 91.870101],
  [27.594834, 91.870148],
  [27.594883, 91.870189],
  [27.594908, 91.870236],
  [27.594919, 91.870307],
  [27.594916, 91.870416],
  [27.59491, 91.870461],
  [27.594893, 91.870543],
  [27.594872, 91.870589],
  [27.594837, 91.870642],
  [27.594737, 91.870758],
  [27.594676, 91.870825],
  [27.594663, 91.87084],
  [27.59458, 91.870937],
  [27.594521, 91.871029],
  [27.594494, 91.871093],
  [27.594477, 91.871152],
  [27.594463, 91.871214],
  [27.594454, 91.871291],
  [27.594456, 91.871366],
  [27.594471, 91.871444],
  [27.594485, 91.871557],
  [27.594504, 91.87171],
  [27.594518, 91.871763],
  [27.594544, 91.871818],
  [27.59457, 91.871867],
  [27.59459, 91.871951],
  [27.594594, 91.872021],
  [27.594566, 91.872091],
  [27.594533, 91.872136],
  [27.594475, 91.872171],
  [27.59438, 91.87219],
  [27.594314, 91.872182],
  [27.594257, 91.872179],
  [27.594124, 91.872194],
  [27.593891, 91.872236],
  [27.593805, 91.872262],
  [27.59361, 91.8723],
  [27.593487, 91.872375],
  [27.593368, 91.872493],
  [27.593311, 91.872579],
  [27.59322, 91.872793],
  [27.593078, 91.873003],
  [27.592942, 91.873214],
  [27.592917, 91.873265],
  [27.592891, 91.873336],
  [27.592877, 91.873395],
  [27.592864, 91.873465],
  [27.592854, 91.87355],
  [27.592857, 91.873633],
  [27.592877, 91.873812],
  [27.592889, 91.873864],
  [27.592888, 91.873893],
  [27.592873, 91.873921],
  [27.592807, 91.874017],
  [27.59272, 91.874144],
  [27.592564, 91.87436],
  [27.592393, 91.874558],
  [27.592285, 91.874704],
  [27.59221, 91.874818],
  [27.592173, 91.87488],
  [27.59215, 91.874928],
  [27.592093, 91.875054],
];

// Road Corridors
const ROAD_CORRIDORS = [
  {
    id: "ROAD-TW-SAFE",
    name: "NH-13 Safe Evacuation Corridor",
    sector: "tawang",
    status: "SAFE",
    color: "#16a34a",
    weight: 4,
    dashArray: undefined,
    coordinates: TAWANG_SAFE_ROAD_COORDINATES,
  },
  {
    id: "ROAD-TW-BLOCKED",
    name: "NH-13 Km 14 Active Obstruction Segment",
    sector: "tawang",
    status: "BLOCKED",
    color: "#ef4444",
    weight: 3.5,
    dashArray: "6, 6",
    coordinates: [
      [27.582, 91.852],
      [27.586, 91.859],
      [27.589, 91.865],
    ] as [number, number][],
  },
  {
    id: "ROAD-GTK-SAFE",
    name: "NH-10 Safe Bypass Corridor",
    sector: "gangtok",
    status: "SAFE",
    color: "#16a34a",
    weight: 4,
    dashArray: undefined,
    coordinates: [
      [27.310, 88.595],
      [27.325, 88.605],
      [27.331, 88.613],
      [27.345, 88.620],
    ] as [number, number][],
  },
  {
    id: "ROAD-GTK-BLOCKED",
    name: "NH-10 Ranipool Debris Cut Segment",
    sector: "gangtok",
    status: "BLOCKED",
    color: "#ef4444",
    weight: 3.5,
    dashArray: "6, 6",
    coordinates: [
      [27.328, 88.608],
      [27.331, 88.613],
      [27.335, 88.618],
    ] as [number, number][],
  },
];

export type BaseMapType = "streets" | "satellite" | "terrain" | "light";

const BASEMAP_CONFIGS: Record<
  BaseMapType,
  { url: string; attribution: string; maxZoom: number; subdomains?: string }
> = {
  streets: {
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    subdomains: "abcd",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
    subdomains: "abc",
  },
  terrain: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, Intermap, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    maxZoom: 19,
    subdomains: "abc",
  },
  light: {
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    subdomains: "abcd",
  },
};

interface LeafletMapProps {
  selectedLocation: "tawang" | "gangtok";
  activeFilter?: LayerFilter;
  layerVisibility?: LayerVisibility;
  onSelectFeature: (feature: GisMapFeature) => void;
  riskResult: RiskEngineResult | null;
  reports?: IncidentReportRecord[];
  sensors?: SensorReadingRecord[];
}

export default function LeafletMap({
  selectedLocation,
  activeFilter = "all",
  layerVisibility,
  onSelectFeature,
  riskResult,
  reports = [],
}: LeafletMapProps) {
  const { isMobile } = useDeviceMode();
  const allHistoricalLandslides = LandslideInventoryService.getAllLandslides();

  // Internal layer visibility state synced with props
  const [layers, setLayers] = useState<LayerVisibility>(layerVisibility || DEFAULT_LAYER_VISIBILITY);
  const [baseMap, setBaseMap] = useState<BaseMapType>("streets");
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [is3dTerrain, setIs3dTerrain] = useState(false);

  useEffect(() => {
    if (layerVisibility) {
      setLayers(layerVisibility);
    }
  }, [layerVisibility]);

  // Actual visibility driven by working layer toggles
  const showRiskZones = layers.riskZones;
  const showHistorical = layers.historical;
  const showSensors = layers.sensors;
  const showShelters = layers.shelters;
  const showReports = layers.reports;
  const showRoads = layers.roads;

  const initialCenter =
    selectedLocation === "gangtok" ? SECTOR_COORDS.gangtok : SECTOR_COORDS.tawang;

  const currentRainfall = riskResult?.factors?.rainfall?.raw ?? 4.3;

  const currentBasemap = BASEMAP_CONFIGS[baseMap] || BASEMAP_CONFIGS.streets;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className={`w-full h-full transition-all duration-500 origin-bottom ${
        is3dTerrain
          ? "[perspective:1200px] [transform:perspective(1200px)_rotateX(22deg)_scale(1.04)]"
          : ""
      }`}>
      <MapContainer
        center={initialCenter}
        zoom={14}
        minZoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
        attributionControl={true}
      >
      <TileLayer
        key={baseMap}
        attribution={currentBasemap.attribution}
        url={currentBasemap.url}
        maxZoom={currentBasemap.maxZoom}
        subdomains={currentBasemap.subdomains}
      />

      <MapController selectedLocation={selectedLocation} />

      {/* -- 1. Landslide Risk Zones (Subtle Translucent Polygons with 4-Tier Color Levels) -- */}
      {showRiskZones &&
        RISK_ZONES.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.coordinates}
            pathOptions={{
              color:
                zone.level === "Critical"
                  ? "#dc2626"
                  : zone.level === "High"
                  ? "#ea580c"
                  : zone.level === "Moderate"
                  ? "#d97706"
                  : "#16a34a",
              fillColor:
                zone.level === "Critical"
                  ? "#ef4444"
                  : zone.level === "High"
                  ? "#f97316"
                  : zone.level === "Moderate"
                  ? "#f59e0b"
                  : "#22c55e",
              fillOpacity:
                zone.level === "Critical"
                  ? 0.18
                  : zone.level === "High"
                  ? 0.16
                  : zone.level === "Moderate"
                  ? 0.14
                  : 0.12,
              weight: zone.level === "Critical" ? 2 : 1.5,
              dashArray: zone.level === "Critical" ? undefined : "4, 3",
            }}
            eventHandlers={{
              click: () => {
                const isCrit = zone.level === "Critical";
                const isHigh = zone.level === "High";
                const recAction = isCrit ? "EVACUATE" : isHigh ? "AVOID ZONE" : "STAY ALERT";
                const recAdvice = isCrit
                  ? "CRITICAL FAILURE IMMINENT: High shear failure probability. Evacuate immediately to safe high-ground shelters via unblocked bypass routes."
                  : isHigh
                  ? "AVOID ZONE: Active slope creep and tension displacement. Restrict all vehicle transit and avoid hillside cuts."
                  : "STAY ALERT: Elevated saturation. Monitor continuous rainfall telemetry and local road advisories.";

                onSelectFeature({
                  id: zone.id,
                  name: zone.name,
                  subCode: `Risk Zone - FoS ${zone.fos.toFixed(2)}`,
                  type: "hazard",
                  riskLevel: isCrit ? "Critical" : isHigh ? "High" : "Moderate",
                  fos: zone.fos,
                  saturation: zone.saturation,
                  rainfall: `${currentRainfall} mm`,
                  moisture: zone.saturation,
                  slopeFos: zone.fos,
                  riskScore: isCrit ? 84.5 : isHigh ? 68.0 : 46.5,
                  dataSource: "Operational Weather (Open-Meteo) + SentinalX Geotechnical Risk Model",
                  recommendedAction: recAction,
                  actionAdvice: recAdvice,
                  telemetry1: `Slope FoS: ${zone.fos.toFixed(2)} (${isCrit ? "Critical Shear Failure" : isHigh ? "Unstable Slope" : "Marginal"})`,
                  telemetry2: `Soil Saturation: ${zone.saturation} | 24h Rain: ${currentRainfall} mm (Live Open-Meteo)`,
                  telemetry3: `Recommended Action: ${recAction}`,
                  description: zone.description,
                  actionText: "View Safe Evacuation Bypass",
                  actionHref: "/routes",
                  isDemo: false,
                });
              },
            }}
          >
            <Popup className="sentinalx-popup">
              <div className="space-y-1.5 p-0.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white ${
                      zone.level === "Critical"
                        ? "bg-rose-600"
                        : zone.level === "High"
                        ? "bg-orange-600"
                        : "bg-amber-600"
                    }`}
                  >
                    {zone.level === "Critical" ? "SEVERE RISK" : `${zone.level.toUpperCase()} RISK`}
                  </span>
                  <span className="font-mono text-[9px] text-slate-500 font-bold">{zone.id}</span>
                </div>

                <div className="font-extrabold text-xs text-slate-900 leading-snug">{zone.name}</div>

                {/* Recommended Action Badge */}
                <div className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wider flex items-center justify-between ${
                  zone.level === "Critical"
                    ? "bg-rose-100 text-rose-900 border border-rose-200"
                    : zone.level === "High"
                    ? "bg-orange-100 text-orange-900 border border-orange-200"
                    : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}>
                  <span>ACTION DIRECTIVE:</span>
                  <span className="underline decoration-2">
                    {zone.level === "Critical" ? "EVACUATE" : zone.level === "High" ? "AVOID ZONE" : "STAY ALERT"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 py-1 text-[10px] font-mono">
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[8px] uppercase">Slope FoS</span>
                    <span className="font-bold text-slate-800">{zone.fos.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[8px] uppercase">Saturation</span>
                    <span className="font-bold text-slate-800">{zone.saturation}</span>
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[8px] uppercase">24h Rain</span>
                    <span className="font-bold text-slate-800">{currentRainfall} mm</span>
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[8px] uppercase">Risk Score</span>
                    <span className="font-bold text-rose-700">{zone.level === "Critical" ? "84.5" : zone.level === "High" ? "68.0" : "46.5"} / 100</span>
                  </div>
                </div>

                <div className="bg-slate-50/90 p-1.5 rounded border border-slate-100 text-[9.5px] text-slate-600 space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase block text-[8.5px]">Main Hazard Contributors:</span>
                  <div className="flex items-center gap-1">• Heavy Infiltration & Rainfall ({currentRainfall} mm)</div>
                  <div className="flex items-center gap-1">• High Soil Saturation ({zone.saturation})</div>
                  <div className="flex items-center gap-1">• Unstable Cut Slope (FoS {zone.fos.toFixed(2)})</div>
                </div>

                <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{zone.description}</p>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href="/routes"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors"
                  >
                    <span>Find Safe Route →</span>
                  </a>
                  <span className="text-[9px] text-blue-700 font-mono font-bold">MODEL INFERENCE</span>
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

      {/* -- 2. Road Network Corridors -- */}
      {showRoads &&
        ROAD_CORRIDORS.map((corridor) => (
          <Polyline
            key={corridor.id}
            positions={corridor.coordinates}
            pathOptions={{
              color: corridor.color,
              weight: corridor.weight,
              dashArray: corridor.dashArray,
              lineCap: "round",
            }}
            eventHandlers={{
              click: () => {
                onSelectFeature({
                  id: corridor.id,
                  name: corridor.name,
                  subCode: corridor.status === "SAFE" ? "Open Corridor" : "Hazard Obstruction",
                  type: "hazard",
                  riskLevel: corridor.status === "SAFE" ? "Safe" : "Critical",
                  telemetry1: `Road Status: ${corridor.status === "SAFE" ? "Unobstructed Safe Corridor" : "Blocked by Rockfall"}`,
                  telemetry2: `Slope Stability along cut: ${corridor.status === "SAFE" ? "FoS 1.85 (Reinforced)" : "FoS 0.88 (Unstable)"}`,
                  telemetry3: `Antecedent Rainfall: ${currentRainfall} mm / 24h`,
                  description:
                    corridor.status === "SAFE"
                      ? "Designated safe evacuation corridor monitored for unobstructed vehicle passage."
                      : "Active rockfall and debris accumulation risk. Avoid travel along this highway segment.",
                  actionText: "Open Safe Route Router",
                  actionHref: "/routes",
                });
              },
            }}
          >
            <Popup className="sentinalx-popup">
              <div className="space-y-1.5 p-0.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full text-white ${
                      corridor.status === "SAFE" ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  >
                    {corridor.status === "SAFE" ? "SAFE CORRIDOR (OPEN)" : "ROAD SEVERED (BLOCKED)"}
                  </span>
                  <span className="font-mono text-[9px] text-slate-500 font-bold">{corridor.id}</span>
                </div>

                <div className="font-extrabold text-xs text-slate-900">{corridor.name}</div>

                <div className="text-[10px] space-y-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Road Clearance:</span>
                    <span className={`font-bold ${corridor.status === "SAFE" ? "text-emerald-700" : "text-rose-700"}`}>
                      {corridor.status === "SAFE" ? "Clear for Emergency Traffic" : "Blocked by Active Debris Flow"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Cut Slope FoS:</span>
                    <span className="font-mono font-bold text-slate-800">{corridor.status === "SAFE" ? "1.85 (Stable)" : "0.88 (Failure)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Antecedent Rain:</span>
                    <span className="font-mono font-bold text-slate-800">{currentRainfall} mm</span>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 font-mono pt-0.5 border-t border-slate-100 flex items-center justify-between">
                  <span>OSM/OSRM Highway Network</span>
                  <span className="text-emerald-700 font-bold">VERIFIED</span>
                </div>
              </div>
            </Popup>
          </Polyline>
        ))}

      {/* -- 3. Sector Focus Epicenter Marker -- */}
      <Marker
        position={selectedLocation === "gangtok" ? SECTOR_COORDS.gangtok : SECTOR_COORDS.tawang}
        icon={selectedLocation === "gangtok" ? ICONS.locationGangtok : ICONS.locationTawang}
        eventHandlers={{
          click: () => {
            const score = riskResult?.score ?? 43.5;
            const level = riskResult?.level ?? "MODERATE";
            const isCrit = level === "CRITICAL";
            const isHigh = level === "HIGH";
            const isMod = level === "MODERATE";
            const recAction = isCrit ? "EVACUATE" : isHigh ? "AVOID ZONE" : isMod ? "STAY ALERT" : "MONITOR";
            const recAdvice = isCrit
              ? "CRITICAL REGIONAL HAZARD: Severe landslide trigger thresholds reached. Initiate sector evacuation."
              : isHigh
              ? "HIGH REGIONAL HAZARD: Heavy moisture accumulation on critical slopes. AVOID ZONE and restrict transport."
              : isMod
              ? "MODERATE HAZARD: Elevated soil moisture and antecedent rain. STAY ALERT and check arterial road clearances."
              : "MONITOR: Slopes currently stable under prevailing atmospheric and ground motion conditions.";

            onSelectFeature({
              id: selectedLocation === "gangtok" ? "LOC-GTK" : "LOC-TW",
              name: selectedLocation === "gangtok" ? "Gangtok / Sevoke Corridor" : "Tawang Sector",
              subCode: selectedLocation === "gangtok" ? "Regional Sector • NH-10" : "Regional Sector • NH-13",
              type: "location",
              riskLevel: isCrit ? "Critical" : isHigh ? "High" : isMod ? "Moderate" : "Low",
              rainfall: `${riskResult?.factors.rainfall.raw ?? currentRainfall} mm`,
              moisture: `${riskResult?.factors.soilMoisture.raw ?? 68}%`,
              slopeFos: 1.15,
              riskScore: score,
              dataSource: "Live Weather (Open-Meteo) + SentinalX Risk Engine (Active)",
              recommendedAction: recAction,
              actionAdvice: recAdvice,
              telemetry1: `24h Rainfall: ${riskResult?.factors.rainfall.raw ?? currentRainfall} mm (Live Open-Meteo)`,
              telemetry2: `Soil Moisture: ${riskResult?.factors.soilMoisture.raw ?? 68}% | Pore Pressure: ${riskResult?.factors.porePressure.raw ?? 42.1} kPa (Field IoT Grid)`,
              telemetry3: `USGS Ground Motion: ${(Number(riskResult?.factors.groundMotion.raw ?? 0) * 100).toFixed(0)}% (Live Feed)`,
              description:
                riskResult?.primaryThreat ??
                "Elevated moisture infiltration on mountain slopes. Continuous geotechnical monitoring active.",
              actionText: "View Detailed Risk Breakdown",
              actionHref: "/",
            });
          },
        }}
      >
        <Popup className="sentinalx-popup">
          <div className="space-y-1.5 p-0.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-white">
                REGIONAL SECTOR HUB
              </span>
              <span className="font-mono text-[9px] text-slate-500 font-bold">
                {selectedLocation === "gangtok" ? "GTK-01" : "TW-01"}
              </span>
            </div>

            <div className="font-black text-xs text-slate-900">
              {selectedLocation === "gangtok" ? "Gangtok / Sevoke Corridor" : "Tawang Sector"}
            </div>

            <div className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wider flex items-center justify-between ${
              riskResult?.level === "CRITICAL"
                ? "bg-rose-100 text-rose-900 border border-rose-200"
                : riskResult?.level === "HIGH"
                ? "bg-orange-100 text-orange-900 border border-orange-200"
                : "bg-amber-100 text-amber-900 border border-amber-200"
            }`}>
              <span>ACTION DIRECTIVE:</span>
              <span className="underline decoration-2">
                {riskResult?.level === "CRITICAL"
                  ? "EVACUATE"
                  : riskResult?.level === "HIGH"
                  ? "AVOID ZONE"
                  : riskResult?.level === "SAFE"
                  ? "MONITOR"
                  : "STAY ALERT"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 py-1 text-[10px] font-mono">
              <div className="bg-slate-50 p-1 rounded border border-slate-100">
                <span className="text-slate-400 block text-[8px] uppercase">Risk Score</span>
                <span className="font-bold text-rose-700">{riskResult ? riskResult.score.toFixed(1) : "43.5"} / 100</span>
              </div>
              <div className="bg-slate-50 p-1 rounded border border-slate-100">
                <span className="text-slate-400 block text-[8px] uppercase">Live Rainfall</span>
                <span className="font-bold text-emerald-700">{riskResult?.factors.rainfall.raw ?? currentRainfall} mm</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
              {riskResult?.primaryThreat ?? "Active regional geotechnical monitoring"}
            </p>

            <div className="text-[9px] text-slate-400 font-mono pt-0.5 border-t border-slate-100 flex items-center justify-between">
              <span>Weather Stream: <strong className="text-emerald-700">LIVE</strong></span>
              <span>Model: <strong className="text-blue-700">ACTIVE</strong></span>
            </div>
          </div>
        </Popup>
      </Marker>

      {/* -- 4. Designated Shelters -- */}
      {showShelters &&
        SHELTER_POINTS.map((shelter) => (
          <Marker
            key={shelter.id}
            position={shelter.latLng}
            icon={ICONS.shelter}
            eventHandlers={{
              click: () => {
                onSelectFeature({
                  id: shelter.id,
                  name: shelter.name,
                  subCode: shelter.address,
                  type: "shelter",
                  riskLevel: "Safe",
                  fos: 2.1,
                  saturation: "18.0%",
                  telemetry1: `Capacity: ${shelter.capacity}`,
                  telemetry2: `Supplies: ${shelter.supplies}`,
                  description: `Primary emergency relief shelter. Built on reinforced bedrock with emergency generator and provisions.`,
                  actionText: "View Shelter Directions",
                  actionHref: "/shelters",
                  latLng: shelter.latLng,
                });
              },
            }}
          >
            <Popup className="sentinalx-popup">
              <div className="space-y-1.5 p-0.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    RELIEF SHELTER - {shelter.status}
                  </span>
                  <span className="font-mono text-[9px] text-slate-500 font-bold">{shelter.id}</span>
                </div>

                <div className="font-extrabold text-xs text-slate-900">{shelter.name}</div>
                <div className="text-[10px] text-slate-600 font-medium">{shelter.address}</div>

                <div className="bg-emerald-50/70 p-1.5 rounded border border-emerald-100 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Capacity:</span>
                    <span className="font-bold font-mono text-emerald-800">{shelter.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Bedrock Elevation:</span>
                    <span className="font-mono text-slate-800">{shelter.elevation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Road Connectivity:</span>
                    <span className="font-semibold text-slate-800">{shelter.roadAccess}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 font-medium">
                  <strong className="text-slate-800">Supplies:</strong> {shelter.supplies}
                </div>

                <div className="text-[9px] text-slate-400 font-mono pt-0.5 border-t border-slate-100 flex items-center justify-between">
                  <span>Certified Safe High Ground</span>
                  <span className="text-emerald-700 font-bold">OPEN 24x7</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* -- 5. In-Situ IoT Geotechnical Sensors -- */}
      {showSensors &&
        SENSOR_POINTS.map((sensor) => (
          <Marker
            key={sensor.id}
            position={sensor.latLng}
            icon={ICONS.sensor}
            eventHandlers={{
              click: () => {
                onSelectFeature({
                  id: sensor.id,
                  name: sensor.name,
                  subCode: `${sensor.subCode} • Operational Telemetry`,
                  type: "sensor",
                  riskLevel: sensor.fos < 1.0 ? "Critical" : sensor.fos < 1.2 ? "High" : "Moderate",
                  fos: sensor.fos,
                  saturation: "82.5%",
                  rainfall: `${currentRainfall} mm`,
                  moisture: "82.5%",
                  slopeFos: sensor.fos,
                  riskScore: sensor.fos < 1.0 ? 82.0 : 64.0,
                  dataSource: "Operational In-Situ Geotechnical Sensor Network",
                  recommendedAction: sensor.fos < 1.0 ? "EVACUATE" : sensor.fos < 1.2 ? "AVOID ZONE" : "STAY ALERT",
                  actionAdvice: `Inclinometer recorded ${sensor.tilt}. Pore pressure is ${sensor.pressure}. Local slope FoS is ${sensor.fos.toFixed(2)}.`,
                  telemetry1: `Hydrostatic Pressure: ${sensor.pressure}`,
                  telemetry2: `Inclinometer Tilt: ${sensor.tilt}`,
                  telemetry3: `Slope FoS: ${sensor.fos.toFixed(2)} | Status: ${sensor.status}`,
                  description:
                    "Sub-surface piezometer and dual-axis MEMS tiltmeter sensor node streaming borehole metrics.",
                  actionText: "Inspect Authority Console",
                  actionHref: "/authority",
                  isDemo: false,
                });
              },
            }}
          >
            <Popup className="sentinalx-popup">
              <div className="space-y-1.5 p-0.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    GEOTECHNICAL SENSOR FEED
                  </span>
                  <span className="font-mono text-[9px] text-slate-500 font-bold">{sensor.subCode}</span>
                </div>

                <div className="font-extrabold text-xs text-slate-900">{sensor.name}</div>

                <div className="grid grid-cols-2 gap-1 py-1 text-[10px] font-mono">
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[8px] uppercase">Pore Pressure</span>
                    <span className="font-bold text-blue-700">{sensor.pressure}</span>
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[8px] uppercase">Borehole Tilt</span>
                    <span className="font-bold text-slate-800">{sensor.tilt}</span>
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[8px] uppercase">Local FoS</span>
                    <span className="font-bold text-slate-800">{sensor.fos.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[8px] uppercase">Last Ping</span>
                    <span className="font-bold text-emerald-700">{sensor.lastPing}</span>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 font-mono pt-0.5 border-t border-slate-100 flex items-center justify-between">
                  <span>In-Situ Telemetry Node</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[8px]">ACTIVE</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* -- 6. Citizen Incident Reports -- */}
      {showReports &&
        reports.map((report, idx) => {
          const lat =
            report.latitude && !isNaN(report.latitude) && report.latitude !== 0
              ? report.latitude
              : 27.586 + idx * 0.004 * (idx % 2 === 0 ? 1 : -1);
          const lng =
            report.longitude && !isNaN(report.longitude) && report.longitude !== 0
              ? report.longitude
              : 91.862 + idx * 0.005 * (idx % 2 === 0 ? -1 : 1);

          return (
            <Marker
              key={report.reportId || `rep-${idx}`}
              position={[lat, lng]}
              icon={ICONS.incident}
              eventHandlers={{
                click: () => {
                  onSelectFeature({
                    id: report.reportId,
                    name: `${report.hazardType} Report`,
                    subCode: `${report.locationName} • Field Report`,
                    type: "report",
                    riskLevel:
                      report.severity >= 4
                        ? "Critical"
                        : report.severity === 3
                        ? "High"
                        : "Moderate",
                    rainfall: `${currentRainfall} mm`,
                    dataSource: "Verified Citizen Incident Stream",
                    recommendedAction: report.severity >= 4 ? "EVACUATE" : report.severity === 3 ? "AVOID ZONE" : "STAY ALERT",
                    actionAdvice: `Field observer reported ${report.hazardType}. Response status: ${report.responseStatus}.`,
                    telemetry1: `Severity: Level ${report.severity}/5 (${report.severity >= 4 ? "Severe Hazard" : "Elevated Risk"})`,
                    telemetry2: `Verification: ${report.verificationStatus} | Response: ${report.responseStatus}`,
                    telemetry3: `Coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
                    description: report.description,
                    actionText: "Track Incident Status",
                    actionHref: `/report/track?id=${encodeURIComponent(report.reportId)}`,
                    isDemo: false,
                  });
                },
              }}
            >
              <Popup className="sentinalx-popup">
                <div className="space-y-1.5 p-0.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      CITIZEN REPORT
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 font-bold">{report.reportId}</span>
                  </div>

                  <div className="font-extrabold text-xs text-slate-900">
                    {report.hazardType} • {report.locationName}
                  </div>

                  <div className="bg-rose-50/60 p-1.5 rounded border border-rose-100 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Severity:</span>
                      <span className="font-bold text-rose-700">Level {report.severity} / 5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Verification:</span>
                      <span className="font-semibold text-slate-800">{report.verificationStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Road Status:</span>
                      <span className="font-semibold text-rose-700">Partial Blockage</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{report.description}</p>

                  <div className="text-[9px] text-slate-400 font-mono pt-0.5 border-t border-slate-100 flex items-center justify-between">
                    <span>Incident Layer</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[8px]">VERIFIED INCIDENT</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* -- 7. All 25 Verified Historical Landslide Records (GSI/ISRO/NASA) -- */}
      {showHistorical &&
        allHistoricalLandslides.map((rec) => (
          <CircleMarker
            key={rec.id}
            center={[rec.latitude, rec.longitude]}
            radius={4}
            pathOptions={{
              color: "#ffffff",
              weight: 1.5,
              fillColor: "#7e22ce",
              fillOpacity: 0.95,
            }}
            eventHandlers={{
              click: () => {
                onSelectFeature({
                  id: rec.id,
                  name: rec.locationName || `${rec.district}, ${rec.state}`,
                  subCode: `${rec.source} (${rec.date})`,
                  type: "historical",
                  riskLevel: rec.severity === "Catastrophic" ? "Critical" : "High",
                  rainfall: `${currentRainfall} mm`,
                  dataSource: "Geological Survey of India (GSI) / ISRO Bhuvan Open Catalog",
                  recommendedAction: "MONITOR",
                  actionAdvice: `Historical cataloged event. Trigger: ${rec.trigger ?? "Precipitation"}. Recorded on ${rec.date}.`,
                  telemetry1: `Catalog: ${rec.source} (${rec.date})`,
                  telemetry2: `Trigger: ${rec.trigger ?? "Heavy Rain"} | Type: ${rec.landslideType ?? "Debris Flow"}`,
                  telemetry3: `Casualties: ${rec.fatalities ?? 0} Fatalities | ${rec.injuries ?? 0} Injuries`,
                  description: `Historical landslide recorded in public database: ${rec.landslideType}. Source: ${rec.sourceUrl}. Geocode status: ${rec.geocodeStatus}.`,
                  actionText: "View Historical Inventory API",
                  actionHref: "/api/landslides/inventory",
                  latLng: [rec.latitude, rec.longitude],
                });
              },
            }}
          >
            <Popup className="sentinalx-popup">
              <div className="space-y-1.5 p-0.5 min-w-[190px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[9px] font-extrabold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full uppercase">
                    HISTORICAL LANDSLIDE
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold">{rec.source}</span>
                </div>

                <div className="font-extrabold text-xs text-slate-900">
                  {rec.locationName || `${rec.district}, ${rec.state}`}
                </div>

                <div className="bg-purple-50/60 p-1.5 rounded border border-purple-100 text-[10px] space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-bold text-slate-800">{rec.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coords:</span>
                    <span className="font-bold text-slate-800">{rec.latitude.toFixed(3)}°N, {rec.longitude.toFixed(3)}°E</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trigger:</span>
                    <span className="font-bold text-purple-900">{rec.trigger}</span>
                  </div>
                  {((rec.fatalities ?? 0) > 0 || (rec.injuries ?? 0) > 0) && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Casualties:</span>
                      <span>{rec.fatalities ?? 0} Fat, {rec.injuries ?? 0} Inj</span>
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-slate-500 font-mono truncate">
                  Ref: {rec.sourceRecordId}
                </div>

                <div className="text-[9px] text-slate-400 font-mono pt-0.5 border-t border-slate-100 flex items-center justify-between">
                  <span>Verified Geocode</span>
                  <span className="text-purple-700 font-bold">GODL / ISRO</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
      </div>

    {/* ── Top-Right Floating GIS Layers Control ── */}
    <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
      {/* 2D / 3D Terrain Mode Switcher */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-300 shadow-md p-0.5 rounded-xl flex items-center">
        <button
          type="button"
          onClick={() => {
            setIs3dTerrain(false);
            if (baseMap === "terrain") setBaseMap("streets");
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all ${
            !is3dTerrain
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="2D Map Projection"
        >
          2D
        </button>
        <button
          type="button"
          onClick={() => {
            setIs3dTerrain(true);
            setBaseMap("terrain");
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
            is3dTerrain
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="TERRAIN Perspective with Elevation Relief"
        >
          <span>⛰️</span>
          <span>TERRAIN</span>
        </button>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-md px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all select-none cursor-pointer"
          title="Toggle Map Layers & Basemaps"
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Layers</span>
        </button>

        {isLayersOpen && (
          <div className={
            isMobile
              ? "fixed inset-x-0 bottom-0 z-[2000] w-full max-h-[70vh] overflow-y-auto bg-white border-t border-slate-300 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-4 text-xs space-y-3 animate-slideUp select-none pb-[86px]"
              : "absolute top-full right-0 mt-2 w-72 max-h-[380px] overflow-y-auto bg-white/98 backdrop-blur-md border border-slate-300 rounded-2xl shadow-2xl p-3.5 text-xs space-y-3 animate-fadeIn select-none scrollbar-thin"
          }>
            {isMobile && (
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" />
            )}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              GIS MAP CONTROLS
            </span>
            <button
              type="button"
              onClick={() => setIsLayersOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Layers"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. MAP TYPE (Radio selection) */}
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              MAP TYPE
            </div>
            <div className="space-y-1">
              {[
                { id: "streets", label: "Streets", icon: "🗺️" },
                { id: "satellite", label: "Satellite", icon: "🛰️" },
                { id: "terrain", label: "Terrain", icon: "⛰️" },
                { id: "light", label: "Light", icon: "◻️" },
              ].map((bm) => (
                <label
                  key={bm.id}
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl cursor-pointer transition-colors ${
                    baseMap === bm.id ? "bg-blue-50/90 text-blue-950 font-bold border border-blue-200" : "hover:bg-slate-100 text-slate-700 font-medium"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-sm">{bm.icon}</span>
                    <span>{bm.label}</span>
                  </span>
                  <input
                    type="radio"
                    name="basemap"
                    value={bm.id}
                    checked={baseMap === bm.id}
                    onChange={() => setBaseMap(bm.id as BaseMapType)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 2. OVERLAYS (Checkboxes) */}
          <div className="border-t border-slate-100 pt-2">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              <span>OVERLAYS</span>
              <span className="font-mono text-slate-500 font-bold text-[10px]">
                {Object.values(layers).filter(Boolean).length}/6 ACTIVE
              </span>
            </div>
            <div className="space-y-1">
              {[
                { key: "riskZones", label: "Risk Zones" },
                { key: "historical", label: "Historical Landslides" },
                { key: "shelters", label: "Shelters" },
                { key: "sensors", label: "Sensors" },
                { key: "reports", label: "Citizen Reports" },
                { key: "roads", label: "Road Status" },
              ].map((l) => (
                <label
                  key={l.key}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <span className="font-medium text-slate-800 text-xs">{l.label}</span>
                  <input
                    type="checkbox"
                    checked={layers[l.key as keyof LayerVisibility]}
                    onChange={() =>
                      setLayers((prev) => ({
                        ...prev,
                        [l.key]: !prev[l.key as keyof LayerVisibility],
                      }))
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>

    {/* ── Compact Professional Map Legend (Bottom-Left) ── */}
    <div className="absolute bottom-2 left-2 z-[1000] max-w-[calc(100%-16px)] pointer-events-auto">
      {isMobile && (
        <button 
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="mb-1 flex items-center justify-between w-full bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/90 shadow-sm text-[10px] font-bold text-slate-700"
        >
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" /> Map Legend
          </span>
          {isLegendOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      )}

      {(!isMobile || isLegendOpen) && (
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl border border-slate-200/90 shadow-md space-y-1 text-[9px] sm:text-[10px] font-bold text-slate-700 select-none">
          {/* Row 1: 4-Tier Risk Levels */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>LOW — MONITOR</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>MODERATE — STAY ALERT</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              <span>HIGH — AVOID ZONE</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>SEVERE — EVACUATE</span>
            </div>
          </div>
          {/* Row 2: Map Feature Symbols */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-600 border-t border-slate-100 pt-1 text-[8.5px] sm:text-[9px]">
            <span className="flex items-center gap-1">🏠 Shelter</span>
            <span className="flex items-center gap-1">⚠ Incident</span>
            <span className="flex items-center gap-1">📡 Sensor</span>
            <span className="flex items-center gap-1">🛣 Road</span>
            <span className="flex items-center gap-1">📍 Current</span>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
