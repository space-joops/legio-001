"use client";

import { useCallback, useEffect, useState } from "react";
import { ROSARY_SET_SIZE } from "@/lib/constants";
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

  /** Fills one bead; the fifth one commits the whole set at once. */
  const addRosaryBead = useCallback(() => {
    if (!report) return;
    const next = (report.rosarySetProgress ?? 0) + 1;
    const complete = next >= ROSARY_SET_SIZE;
    persist({
      ...report,
      counts: complete
        ? { ...report.counts, rosaryDecades: report.counts.rosaryDecades + ROSARY_SET_SIZE }
        : report.counts,
      rosarySetProgress: complete ? 0 : next,
      updatedAt: new Date().toISOString(),
    });
  }, [report, persist]);

  /**
   * The exact inverse of `addRosaryBead`, including across a set boundary:
   * undoing the tap that completed a set gives the 5단 back and leaves four
   * beads standing, which is what someone who mis-tapped expects to see.
   */
  const removeRosaryBead = useCallback(() => {
    if (!report) return;
    const progress = report.rosarySetProgress ?? 0;
    const count = report.counts.rosaryDecades;
    let nextProgress = 0;
    let nextCount = count;
    if (progress > 0) {
      nextProgress = progress - 1;
    } else if (count >= ROSARY_SET_SIZE) {
      nextCount = count - ROSARY_SET_SIZE;
      nextProgress = ROSARY_SET_SIZE - 1;
    } else {
      // A count typed in by hand that isn't a whole set — just clear it.
      nextCount = 0;
    }
    persist({
      ...report,
      counts: { ...report.counts, rosaryDecades: nextCount },
      rosarySetProgress: nextProgress,
      updatedAt: new Date().toISOString(),
    });
  }, [report, persist]);

  /** Records a full set at once — the prayer guide's "5단을 다 바쳤다" path. */
  const addRosarySet = useCallback(() => {
    if (!report) return;
    persist({
      ...report,
      counts: {
        ...report.counts,
        rosaryDecades: report.counts.rosaryDecades + ROSARY_SET_SIZE,
      },
      updatedAt: new Date().toISOString(),
    });
  }, [report, persist]);

  const setActivityNote = useCallback(
    (value: string) => {
      if (!report) return;
      persist({
        ...report,
        activityNote: value,
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
      // A set that never reached five decades doesn't go on the report.
      rosarySetProgress: 0,
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
    addRosaryBead,
    removeRosaryBead,
    addRosarySet,
    setActivityNote,
    submit,
    discard,
  };
}
