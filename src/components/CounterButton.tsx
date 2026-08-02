"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { selectOnFocus } from "@/lib/selectOnFocus";
import styles from "./CounterButton.module.css";

interface CounterButtonProps {
  label: string;
  unitLabel?: string;
  icon: ReactNode;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetValue: (value: number) => void;
  onShowText?: () => void;
  /** When set, taps fill a row of this many beads instead of moving the count. */
  setSize?: number;
  /** Beads already filled toward the current set (0 to setSize-1). */
  setProgress?: number;
}

export function CounterButton({
  label,
  unitLabel,
  icon,
  count,
  onIncrement,
  onDecrement,
  onSetValue,
  onShowText,
  setSize,
  setProgress = 0,
}: CounterButtonProps) {
  const { t } = useTranslation();
  const [numericMode, setNumericMode] = useState(false);
  const [draft, setDraft] = useState(String(count));

  const openNumericMode = () => {
    setDraft(String(count));
    setNumericMode(true);
  };

  const applyDraft = () => {
    const parsed = Number.parseInt(draft, 10);
    onSetValue(Number.isFinite(parsed) ? parsed : 0);
    setNumericMode(false);
  };

  // Typed numbers used to be silently dropped unless 확인 was tapped — commit on
  // blur too, so tapping elsewhere keeps what was typed (empty input keeps the
  // previous count instead of zeroing it).
  const commitDraftOnBlur = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed)) onSetValue(Math.max(0, parsed));
  };

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.headerIcon}>{icon}</span>
        <span>{label}</span>
        {unitLabel && <span className={styles.unit}>({unitLabel})</span>}
        {onShowText && (
          <button type="button" className={styles.textLink} onClick={onShowText}>
            {t("counters.viewPrayerText")}
          </button>
        )}
      </div>

      {!numericMode ? (
        <>
          <button
            type="button"
            className={styles.tapArea}
            onClick={onIncrement}
            aria-label={`${label} ${t("counters.tapToRecord")}`}
          >
            <span className={styles.count}>{count}</span>
          </button>
          {setSize && (
            /* The bead count is spelled out as well as drawn: filled and empty
               beads differ only by fill, and shape alone isn't enough here. */
            <p className={styles.beads}>
              <span className={styles.beadRow} aria-hidden="true">
                {Array.from({ length: setSize }, (_, i) => (
                  <span
                    key={i}
                    className={i < setProgress ? styles.beadFilled : styles.bead}
                  />
                ))}
              </span>
              <span className={styles.beadCaption}>
                {t("counters.setProgress")
                  .replace("{done}", String(setProgress))
                  .replace("{total}", String(setSize))}
              </span>
            </p>
          )}
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.minusButton}
              onClick={onDecrement}
              disabled={count <= 0 && setProgress <= 0}
              aria-label={`${label} ${t("counters.minus")}`}
            >
              −
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={openNumericMode}
            >
              {t("counters.directInput")}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.numericRow}>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraftOnBlur}
              onFocus={selectOnFocus}
              aria-label={label}
              className={styles.numberInput}
            />
            <button
              type="button"
              className={styles.applyButton}
              onClick={applyDraft}
            >
              {t("counters.apply")}
            </button>
          </div>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => setNumericMode(false)}
          >
            {t("counters.counterView")}
          </button>
        </>
      )}
    </div>
  );
}
