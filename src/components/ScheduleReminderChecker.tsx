"use client";

import { useEffect } from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { useTranslation } from "@/i18n/useTranslation";
import { formatMeetingDateTime } from "@/lib/reportUtils";
import { useToast } from "./ToastProvider";

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
