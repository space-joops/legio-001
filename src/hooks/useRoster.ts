"use client";

import { useCallback, useEffect, useState } from "react";
import { generateId } from "@/lib/id";
import { deriveMemberCounts } from "@/lib/monthlyReportUtils";
import { storage } from "@/lib/storage";
import type { MemberCounts, MemberEntry, OfficerEntry, OfficerRole, PraesidiumRoster } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

/**
 * 쁘레시디움 명단(간부 4명 + 구분별 단원 명부)을 다루는 훅.
 *
 * 명단은 월례 보고서가 만들어질 때 통째로 복사돼 들어간다. 그래서 여기서
 * 이름을 고쳐도 **이미 만들어진 보고서는 따라 바뀌지 않는다** — 그쪽은
 * `monthlyReportUtils` 의 이름 동기화 함수가 따로 처리한다.
 */
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
    (
      patch: Partial<
        Pick<
          PraesidiumRoster,
          | "praesidiumName"
          | "councilAffiliation"
          | "spiritualDirectorName"
          | "spiritualDirectorBaptismalName"
        >
      >
    ) => {
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
