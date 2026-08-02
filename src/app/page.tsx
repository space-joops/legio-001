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
    addRosaryBead,
    removeRosaryBead,
    addRosarySet,
    setActivityNote,
    submit,
  } = useCurrentReport();
  const { history } = useHistory();

  const [editing, setEditing] = useState(false);
  const [sessionNumber, setSessionNumber] = useState("");
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    // Seeds the note draft from the active report whenever a (different) report becomes active,
    // without clobbering in-progress typing on every unrelated report update (e.g. a counter tap).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNoteDraft(report?.activityNote ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id]);

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
      if (history[0]?.meetingDateTime) {
        // Weekly meetings recur on the same day/time, so default to one week after the last one.
        const base = new Date(history[0].meetingDateTime);
        base.setDate(base.getDate() + 7);
        setMeetingDateTime(toDateTimeLocalValue(base));
      } else {
        setMeetingDateTime(toDateTimeLocalValue(new Date()));
      }
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

  return (
    <PageShell title={t("app.shortName")}>
      {!report ? (
        <>
          <p className={styles.emptyNotice}>{t("week.noActiveWeek")}</p>
          <WeekSessionForm
            sessionNumber={sessionNumber}
            meetingDateTime={meetingDateTime}
            onSessionNumberChange={setSessionNumber}
            onMeetingDateTimeChange={setMeetingDateTime}
            onSubmit={handleStart}
            submitLabel={t("week.startWeek")}
          />
        </>
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
            // 묵주기도 taps fill a bead instead of moving the count; the fifth
            // one commits all five 단 at once.
            onIncrement={(key) =>
              key === "rosaryDecades" ? addRosaryBead() : incrementCount(key, 1)
            }
            onDecrement={(key) =>
              key === "rosaryDecades" ? removeRosaryBead() : incrementCount(key, -1)
            }
            onSetValue={(key, value) => setCount(key, value)}
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
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => setActivityNote(noteDraft)}
            />
          </label>

          <SubmitReportButton onConfirmSubmit={handleSubmit} />
        </>
      )}
    </PageShell>
  );
}
