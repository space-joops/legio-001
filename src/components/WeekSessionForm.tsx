"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { selectOnFocus } from "@/lib/selectOnFocus";
import styles from "./WeekSessionForm.module.css";

/**
 * 회차 번호와 주회 일시를 입력받는 작은 폼.
 *
 * 홈 화면에서 두 곳에 쓰인다 — 회차를 새로 시작할 때와, 이미 시작한 회차의
 * 정보를 고칠 때. 버튼 문구만 다르고 나머지는 같아서 하나로 합쳐 두었다.
 */

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
          onFocus={selectOnFocus}
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
