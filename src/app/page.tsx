"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CounterGrid } from "@/components/CounterGrid";
import { PageShell } from "@/components/PageShell";
import { SubmitReportButton } from "@/components/SubmitReportButton";
import { WeekSessionForm } from "@/components/WeekSessionForm";
import { useCurrentReport } from "@/hooks/useCurrentReport";
import { useHistory } from "@/hooks/useHistory";
import { useTranslation } from "@/i18n/useTranslation";
import {
  formatMeetingDateTime,
  formatSessionLabel,
  toDateTimeLocalValue,
} from "@/lib/reportUtils";
import { storage } from "@/lib/storage";
import type { PrayerItemKey, WeeklyReport } from "@/lib/types";
import styles from "./page.module.css";

/**
 * 홈 화면(`/`). 이 앱에서 단원이 가장 많이 보는 화면이다.
 *
 * 상태에 따라 두 가지 모습 중 하나가 된다.
 *   1. 진행 중인 회차가 없다 → 회차 번호·주회 일시를 입력하는 시작 폼
 *   2. 진행 중인 회차가 있다 → 기도 카운터 5개 + 활동 메모 + 제출 버튼
 *
 * 아래 `HomePage` 는 이 둘을 **조기 반환(early return)** 으로 갈라 놓았다.
 * 한 return 안에서 조건을 중첩해 쓰면 괄호가 겹겹이 쌓여 읽기 어려워지기 때문이다.
 */

interface WeekHeaderProps {
  report: WeeklyReport;
  /** true 면 회차·일시를 고치는 입력 폼, false 면 요약 버튼을 보여 준다. */
  editing: boolean;
  sessionNumber: string;
  meetingDateTime: string;
  onSessionNumberChange: (value: string) => void;
  onMeetingDateTimeChange: (value: string) => void;
  onSave: () => void;
  onStartEditing: () => void;
}

/**
 * 화면 맨 위의 "몇 회차 / 언제" 표시줄.
 *
 * 평소에는 요약을 보여 주다가, 누르면 같은 자리에서 입력 폼으로 바뀐다.
 */
