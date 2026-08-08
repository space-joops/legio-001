"use client";

import { useEffect } from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { useTranslation } from "@/i18n/useTranslation";
import { formatMeetingDateTime } from "@/lib/reportUtils";
import { useToast } from "./ToastProvider";

/**
 * 일정 알림을 띄울 때가 됐는지 주기적으로 확인한다. 화면은 그리지 않는다.
 *
 * 서버가 없어 푸시 알림을 보낼 수 없으므로, 앱이 열려 있는 동안 30초마다
 * 직접 확인하는 방식이다. 즉 **앱을 켜 두지 않으면 알림도 오지 않는다.**
 * 한 번 띄운 알림은 `notifiedAt` 에 표시해 두 번 뜨지 않게 한다.
 */

const CHECK_INTERVAL_MS = 30000;

function notify(title: string, body: string, showToast: (message: string) => void) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    showToast(`${title}: ${body}`);
    return;
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.showNotification(title, { body }))
      .catch(() => new Notification(title, { body }));
  } else {
    new Notification(title, { body });
  }
}

/** No UI: mounted globally to poll for due schedule reminders while the app is open. */
export function ScheduleReminderChecker() {
  const { ready, events, markNotified } = useSchedule();
  const { showToast } = useToast();
  const { t, language } = useTranslation();

  useEffect(() => {
    if (!ready) return;

    const checkReminders = () => {
      const now = Date.now();
      for (const event of events) {
        if (event.notifiedAt) continue;
        const eventTime = new Date(event.dateTime).getTime();
        const reminderTime = eventTime - event.reminderMinutesBefore * 60000;
        if (now >= reminderTime && now < eventTime) {
          const body = `${event.title} · ${formatMeetingDateTime(event.dateTime, language)}`;
          notify(t("schedule.notifyTitle"), body, showToast);
          markNotified(event.id);
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [ready, events, markNotified, language, t, showToast]);

  return null;
}
