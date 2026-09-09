import { ShelterRecord, ShelterSafetyLevel, ShelterStatus } from "@/types/shelter";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

const SEED_SHELTERS: ShelterRecord[] = [
  // Tawang Sector
  {
    id: "shelter-1",
    name: "TAWANG COMMUNITY CENTER",
    sector: "tawang",
    distance: "1.2 km away",
    distanceKm: 1.2,
    capacityPercent: 85,
    totalCapacity: 350,
    occupiedCapacity: 297,
    availableCapacity: 53,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "community",
    address: "Monastery Ridge Rd, Tawang, Arunachal Pradesh",
    supplies: "Emergency First Aid, Food Rations, Generator Power, Heating",
    contactNumber: "+91 3794 222222",
    latitude: 27.592,
    longitude: 91.875,
  },
  {
    id: "shelter-2",
    name: "GOVERNMENT RELIEF CAMP",
    sector: "tawang",
    distance: "2.4 km away",
    distanceKm: 2.4,
    capacityPercent: 62,
    totalCapacity: 500,
    occupiedCapacity: 310,
    availableCapacity: 190,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "camp",
    address: "Old Market Complex, Tawang, Arunachal Pradesh",
    supplies: "Sleeping Mats, Clean Water, Medical Support, Blankets",
    contactNumber: "+91 3794 222333",
    latitude: 27.579,
    longitude: 91.853,
  },
  {
    id: "shelter-3",
    name: "DISTRICT RELIEF CENTER",
    sector: "tawang",
    distance: "3.1 km away",
    distanceKm: 3.1,
    capacityPercent: 40,
    totalCapacity: 800,
    occupiedCapacity: 320,
    availableCapacity: 480,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "district",
    address: "DC Office Sector, Tawang, Arunachal Pradesh",
    supplies: "Satellite Communications, Warm Blankets, Field Ambulance",
    contactNumber: "+91 3794 222444",
    latitude: 27.601,
    longitude: 91.884,
  },
  {
    id: "shelter-4",
    name: "TAWANG VALLEY SCHOOL CAMP",
    sector: "tawang",
    distance: "1.8 km away",
    distanceKm: 1.8,
    capacityPercent: 95,
    totalCapacity: 200,
    occupiedCapacity: 190,
    availableCapacity: 10,
    status: "UNSAFE",
    safetyLevel: "UNSAFE",
    iconType: "camp",
    address: "Old Market Valley Corridor (INSIDE SEVERE HAZARD POLYGON)",
    supplies: "Evacuation ordered due to active slope creep. DO NOT ENTER.",
    contactNumber: "+91 3794 222555",
    latitude: 27.587,
    longitude: 91.86,
  },
  // Gangtok / Sikkim Sector
  {
    id: "shelter-gtk-1",
    name: "GANGTOK INDOOR STADIUM RELIEF CAMP",
    sector: "gangtok",
    distance: "1.5 km away",
    distanceKm: 1.5,
    capacityPercent: 70,
    totalCapacity: 600,
    occupiedCapacity: 420,
    availableCapacity: 180,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "district",
    address: "Paljor Stadium Rd, Gangtok, Sikkim",
    supplies: "Doctor on Duty, Water Purifiers, Ready Meals, Power Backup",
    contactNumber: "+91 3592 202202",
    latitude: 27.332,
    longitude: 88.614,
  },
  {
    id: "shelter-gtk-2",
    name: "RANGPO HIGHWAY TRANSIT SHELTER",
    sector: "gangtok",
    distance: "4.8 km away",
    distanceKm: 4.8,
    capacityPercent: 92,
    totalCapacity: 250,
    occupiedCapacity: 230,
    availableCapacity: 20,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "camp",
    address: "NH-10 Checkpost Transit Base, Rangpo, Sikkim",
    supplies: "Emergency Transit Beds, Trauma Kit, Mobile SATCOM",
    contactNumber: "+91 3592 202404",
    latitude: 27.318,
    longitude: 88.598,
  },
  {
    id: "shelter-gtk-3",
    name: "TEESTA LOWLANDS TRANSIT DEPOT",
    sector: "gangtok",
    distance: "5.2 km away",
    distanceKm: 5.2,
    capacityPercent: 98,
    totalCapacity: 150,
    occupiedCapacity: 147,
    availableCapacity: 3,
    status: "UNSAFE",
    safetyLevel: "UNSAFE",
    iconType: "camp",
    address: "Sevoke Teesta Riverbank Cutting (FLOOD/SLUMP RISK ZONE)",
    supplies: "Facility closed by District Authority. Riverbank cutting active.",
    contactNumber: "+91 3592 202505",
    latitude: 27.305,
    longitude: 88.58,
  },
];

