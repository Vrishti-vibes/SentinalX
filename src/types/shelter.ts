export type ShelterStatus = "OPEN" | "FULL" | "STANDBY" | "UNSAFE";
export type ShelterSafetyLevel = "SAFE" | "ADVISORY" | "UNSAFE";
export type ShelterIconType = "community" | "camp" | "district";

export interface ShelterRecord {
  id: string;
  name: string;
  sector: "tawang" | "gangtok" | "all";
  distance: string;
  distanceKm: number;
  capacityPercent: number;
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
  status: ShelterStatus;
  safetyLevel: ShelterSafetyLevel;
  iconType: ShelterIconType;
  address: string;
  supplies: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  isDemo?: boolean;
}

export interface SheltersApiResponse {
  success: boolean;
  count: number;
  data: ShelterRecord[];
  sector: string;
  source: string;
}
