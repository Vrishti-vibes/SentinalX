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
  // Guwahati Sector (Assam)
  {
    id: "shelter-guw-1",
    name: "SARUSAJAI SPORTS COMPLEX RELIEF HAVEN",
    sector: "guwahati",
    distance: "1.8 km away",
    distanceKm: 1.8,
    capacityPercent: 45,
    totalCapacity: 1200,
    occupiedCapacity: 540,
    availableCapacity: 660,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "district",
    address: "National Games Stadium Complex, Lokhra Rd, Guwahati",
    supplies: "Mega staging hub, 24/7 emergency medical triage, mobile kitchen, bedding",
    contactNumber: "+91 361 2237001",
    latitude: 26.115,
    longitude: 91.758,
  },
  {
    id: "shelter-guw-2",
    name: "DISPUR DISASTER MANAGEMENT CENTER",
    sector: "guwahati",
    distance: "2.5 km away",
    distanceKm: 2.5,
    capacityPercent: 55,
    totalCapacity: 500,
    occupiedCapacity: 275,
    availableCapacity: 225,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "community",
    address: "Secretariat Relief Annex, Capital Complex, Dispur, Guwahati",
    supplies: "State SDRF forward command post, high-speed SATCOM, emergency rations",
    contactNumber: "+91 361 2237002",
    latitude: 26.143,
    longitude: 91.789,
  },
  // Shillong Sector (Meghalaya)
  {
    id: "shelter-shl-1",
    name: "SHILLONG CENTRAL YOUTH CENTER",
    sector: "shillong",
    distance: "1.4 km away",
    distanceKm: 1.4,
    capacityPercent: 48,
    totalCapacity: 450,
    occupiedCapacity: 216,
    availableCapacity: 234,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "community",
    address: "Mawkhar Ridge, Upper Shillong Road, Shillong",
    supplies: "Emergency power generators, hot food distribution, clean water, blankets",
    contactNumber: "+91 364 2224001",
    latitude: 25.582,
    longitude: 91.885,
  },
  // Cherrapunji Sector (Meghalaya)
  {
    id: "shelter-che-1",
    name: "SOHRA CIVIL SUB-DIVISION RELIEF HALL",
    sector: "cherrapunji",
    distance: "1.1 km away",
    distanceKm: 1.1,
    capacityPercent: 50,
    totalCapacity: 300,
    occupiedCapacity: 150,
    availableCapacity: 150,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "community",
    address: "Sohra Rim High Ground, Near Circuit House, Cherrapunji",
    supplies: "Heavy rainfall protective tarpaulins, warm fleece, drinking water purification",
    contactNumber: "+91 364 2224005",
    latitude: 25.295,
    longitude: 91.735,
  },
  // Haflong / Dima Hasao Sector (Assam)
  {
    id: "shelter-haf-1",
    name: "HAFLONG DISTRICT INDOOR STADIUM",
    sector: "haflong",
    distance: "1.3 km away",
    distanceKm: 1.3,
    capacityPercent: 65,
    totalCapacity: 500,
    occupiedCapacity: 325,
    availableCapacity: 175,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "district",
    address: "Haflong Hill Top, Near Circuit House, Dima Hasao",
    supplies: "Potable water tankers, relief medical brigade, emergency field beds",
    contactNumber: "+91 3673 236201",
    latitude: 25.172,
    longitude: 93.025,
  },
  // Kohima Sector (Nagaland)
  {
    id: "shelter-koh-1",
    name: "KOHIMA LOCAL GROUND COMMUNITY PAVILION",
    sector: "kohima",
    distance: "1.6 km away",
    distanceKm: 1.6,
    capacityPercent: 58,
    totalCapacity: 400,
    occupiedCapacity: 232,
    availableCapacity: 168,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "community",
    address: "Khuochiezie, Kohima Municipal Center, Kohima",
    supplies: "Water filtration tanks, trauma first-aid post, emergency rations",
    contactNumber: "+91 370 2290301",
    latitude: 25.670,
    longitude: 94.112,
  },
  // Imphal Sector (Manipur)
  {
    id: "shelter-imp-1",
    name: "KHUMAN LAMPAK RELIEF COMPLEX",
    sector: "imphal",
    distance: "2.1 km away",
    distanceKm: 2.1,
    capacityPercent: 52,
    totalCapacity: 750,
    occupiedCapacity: 390,
    availableCapacity: 360,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "district",
    address: "Khuman Lampak Main Stadium, Imphal East",
    supplies: "Large capacity staging, 3 dedicated trauma surgical bays, food bank",
    contactNumber: "+91 385 2421201",
    latitude: 24.821,
    longitude: 93.945,
  },
  // Aizawl Sector (Mizoram)
  {
    id: "shelter-aiz-1",
    name: "AIZAWL HIGH GROUND PARISH HALL",
    sector: "aizawl",
    distance: "1.7 km away",
    distanceKm: 1.7,
    capacityPercent: 60,
    totalCapacity: 350,
    occupiedCapacity: 210,
    availableCapacity: 140,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "community",
    address: "Durtlang Ridge High Ground, Aizawl",
    supplies: "Dry rations, medical dispensary, high-altitude heating blankets",
    contactNumber: "+91 389 2322201",
    latitude: 23.755,
    longitude: 92.730,
  },
  // Agartala Sector (Tripura)
  {
    id: "shelter-agt-1",
    name: "SWAMI VIVEKANANDA RELIEF HUB",
    sector: "agartala",
    distance: "1.5 km away",
    distanceKm: 1.5,
    capacityPercent: 42,
    totalCapacity: 600,
    occupiedCapacity: 252,
    availableCapacity: 348,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "district",
    address: "Astabal Stadium Grounds, Agartala",
    supplies: "Clean drinking water distribution, food ration packs, field clinic",
    contactNumber: "+91 381 2324001",
    latitude: 23.836,
    longitude: 91.282,
  },
  // Itanagar Sector (Arunachal Pradesh)
  {
    id: "shelter-ita-1",
    name: "INDIRA GANDHI PARK RELIEF PAVILION",
    sector: "itanagar",
    distance: "1.9 km away",
    distanceKm: 1.9,
    capacityPercent: 46,
    totalCapacity: 500,
    occupiedCapacity: 230,
    availableCapacity: 270,
    status: "OPEN",
    safetyLevel: "SAFE",
    iconType: "district",
    address: "IG Park Concourse, Capital Complex, Itanagar",
    supplies: "NDRF staging camp, emergency rations, diesel generators, first aid",
    contactNumber: "+91 360 2212301",
    latitude: 27.098,
    longitude: 93.619,
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
