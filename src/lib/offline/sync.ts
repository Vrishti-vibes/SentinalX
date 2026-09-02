import {
  getPendingReports,
  updatePendingReport,
  removePendingReport,
  PendingOfflineReport,
} from "./storage";

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  remainingPending: number;
  results: {
    localReportId: string;
    serverReportId: string | null;
    success: boolean;
    error?: string;
  }[];
}

const MAX_RETRIES = 5;

/**
 * Synchronize all pending offline field reports with idempotency protection
 */
export async function syncPendingReports(): Promise<SyncResult> {
  if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.onLine) {
    return {
      syncedCount: 0,
      failedCount: 0,
      remainingPending: getPendingReports().length,
      results: [],
    };
  }

  const reports = getPendingReports().filter(
    (r) => r.syncStatus === "QUEUED_OFFLINE" || (r.syncStatus === "SYNC_FAILED" && r.retryCount < MAX_RETRIES)
  );

  let syncedCount = 0;
  let failedCount = 0;
  const results: SyncResult["results"] = [];

  for (const item of reports) {
    updatePendingReport(item.localReportId, { syncStatus: "SYNCING" });

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        const json = await res.json();
        const serverReportId = json.reportId || json.data?.reportId || null;

        updatePendingReport(item.localReportId, {
          syncStatus: "SYNCED",
          serverReportId,
        });

        // Remove from active pending queue
        removePendingReport(item.localReportId);

        syncedCount++;
        results.push({
          localReportId: item.localReportId,
          serverReportId,
          success: true,
        });
      } else {
        const errJson = await res.json().catch(() => ({}));
        const newRetry = item.retryCount + 1;
        const syncStatus = newRetry >= MAX_RETRIES ? "SYNC_FAILED" : "QUEUED_OFFLINE";

        updatePendingReport(item.localReportId, {
          syncStatus,
          retryCount: newRetry,
          lastError: errJson.error || `HTTP ${res.status}`,
        });

        failedCount++;
        results.push({
          localReportId: item.localReportId,
          serverReportId: null,
          success: false,
          error: errJson.error || `HTTP ${res.status}`,
        });
      }
    } catch (err: unknown) {
      const newRetry = item.retryCount + 1;
      const syncStatus = newRetry >= MAX_RETRIES ? "SYNC_FAILED" : "QUEUED_OFFLINE";

      updatePendingReport(item.localReportId, {
        syncStatus,
        retryCount: newRetry,
        lastError: err instanceof Error ? err.message : "Network error during sync",
      });

      failedCount++;
      results.push({
        localReportId: item.localReportId,
        serverReportId: null,
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  return {
    syncedCount,
    failedCount,
    remainingPending: getPendingReports().length,
    results,
  };
}

/**
 * Initialize automatic background sync when browser network reconnects
 */
export function initAutoSync(onSyncComplete?: (result: SyncResult) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = async () => {
    console.log("[OfflineSync] Network reconnected. Synchronizing queued field reports...");
    const result = await syncPendingReports();
    if (onSyncComplete) onSyncComplete(result);
  };

  window.addEventListener("online", handleOnline);

  // Also attempt initial sync if online
  if (navigator.onLine) {
    syncPendingReports().then((res) => {
      if (onSyncComplete && res.syncedCount > 0) onSyncComplete(res);
    });
  }

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
