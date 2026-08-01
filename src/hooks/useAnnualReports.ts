"use client";

import { useCallback, useEffect, useState } from "react";
import { createAnnualReport, sortAnnualReports } from "@/lib/annualReportUtils";
import { storage } from "@/lib/storage";
import type { AnnualReport, PraesidiumRoster } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

export function useAnnualReports() {
  const ready = useLocalStorageReady();
  const [reports, setReports] = useState<AnnualReport[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setReports(sortAnnualReports(storage.getAnnualReports()));
  }, [ready]);

  const persist = useCallback((next: AnnualReport[]) => {
    const sorted = sortAnnualReports(next);
    setReports(sorted);
    storage.setAnnualReports(sorted);
  }, []);

  const findById = useCallback(
    (id: string) => reports.find((r) => r.id === id) ?? null,
    [reports]
  );

  const createReport = useCallback(
    (year: number, roster: PraesidiumRoster) => {
      const previous = sortAnnualReports(reports).find((r) => r.year < year) ?? null;
      const created = createAnnualReport(year, roster, storage.getMonthlyReports(), previous);
      persist([...reports, created]);
      return created;
    },
    [reports, persist]
  );

  const updateReport = useCallback(
    (id: string, patch: Partial<AnnualReport>) => {
      persist(
        reports.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
        )
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
