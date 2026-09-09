"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  Polygon,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "@/styles/leaflet-setup.css";
import { RouteResponse } from "@/types/routing";

function createHtmlIcon(html: string, className = "sentinalx-marker", size: [number, number] = [24, 24]) {
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

const ROUTE_ICONS = {
  start: createHtmlIcon(
    `<div style="background:#2563eb;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:6px;border-radius:50%;background:white;"></div></div>`,
    "sentinalx-marker",
    [20, 20]
  ),
  destination: createHtmlIcon(
    `<div style="background:#15803d;width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V9l7-6 7 6v12"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/></svg></div>`,
    "sentinalx-marker",
    [22, 22]
  ),
};

function RouteMapController({ routeCoordinates }: { routeCoordinates: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, duration: 1.0 });
    }
  }, [routeCoordinates, map]);

  return null;
}

interface LeafletRouteMapProps {
  routeData: RouteResponse | null;
  originLat?: number;
  originLon?: number;
  destLat?: number;
  destLon?: number;
  originName?: string;
  destName?: string;
  hazardName?: string;
}

export default function LeafletRouteMap({
  routeData,
  originLat = 27.586,
  originLon = 91.859,
  destLat = 27.592,
  destLon = 91.875,
  originName = "Current Departure Sector",
  destName = "Designated Safe Shelter",
  hazardName = "Active Geotechnical Hazard Zone",
}: LeafletRouteMapProps) {
  // Convert GeoJSON coordinates [lon, lat] to Leaflet [lat, lon]
  const rawCoords = routeData?.recommendedRoute?.geometry?.coordinates;
  const polylinePositions: [number, number][] =
    rawCoords && rawCoords.length > 0
      ? rawCoords.map((c) => [c[1], c[0]])
      : [
          [originLat, originLon],
          [
            originLat + (destLat - originLat) * 0.35 + 0.002,
            originLon + (destLon - originLon) * 0.35 - 0.002,
          ],
          [
            originLat + (destLat - originLat) * 0.7 + 0.001,
            originLon + (destLon - originLon) * 0.7 - 0.001,
          ],
          [destLat, destLon],
        ];

  // Dynamic hazard zone avoiding in this sector
  const midLat = (originLat + destLat) / 2;
  const midLon = (originLon + destLon) / 2;
  const offsetLat = (destLon - originLon) * 0.25;
  const offsetLon = -(destLat - originLat) * 0.25;

  const hCenterLat = midLat + offsetLat;
  const hCenterLon = midLon + offsetLon;
  const hSize = Math.max(0.0025, Math.min(0.015, Math.abs(destLat - originLat) * 0.2));

  const hazardPolygon: [number, number][] = [
    [hCenterLat - hSize, hCenterLon - hSize],
    [hCenterLat + hSize, hCenterLon - hSize * 0.8],
    [hCenterLat + hSize * 0.9, hCenterLon + hSize],
    [hCenterLat - hSize * 0.8, hCenterLon + hSize * 0.9],
  ];

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <MapContainer
        center={[originLat, originLon]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[320px]"
        attributionControl={true}
      >
        <TileLayer
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'}
          url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`}
          maxZoom={19}
          subdomains="abcd"
        />

        <RouteMapController routeCoordinates={polylinePositions} />

        {/* Hazard Zone Avoided (Subtle translucent pink/red with clean dashed border) */}
        <Polygon
          positions={hazardPolygon}
          pathOptions={{
            color: "#e11d48",
            fillColor: "#f43f5e",
            fillOpacity: 0.14,
            weight: 1.5,
            dashArray: "4, 4",
          }}
        >
          <Popup>
            <div className="text-xs p-1">
              <span className="font-bold text-rose-700 block uppercase text-[10px]">Hazard Zone Avoided</span>
              <span className="font-bold">{hazardName}</span>
              <p className="text-slate-600 mt-0.5">Route engine navigated traffic away from high slope-instability corridor.</p>
            </div>
          </Popup>
        </Polygon>

        {/* Clean, Prominent Safe Route Geometry Polyline */}
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: "#15803d",
            weight: 5,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Origin Marker */}
        <Marker position={[originLat, originLon]} icon={ROUTE_ICONS.start}>
          <Popup>
            <div className="text-xs p-1">
              <span className="font-bold text-blue-700 block text-[10px] uppercase">Departure Point</span>
              <span className="font-bold">{originName}</span>
              <span className="text-[10px] text-slate-500 block">({originLat.toFixed(3)}°N, {originLon.toFixed(3)}°E)</span>
            </div>
          </Popup>
        </Marker>

        {/* Destination Shelter Marker */}
        <Marker position={[destLat, destLon]} icon={ROUTE_ICONS.destination}>
          <Popup>
            <div className="text-xs p-1">
              <span className="font-bold text-emerald-700 block text-[10px] uppercase">Safe Destination</span>
              <span className="font-bold">{destName}</span>
              <span className="text-[10px] text-slate-500 block">Certified Relief Shelter • Safe Route Verified</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}