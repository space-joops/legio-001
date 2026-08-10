"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useSchedule } from "@/hooks/useSchedule";
import { useTranslation } from "@/i18n/useTranslation";
import { formatMeetingDateTime, toDateTimeLocalValue } from "@/lib/reportUtils";
import styles from "./page.module.css";

/**
 * 주회·행사 일정을 등록하고 알림을 받는 화면(`/schedule`).
 *
 * 서버가 없으므로 푸시 알림을 보낼 수 없다. 대신 앱이 켜져 있는 동안
 * `ScheduleReminderChecker` 가 주기적으로 확인해서 브라우저 알림을 띄운다.
 * 즉 알림은 앱을 한 번이라도 열어야 뜬다.
 */

/**
 * 알림 시점 선택지. 분 단위 값과 화면에 보일 이름을 한 쌍으로 둔다.
 * 선택지를 늘리려면 여기 한 줄만 추가하면 된다.
 */
const REMINDER_OPTIONS = [
  { minutes: 10, label: "10분 전" },
  { minutes: 30, label: "30분 전" },
  { minutes: 60, label: "1시간 전" },
  { minutes: 180, label: "3시간 전" },
  { minutes: 1440, label: "1일 전" },
] as const;

/**
 * 저장된 분값을 이름으로 바꾼다. 선택지에 없는 값(예전 버전이나 가져온 데이터)이
 * 들어와도 빈칸이 되지 않도록 "N분 전"으로 만들어 준다.
 */
function reminderLabel(minutes: number): string {
  return REMINDER_OPTIONS.find((option) => option.minutes === minutes)?.label ?? `${minutes}분 전`;
}

type PermissionState = NotificationPermission | "unsupported";

export default function SchedulePage() {
  const { t } = useTranslation();
  const { ready, events, pastEvents, addEvent, removeEvent } = useSchedule();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(60);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>("default");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of browser APIs unavailable at render time */
    setDateTime(toDateTimeLocalValue(new Date()));
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!ready) {
    return <PageShell title={t("schedule.title")}>{null}</PageShell>;
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateTime) return;
    addEvent(title.trim(), dateTime, reminderMinutesBefore);
    setTitle("");
    setDateTime(toDateTimeLocalValue(new Date()));
    // The new item lands below the fold on phones, so confirm out loud.
    showToast(t("schedule.added"));
  };

  const handleRequestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <PageShell title={t("schedule.title")}>
      <p className={styles.hint}>{t("schedule.notificationHint")}</p>
      {permission === "default" && (
        <button type="button" className={styles.permissionButton} onClick={handleRequestPermission}>
          {t("schedule.notificationPermissionButton")}
        </button>
      )}
      {permission === "denied" && <p className={styles.hint}>{t("schedule.notificationPermissionDenied")}</p>}

      <form className={styles.form} onSubmit={handleAdd}>
        <h2 className={styles.formTitle}>{t("schedule.addTitle")}</h2>
        <label className={styles.field}>
          <span className={styles.label}>{t("schedule.titleLabel")}</span>
          <input
            type="text"
            className={styles.input}
            value={title}
            required
            placeholder={t("schedule.titlePlaceholder")}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("schedule.dateTimeLabel")}</span>
          <input
            type="datetime-local"
            className={styles.input}
            value={dateTime}
            required
            onChange={(e) => setDateTime(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("schedule.reminderLabel")}</span>
          <select
            className={styles.select}
            value={reminderMinutesBefore}
            onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
          >
            {REMINDER_OPTIONS.map(({ minutes, label }) => (
              <option key={minutes} value={minutes}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={styles.addButton}>
          {t("schedule.add")}
        </button>
      </form>

      {events.length === 0 ? (
        <p className={styles.empty}>{t("schedule.empty")}</p>
      ) : (
        <ul className={styles.list}>
          {events.map((event) => (
            <li key={event.id} className={styles.item}>
              <div>
                <p className={styles.itemTitle}>{event.title}</p>
                <p className={styles.itemDate}>
                  {formatMeetingDateTime(event.dateTime)}
                </p>
                <p className={styles.itemReminder}>
                  {reminderLabel(event.reminderMinutesBefore)}
                </p>
              </div>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => setDeleteTarget(event.id)}
              >
                {t("common.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {pastEvents.length > 0 && (
        <>
          <h2 className={styles.pastTitle}>{t("schedule.pastTitle")}</h2>
          <ul className={`${styles.list} ${styles.pastList}`}>
            {pastEvents.map((event) => (
              <li key={event.id} className={styles.item}>
                <div>
                  <p className={styles.itemTitle}>{event.title}</p>
                  <p className={styles.itemDate}>
                    {formatMeetingDateTime(event.dateTime)}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setDeleteTarget(event.id)}
                >
                  {t("common.delete")}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("schedule.deleteConfirmTitle")}
        body={t("schedule.deleteConfirmBody")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removeEvent(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </PageShell>
  );
}
