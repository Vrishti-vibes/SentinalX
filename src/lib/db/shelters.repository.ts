import { ShelterRecord } from "@/types/shelter";

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
];

export class SheltersRepository {
  private static shelters: ShelterRecord[] = [...SEED_SHELTERS];

  public static async getShelters(sector?: string): Promise<ShelterRecord[]> {
    let list = [...this.shelters];
    if (sector && sector.toLowerCase() !== "all") {
      const sec = sector.toLowerCase();
      list = list.filter((s) => s.sector === sec || s.sector === "all");
    }

    // Dynamic safety calculation: ensure availableCapacity is synced
    return list.map((s) => ({
      ...s,
      availableCapacity: Math.max(0, s.totalCapacity - s.occupiedCapacity),
      capacityPercent: Math.round((s.occupiedCapacity / s.totalCapacity) * 100),
      status: s.occupiedCapacity >= s.totalCapacity ? "FULL" : s.status,
    }));
  }

  public static async getShelterById(id: string): Promise<ShelterRecord | null> {
    const s = this.shelters.find((item) => item.id === id);
    if (!s) return null;
    return {
      ...s,
      availableCapacity: Math.max(0, s.totalCapacity - s.occupiedCapacity),
      capacityPercent: Math.round((s.occupiedCapacity / s.totalCapacity) * 100),
    };
  }

  public static async updateShelterSafety(id: string, safetyLevel: "SAFE" | "ADVISORY" | "UNSAFE", status?: "OPEN" | "FULL" | "STANDBY" | "UNSAFE"): Promise<ShelterRecord | null> {
    const idx = this.shelters.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.shelters[idx].safetyLevel = safetyLevel;
    if (status) this.shelters[idx].status = status;
    return this.shelters[idx];
  }
}
