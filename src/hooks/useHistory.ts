"use client";

import { useCallback, useEffect, useState } from "react";
import { sortHistory } from "@/lib/reportUtils";
import { storage } from "@/lib/storage";
import type { WeeklyReport } from "@/lib/types";
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

  return { ready, history, refresh, findById };
}
