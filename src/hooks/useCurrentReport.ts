"use client";

import { useCallback, useEffect, useState } from "react";
import { createNewReport } from "@/lib/reportUtils";
import { storage } from "@/lib/storage";
import type { PrayerItemKey, Profile, WeeklyReport } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

export function useCurrentReport() {
  const ready = useLocalStorageReady();
  const [report, setReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setReport(storage.getCurrentReport());
  }, [ready]);

  const persist = useCallback((next: WeeklyReport | null) => {
    setReport(next);
    storage.setCurrentReport(next);
  }, []);

  const startWeek = useCallback(
    (sessionNumber: number, meetingDateTime: string, profile: Profile) => {
      const next = createNewReport(sessionNumber, meetingDateTime, profile);
      persist(next);
      return next;
    },
    [persist]
  );

  const updateSessionInfo = useCallback(
    (sessionNumber: number, meetingDateTime: string) => {
      if (!report) return;
      persist({
        ...report,
        sessionNumber,
        meetingDateTime,
        updatedAt: new Date().toISOString(),
      });
    },
    [report, persist]
  );

  const incrementCount = useCallback(
    (key: PrayerItemKey, delta: number) => {
      if (!report) return;
      const value = Math.max(0, report.counts[key] + delta);
      persist({
        ...report,
        counts: { ...report.counts, [key]: value },
        updatedAt: new Date().toISOString(),
      });
    },
    [report, persist]
  );

  const setCount = useCallback(
    (key: PrayerItemKey, value: number) => {
      if (!report) return;
      const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
      persist({
        ...report,
        counts: { ...report.counts, [key]: safe },
        updatedAt: new Date().toISOString(),
      });
    },
    [report, persist]
  );

  const submit = useCallback((): WeeklyReport | null => {
    if (!report) return null;
    const now = new Date().toISOString();
    const submitted: WeeklyReport = {
      ...report,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    };
    storage.setHistory([submitted, ...storage.getHistory()]);
    persist(null);
    return submitted;
  }, [report, persist]);

  const discard = useCallback(() => {
    persist(null);
  }, [persist]);

  return {
    ready,
    report,
    startWeek,
    updateSessionInfo,
    incrementCount,
    setCount,
    submit,
    discard,
  };
}
