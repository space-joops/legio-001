"use client";

import { PageShell } from "@/components/PageShell";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./page.module.css";
import { useState } from "react";

/**
 * 실험실의 "디지털 묵주"(`/lab/rosary`) — 누르면 숫자가 오르는 단순 카운터.
 *
 * **묵주기도 안내 화면(`RosaryGuide`)과는 아무 상관이 없다.** 여기서 센 숫자는
 * 어디에도 저장되지 않고 주간 보고에도 반영되지 않는다. 화면을 벗어나면 사라진다.
 * 손에 쥔 묵주 대신 화면을 두드려 세어 보는 실험용 화면일 뿐이다.
 *
 * 하단 탭에는 없다. 들어오는 길은 **설정 → 실험실 펼치기 → [디지털 묵주]** 하나뿐이다.
 *
 * 진짜 묵주기도 안내를 찾는다면: 홈 → 묵주기도 카드 → [기도문 보기]
 * (`src/components/RosaryGuide.tsx`, `docs/rosary/` 참고)
 */
export default function RosaryPage() {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);

  return (
    <PageShell title={t("lab.digitalRosary")}>
      <div className={styles.container}>
        <div className={styles.beadContainer} onClick={() => setCount(c => c + 1)}>
          <div className={styles.bead}>{count}</div>
        </div>
        <button className={styles.resetButton} onClick={() => setCount(0)}>
          {t("common.cancel")}
        </button>
      </div>
    </PageShell>
  );
}
