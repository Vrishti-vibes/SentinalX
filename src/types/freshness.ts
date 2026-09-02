export type DataFreshnessStatus =
  | "LIVE"
  | "REFRESHING"
  | "CACHED"
  | "STALE"
  | "OFFLINE"
  | "UNAVAILABLE";

export interface DataFreshnessMetadata {
  status: DataFreshnessStatus;
  lastSuccessfulUpdate: string | null; // ISO 8601 string from actual response
  ageSeconds: number | null;
  source: string | null;
  isRefreshing?: boolean;
}
