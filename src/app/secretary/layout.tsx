import type { ReactNode } from "react";
import { SecretaryModeBanner } from "@/components/SecretaryModeBanner";
import styles from "./layout.module.css";

/**
 * `/secretary/*` 아래 모든 화면을 감싸는 서기 전용 껍데기.
 *
 * 여기서 두 가지를 한다.
 *   1. 색을 오렌지 계열로 바꾼다(개인용 화면과 헷갈리지 않도록)
 *   2. 하단 탭을 서기용으로 갈아 끼운다(`data-secretary="true"` 표시로)
 */
export default function SecretaryLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.themed}>
      <SecretaryModeBanner />
      {children}
    </div>
  );
}
