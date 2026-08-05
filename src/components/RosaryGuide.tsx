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
  /** Beads filled toward the current rosary set (0 to 4). */
  progress?: number;
}

/**
 * Walks the whole rosary one prayer per screen — the day's mysteries, the ten
 * Hail Marys of each decade, the lot. Which set is prayed depends on the
 * weekday, so the day is read on the client: a static export has no "today" at
 * build time.
 */
export function RosaryGuide({ onRecordSet, progress = 0 }: RosaryGuideProps) {
  const { t, language } = useTranslation();
  const [mysteryId, setMysteryId] = useState<MysteryId | null>(null);
  const [index, setIndex] = useState(0);
  const [asking, setAsking] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [showMeditation, setShowMeditation] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showMeditation && !dialog.open) {
      dialog.showModal();
    } else if (!showMeditation && dialog.open) {
      dialog.close();
    }
  }, [showMeditation]);

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



  const initRef = useRef(false);
  useEffect(() => {
    if (steps.length > 0 && progress > 0 && !initRef.current) {
      const targetDecade = progress + 1;
      const targetIndex = steps.findIndex(s => s.decade === targetDecade);
      if (targetIndex !== -1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIndex(targetIndex);
      }
      initRef.current = true;
    }
  }, [steps, progress]);


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
    setSlideDirection("right");
    setIndex(index + 1);
  };

  const handleConfirm = () => {
    onRecordSet();
    setAsking(false);
    setRecorded(true);
    setIndex(0);
  };

  const handlePrev = () => {
    if (index > 0) {
      setSlideDirection("left");
      setIndex(index - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
    if (contentRef.current) {
      contentRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
    if (touchStart.current && contentRef.current && !asking) {
      const distanceX = touchStart.current.x - touchEnd.current.x;
      const distanceY = Math.abs(touchStart.current.y - touchEnd.current.y);
      if (Math.abs(distanceX) > distanceY) {
        contentRef.current.style.transform = `translateX(${-distanceX}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (contentRef.current) {
      contentRef.current.style.transition = "transform 0.3s ease";
      contentRef.current.style.transform = "translateX(0)";
    }

    if (!touchStart.current || !touchEnd.current) return;
    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;

    if (Math.abs(distanceX) <= Math.abs(distanceY)) return;

    if (!asking) {
      if (distanceX > 50) {
        handleNext();
      } else if (distanceX < -50 && index > 0) {
        handlePrev();
      }
    }
  };

  const context = [mysteryHeading, step.decade ? t("rosary.decade").replace("{n}", String(step.decade)) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      ref={rootRef}
      className={styles.guide}
      aria-label={t("rosary.guideLabel")}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={contentRef}
        key={index}
        className={`${styles.contentWrapper} ${slideDirection === "right" ? styles.slideInRight : styles.slideInLeft}`}
      >
        <div className={styles.stickyHead}>
          <p className={styles.context}>{context}</p>
          {/* Remounting on index change restarts the blink — the point is to show
              that the prayer moved, so it has to replay on every step. */}
          <p key={index} className={styles.heading}>
            {step.title}
            {step.ordinal && <span className={styles.ordinal}>{step.ordinal}</span>}
          </p>
        </div>


        {step.image && (
          <div className={styles.imageWrapper}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.image}
              alt={step.title}
              className={`${styles.mysteryImage} ${step.meditations ? styles.clickableImage : ""}`}
              onClick={() => {
                if (step.meditations) setShowMeditation(true);
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

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
            <div className={styles.bottomNav}>
              <button
                type="button"
                className={styles.bottomNavButton}
                onClick={handlePrev}
                disabled={index === 0}
                aria-label={t("rosary.previous")}
                title={t("rosary.previous")}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <polygon points="15,4 5,12 15,20"></polygon>
                </svg>
              </button>

              <p className={styles.position}>
                {t("rosary.position")
                  .replace("{current}", String(index + 1))
                  .replace("{total}", String(steps.length))}
              </p>

              <button
                type="button"
                className={styles.bottomNavButton}
                onClick={handleNext}
                aria-label={t("rosary.next")}
                title={t("rosary.next")}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <polygon points="9,4 19,12 9,20"></polygon>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
      {step.meditations && (
        <dialog
          ref={dialogRef}
          className={styles.meditationDialog}
          onCancel={(e) => {
            e.preventDefault();
            setShowMeditation(false);
          }}
          onClick={(e) => {
            // Close when clicking outside the dialog content
            if (e.target === dialogRef.current) {
              setShowMeditation(false);
            }
          }}
        >
          <div className={styles.meditationDialogContent}>
            <div className={styles.meditationDialogHeader}>
              <h3>{step.title}</h3>
              <button
                type="button"
                className={styles.meditationDialogClose}
                onClick={() => setShowMeditation(false)}
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>
            <div className={styles.meditationDialogBody}>
              {step.meditations.map((line, i) => {
                const isLast = i === step.meditations!.length - 1;
                return (
                  <p key={i} className={isLast ? styles.meditationDialogFooter : styles.meditationDialogLine}>
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}
