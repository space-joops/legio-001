"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useSchedule } from "@/hooks/useSchedule";
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
    return <PageShell title="일정">{null}</PageShell>;
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateTime) return;
    addEvent(title.trim(), dateTime, reminderMinutesBefore);
    setTitle("");
    setDateTime(toDateTimeLocalValue(new Date()));
    // The new item lands below the fold on phones, so confirm out loud.
    showToast("일정이 추가되었습니다.");
  };

  const handleRequestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <PageShell title="일정">
      <p className={styles.hint}>알림은 이 앱을 열어두었을 때만 울립니다.</p>
      {permission === "default" && (
        <button type="button" className={styles.permissionButton} onClick={handleRequestPermission}>
          알림 켜기
        </button>
      )}
      {permission === "denied" && <p className={styles.hint}>브라우저 설정에서 알림 권한이 차단되어 있습니다.</p>}

      <form className={styles.form} onSubmit={handleAdd}>
        <h2 className={styles.formTitle}>새 일정 등록</h2>
        <label className={styles.field}>
          <span className={styles.label}>일정 이름</span>
          <input
            type="text"
            className={styles.input}
            value={title}
            required
            placeholder="예: 정기 주회, 반상회"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>일시</span>
          <input
            type="datetime-local"
            className={styles.input}
            value={dateTime}
            required
            onChange={(e) => setDateTime(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>사전 알림</span>
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
          추가하기
        </button>
      </form>

      {events.length === 0 ? (
        <p className={styles.empty}>등록된 일정이 없습니다.</p>
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
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {pastEvents.length > 0 && (
        <>
          <h2 className={styles.pastTitle}>지난 일정</h2>
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
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 일정을 삭제할까요?"
        body="삭제하면 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
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
