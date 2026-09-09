"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { RiskEngineResult } from "@/types/risk";
import { IncidentReportRecord, SensorReadingRecord } from "@/types/database";
import {
  NER_LOCATIONS,
  NER_RISK_ZONES,
  NER_HEATMAP_POINTS,
  NER_INCIDENTS,
  NER_ROADS,
  NER_SHELTERS,
  NER_SENSORS,
  NerLocationItem,
  NerRiskZone,
  NerIncident,
  NerRoadCorridor,
  NerShelter,
  NerSensorNode,
} from "@/lib/data/ner-gis-data";

import {
  LayerFilter,
  LayerVisibility,
  DEFAULT_LAYER_VISIBILITY,
  GisMapFeature,
} from "@/types/gis-map";

export type { LayerFilter, LayerVisibility, GisMapFeature };
export { DEFAULT_LAYER_VISIBILITY };

// Backward compatibility coordinate map
export const SECTOR_COORDS: Record<string, [number, number]> = {
  ner: [26.2006, 92.9376],
  tawang: [27.587, 91.860],
  arunachal: [27.587, 91.860],
  gangtok: [27.331, 88.613],
  sikkim: [27.331, 88.613],
  assam: [26.1445, 91.7362],
  guwahati: [26.1445, 91.7362],
  meghalaya: [25.5788, 91.8933],
  shillong: [25.5788, 91.8933],
  nagaland: [25.6751, 94.1086],
  kohima: [25.6751, 94.1086],
  manipur: [24.8170, 93.9368],
  imphal: [24.8170, 93.9368],
  mizoram: [23.7271, 92.7176],
  aizawl: [23.7271, 92.7176],
  tripura: [23.8315, 91.2868],
  agartala: [23.8315, 91.2868],
  haflong: [25.1764, 93.0182],
  cherrapunji: [25.2986, 91.7314],
};

// Safe Vector DivIcon Factory
function createHtmlIcon(html: string, size: [number, number] = [24, 24]) {
  if (typeof window === "undefined" || !L || !L.divIcon) {
    return {} as L.DivIcon;
  }
  return L.divIcon({
    className: "sentinalx-marker",
    html,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2],
  });
}

// Basemap Configurations
export type BaseMapType = "streets" | "satellite" | "terrain";

export const BASEMAP_CONFIGS: Record<
  BaseMapType,
  { url: string; attribution: string; maxZoom: number; label: string; provider: string }
> = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
    label: "Street Map",
    provider: "OpenStreetMap Public Tiles",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
    label: "Satellite Imagery",
    provider: "Esri World Imagery (High Resolution Aerial)",
  },
  terrain: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: USGS, FAO, NPS, NRCAN, GeoBase",
    maxZoom: 19,
    label: "Topographic Terrain",
    provider: "Esri World Topographic Map",
  },
};

// Sector Map Fly-to Controller
function MapController({
  selectedLocation,
  selectedLocationData,
}: {
  selectedLocation: string;
  selectedLocationData?: NerLocationItem | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocationData) {
      map.flyTo(selectedLocationData.latLng, selectedLocationData.zoom, { duration: 1.2 });
      return;
    }

    const locKey = (selectedLocation || "ner").toLowerCase();
    const locMatch = NER_LOCATIONS.find((l) => l.id.toLowerCase() === locKey);

    if (locMatch) {
      map.flyTo(locMatch.latLng, locMatch.zoom, { duration: 1.2 });
    } else if (SECTOR_COORDS[locKey]) {
      map.flyTo(SECTOR_COORDS[locKey], locKey === "ner" ? 7 : 13, { duration: 1.2 });
    } else {
      map.flyTo([26.2006, 92.9376], 7, { duration: 1.2 });
    }
  }, [selectedLocation, selectedLocationData, map]);

  return null;
}

