"use client";

import { useTranslation } from "@/i18n/useTranslation";
import styles from "./WeekSessionForm.module.css";

interface WeekSessionFormProps {
  sessionNumber: string;
  meetingDateTime: string;
  onSessionNumberChange: (value: string) => void;
  onMeetingDateTimeChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
}

export function WeekSessionForm({
  sessionNumber,
  meetingDateTime,
  onSessionNumberChange,
  onMeetingDateTimeChange,
  onSubmit,
  submitLabel,
}: WeekSessionFormProps) {
  const { t } = useTranslation();

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className={styles.field}>
        <span className={styles.label}>{t("week.sessionNumber")}</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          required
          value={sessionNumber}
          onChange={(e) => onSessionNumberChange(e.target.value)}
          placeholder={t("week.sessionNumberPlaceholder")}
          className={styles.input}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{t("week.meetingDateTime")}</span>
        <input
          type="datetime-local"
          required
          value={meetingDateTime}
          onChange={(e) => onMeetingDateTimeChange(e.target.value)}
          className={styles.input}
        />
      </label>
      <button type="submit" className={styles.submitButton}>
        {submitLabel}
      </button>
    </form>
  );
}
