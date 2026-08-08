"use client";

import { useCallback, useEffect, useState } from "react";
import { sortHistory } from "@/lib/reportUtils";
import { storage } from "@/lib/storage";
import type { PrayerCounts, WeeklyReport } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

/**
 * 제출이 끝난 주간 보고 목록을 다루는 훅. 기록 화면과 보고서 상세 화면이 쓴다.
 *
 * 이 저장소의 훅은 전부 같은 모양이다(`useCurrentReport`, `useRoster`,
 * `useMonthlyReports` … 도 마찬가지). 하나만 이해하면 나머지는 그대로 읽힌다.
 *
 *   1. `useLocalStorageReady()` 로 브라우저 준비를 기다린다
 *   2. 준비되면 `useEffect` 안에서 딱 한 번 저장소를 읽어 state 에 담는다
 *   3. 값을 바꿀 때는 **state 와 저장소에 동시에** 쓴다
 *
 * 즉 React state 는 localStorage 의 거울일 뿐이고, 둘이 어긋나지 않도록
 * 항상 같이 갱신하는 게 이 패턴의 핵심이다.
 */
export function useHistory() {
  const ready = useLocalStorageReady();
  const [history, setHistory] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션이 끝난 뒤 localStorage 에서 한 번만 읽어 오는 초기 적재
    if (ready) setHistory(sortHistory(storage.getHistory()));
  }, [ready]);

  /** 다른 화면이 저장소를 고쳤을 수 있을 때 다시 읽어 온다. */
  const refresh = useCallback(() => {
    setHistory(sortHistory(storage.getHistory()));
  }, []);

  const findById = useCallback(
    // [TS] `?? null` 은 왼쪽이 null/undefined 일 때만 오른쪽을 쓴다.
    //      `find` 는 못 찾으면 undefined 를 주는데, 이 앱은 "없음"을 null 로
    //      통일해 쓰기 때문에 여기서 바꿔 준다. → docs/typescript-for-python.md#5-널-다루기
    (id: string) => history.find((r) => r.id === id) ?? null,
    [history]
  );

  const updateReportEntry = useCallback(
    (id: string, counts: PrayerCounts, activityNote: string) => {
      // [TS] `setState((prev) => ...)` 는 "지금 화면이 알고 있는 값"이 아니라
      //      "React 가 들고 있는 최신 값"에서 출발한다. 연달아 두 번 고칠 때
      //      뒤엣것이 앞엣것을 덮어쓰는 사고를 막아 준다.
      setHistory((prev) => {
        // 원본 배열을 고치지 않고 새 배열을 만든다(불변 갱신). React 는 객체가
        // 바뀌었는지를 "같은 객체인가"로 판단하기 때문에, 안을 직접 고치면
        // 화면이 다시 그려지지 않는다.
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
