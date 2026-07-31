"use client";

import { useCallback, useEffect, useState } from "react";
import { generateId } from "@/lib/id";
import { deriveMemberCounts } from "@/lib/monthlyReportUtils";
import { storage } from "@/lib/storage";
import type { MemberCounts, MemberEntry, OfficerEntry, OfficerRole, PraesidiumRoster } from "@/lib/types";
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

  const updateRegularMeetingWeekday = useCallback((weekday: number) => {
    setRoster((prev) => {
      if (!prev) return prev;
      const next = { ...prev, regularMeetingWeekday: weekday };
      storage.setRoster(next);
      return next;
    });
  }, []);

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

  const addMemberEntry = useCallback(
    (category: keyof MemberCounts, name: string, baptismalName: string) => {
      setRoster((prev) => {
        if (!prev) return prev;
        const entry: MemberEntry = { id: generateId(), name, baptismalName };
        const memberRoster = {
          ...prev.memberRoster,
          [category]: [...prev.memberRoster[category], entry],
        };
        const next = { ...prev, memberRoster, memberCounts: deriveMemberCounts(memberRoster) };
        storage.setRoster(next);
        return next;
      });
    },
    []
  );

  const removeMemberEntry = useCallback((category: keyof MemberCounts, id: string) => {
    setRoster((prev) => {
      if (!prev) return prev;
      const memberRoster = {
        ...prev.memberRoster,
        [category]: prev.memberRoster[category].filter((entry) => entry.id !== id),
      };
      const next = { ...prev, memberRoster, memberCounts: deriveMemberCounts(memberRoster) };
      storage.setRoster(next);
      return next;
    });
  }, []);

  const updateMemberEntry = useCallback(
    (category: keyof MemberCounts, id: string, patch: Partial<MemberEntry>) => {
      setRoster((prev) => {
        if (!prev) return prev;
        const memberRoster = {
          ...prev.memberRoster,
          [category]: prev.memberRoster[category].map((entry) =>
            entry.id === id ? { ...entry, ...patch } : entry
          ),
        };
        const next = { ...prev, memberRoster };
        storage.setRoster(next);
        return next;
      });
    },
    []
  );

  return {
    ready,
    roster,
    updateHeader,
    updateRegularMeetingWeekday,
    updateOfficer,
    addMemberEntry,
    removeMemberEntry,
    updateMemberEntry,
    persist,
  };
}
