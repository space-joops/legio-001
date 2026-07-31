"use client";

import { useDisplayPreferences } from "./DisplayPreferencesProvider";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./SplashToggle.module.css";

const OPTIONS: { value: boolean; labelKey: string }[] = [
  { value: true, labelKey: "settings.splashOn" },
  { value: false, labelKey: "settings.splashOff" },
];

export function SplashToggle() {
  const { splashEnabled, setSplashEnabled } = useDisplayPreferences();
  const { t } = useTranslation();

  return (
    <div className={styles.group} role="group" aria-label={t("settings.splashLabel")}>
      {OPTIONS.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={`${styles.option} ${splashEnabled === option.value ? styles.active : ""}`}
          onClick={() => setSplashEnabled(option.value)}
          aria-pressed={splashEnabled === option.value}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}
