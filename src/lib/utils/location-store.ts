"use client";

import { NER_LOCATIONS, NerLocationItem } from "@/lib/data/ner-gis-data";

export const STORAGE_LOCATION_KEY = "sentinalx_selected_location";
export const LOCATION_CHANGE_EVENT = "sentinalx-location-change";

export const DEFAULT_LOCATION_ID = "tawang";

/**
 * Returns the resolved location item for a given location id or name.
 */
export function getResolvedLocation(locIdOrName?: string | null): NerLocationItem {
  if (!locIdOrName) {
    const def = NER_LOCATIONS.find((l) => l.id === DEFAULT_LOCATION_ID);
    return def || NER_LOCATIONS[0];
  }

  const normalized = locIdOrName.toLowerCase().trim();

  // Direct match by ID
  const idMatch = NER_LOCATIONS.find((l) => l.id.toLowerCase() === normalized);
  if (idMatch) return idMatch;

  // Name or state partial match
  const nameMatch = NER_LOCATIONS.find(
    (l) =>
      l.name.toLowerCase().includes(normalized) ||
      normalized.includes(l.id.toLowerCase()) ||
      l.state.toLowerCase().includes(normalized)
  );
  if (nameMatch) return nameMatch;

  // Fallback to default location (Tawang)
  const fallback = NER_LOCATIONS.find((l) => l.id === DEFAULT_LOCATION_ID);
  return fallback || NER_LOCATIONS[0];
}

/**
 * Gets currently saved location id from localStorage safely.
 */
export function getStoredLocationId(defaultId: string = DEFAULT_LOCATION_ID): string {
  if (typeof window === "undefined") return defaultId;
  try {
    const val = localStorage.getItem(STORAGE_LOCATION_KEY);
    if (val && NER_LOCATIONS.some((l) => l.id.toLowerCase() === val.toLowerCase())) {
      return val.toLowerCase();
    }
  } catch {
    // Ignore access error
  }
  return defaultId;
}

/**
 * Sets saved location id in localStorage and dispatches custom event.
 */
export function setStoredLocationId(locationId: string): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = locationId.toLowerCase().trim();
    localStorage.setItem(STORAGE_LOCATION_KEY, normalized);
    window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT, { detail: normalized }));
  } catch {
    // Ignore storage quota error
  }
}
