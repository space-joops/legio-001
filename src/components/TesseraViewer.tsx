"use client";

import { useCurrentReport } from "@/hooks/useCurrentReport";
import { useTranslation } from "@/i18n/useTranslation";
import { PRAYER_TEXTS } from "@/lib/prayerTexts";
import styles from "./TesseraViewer.module.css";

export function TesseraViewer() {
  const { t, language } = useTranslation();
  const { report, incrementCount } = useCurrentReport();

  const handleRecordCatena = () => {
    incrementCount("catena", 1);
  };

  const catenaText = PRAYER_TEXTS.catena?.[language];

  return (
    <div className={styles.container}>
      <p className={styles.notice}>
        ※ 레지오 마리애 행동단원은 매일 까떼나를 바쳐야 하며, 협조단원은 뗏세라 전체를 바쳐야 합니다.
      </p>

      {catenaText && (
        <section className={styles.section}>
          <h2 className={styles.title}>{catenaText.sections[0]?.heading}</h2>
          <div className={styles.prayerText}>
            {catenaText.sections[0]?.lines.map((line, idx) => (
              <p key={idx} className={styles.line}>
                {line}
              </p>
            ))}
          </div>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleRecordCatena}
            disabled={!report}
          >
            {t("counters.catena")} {t("counters.tapToRecord")} (+1)
          </button>
        </section>
      )}
    </div>
  );
}