export interface LeafletMapProps {
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

export default function LeafletMap({
  selectedLocation,
  selectedLocationData,
  activeFilter = "all",
  layerVisibility,
  onSelectFeature,
  onSelectLocation,
  riskResult,
  reports = [],
  sensors = [],
}: LeafletMapProps) {
  const { isMobile } = useDeviceMode();
  const [isMounted, setIsMounted] = useState(false);
  const [baseMap, setBaseMap] = useState<BaseMapType>("streets");
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  // Internal layer visibility state synced with props
  const [layers, setLayers] = useState<LayerVisibility>(layerVisibility || DEFAULT_LAYER_VISIBILITY);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (layerVisibility) {
      setLayers(layerVisibility);
    }
  }, [layerVisibility]);

  // Icons generated safely on client
  const icons = useMemo(() => {
    if (!isMounted || typeof window === "undefined") return null;

    return {
      incident: createHtmlIcon(
        '<div style="background:#dc2626;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>',
        [24, 24]
      ),
      shelter: createHtmlIcon(
        '<div style="background:#15803d;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V9l7-6 7 6v12"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/></svg></div>',
        [24, 24]
      ),
      sensor: createHtmlIcon(
        '<div style="background:#2563eb;width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5" fill="white"/><path d="M5 19a10 10 0 0 1 0-14"/><path d="M19 19a10 10 0 0 0 0-14"/></svg></div>',
        [22, 22]
      ),
      report: createHtmlIcon(
        '<div style="background:#ea580c;width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>',
        [22, 22]
      ),
      selectedPin: createHtmlIcon(
        '<div style="position:relative;display:flex;align-items:center;justify-content:center;"><span style="position:absolute;width:34px;height:34px;border-radius:50%;background:rgba(59,130,246,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span><div style="background:#0f172a;padding:3px 8px;border-radius:999px;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.35);color:white;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:10px;font-weight:800;display:flex;align-items:center;gap:5px;white-space:nowrap;"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;"></span><span>SELECTED LOCATION</span></div></div>',
        [120, 24]
      ),
    };
  }, [isMounted]);

  const currentBasemap = BASEMAP_CONFIGS[baseMap] || BASEMAP_CONFIGS.streets;

  // Center coordinate
  const centerCoord: [number, number] = useMemo(() => {
    if (selectedLocationData) return selectedLocationData.latLng;
    const locKey = (selectedLocation || "ner").toLowerCase();
    const match = NER_LOCATIONS.find((l) => l.id.toLowerCase() === locKey);
    if (match) return match.latLng;
    return SECTOR_COORDS[locKey] || [26.2006, 92.9376];
  }, [selectedLocation, selectedLocationData]);

  if (!isMounted || !icons) {
    return (
      <div className="w-full h-full min-h-[420px] bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
          INITIALIZING NER GIS MAP ENGINE...
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <MapContainer
        center={centerCoord}
        zoom={selectedLocation === "ner" ? 7 : 12}
        minZoom={6}
        maxZoom={18}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        attributionControl={true}
      >
        <TileLayer
          key={baseMap}
          attribution={currentBasemap.attribution}
          url={currentBasemap.url}
          maxZoom={currentBasemap.maxZoom}
        />

        <MapController
          selectedLocation={selectedLocation}
          selectedLocationData={selectedLocationData}
        />

        {/* ── 1. RISK HEATMAP LAYER ── */}
        {layers.heatmap && (
          <>
            {NER_HEATMAP_POINTS.map((pt, idx) => {
              const intensity = pt[2];
              const haloColor =
                intensity > 0.88
                  ? "#dc2626"
                  : intensity > 0.75
                  ? "#ea580c"
                  : intensity > 0.6
                  ? "#f59e0b"
                  : "#10b981";

              return (
                <React.Fragment key={'heat-' + idx}>
                  <CircleMarker
                    center={[pt[0], pt[1]]}
                    radius={intensity > 0.8 ? 28 : 20}
                    pathOptions={{
                      color: "transparent",
                      fillColor: haloColor,
                      fillOpacity: 0.28,
                      weight: 0,
                    }}
                  />
                  <CircleMarker
                    center={[pt[0], pt[1]]}
                    radius={intensity > 0.8 ? 12 : 8}
                    pathOptions={{
                      color: "transparent",
                      fillColor: haloColor,
                      fillOpacity: 0.55,
                      weight: 0,
                    }}
                  />
                </React.Fragment>
              );
            })}
          </>
        )}

        {/* ── 2. LANDSLIDE RISK ZONES ── */}
        {layers.riskZones &&
          NER_RISK_ZONES.map((zone: NerRiskZone) => {
            const isVeryHigh = zone.level === "VERY HIGH";
            const isHigh = zone.level === "HIGH";
            const isMod = zone.level === "MODERATE";

            return (
              <Polygon
                key={zone.id}
                positions={zone.coordinates}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.fillColor,
                  fillOpacity: isVeryHigh ? 0.26 : isHigh ? 0.22 : isMod ? 0.16 : 0.12,
                  weight: isVeryHigh ? 2.5 : 1.8,
                  dashArray: isVeryHigh ? undefined : "4, 4",
                }}
                eventHandlers={{
                  click: () => {
                    onSelectFeature({
                      id: zone.id,
                      name: zone.name,
                      subCode: zone.state + " • FoS " + zone.fos.toFixed(2),
                      type: "hazard",
                      riskLevel: isVeryHigh ? "Critical" : isHigh ? "High" : isMod ? "Moderate" : "Low",
                      fos: zone.fos,
                      saturation: zone.saturation,
                      rainfall: isVeryHigh ? 168.0 : isHigh ? 135.0 : 88.0,
                      moisture: zone.saturation,
                      slopeStability: isVeryHigh ? "Critical FoS < 1.0" : isHigh ? "Unstable Slope" : "Marginal",
                      riskScore: isVeryHigh ? 88 : isHigh ? 76 : isMod ? 54 : 28,
                      description: zone.description,
                      road: "Regional Arterial Corridor",
                      status: isVeryHigh ? "RESTRICTED" : isHigh ? "CAUTION" : "PASSABLE",
                      actionText: "Safe Evacuation Route",
                      actionHref: "/routes",
                      recommendedAction: isVeryHigh ? "EVACUATE" : isHigh ? "AVOID ZONE" : "STAY ALERT",
                      actionAdvice: isVeryHigh
                        ? "SEVERE FAILURE IMMINENT: High shear failure probability. Restrict transport corridors and deploy field sensors."
                        : isHigh
                        ? "HIGH HAZARD: Elevated soil moisture and slope creep. Restrict arterial traffic."
                        : "MODERATE: Ongoing monitoring under regional rainfall parameters.",
                    });
                  },
                }}
              >
                <Popup className="sentinalx-popup">
                  <div className="space-y-1.5 p-0.5 min-w-[210px]">
                    <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1">
                      <span
                        className={'text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white ' + (
                          isVeryHigh
                            ? "bg-rose-600"
                            : isHigh
                            ? "bg-orange-600"
                            : isMod
                            ? "bg-amber-600"
                            : "bg-emerald-600"
                        )}
                      >
                        {zone.level} RISK ZONE
                      </span>
                      <span className="font-mono text-[9px] text-slate-500 font-bold">{zone.id}</span>
                    </div>

                    <div className="font-extrabold text-xs text-slate-900 leading-snug">{zone.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">State: {zone.state}</div>

                    <div className="grid grid-cols-2 gap-1 py-1 text-[10px] font-mono">
                      <div className="bg-slate-50 p-1 rounded border border-slate-100">
                        <span className="text-slate-400 block text-[8px] uppercase">Slope FoS</span>
                        <span className="font-bold text-slate-900">{zone.fos.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-50 p-1 rounded border border-slate-100">
                        <span className="text-slate-400 block text-[8px] uppercase">Saturation</span>
                        <span className="font-bold text-slate-900">{zone.saturation}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{zone.description}</p>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href="/routes"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition-colors"
                      >
                        Safe Route →
                      </a>
                      <span className="text-[9px] text-slate-500 font-mono font-bold">GIS POLYGON</span>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {/* ── 3. ROAD NETWORK CORRIDORS ── */}
        {layers.roads &&
          NER_ROADS.map((corridor: NerRoadCorridor) => (
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
                    subCode: corridor.highway + " • " + corridor.state,
                    type: "road",
                    riskLevel: corridor.status === "CLOSED" ? "Critical" : corridor.status === "RESTRICTED" ? "High" : "Moderate",
                    road: corridor.highway,
                    status: corridor.status,
                    description: corridor.description,
                    actionText: "Find Alternative Route",
                    actionHref: "/routes",
                    recommendedAction: corridor.status === "RESTRICTED" ? "AVOID ZONE" : "STAY ALERT",
                    actionAdvice: 'Highway speed advisory: ' + corridor.speedKmH + ' km/h. Road status is ' + corridor.status + '.',
                  });
                },
              }}
            >
              <Popup className="sentinalx-popup">
                <div className="space-y-1.5 p-0.5 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                      {corridor.highway}
                    </span>
                    <span
                      className={'text-[9px] font-bold px-1.5 py-0.5 rounded ' + (
                        corridor.status === "RESTRICTED"
                          ? "bg-rose-100 text-rose-800"
                          : corridor.status === "CLOSED"
                          ? "bg-red-200 text-red-900"
                          : corridor.status === "CAUTION"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {corridor.status}
                    </span>
                  </div>
                  <div className="font-extrabold text-xs text-slate-900">{corridor.name}</div>
                  <div className="text-[10px] text-slate-600 font-medium">{corridor.description}</div>
                  <div className="text-[9px] font-mono text-slate-500 pt-0.5 border-t border-slate-100 flex items-center justify-between">
                    <span>Speed: {corridor.speedKmH} km/h</span>
                    <a href="/routes" className="text-blue-600 hover:underline font-bold">
                      Route Bypass →
                    </a>
                  </div>
                </div>
              </Popup>
            </Polyline>
          ))}

        {/* ── 4. ACTIVE INCIDENTS ── */}
        {layers.incidents &&
          NER_INCIDENTS.map((inc: NerIncident) => (
            <Marker
              key={inc.id}
              position={inc.latLng}
              icon={icons.incident}
              eventHandlers={{
                click: () => {
                  onSelectFeature({
                    id: inc.id,
                    name: 'LANDSLIDE INCIDENT: ' + inc.location,
                    subCode: inc.state + ' • ' + inc.road,
                    type: "incident",
                    riskLevel: inc.risk === "VERY HIGH" ? "Critical" : "High",
                    riskScore: inc.riskScore,
                    rainfall: inc.rainfall + ' mm',
                    moisture: inc.soilMoisture + '%',
                    road: inc.road,
                    status: inc.status,
                    description: inc.description,
                    actionText: inc.actionText,
                    actionHref: inc.actionHref,
                    recommendedAction: inc.risk === "VERY HIGH" ? "EVACUATE" : "AVOID ZONE",
                    actionAdvice: 'Incident reported on ' + inc.road + '. Status: ' + inc.status + '. Rainfall ' + inc.rainfall + ' mm and ' + inc.soilMoisture + '% saturation.',
                  });
                },
              }}
            >
              <Popup className="sentinalx-popup">
                <div className="space-y-2 p-1 min-w-[220px]">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-1">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white tracking-wider">
                      LANDSLIDE INCIDENT
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 font-bold">{inc.id}</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 font-medium">Location:</span>
                      <strong className="text-slate-900 text-right font-bold">{inc.location}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Risk:</span>
                      <span className="font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        {inc.risk}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-500 font-medium font-sans">Risk Score:</span>
                      <strong className="text-rose-600 font-extrabold">{inc.riskScore} / 100</strong>
                    </div>
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-500 font-medium font-sans">Rainfall:</span>
                      <span className="font-bold text-slate-800">{inc.rainfall} mm</span>
                    </div>
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-500 font-medium font-sans">Soil Moisture:</span>
                      <span className="font-bold text-slate-800">{inc.soilMoisture}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Road:</span>
                      <span className="font-bold text-slate-800">{inc.road}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <span className="font-extrabold text-rose-600 uppercase text-[10px]">{inc.status}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-relaxed font-medium bg-slate-50 p-1.5 rounded border border-slate-100">
                    {inc.description}
                  </p>

                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <a
                      href="/authority"
                      className="flex-1 text-center py-1 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] transition-colors"
                    >
                      View Details
                    </a>
                    <a
                      href="/routes"
                      className="flex-1 text-center py-1 px-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition-colors"
                    >
                      Safe Route
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* ── 5. CITIZEN REPORTS LAYER ── */}
        {layers.reports &&
          (reports.length > 0 ? reports : [
            {
              id: "rpt-01",
              reportId: "RPT-SK-091",
              hazardType: "Debris Spill",
              locationName: "Pakyong Ridge KM-8",
              description: "Boulders rolled onto single lane road following cloudburst.",
              severity: 3,
              responseStatus: "DISPATCHED",
              verificationStatus: "VERIFIED",
              latitude: 27.245,
              longitude: 88.590,
            },
            {
              id: "rpt-02",
              reportId: "RPT-TW-042",
              hazardType: "Road Subsidence",
              locationName: "Tawang Monastery Cut",
              description: "Tension crack expanding near roadside culvert.",
              severity: 4,
              responseStatus: "UNDER_REVIEW",
              verificationStatus: "VERIFIED",
              latitude: 27.590,
              longitude: 91.868,
            }
          ]).map((rpt: any, idx) => {
            const lat = rpt.latitude || 27.33 + idx * 0.05;
            const lng = rpt.longitude || 88.61 + idx * 0.05;

            return (
              <Marker
                key={rpt.reportId || 'rpt-' + idx}
                position={[lat, lng]}
                icon={icons.report}
                eventHandlers={{
                  click: () => {
                    onSelectFeature({
                      id: rpt.reportId || rpt.id,
                      name: 'Citizen Report: ' + rpt.hazardType,
                      subCode: rpt.locationName,
                      type: "report",
                      riskLevel: rpt.severity >= 4 ? "Critical" : "Moderate",
                      description: rpt.description,
                      actionText: "Track Incident",
                      actionHref: '/report/track?id=' + encodeURIComponent(rpt.reportId || rpt.id),
                      recommendedAction: rpt.severity >= 4 ? "AVOID ZONE" : "STAY ALERT",
                      actionAdvice: 'Citizen field report. Status: ' + rpt.responseStatus + '. Verified: ' + rpt.verificationStatus + '.',
                    });
                  },
                }}
              >
                <Popup className="sentinalx-popup">
                  <div className="space-y-1.5 p-0.5 min-w-[190px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900">
                        CITIZEN REPORT
                      </span>
                      <span className="font-mono text-[9px] text-slate-500 font-bold">{rpt.reportId || rpt.id}</span>
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">{rpt.hazardType}</div>
                    <div className="text-[10px] text-slate-600 font-medium">Location: {rpt.locationName}</div>
                    <div className="text-[10px] text-slate-600 font-medium">Severity: Level {rpt.severity} / 5</div>
                    <p className="text-[10px] text-slate-600 bg-slate-50 p-1 rounded border border-slate-100">
                      {rpt.description}
                    </p>
                    <a
                      href={'/report/track?id=' + encodeURIComponent(rpt.reportId || rpt.id)}
                      className="block text-center py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px]"
                    >
                      Track Incident Status →
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* ── 6. EMERGENCY SHELTERS LAYER ── */}
        {layers.shelters &&
          NER_SHELTERS.map((sh: NerShelter) => (
            <Marker
              key={sh.id}
              position={sh.latLng}
              icon={icons.shelter}
              eventHandlers={{
                click: () => {
                  onSelectFeature({
                    id: sh.id,
                    name: sh.name,
                    subCode: sh.location + " • " + sh.state,
                    type: "shelter",
                    riskLevel: "Safe",
                    description: 'Certified emergency staging camp at ' + sh.elevation + '. Capacity: ' + sh.capacity + ' persons (' + sh.currentOccupancy + ' sheltered). Supplies: ' + sh.supplies + '. Road Access: ' + sh.roadAccess + '.',
                    actionText: "View Shelter Logistics",
                    actionHref: "/shelters",
                    recommendedAction: "MONITOR",
                    actionAdvice: 'Designated safe high ground. Road access: ' + sh.roadAccess + '.',
                  });
                },
              }}
            >
              <Popup className="sentinalx-popup">
                <div className="space-y-1.5 p-0.5 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-1">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      SAFE SHELTER
                    </span>
                    <span className="font-mono text-[9px] text-emerald-700 font-bold">OPEN 24x7</span>
                  </div>
                  <div className="font-extrabold text-xs text-slate-900 leading-snug">{sh.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{sh.address}</div>
                  <div className="bg-emerald-50/70 p-1.5 rounded border border-emerald-100 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Capacity:</span>
                      <strong className="text-slate-900">{sh.capacity} persons</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Occupancy:</span>
                      <strong className="text-emerald-800">{sh.currentOccupancy} sheltered</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Elevation:</span>
                      <strong className="text-slate-900">{sh.elevation}</strong>
                    </div>
                  </div>
                  <div className="text-[9.5px] text-slate-600">
                    <strong>Supplies:</strong> {sh.supplies}
                  </div>
                  <a
                    href="/shelters"
                    className="block text-center py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition-colors"
                  >
                    View Shelter Info →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* ── 7. IOT GEOTECHNICAL SENSORS LAYER ── */}
        {layers.sensors &&
          NER_SENSORS.map((sen: NerSensorNode) => (
            <Marker
              key={sen.id}
              position={sen.latLng}
              icon={icons.sensor}
              eventHandlers={{
                click: () => {
                  onSelectFeature({
                    id: sen.id,
                    name: sen.name,
                    subCode: sen.subCode + " • " + sen.state,
                    type: "sensor",
                    riskLevel: sen.fos < 1.0 ? "Critical" : sen.fos < 1.2 ? "High" : "Moderate",
                    fos: sen.fos,
                    saturation: sen.soilMoisture,
                    rainfall: sen.rainfall24h + ' mm',
                    moisture: sen.soilMoisture,
                    description: 'In-situ telemetry node streaming pore pressure (' + sen.porePressure + '), tilt angle (' + sen.tiltAngle + '), 24h rainfall (' + sen.rainfall24h + ' mm), and battery (' + sen.batteryLevel + '%).',
                    actionText: "Inspect Sensor Grid",
                    actionHref: "/authority",
                    recommendedAction: sen.fos < 1.0 ? "EVACUATE" : "MONITOR",
                    actionAdvice: 'Pore pressure is ' + sen.porePressure + '. Tilt is ' + sen.tiltAngle + '. Local FoS is ' + sen.fos.toFixed(2) + '.',
                  });
                },
              }}
            >
              <Popup className="sentinalx-popup">
                <div className="space-y-1.5 p-0.5 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-1">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      GEOTECH SENSOR
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 font-bold">{sen.subCode}</span>
                  </div>
                  <div className="font-extrabold text-xs text-slate-900">{sen.name}</div>
                  <div className="grid grid-cols-2 gap-1 py-1 text-[10px] font-mono">
                    <div className="bg-slate-50 p-1 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Pore Pressure</span>
                      <span className="font-bold text-blue-700">{sen.porePressure}</span>
                    </div>
                    <div className="bg-slate-50 p-1 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Tilt Angle</span>
                      <span className="font-bold text-slate-800">{sen.tiltAngle}</span>
                    </div>
                    <div className="bg-slate-50 p-1 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Local FoS</span>
                      <span className="font-bold text-slate-900">{sen.fos.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-50 p-1 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[8px] uppercase">Battery</span>
                      <span className="font-bold text-emerald-700">{sen.batteryLevel}%</span>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 pt-0.5 border-t border-slate-100 flex items-center justify-between">
                    <span>Ping: {sen.lastPing}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[8px]">
                      {sen.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* ── Top-Right Floating Basemap & Layers Control ── */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-md px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all select-none cursor-pointer"
            title="Toggle Map Layers & Basemaps"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>GIS Controls</span>
          </button>

          {isLayersOpen && (
            <div
              className={
                isMobile
                  ? "fixed inset-x-0 bottom-0 z-[2000] w-full max-h-[75vh] overflow-y-auto bg-white border-t border-slate-300 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-4 text-xs space-y-3 animate-slideUp select-none pb-[86px]"
                  : "absolute top-full right-0 mt-2 w-72 max-h-[420px] overflow-y-auto bg-white/98 backdrop-blur-md border border-slate-300 rounded-2xl shadow-2xl p-3.5 text-xs space-y-3 animate-fadeIn select-none scrollbar-thin"
              }
            >
              {isMobile && <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" />}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  GIS BASEMAP & LAYERS
                </span>
                <button
                  type="button"
                  onClick={() => setIsLayersOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Close Controls"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. BASEMAP SWITCHER */}
              <div>
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>BASEMAP PROVIDER</span>
                  <span className="text-[9px] font-mono text-blue-600 font-bold">REAL TILES</span>
                </div>
                <div className="space-y-1">
                  {[
                    { id: "streets", label: "Street Map", icon: "🗺️", desc: "OpenStreetMap" },
                    { id: "satellite", label: "Satellite", icon: "🛰️", desc: "Esri World Imagery" },
                    { id: "terrain", label: "Terrain", icon: "⛰️", desc: "Esri World Topo" },
                  ].map((bm) => (
                    <label
                      key={bm.id}
                      className={'flex items-center justify-between py-1.5 px-2.5 rounded-xl cursor-pointer transition-colors ' + (
                        baseMap === bm.id
                          ? "bg-blue-50/90 text-blue-950 font-bold border border-blue-200"
                          : "hover:bg-slate-100 text-slate-700 font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-sm">{bm.icon}</span>
                        <div>
                          <div className="font-bold leading-tight">{bm.label}</div>
                          <div className="text-[9px] text-slate-500 font-normal">{bm.desc}</div>
                        </div>
                      </div>
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

              {/* 2. 7 INDEPENDENT LAYER TOGGLES */}
              <div className="border-t border-slate-100 pt-2">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>MAP OVERLAYS</span>
                  <span className="font-mono text-slate-600 font-bold text-[10px]">
                    {Object.values(layers).filter(Boolean).length}/7 ACTIVE
                  </span>
                </div>
                <div className="space-y-1">
                  {[
                    { key: "heatmap", label: "Risk Heatmap", icon: "🔥" },
                    { key: "riskZones", label: "Landslide Risk Zones", icon: "⬡" },
                    { key: "incidents", label: "Active Incidents", icon: "⚠️" },
                    { key: "reports", label: "Citizen Reports", icon: "▲" },
                    { key: "roads", label: "Road Status", icon: "🛣️" },
                    { key: "shelters", label: "Shelters", icon: "⛺" },
                    { key: "sensors", label: "IoT Sensors", icon: "📡" },
                  ].map((l) => (
                    <label
                      key={l.key}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <span className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                        <span>{l.icon}</span>
                        <span>{l.label}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(layers[l.key as keyof LayerVisibility])}
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

      {/* ── Compact Map Legend ── */}
      <div className="absolute bottom-2 left-2 z-[1000] max-w-[calc(100%-16px)] pointer-events-auto">
        {isMobile && (
          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="mb-1 flex items-center justify-between w-full bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/90 shadow-sm text-[10px] font-bold text-slate-700"
          >
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" /> GIS Legend
            </span>
            {isLegendOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        )}

        {(!isMobile || isLegendOpen) && (
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl border border-slate-200/90 shadow-md space-y-1 text-[9px] sm:text-[10px] font-bold text-slate-700 select-none">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>LOW</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>MODERATE</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span>HIGH</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span>VERY HIGH</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-600 border-t border-slate-100 pt-1 text-[8.5px] sm:text-[9px]">
              <span className="flex items-center gap-1">🔥 Heatmap</span>
              <span className="flex items-center gap-1">⚠️ Incident</span>
              <span className="flex items-center gap-1">🏠 Shelter</span>
              <span className="flex items-center gap-1">📡 Sensor</span>
              <span className="flex items-center gap-1">🛣️ Road</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
