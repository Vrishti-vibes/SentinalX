"use client";

import React, { useState, useEffect } from "react";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { getPendingReports } from "@/lib/offline/storage";
import { syncPendingReports, initAutoSync } from "@/lib/offline/sync";
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export function OfflineStatus() {
  const { isOnline, connectionState, lastOnlineAt } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  const updatePendingCount = () => {
    setPendingCount(getPendingReports().length);
  };

  useEffect(() => {
    updatePendingCount();

    const cleanup = initAutoSync((res) => {
      updatePendingCount();
      if (res.syncedCount > 0) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      }
    });

    const interval = setInterval(updatePendingCount, 3000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncPendingReports();
      updatePendingCount();
      if (res.syncedCount > 0) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // If online and no pending reports and didn't just sync, show compact online pill
  if (isOnline && pendingCount === 0 && !justSynced) {
    return (
      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>ONLINE</span>
      </div>
    );
  }

  // If just synced
  if (justSynced) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-fadeIn">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>SYNC COMPLETE</span>
      </div>
    );
  }

  // If offline
  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm animate-pulse">
        <WifiOff className="w-3 h-3 text-amber-700" />
        <span>OFFLINE • LAST KNOWN DATA</span>
        {pendingCount > 0 && (
          <span className="bg-amber-200 text-amber-900 px-1.5 rounded-full text-[9px] font-mono">
            {pendingCount} queued
          </span>
        )}
      </div>
    );
  }

  // Online with pending reports
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
      <Wifi className="w-3 h-3 text-blue-600" />
      <span>{pendingCount} QUEUED</span>
      <button
        type="button"
        onClick={handleManualSync}
        disabled={isSyncing}
        className="ml-1 text-blue-700 hover:text-blue-900 underline flex items-center gap-0.5"
      >
        <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? "animate-spin" : ""}`} />
        <span>{isSyncing ? "Syncing..." : "Sync"}</span>
      </button>
    </div>
  );
}
