"use client";

import { useDisplayPreferences } from "./DisplayPreferencesProvider";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./ThemeToggle.module.css";
import type { Theme } from "@/lib/types";

export function ThemeToggle() {
  const { theme, setTheme } = useDisplayPreferences();
  const { t } = useTranslation();

  const themes: { value: Theme; labelKey: string }[] = [
    { value: "classic", labelKey: "settings.themeClassic" },
    { value: "modern-dark", labelKey: "settings.themeModernDark" },
    { value: "glassmorphism", labelKey: "settings.themeGlassmorphism" },
    { value: "monochrome", labelKey: "settings.themeMonochrome" },
  ];

  return (
    <div className={styles.group} role="group" aria-label={t("settings.themeLabel")}>
      {themes.map(({ value, labelKey }) => (
        <button
          key={value}
          type="button"
          className={`${styles.option} ${theme === value ? styles.active : ""}`}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
        >
          {t(labelKey as any)}
        </button>
      ))}
    </div>
  );
}
