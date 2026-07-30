"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./CounterButton.module.css";

interface CounterButtonProps {
  label: string;
  unitLabel?: string;
  icon: ReactNode;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetValue: (value: number) => void;
}

export function CounterButton({
  label,
  unitLabel,
  icon,
  count,
  onIncrement,
  onDecrement,
  onSetValue,
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

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.headerIcon}>{icon}</span>
        <span>{label}</span>
        {unitLabel && <span className={styles.unit}>({unitLabel})</span>}
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
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.minusButton}
              onClick={onDecrement}
              disabled={count <= 0}
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
