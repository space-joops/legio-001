"use client";

import { PageShell } from "@/components/PageShell";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./page.module.css";
import { useState } from "react";

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
