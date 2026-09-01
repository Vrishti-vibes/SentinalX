import { MapPin, Layers, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MOCK_SENSORS } from "@/data/mock/sensors.mock";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="low">Spatial GIS</Badge>
            <span className="text-xs text-slate-400 font-mono">NER Topo Grid</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Live Landslide Risk Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Geospatial hazard mapping and telemetry overlays across North Eastern states.
          </p>
        </div>
      </div>

      {/* Map Viewport Placeholder Card */}
      <Card className="min-h-[420px] flex flex-col items-center justify-center text-center p-8 border-dashed border-slate-800 bg-slate-950/60">
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-950/40">
          <MapPin className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">GIS Map Canvas Ready</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6">
          Awaiting the Stitch screen design layout for map controls, layer toggles, and sensor slide-out sheets.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            📡 18 Sensor Stations
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            🌧️ Rainfall Isohyet Overlay
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            ⚠️ 5 Monitored Corridors
          </span>
        </div>
      </Card>

      {/* Sensor Station Nodes Preview */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Active IoT Geotechnical Stations</CardTitle>
            <CardDescription>Piezometer, Inclinometer, and Rain Gauge telemetry feeds</CardDescription>
          </div>
          <Badge variant="outline">{MOCK_SENSORS.length} Online</Badge>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MOCK_SENSORS.map((sensor) => (
            <div
              key={sensor.id}
              className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-emerald-400">{sensor.id}</span>
                <span className="text-[11px] text-slate-400">{sensor.lastUpdated}</span>
              </div>
              <div className="text-sm font-medium text-white truncate">{sensor.stationName}</div>
              <div className="text-xs text-slate-400">{sensor.state}</div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850 text-xs font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">Moisture</div>
                  <div className="text-slate-200">{sensor.soilMoisturePercent}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Pore Press.</div>
                  <div className="text-slate-200">{sensor.porePressureKpa} kPa</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
