"use client";

import type { ReactNode } from "react";
import { DisplayPreferencesProvider } from "@/components/DisplayPreferencesProvider";
import { InAppBrowserNotice } from "@/components/InAppBrowserNotice";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ScheduleReminderChecker } from "@/components/ScheduleReminderChecker";
import { SplashOverlay } from "@/components/SplashOverlay";
import { StorageBootstrap } from "@/components/StorageBootstrap";
import { StorageFailureNotice } from "@/components/StorageFailureNotice";
import { ToastProvider } from "@/components/ToastProvider";
import { UpdateAvailableNotice } from "@/components/UpdateAvailableNotice";
import { LanguageProvider } from "@/i18n/LanguageContext";
import styles from "./providers.module.css";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DisplayPreferencesProvider>
        <ToastProvider>
          <StorageBootstrap />
          <StorageFailureNotice />
          <div className={styles.noticeStack} data-app-chrome>
            <InAppBrowserNotice />
            <UpdateAvailableNotice />
          </div>
          {/* Sibling of OnboardingGate, not a child: the gate renders nothing
              until hydrated, so the splash must sit outside it to also cover
              the onboarding screen. */}
          <SplashOverlay />
          <OnboardingGate>
            <ScheduleReminderChecker />
            {children}
          </OnboardingGate>
        </ToastProvider>
      </DisplayPreferencesProvider>
    </LanguageProvider>
  );
}
