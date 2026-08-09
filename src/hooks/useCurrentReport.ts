"use client";

import { useCallback, useEffect, useState } from "react";
import { ROSARY_SET_SIZE } from "@/lib/constants";
import { createNewReport } from "@/lib/reportUtils";
import { storage } from "@/lib/storage";
import type { PrayerItemKey, Profile, WeeklyReport } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

/**
 * 지금 작성 중인 주간 보고 하나를 다루는 훅. 홈 화면의 심장이다.
 *
 * 홈 화면에서 카운터를 누르면 결국 전부 여기로 들어온다. 흐름은 이렇다.
 *
 *   CounterButton(탭) → CounterGrid → app/page.tsx → 이 훅 → storage → localStorage
 *
 * 규칙이 두 개 있다.
 *   1. 보고서를 **직접 고치지 않는다.** 항상 새 객체를 만들어 통째로 교체한다.
 *      (React 는 "객체가 바뀌었나"를 내용이 아니라 "다른 객체인가"로 판단한다.)
 *   2. 화면 state 와 localStorage 에 **동시에** 쓴다. 그 일을 `persist` 가 한다.
 */
export function useCurrentReport() {
  const ready = useLocalStorageReady();
  const [report, setReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션이 끝난 뒤 localStorage 에서 한 번만 읽어 오는 초기 적재
    if (ready) setReport(storage.getCurrentReport());
  }, [ready]);

  /** 화면과 저장소에 같은 값을 함께 기록한다. 이 훅에서 쓰기가 일어나는 유일한 지점. */
  const persist = useCallback((next: WeeklyReport | null) => {
    setReport(next);
    storage.setCurrentReport(next);
  }, []);

  /**
   * 지금 보고서에서 몇 개 필드만 바꾼 새 보고서를 저장한다.
   *
   * 아래 액션들이 전부 "필드 몇 개 + 수정 시각"만 바꾸기 때문에, 그 공통 부분을
   * 여기 한 번만 적어 둔다. 덕분에 각 액션이 한두 줄로 끝난다.
   *
   * [TS] `Partial<WeeklyReport>` 는 "WeeklyReport 의 모든 필드가 선택 사항인 버전"이다.
   *      즉 바꾸고 싶은 것만 골라 넘기면 된다. `{ ...report, ...changes }` 는
   *      파이썬의 `{**report, **changes}` 와 같아서 뒤에 온 changes 가 이긴다.
   *      → docs/typescript-for-python.md#3-객체
   */
  const patchReport = useCallback(
    (changes: Partial<WeeklyReport>) => {
      if (!report) return;
      persist({ ...report, ...changes, updatedAt: new Date().toISOString() });
    },
    [report, persist]
  );

  /** 새 회차를 시작한다. 이때 설정 화면의 내 정보를 보고서 안에 복사해 둔다. */
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
      patchReport({ sessionNumber, meetingDateTime });
    },
    [patchReport]
  );

  /** 카운터 한 종류를 delta 만큼 올리거나 내린다. 0 밑으로는 내려가지 않는다. */
  const incrementCount = useCallback(
    (key: PrayerItemKey, delta: number) => {
      if (!report) return;
      const value = Math.max(0, report.counts[key] + delta);
      // [TS] `{ [key]: value }` 처럼 대괄호를 쓰면 변수에 담긴 이름을 키로 쓴다.
      //      파이썬의 `{key: value}` 와 같다. 대괄호가 없으면 "key" 라는 글자
      //      그대로가 키가 되어 버린다. → docs/typescript-for-python.md#3-객체
      patchReport({ counts: { ...report.counts, [key]: value } });
    },
    [report, patchReport]
  );

  /** 직접 입력 모드에서 숫자를 그대로 넣는다. 음수·소수·쓰레기 값은 여기서 걸러진다. */
  const setCount = useCallback(
    (key: PrayerItemKey, value: number) => {
      if (!report) return;
      const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
      patchReport({ counts: { ...report.counts, [key]: safe } });
    },
    [report, patchReport]
  );

  /**
   * 구슬 한 알을 채운다. 다섯 번째 알에서 5단이 한꺼번에 기록된다.
   *
   *   탭 1~4회 → counts 는 그대로, rosarySetProgress 만 1씩 오름
   *   탭 5회째 → counts.rosaryDecades += 5, rosarySetProgress = 0
   *
   * 묵주기도는 5단을 한 묶음으로 바치기 때문에, 세다가 만 것을 보고서에 올리지
   * 않으려는 설계다. 자세한 설명: `docs/rosary/04-구슬과-기록.md`
   */
  const addRosaryBead = useCallback(() => {
    if (!report) return;
    const next = (report.rosarySetProgress ?? 0) + 1;
    const complete = next >= ROSARY_SET_SIZE;
    patchReport({
      counts: complete
        ? { ...report.counts, rosaryDecades: report.counts.rosaryDecades + ROSARY_SET_SIZE }
        : report.counts,
      rosarySetProgress: complete ? 0 : next,
    });
  }, [report, patchReport]);

  /**
   * `addRosaryBead` 를 정확히 되돌린다. 세트 경계도 넘어간다.
   *
   * 세 갈래로 갈린다.
   *
   *   구슬이 남아 있으면        → 구슬만 하나 뺀다            (3알 → 2알)
   *   구슬 0 이고 5단 이상이면  → 5단을 빼고 구슬 4알을 남긴다 (10단·0알 → 5단·4알)
   *   구슬 0 이고 5단 미만이면  → 숫자를 0 으로 만든다          (아래 주의)
   *
   * 두 번째가 핵심이다. 세트를 완성한 그 탭을 취소하면 5단을 도로 빼고 구슬 4알이
   * 남는다 — 잘못 누른 사람이 기대하는 그림이 바로 그것이다.
   *
   * ⚠️ 세 번째 갈래는 직접 입력한 숫자를 통째로 날린다(7 에서 한 번 빼면 6이
   *    아니라 0). `docs/rosary/06-알려진-문제.md` 참고.
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
      // 손으로 직접 입력해서 5의 배수가 아닌 숫자가 남은 경우 — 그냥 0으로 지운다.
      nextCount = 0;
    }
    patchReport({
      counts: { ...report.counts, rosaryDecades: nextCount },
      rosarySetProgress: nextProgress,
    });
  }, [report, patchReport]);

  /**
   * 5단을 한 번에 기록한다 — 묵주기도 안내 화면을 끝까지 따라간 경로.
   *
   * 구슬을 한 알씩 세는 `addRosaryBead` 와는 별개의 입구다. 안내 화면
   * (`RosaryGuide`)에서 마지막 단계까지 간 뒤 [기록하기]를 누르면 여기로 온다.
   *
   * ⚠️ 이 함수는 `rosarySetProgress` 를 건드리지 않는다. 그래서 구슬 3알을 채워
   *    둔 상태로 안내를 완주하면 +5 가 되면서 구슬 3알이 그대로 남고, 이후 탭
   *    2번에 또 +5 가 된다. `docs/rosary/06-알려진-문제.md` 의 1번 항목.
   */
  const addRosarySet = useCallback(() => {
    if (!report) return;
    patchReport({
      counts: {
        ...report.counts,
        rosaryDecades: report.counts.rosaryDecades + ROSARY_SET_SIZE,
      },
    });
  }, [report, patchReport]);

  const setActivityNote = useCallback(
    (value: string) => {
      patchReport({ activityNote: value });
    },
    [patchReport]
  );

  /**
   * 작성 중인 보고서를 제출한다. 기록 목록 맨 앞에 넣고 작성 중 칸은 비운다.
   *
   * 여기만 `patchReport` 를 쓰지 않는다. 제출 시각과 수정 시각이 **정확히 같은
   * 값**이어야 하고, 채우다 만 구슬을 버리는 처리도 함께 해야 하기 때문이다.
   */
  const submit = useCallback((): WeeklyReport | null => {
    if (!report) return null;
    const now = new Date().toISOString();
    const submitted: WeeklyReport = {
      ...report,
      // 5단을 채우지 못한 세트는 보고서에 올리지 않는다.
      rosarySetProgress: 0,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    };
    storage.setHistory([submitted, ...storage.getHistory()]);
    persist(null);
    return submitted;
  }, [report, persist]);

  /** 작성 중인 보고서를 버린다. */
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
