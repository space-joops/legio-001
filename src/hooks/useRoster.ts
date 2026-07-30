"use client";

import { useCallback, useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import type { MemberCounts, OfficerEntry, OfficerRole, PraesidiumRoster } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

export function useRoster() {
  const ready = useLocalStorageReady();
  const [roster, setRoster] = useState<PraesidiumRoster | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setRoster(storage.getRoster());
  }, [ready]);

  const persist = useCallback((next: PraesidiumRoster) => {
    setRoster(next);
    storage.setRoster(next);
  }, []);

  const updateHeader = useCallback(
    (patch: Partial<Pick<PraesidiumRoster, "councilAffiliation" | "spiritualDirectorName" | "spiritualDirectorBaptismalName">>) => {
      setRoster((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        storage.setRoster(next);
        return next;
      });
    },
    []
  );

  const updateOfficer = useCallback((role: OfficerRole, patch: Partial<OfficerEntry>) => {
    setRoster((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        officers: prev.officers.map((officer) =>
          officer.role === role ? { ...officer, ...patch } : officer
        ),
      };
      storage.setRoster(next);
      return next;
    });
  }, []);

  const updateMemberCounts = useCallback((patch: Partial<MemberCounts>) => {
    setRoster((prev) => {
      if (!prev) return prev;
      const next = { ...prev, memberCounts: { ...prev.memberCounts, ...patch } };
      storage.setRoster(next);
      return next;
    });
  }, []);

  return { ready, roster, updateHeader, updateOfficer, updateMemberCounts, persist };
}
