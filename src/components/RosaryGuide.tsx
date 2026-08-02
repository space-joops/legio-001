"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { ROSARY_SET_SIZE } from "@/lib/constants";
import {
  buildRosarySteps,
  getMysteryIdForDate,
  getMysterySection,
  type MysteryId,
} from "@/lib/rosaryMysteries";
import styles from "./RosaryGuide.module.css";

interface RosaryGuideProps {
  /** Adds a whole 5단 set to the counter. */
  onRecordSet: () => void;
}

/**
 * Walks the whole rosary one prayer per screen — the day's mysteries, the ten
 * Hail Marys of each decade, the lot. Which set is prayed depends on the
 * weekday, so the day is read on the client: a static export has no "today" at
 * build time.
 */
export function RosaryGuide({ onRecordSet }: RosaryGuideProps) {
  const { t, language } = useTranslation();
  const [mysteryId, setMysteryId] = useState<MysteryId | null>(null);
  const [index, setIndex] = useState(0);
  const [asking, setAsking] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- today's date is unavailable at render time on a static export
    setMysteryId(getMysteryIdForDate(new Date()));
  }, []);

  const steps = useMemo(
    () =>
      mysteryId
        ? buildRosarySteps(mysteryId, language, {
            creed: t("rosary.creed"),
            ourFather: t("rosary.ourFather"),
            hailMary: t("rosary.hailMary"),
            gloryBe: t("rosary.gloryBe"),
            salvation: t("rosary.salvation"),
            closing: t("rosary.closing"),
          })
        : [],
    // `t` is recreated each render; the language is what actually changes the text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mysteryId, language]
  );

  // Put the title back at the top of the screen on every move — the point of a
  // walk-through is that you never have to hunt for where you are. Scrolling
  // our own root keeps the dialog's scroll container out of this component's
  // props (and out of the render pass).
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "start" });
  }, [index]);

  if (!mysteryId || steps.length === 0) return null;

  const step = steps[index];
  const isLast = index >= steps.length - 1;
  const mysteryHeading = getMysterySection(mysteryId, language).heading;

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

  const context = [mysteryHeading, step.decade ? t("rosary.decade").replace("{n}", String(step.decade)) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <section ref={rootRef} className={styles.guide} aria-label={t("rosary.guideLabel")}>
      <div className={styles.stickyHead}>
        <p className={styles.context}>{context}</p>
        {/* Remounting on index change restarts the blink — the point is to show
            that the prayer moved, so it has to replay on every step. */}
        <p key={index} className={styles.heading}>
          {step.title}
          {step.ordinal && <span className={styles.ordinal}>{step.ordinal}</span>}
        </p>
      </div>

      {step.lines.length > 0 && (
        <div className={styles.body}>
          {step.lines.map((line, i) => (
            <p key={i} className={styles.line}>
              {line}
            </p>
          ))}
        </div>
      )}

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
              <span aria-hidden="true">←</span> {t("rosary.previous")}
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleNext}>
              {isLast ? t("rosary.finish") : t("rosary.next")}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className={styles.position}>
            {t("rosary.position")
              .replace("{current}", String(index + 1))
              .replace("{total}", String(steps.length))}
          </p>
        </>
      )}
    </section>
  );
}
