"use client";

import { useDisplayPreferences } from "./DisplayPreferencesProvider";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./FontFamilyToggle.module.css";

/**
 * 설정 화면의 글꼴 선택(기기 기본 / 나눔고딕).
 * 기본값이 기기 글꼴인 이유는 나눔고딕을 받는 데 용량이 크기 때문이다(`app/layout.tsx` 참고).
 */

export function FontFamilyToggle() {
  const { fontFamily, setFontFamily } = useDisplayPreferences();
  const { t } = useTranslation();

  return (
    <div className={styles.group} role="group" aria-label={t("settings.fontFamilyLabel")}>
      <button
        type="button"
        className={`${styles.option} ${fontFamily === "system" ? styles.active : ""}`}
        onClick={() => setFontFamily("system")}
        aria-pressed={fontFamily === "system"}
      >
        {t("settings.fontFamilySystem")}
      </button>
      <button
        type="button"
        className={`${styles.option} ${fontFamily === "nanum" ? styles.active : ""}`}
        onClick={() => setFontFamily("nanum")}
        aria-pressed={fontFamily === "nanum"}
      >
        {t("settings.fontFamilyNanum")}
      </button>

      <button
        type="button"
        className={`${styles.option} ${fontFamily === "catholic" ? styles.active : ""}`}
        onClick={() => setFontFamily("catholic")}
        aria-pressed={fontFamily === "catholic"}
      >
        {t("settings.fontFamilyCatholic")}
      </button>
    </div>
  );
}
