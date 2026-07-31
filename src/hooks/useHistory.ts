"use client";

import { useCallback, useEffect, useState } from "react";
import { sortHistory } from "@/lib/reportUtils";
import { storage } from "@/lib/storage";
import type { PrayerCounts, WeeklyReport } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

export function useHistory() {
  const ready = useLocalStorageReady();
  const [history, setHistory] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setHistory(sortHistory(storage.getHistory()));
  }, [ready]);

  const refresh = useCallback(() => {
    setHistory(sortHistory(storage.getHistory()));
  }, []);

  const findById = useCallback(
    (id: string) => history.find((r) => r.id === id) ?? null,
    [history]
  );

  const updateReportEntry = useCallback(
    (id: string, counts: PrayerCounts, activityNote: string) => {
      setHistory((prev) => {
        const next = sortHistory(
          prev.map((r) =>
            r.id === id
              ? { ...r, counts, activityNote, updatedAt: new Date().toISOString() }
              : r
          )
        );
        storage.setHistory(next);
        return next;
      });
    },
    []
  );

  const removeReport = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      storage.setHistory(next);
      return next;
    });
  }, []);

  return { ready, history, refresh, findById, updateReportEntry, removeReport };
}
