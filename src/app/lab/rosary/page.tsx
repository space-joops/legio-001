"use client";

import { PageShell } from "@/components/PageShell";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./page.module.css";
import { useState } from "react";

/**
 * 묵주기도 안내를 통째로 한 화면에서 보는 실험실 페이지(`/lab/rosary`).
 * 하단 탭에는 없고, 안내 화면만 따로 열어 보고 싶을 때 쓰는 통로다.
 */
export default function RosaryPage() {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);

  return (
    <PageShell title={t("lab.digitalRosary")}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.beadContainer}
          onClick={() => setCount(c => c + 1)}
          aria-label={`${t("lab.digitalRosary")} — ${t("lab.tapToAdd")}`}
        >
          <span className={styles.bead} aria-hidden="true">{count}</span>
        </button>
        <span className="visuallyHidden" role="status">{count}</span>
        <button type="button" className={styles.resetButton} onClick={() => setCount(0)}>
          {t("lab.reset")}
        </button>
      </div>
    </PageShell>
  );
}
