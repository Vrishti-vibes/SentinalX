/**
 * SentinalX Centralized Auto-Refresh & Freshness Configuration
 *
 * NOTE: These are application polling and UI freshness intervals,
 * NOT scientific prediction or physical hazard sensor update frequencies.
 */

export const REFRESH_INTERVALS = {
  /** Risk intelligence multi-source computation interval (60 seconds) */
  RISK_INTELLIGENCE: 60 * 1000,

  /** Weather telemetry refresh interval (60 seconds) */
  WEATHER: 60 * 1000,

  /** Early warning alerts feed polling interval (30 seconds) */
  ALERTS: 30 * 1000,

  /** External data provider health check interval (30 seconds) */
  DATA_STATUS: 30 * 1000,

  /** Authority dashboard response queue interval (30 seconds) */
  AUTHORITY_DASHBOARD: 30 * 1000,

  /** GIS map dynamic layer risk update interval (60 seconds) */
  GIS_MAP: 60 * 1000,
} as const;

export const FRESHNESS_THRESHOLDS = {
  /** 0 to 60 seconds: Considered freshly updated LIVE data */
  LIVE_SECONDS: 60,

  /** 61 to 180 seconds: Considered recently updated data */
  RECENT_SECONDS: 180,

  /** 181 to 600 seconds: Aging data (within reasonable cache window) */
  AGING_SECONDS: 600,

  /** >600 seconds (10 mins): Stale indicator threshold */
  STALE_SECONDS: 600,
} as const;
