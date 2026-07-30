"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import type { PrayerTextEntry } from "@/lib/prayerTexts";
import styles from "./PrayerTextDialog.module.css";

interface PrayerTextDialogProps {
  title: string;
  entry: PrayerTextEntry | null;
  count: number;
  onIncrement: () => void;
  onClose: () => void;
}

export function PrayerTextDialog({
  title,
  entry,
  count,
  onIncrement,
  onClose,
}: PrayerTextDialogProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const open = Boolean(entry);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {entry && (
        <div className={styles.screen}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.content}>
            {entry.sections.map((section, i) => (
              <div key={i} className={styles.section}>
                {section.heading && (
                  <span className={styles.sectionHeading}>{section.heading}</span>
                )}
                {section.lines.map((line, j) => (
                  <p key={j} className={styles.line}>
                    {line}
                  </p>
                ))}
              </div>
            ))}
            {entry.note && <p className={styles.note}>{entry.note}</p>}
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.incrementButton}
              onClick={onIncrement}
              aria-label={`${title} ${t("counters.tapToRecord")}`}
            >
              <span className={styles.incrementCount}>{count}</span>
              <span className={styles.incrementHint}>{t("counters.tapToRecord")}</span>
            </button>
            <button type="button" className={styles.closeButton} onClick={onClose}>
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
