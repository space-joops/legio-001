"use client";

import { useEffect, type ReactNode } from "react";
import { DisplayPreferencesProvider } from "@/components/DisplayPreferencesProvider";
import { InAppBrowserNotice } from "@/components/InAppBrowserNotice";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ToastProvider } from "@/components/ToastProvider";
import { LanguageProvider } from "@/i18n/LanguageContext";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // installability degrades gracefully without a service worker
      });
    }
  }, []);

  return (
    <LanguageProvider>
      <DisplayPreferencesProvider>
        <ToastProvider>
          <InAppBrowserNotice />
          <OnboardingGate>{children}</OnboardingGate>
        </ToastProvider>
      </DisplayPreferencesProvider>
    </LanguageProvider>
  );
}
