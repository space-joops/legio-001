"use client";

import { useDisplayPreferences } from "./DisplayPreferencesProvider";
import { useTranslation } from "@/i18n/useTranslation";
import type { FontScale } from "@/lib/types";
import styles from "./FontScaleToggle.module.css";

/**
 * 설정 화면의 글자 크기 선택(작게·보통·크게·아주 크게).
 * 사용자층에 어르신 비중이 높아, 이 앱에서 가장 많이 쓰이는 설정이다.
 */

const OPTIONS: { value: FontScale; label: string }[] = [
  { value: "small", label: "작게" },
  { value: "medium", label: "기본" },
  { value: "large", label: "크게" },
  { value: "xlarge", label: "아주 크게" },
];

export function FontScaleToggle() {
  const { fontScale, setFontScale } = useDisplayPreferences();
  const { t } = useTranslation();

  return (
    <div className={styles.group} role="group" aria-label={t("settings.fontSizeLabel")}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.option} ${fontScale === option.value ? styles.active : ""}`}
          onClick={() => setFontScale(option.value)}
          aria-pressed={fontScale === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
