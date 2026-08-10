"use client";

import Link from "next/link";
import styles from "./SecretaryModeBanner.module.css";

/**
 * 서기 화면 위에 붙는 "지금 서기 모드입니다" 띠.
 *
 * 개인용 화면과 서기용 화면이 비슷하게 생겨서, 어느 쪽에 있는지 헷갈린다는
 * 피드백에 따라 추가했다. 일반 설정으로 돌아가는 링크도 여기 있다.
 */

/** Slim bar atop every /secretary/* page: names the mode (the sudden amber
    theme otherwise goes unexplained) and restores the door people came in
    through — the general Settings tab disappears from the bottom nav here. */
export function SecretaryModeBanner() {
  return (
    <div className={styles.banner} data-app-chrome>
      <span className={styles.label}>서기 전용 화면입니다</span>
      <Link href="/settings" className={styles.exitLink}>
        일반 설정으로
      </Link>
    </div>
  );
}
