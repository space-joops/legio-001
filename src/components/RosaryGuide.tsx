"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { ROSARY_SET_SIZE } from "@/lib/constants";
import { getMysteryIdForDate, getMysterySection, type MysteryId } from "@/lib/rosaryMysteries";
import styles from "./RosaryGuide.module.css";

interface RosaryGuideProps {
  /** Adds a whole 5단 set to the counter. */
  onRecordSet: () => void;
}

/**
 * Walks today's mystery one decade at a time. Which set is prayed depends on the
 * weekday, so the day is read on the client — a static export has no "today" at
 * build time.
 */
export function RosaryGuide({ onRecordSet }: RosaryGuideProps) {
  const { t, language } = useTranslation();
  const [mysteryId, setMysteryId] = useState<MysteryId | null>(null);
  const [index, setIndex] = useState(0);
  const [asking, setAsking] = useState(false);
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- today's date is unavailable at render time on a static export
    setMysteryId(getMysteryIdForDate(new Date()));
  }, []);

  if (!mysteryId) return null;

  const section = getMysterySection(mysteryId, language);
  const lines = section.lines;
  const isLast = index >= lines.length - 1;

  const handleNext = () => {
    if (isLast) {
      setAsking(true);
      return;
    }
    setIndex(index + 1);
  };

  const handleConfirm = () => {
    onRecordSet();
    setAsking(false);
    setRecorded(true);
    setIndex(0);
  };

  return (
    <section className={styles.guide} aria-label={t("rosary.guideLabel")}>
      <p className={styles.mystery}>{section.heading}</p>

      {/* Remounting on index change restarts the blink — the point is to show
          that the decade moved, so it has to replay every step. */}
      <p key={index} className={styles.decade}>
        {lines[index]}
      </p>

      <p className={styles.position}>
        {t("rosary.position")
          .replace("{current}", String(index + 1))
          .replace("{total}", String(lines.length))}
      </p>

      {asking ? (
        /* Inline rather than a nested <dialog>: stacking two top-layer modals is
           more fragile than another step in the one already open. */
        <div className={styles.confirm}>
          <p className={styles.confirmText}>
            {t("rosary.recordQuestion").replace("{count}", String(ROSARY_SET_SIZE))}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setAsking(false)}
            >
              {t("common.cancel")}
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleConfirm}>
              {t("rosary.record")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {recorded && <p className={styles.recorded}>{t("rosary.recorded")}</p>}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setIndex(index - 1)}
              disabled={index === 0}
            >
              {t("rosary.previous")}
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleNext}>
              {isLast ? t("rosary.finish") : t("rosary.next")}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
