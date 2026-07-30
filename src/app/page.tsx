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
import styles from "./page.module.css";

export default function HomePage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const {
    ready,
    report,
    startWeek,
    updateSessionInfo,
    incrementCount,
    setCount,
    submit,
  } = useCurrentReport();
  const { history } = useHistory();

  const [editing, setEditing] = useState(false);
  const [sessionNumber, setSessionNumber] = useState("");
  const [meetingDateTime, setMeetingDateTime] = useState("");

  useEffect(() => {
    if (!ready) return;
    // Seeds the editable form from storage-backed state (not a pure derivation) whenever
    // the active report or history default changes.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (report) {
      setSessionNumber(String(report.sessionNumber));
      setMeetingDateTime(report.meetingDateTime);
    } else {
      const nextSession = (history[0]?.sessionNumber ?? 0) + 1;
      setSessionNumber(String(nextSession));
      setMeetingDateTime(toDateTimeLocalValue(new Date()));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready, report, history]);

  if (!ready) {
    return <PageShell title={t("app.shortName")}>{null}</PageShell>;
  }

  const handleStart = () => {
    const num = Number.parseInt(sessionNumber, 10);
    if (!Number.isFinite(num) || !meetingDateTime) return;
    const profile = storage.getProfile();
    startWeek(num, meetingDateTime, profile.name);
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

  return (
    <PageShell title={t("app.shortName")}>
      {!report ? (
        <WeekSessionForm
          sessionNumber={sessionNumber}
          meetingDateTime={meetingDateTime}
          onSessionNumberChange={setSessionNumber}
          onMeetingDateTimeChange={setMeetingDateTime}
          onSubmit={handleStart}
          submitLabel={t("week.startWeek")}
        />
      ) : (
        <>
          {editing ? (
            <WeekSessionForm
              sessionNumber={sessionNumber}
              meetingDateTime={meetingDateTime}
              onSessionNumberChange={setSessionNumber}
              onMeetingDateTimeChange={setMeetingDateTime}
              onSubmit={handleUpdate}
              submitLabel={t("common.save")}
            />
          ) : (
            <button
              type="button"
              className={styles.weekSummary}
              onClick={() => setEditing(true)}
            >
              <span>{formatSessionLabel(report.sessionNumber, language)}</span>
              <span className={styles.weekSummaryDate}>
                {formatMeetingDateTime(report.meetingDateTime, language)}
              </span>
              <span className={styles.weekSummaryEdit}>{t("week.editWeek")}</span>
            </button>
          )}

          <h2 className={styles.sectionTitle}>{t("home.title")}</h2>
          <CounterGrid
            counts={report.counts}
            onIncrement={(key) => incrementCount(key, 1)}
            onDecrement={(key) => incrementCount(key, -1)}
            onSetValue={(key, value) => setCount(key, value)}
          />
          <SubmitReportButton onConfirmSubmit={handleSubmit} />
        </>
      )}
    </PageShell>
  );
}
