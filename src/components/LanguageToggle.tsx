"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./LanguageToggle.module.css";

/** 설정 화면의 한국어 / English 전환 버튼. */

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className={styles.group} role="group" aria-label={t("settings.languageLabel")}>
      <button
        type="button"
        className={`${styles.option} ${language === "ko" ? styles.active : ""}`}
        onClick={() => setLanguage("ko")}
        aria-pressed={language === "ko"}
      >
        {t("settings.languageKo")}
      </button>
      <button
        type="button"
        className={`${styles.option} ${language === "en" ? styles.active : ""}`}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        {t("settings.languageEn")}
      </button>
    </div>
  );
}
