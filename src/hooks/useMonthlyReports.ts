"use client";

import { useCallback, useEffect, useState } from "react";
import { createMonthlyReport, sortMonthlyReports } from "@/lib/monthlyReportUtils";
import { storage } from "@/lib/storage";
import type { MonthlyReport, PraesidiumRoster } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

export function useMonthlyReports() {
  const ready = useLocalStorageReady();
  const [reports, setReports] = useState<MonthlyReport[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setReports(sortMonthlyReports(storage.getMonthlyReports()));
  }, [ready]);

  const persist = useCallback((next: MonthlyReport[]) => {
    const sorted = sortMonthlyReports(next);
    setReports(sorted);
    storage.setMonthlyReports(sorted);
  }, []);

  const findById = useCallback(
    (id: string) => reports.find((r) => r.id === id) ?? null,
    [reports]
  );

  const createReport = useCallback(
    (yearMonth: string, roster: PraesidiumRoster) => {
      const previousReport = sortMonthlyReports(reports).find((r) => r.yearMonth < yearMonth) ?? null;
      const created = createMonthlyReport(yearMonth, roster, previousReport, storage.getHistory());
      persist([...reports, created]);
      return created;
    },
    [reports, persist]
  );

  const updateReport = useCallback(
    (id: string, patch: Partial<MonthlyReport>) => {
      persist(
        reports.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r))
      );
    },
    [reports, persist]
  );

  const removeReport = useCallback(
    (id: string) => {
      persist(reports.filter((r) => r.id !== id));
    },
    [reports, persist]
  );

  return { ready, reports, findById, createReport, updateReport, removeReport };
}