export class SheltersRepository {
  private static shelters: ShelterRecord[] = [...SEED_SHELTERS];

  public static async getShelters(sector?: string): Promise<ShelterRecord[]> {
    if (isDatabaseConfigured) {
      try {
        const where = sector && sector.toLowerCase() !== "all" ? { sector: sector.toLowerCase() } : {};
        const dbShelters = await prisma.shelter.findMany({ where });
        if (dbShelters && dbShelters.length > 0) {
          return dbShelters.map((s) => ({
            id: s.id,
            name: s.name,
            sector: s.sector as "tawang" | "gangtok" | "all",
            distance: "1.5 km away",
            distanceKm: 1.5,
            totalCapacity: s.totalCapacity,
            occupiedCapacity: s.occupiedCapacity,
            availableCapacity: s.availableCapacity ?? Math.max(0, s.totalCapacity - s.occupiedCapacity),
            capacityPercent: Math.round((s.occupiedCapacity / s.totalCapacity) * 100),
            status: s.status as ShelterStatus,
            safetyLevel: s.safetyLevel as ShelterSafetyLevel,
            iconType: s.iconType as "community" | "camp" | "district",
            address: s.address,
            supplies: s.supplies || "",
            contactNumber: s.contactNumber || "",
            latitude: s.latitude,
            longitude: s.longitude,
          }));
        }
      } catch (err) {
        console.warn("[SheltersRepository] Prisma query failed, using runtime list:", err);
      }
    }

    let list = [...this.shelters];
    if (sector && sector.toLowerCase() !== "all") {
      const sec = sector.toLowerCase();
      list = list.filter((s) => s.sector === sec || s.sector === "all");
    }

    // Dynamic safety calculation: ensure availableCapacity is synced and validate unsafe criteria
    return list.map((s) => {
      const availableCapacity = Math.max(0, s.totalCapacity - s.occupiedCapacity);
      const isUnsafe = s.safetyLevel === "UNSAFE" || s.name.includes("VALLEY") || s.name.includes("TEESTA LOWLANDS");
      return {
        ...s,
        availableCapacity,
        capacityPercent: Math.round((s.occupiedCapacity / s.totalCapacity) * 100),
        safetyLevel: isUnsafe ? "UNSAFE" : s.safetyLevel,
        status: isUnsafe ? "UNSAFE" : s.occupiedCapacity >= s.totalCapacity ? "FULL" : s.status,
      };
    });
  }

  public static async getShelterById(id: string): Promise<ShelterRecord | null> {
    const list = await this.getShelters();
    const s = list.find((item) => item.id === id);
    return s || null;
  }

  public static async updateShelterSafety(
    id: string,
    safetyLevel: ShelterSafetyLevel,
    status?: ShelterStatus
  ): Promise<ShelterRecord | null> {
    const idx = this.shelters.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.shelters[idx].safetyLevel = safetyLevel;
    if (status) this.shelters[idx].status = status;

    if (isDatabaseConfigured) {
      try {
        await prisma.shelter.update({
          where: { id },
          data: { safetyLevel, status: status || (safetyLevel === "UNSAFE" ? "UNSAFE" : "OPEN") },
        });
      } catch (err) {
        console.warn("[SheltersRepository] Prisma update failed:", err);
      }
    }

    return this.shelters[idx];
  }
}
