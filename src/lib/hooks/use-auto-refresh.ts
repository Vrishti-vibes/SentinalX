"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNetworkStatus } from "./use-network-status";

export interface UseAutoRefreshOptions {
  intervalMs: number;
  enabled?: boolean;
  onRefreshStart?: () => void;
  onRefreshComplete?: () => void;
}

export interface UseAutoRefreshReturn {
  isRefreshing: boolean;
  lastRefreshAt: string | null;
  refreshNow: () => Promise<void>;
}

export function useAutoRefresh(
  refreshCallback: () => Promise<void> | void,
  options: UseAutoRefreshOptions
): UseAutoRefreshReturn {
  const { intervalMs, enabled = true, onRefreshStart, onRefreshComplete } = options;
  const { isOnline } = useNetworkStatus();

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);
  const callbackRef = useRef(refreshCallback);
  callbackRef.current = refreshCallback;

  const executeRefresh = useCallback(async () => {
    // Deduplication check: prevent concurrent executions
    if (isFetchingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    isFetchingRef.current = true;
    setIsRefreshing(true);
    if (onRefreshStart) onRefreshStart();

    try {
      await callbackRef.current();
      setLastRefreshAt(new Date().toISOString());
    } catch (err) {
      console.warn("[useAutoRefresh] Error executing refresh callback:", err);
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
      if (onRefreshComplete) onRefreshComplete();
    }
  }, [onRefreshStart, onRefreshComplete]);

  // Handle Tab Visibility
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled && isOnline) {
        executeRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, isOnline, executeRefresh]);

  // Set up periodic interval
  useEffect(() => {
    if (typeof window === "undefined" || !enabled || !isOnline || intervalMs <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      // Only execute if page is visible
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      executeRefresh();
    }, intervalMs);

    return () => {
      clearInterval(timerId);
    };
  }, [enabled, isOnline, intervalMs, executeRefresh]);

  return {
    isRefreshing,
    lastRefreshAt,
    refreshNow: executeRefresh,
  };
}
