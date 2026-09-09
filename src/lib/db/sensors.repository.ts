import { SensorReadingRecord, CreateSensorReadingPayload } from "@/types/database";
import { MOCK_SENSORS } from "@/data/mock/sensors.mock";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

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
      storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
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
  async getSensors(locationFilter?: string): Promise<SensorReadingRecord[]> {
    if (isDatabaseConfigured) {
      try {
        const readings = await prisma.sensorReading.findMany({
          orderBy: { timestamp: "desc" },
          take: 50,
        });

        if (readings && readings.length > 0) {
          const list = readings.map((d) => ({
            id: d.id,
            sensorId: d.sensorId,
            stationName: d.stationName,
            state: d.state,
            latitude: d.latitude,
            longitude: d.longitude,
            timestamp: d.timestamp.toISOString(),
            soilMoisture: d.soilMoisture,
            porePressure: d.porePressure,
            tiltAngle: d.tiltAngle,
            rainfall: d.rainfall,
            status: d.status as SensorReadingRecord["status"],
            storage: "SUPABASE_POSTGRES" as const,
          }));

          if (locationFilter) {
            const loc = locationFilter.toLowerCase();
            return list.filter(
              (r) =>
                r.stationName.toLowerCase().includes(loc) ||
                r.state.toLowerCase().includes(loc) ||
                (loc.includes("tawang") && r.state.toLowerCase().includes("arunachal")) ||
                (loc.includes("gangtok") && r.state.toLowerCase().includes("sikkim"))
            );
          }
          return list;
        }
      } catch (err) {
        console.warn("[SensorsRepository] Prisma query failed, using runtime store:", err);
      }
    }

    let list = Array.from(globalSensors.values());
    if (locationFilter) {
      const loc = locationFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.stationName.toLowerCase().includes(loc) ||
          r.state.toLowerCase().includes(loc) ||
          (loc.includes("tawang") && r.state.toLowerCase().includes("arunachal")) ||
          (loc.includes("gangtok") && r.state.toLowerCase().includes("sikkim"))
      );
    }
    return list;
  },

  /**
   * Get latest reading for a specific location/sensor
   */
  async getLatestSensor(location?: string): Promise<SensorReadingRecord | null> {
    const list = await this.getSensors(location);
    return list.length > 0 ? list[0] : null;
  },

  /**
   * Ingest a new sensor reading
   */
  async recordSensorReading(payload: CreateSensorReadingPayload): Promise<SensorReadingRecord> {
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
      storage: isDatabaseConfigured ? "SUPABASE_POSTGRES" : "DATABASE_NOT_CONFIGURED",
    };

    globalSensors.set(payload.sensorId, newRecord);

    if (isDatabaseConfigured) {
      try {
        // Ensure sensor parent record exists or connectOrCreate
        await prisma.sensor.upsert({
          where: { id: payload.sensorId },
          update: {
            stationName: newRecord.stationName,
            state: newRecord.state,
            latitude: newRecord.latitude,
            longitude: newRecord.longitude,
            status: newRecord.status,
            lastSeen: new Date(now),
          },
          create: {
            id: payload.sensorId,
            stationName: newRecord.stationName,
            state: newRecord.state,
            latitude: newRecord.latitude,
            longitude: newRecord.longitude,
            status: newRecord.status,
            lastSeen: new Date(now),
          },
        });

        const created = await prisma.sensorReading.create({
          data: {
            sensorId: newRecord.sensorId,
            stationName: newRecord.stationName,
            state: newRecord.state,
            latitude: newRecord.latitude,
            longitude: newRecord.longitude,
            soilMoisture: newRecord.soilMoisture,
            porePressure: newRecord.porePressure,
            tiltAngle: newRecord.tiltAngle,
            rainfall: newRecord.rainfall,
            status: newRecord.status,
            timestamp: new Date(now),
          },
        });

        newRecord.id = created.id;
        newRecord.storage = "SUPABASE_POSTGRES";
      } catch (err) {
        console.warn("[SensorsRepository] Prisma insert failed, retained in memory:", err);
        newRecord.storage = "DATABASE_NOT_CONFIGURED";
      }
    }

    return newRecord;
  },
};
