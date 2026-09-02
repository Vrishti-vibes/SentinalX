import { SensorReadingRecord, CreateSensorReadingPayload } from "@/types/database";
import { MOCK_SENSORS } from "@/data/mock/sensors.mock";
import { getDbConfig, supabaseRestQuery } from "./client";

// Global in-memory sensor store
function createInitialSensorStore(): Map<string, SensorReadingRecord> {
  const store = new Map<string, SensorReadingRecord>();

  for (const s of MOCK_SENSORS) {
    const record: SensorReadingRecord = {
      id: `sens-rec-${s.id}`,
      sensorId: s.id,
      stationName: s.stationName,
      state: s.state,
      latitude: s.coordinates[0],
      longitude: s.coordinates[1],
      timestamp: new Date().toISOString(),
      soilMoisture: s.soilMoisturePercent,
      porePressure: s.porePressureKpa,
      tiltAngle: s.tiltAngleDeg,
      rainfall: s.rainfall24hMm,
      status: s.status,
      storage: "DEMO_IN_MEMORY",
    };
    store.set(s.id, record);
  }

  return store;
}

const globalSensors: Map<string, SensorReadingRecord> =
  ((globalThis as unknown as { __sentinalx_sensors?: Map<string, SensorReadingRecord> })
    .__sentinalx_sensors ??= createInitialSensorStore());

export const SensorsRepository = {
  /**
   * Get all latest sensor readings
   */
  async getSensors(): Promise<SensorReadingRecord[]> {
    const config = getDbConfig();

    if (config.isConfigured) {
      const { data, error } = await supabaseRestQuery<Record<string, unknown>[]>("sensor_readings", {
        query: { select: "*", order: "timestamp.desc", limit: "50" },
      });

      if (!error && Array.isArray(data)) {
        return data.map((d) => ({
          id: String(d.id),
          sensorId: String(d.sensor_id),
          stationName: String(d.station_name),
          state: String(d.state),
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          timestamp: String(d.timestamp),
          soilMoisture: Number(d.soil_moisture),
          porePressure: Number(d.pore_pressure),
          tiltAngle: Number(d.tilt_angle),
          rainfall: Number(d.rainfall),
          status: d.status as SensorReadingRecord["status"],
          storage: "SUPABASE_POSTGRES",
        }));
      }
    }

    return Array.from(globalSensors.values());
  },

  /**
   * Ingest a new sensor reading
   */
  async recordSensorReading(payload: CreateSensorReadingPayload): Promise<SensorReadingRecord> {
    const config = getDbConfig();
    const now = new Date().toISOString();

    const newRecord: SensorReadingRecord = {
      id: `sens-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sensorId: payload.sensorId,
      stationName: payload.stationName || `Sensor Station ${payload.sensorId}`,
      state: payload.state || "Arunachal Pradesh",
      latitude: payload.latitude ?? 27.586,
      longitude: payload.longitude ?? 91.859,
      timestamp: now,
      soilMoisture: payload.soilMoisture,
      porePressure: payload.porePressure,
      tiltAngle: payload.tiltAngle,
      rainfall: payload.rainfall,
      status: payload.status || "ONLINE",
      storage: config.isConfigured ? "SUPABASE_POSTGRES" : "DEMO_IN_MEMORY",
    };

    globalSensors.set(payload.sensorId, newRecord);

    if (config.isConfigured) {
      const dbPayload = {
        sensor_id: newRecord.sensorId,
        station_name: newRecord.stationName,
        state: newRecord.state,
        latitude: newRecord.latitude,
        longitude: newRecord.longitude,
        soil_moisture: newRecord.soilMoisture,
        pore_pressure: newRecord.porePressure,
        tilt_angle: newRecord.tiltAngle,
        rainfall: newRecord.rainfall,
        status: newRecord.status,
      };

      const { error } = await supabaseRestQuery("sensor_readings", {
        method: "POST",
        body: dbPayload,
      });

      if (error) {
        console.warn("[SensorsRepository] Remote insert failed, kept in memory:", error);
        newRecord.storage = "DEMO_IN_MEMORY";
      }
    }

    return newRecord;
  },
};
