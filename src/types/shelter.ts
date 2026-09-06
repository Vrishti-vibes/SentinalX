export type ShelterStatus = "OPEN" | "FULL" | "STANDBY";
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
  status: ShelterStatus;
  iconType: ShelterIconType;
  address: string;
  supplies: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  isDemo: boolean;
}

export interface SheltersApiResponse {
  success: boolean;
  count: number;
  data: ShelterRecord[];
  sector: string;
  disclaimer: string;
}
