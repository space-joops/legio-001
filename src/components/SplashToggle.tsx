"use client";

import { useDisplayPreferences } from "./DisplayPreferencesProvider";
import styles from "./SplashToggle.module.css";

/** 설정 화면의 성화 스플래시 켜기/끄기. 끄는 방법은 여기 하나뿐이다. */

const OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: "보기" },
  { value: false, label: "보지 않기" },
];

export function SplashToggle() {
  const { splashEnabled, setSplashEnabled } = useDisplayPreferences();

  return (
    <div className={styles.group} role="group" aria-label="시작 화면 성화">
      {OPTIONS.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={`${styles.option} ${splashEnabled === option.value ? styles.active : ""}`}
          onClick={() => setSplashEnabled(option.value)}
          aria-pressed={splashEnabled === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
