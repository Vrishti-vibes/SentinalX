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
    status: "OPEN",
    iconType: "community",
    address: "Monastery Ridge Rd, Tawang, Arunachal Pradesh",
    supplies: "Emergency First Aid, Food Rations, Generator Power, Heating",
    contactNumber: "+91 3794 222222",
    latitude: 27.592,
    longitude: 91.875,
    isDemo: true,
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
    status: "OPEN",
    iconType: "camp",
    address: "Old Market Complex, Tawang, Arunachal Pradesh",
    supplies: "Sleeping Mats, Clean Water, Medical Support, Blankets",
    contactNumber: "+91 3794 222333",
    latitude: 27.579,
    longitude: 91.853,
    isDemo: true,
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
    status: "OPEN",
    iconType: "district",
    address: "DC Office Sector, Tawang, Arunachal Pradesh",
    supplies: "Satellite Communications, Warm Blankets, Field Ambulance",
    contactNumber: "+91 3794 222444",
    latitude: 27.601,
    longitude: 91.884,
    isDemo: true,
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
    status: "OPEN",
    iconType: "district",
    address: "Paljor Stadium Rd, Gangtok, Sikkim",
    supplies: "Doctor on Duty, Water Purifiers, Ready Meals, Power Backup",
    contactNumber: "+91 3592 202202",
    latitude: 27.332,
    longitude: 88.614,
    isDemo: true,
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
    status: "OPEN",
    iconType: "camp",
    address: "NH-10 Checkpost Transit Base, Rangpo, Sikkim",
    supplies: "Emergency Transit Beds, Trauma Kit, Mobile SATCOM",
    contactNumber: "+91 3592 202404",
    latitude: 27.318,
    longitude: 88.598,
    isDemo: true,
  },
];

export class SheltersRepository {
  private static shelters: ShelterRecord[] = [...SEED_SHELTERS];

  public static async getShelters(sector?: string): Promise<ShelterRecord[]> {
    if (!sector || sector.toLowerCase() === "all") {
      return [...this.shelters];
    }
    const sec = sector.toLowerCase();
    return this.shelters.filter(
      (s) => s.sector === sec || s.sector === "all"
    );
  }

  public static async getShelterById(id: string): Promise<ShelterRecord | null> {
    return this.shelters.find((s) => s.id === id) || null;
  }
}