function WeekHeader({
  report,
  editing,
  sessionNumber,
  meetingDateTime,
  onSessionNumberChange,
  onMeetingDateTimeChange,
  onSave,
  onStartEditing,
}: WeekHeaderProps) {
  const { t, language } = useTranslation();

  if (editing) {
    return (
      <WeekSessionForm
        sessionNumber={sessionNumber}
        meetingDateTime={meetingDateTime}
        onSessionNumberChange={onSessionNumberChange}
        onMeetingDateTimeChange={onMeetingDateTimeChange}
        onSubmit={onSave}
        submitLabel={t("common.save")}
      />
    );
  }

  return (
    <button type="button" className={styles.weekSummary} onClick={onStartEditing}>
      <span>{formatSessionLabel(report.sessionNumber, language)}</span>
      <span className={styles.weekSummaryDate}>
        {formatMeetingDateTime(report.meetingDateTime, language)}
      </span>
      <span className={styles.weekSummaryEdit}>{t("week.editWeek")}</span>
    </button>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  // [TS] `const { a, b } = 객체` 는 구조 분해다. 파이썬에는 없지만 딕셔너리에서
  //      키를 꺼내 같은 이름의 변수로 만드는 것과 같다.
  //      → docs/typescript-for-python.md#3-객체
  const {
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
  } = useCurrentReport();
  const { history } = useHistory();

  // 입력칸에 사람이 타이핑 중인 값(임시본). 확정되기 전까지는 저장하지 않는다.
  const [editing, setEditing] = useState(false);
  const [sessionNumber, setSessionNumber] = useState("");
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    // 메모 입력칸의 초기값을 채운다. 의존성이 `report` 전체가 아니라 `report.id`
    // 인 것이 핵심이다. 카운터를 한 번 누를 때마다 report 객체는 새로 만들어지는데,
    // 그때마다 이 코드가 돌면 타이핑하던 내용이 지워져 버린다.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 보고서가 바뀔 때 입력칸 초기값을 다시 심는 것이지, 렌더마다 계산되는 값이 아니다
    setNoteDraft(report?.activityNote ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 일부러 report.id 만 본다. report 전체를 넣으면 카운터 탭마다 입력 중인 메모가 날아간다
  }, [report?.id]);

  useEffect(() => {
    if (!ready) return;
    // 회차 번호와 주회 일시 입력칸의 초기값을 정한다.
    /* eslint-disable react-hooks/set-state-in-effect -- 저장소에서 읽어 온 값으로 입력칸을 초기화하는 것이지, 렌더마다 계산되는 값이 아니다 */
    if (report) {
      // 이미 진행 중인 회차가 있으면 그 값을 그대로 보여 준다.
      setSessionNumber(String(report.sessionNumber));
      setMeetingDateTime(report.meetingDateTime);
    } else {
      // 없으면 지난 기록에서 다음 회차를 추측해 미리 채워 준다.
      // [TS] `history[0]?.sessionNumber ?? 0` — 기록이 하나도 없으면 `history[0]`
      //      이 undefined 인데, `?.` 덕분에 터지지 않고 통째로 undefined 가 되고,
      //      `?? 0` 이 그걸 0 으로 바꾼다. → docs/typescript-for-python.md#5-널-다루기
      const nextSession = (history[0]?.sessionNumber ?? 0) + 1;
      setSessionNumber(String(nextSession));
      if (history[0]?.meetingDateTime) {
        // 주회는 매주 같은 요일·시각에 열리므로 지난 주회 + 7일을 기본값으로 둔다.
        const base = new Date(history[0].meetingDateTime);
        base.setDate(base.getDate() + 7);
        setMeetingDateTime(toDateTimeLocalValue(base));
      } else {
        setMeetingDateTime(toDateTimeLocalValue(new Date()));
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready, report, history]);

  // 아직 localStorage 를 읽기 전이라 진행 중인 회차가 있는지 알 수 없다.
  // 빈 껍데기만 그려 두고, 준비되면 아래 화면 중 하나로 넘어간다.
  if (!ready) {
    return <PageShell title={t("app.shortName")}>{null}</PageShell>;
  }

  const handleStart = () => {
    const num = Number.parseInt(sessionNumber, 10);
    // 숫자가 아니거나 일시가 비면 아무 일도 하지 않는다.
    if (!Number.isFinite(num) || !meetingDateTime) return;
    const profile = storage.getProfile();
    startWeek(num, meetingDateTime, profile);
  };

  const handleUpdate = () => {
    const num = Number.parseInt(sessionNumber, 10);
    if (!Number.isFinite(num) || !meetingDateTime) return;
    updateSessionInfo(num, meetingDateTime);
    setEditing(false);
  };

  const handleSubmit = () => {
    const submitted = submit();
    if (submitted) router.push(`/report?id=${submitted.id}`);
  };

  // ── 화면 1. 진행 중인 회차가 없을 때 ──────────────────────────────
  if (!report) {
    return (
      <PageShell title={t("app.shortName")}>
        <p className={styles.emptyNotice}>{t("week.noActiveWeek")}</p>
        <WeekSessionForm
          sessionNumber={sessionNumber}
          meetingDateTime={meetingDateTime}
          onSessionNumberChange={setSessionNumber}
          onMeetingDateTimeChange={setMeetingDateTime}
          onSubmit={handleStart}
          submitLabel={t("week.startWeek")}
        />
      </PageShell>
    );
  }

  // ── 화면 2. 진행 중인 회차가 있을 때 ──────────────────────────────
  // 여기부터 `report` 는 절대 null 이 아니다(위에서 걸러 냈으므로 TypeScript 도 안다).

  // 묵주기도만 규칙이 다르다. 탭 한 번이 숫자를 올리는 대신 구슬 한 알을 채우고,
  // 다섯 번째 알에서 5단이 한꺼번에 기록된다.
  const handleIncrement = (key: PrayerItemKey) => {
    if (key === "rosaryDecades") addRosaryBead();
    else incrementCount(key, 1);
  };

  const handleDecrement = (key: PrayerItemKey) => {
    if (key === "rosaryDecades") removeRosaryBead();
    else incrementCount(key, -1);
  };

  return (
    <PageShell title={t("app.shortName")}>
      <WeekHeader
        report={report}
        editing={editing}
        sessionNumber={sessionNumber}
        meetingDateTime={meetingDateTime}
        onSessionNumberChange={setSessionNumber}
        onMeetingDateTimeChange={setMeetingDateTime}
        onSave={handleUpdate}
        onStartEditing={() => setEditing(true)}
      />

      <h2 className={styles.sectionTitle}>{t("home.title")}</h2>
      <CounterGrid
        counts={report.counts}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onSetValue={setCount}
        rosarySetProgress={report.rosarySetProgress ?? 0}
        onRosaryRecordSet={addRosarySet}
      />

      <label className={styles.noteField}>
        <span className={styles.sectionTitle}>{t("home.activityNoteLabel")}</span>
        <textarea
          className={styles.noteInput}
          rows={5}
          value={noteDraft}
          placeholder={t("home.activityNotePlaceholder")}
          // 타이핑하는 동안은 화면 state 만 바꾸고, 입력칸을 벗어날 때(onBlur)
          // 한 번만 저장한다. 글자 하나마다 localStorage 에 쓰지 않기 위해서다.
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => setActivityNote(noteDraft)}
        />
      </label>

      <SubmitReportButton onConfirmSubmit={handleSubmit} />
    </PageShell>
  );
}
