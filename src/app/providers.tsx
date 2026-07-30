"use client";

import type { ReactNode } from "react";
import { DisplayPreferencesProvider } from "@/components/DisplayPreferencesProvider";
import { InAppBrowserNotice } from "@/components/InAppBrowserNotice";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ScheduleReminderChecker } from "@/components/ScheduleReminderChecker";
import { ToastProvider } from "@/components/ToastProvider";
import { UpdateAvailableNotice } from "@/components/UpdateAvailableNotice";
import { LanguageProvider } from "@/i18n/LanguageContext";
import styles from "./providers.module.css";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DisplayPreferencesProvider>
        <ToastProvider>
          <div className={styles.noticeStack}>
            <InAppBrowserNotice />
            <UpdateAvailableNotice />
          </div>
          <OnboardingGate>
            <ScheduleReminderChecker />
            {children}
          </OnboardingGate>
        </ToastProvider>
      </DisplayPreferencesProvider>
    </LanguageProvider>
  );
}
