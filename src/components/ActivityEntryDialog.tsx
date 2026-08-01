"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { selectableActivityItems } from "@/lib/activityItems";
import { generateId } from "@/lib/id";
import { selectOnFocus } from "@/lib/selectOnFocus";
import type { ActivityEntry, ActivityItem } from "@/lib/types";
import styles from "./ActivityEntryDialog.module.css";

interface Props {
  open: boolean;
  personLabel: string;
  sessionNumber: number;
  items: ActivityItem[];
  /** Entries already recorded for this person and session. */
  entries: ActivityEntry[];
  onClose: () => void;
  onSave: (entries: ActivityEntry[]) => void;
}

interface DraftRow {
  id: string;
  itemKey: string;
  count: number;
  note: string;
}

function toNumber(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * Records what one member did in one session. Kept as a list rather than one
 * row per catalogue item so a month with two activities doesn't present a dozen
 * empty boxes.
 */
export function ActivityEntryDialog({
  open,
  personLabel,
  sessionNumber,
  items,
  entries,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<DraftRow[]>([]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Seed from the saved entries every time it opens, so cancelling really cancels.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dialog draft, not derived render state
    setRows(
      entries.map((e) => ({ id: e.id, itemKey: e.itemKey, count: e.count, note: e.note }))
    );
  }, [open, entries]);

  const options = selectableActivityItems(items);

  const addRow = () => {
    const first = options[0];
    if (!first) return;
    setRows((prev) => [...prev, { id: generateId(), itemKey: first.key, count: 1, note: "" }]);
  };

  const patchRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleSave = () => {
    onSave(
      rows
        .filter((r) => r.count > 0)
        .map((r) => ({
          id: r.id,
          personId: "",
          sessionNumber,
          itemKey: r.itemKey,
          count: r.count,
          note: r.note,
        }))
    );
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 className={styles.title}>{t("secretaryReport.activityDialogTitle")}</h2>
      <p className={styles.subtitle}>
        {personLabel} · {sessionNumber}
        {t("week.sessionNumberUnit")}
      </p>

      {rows.length === 0 ? (
        <p className={styles.empty}>{t("secretaryReport.activityDialogEmpty")}</p>
      ) : (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <li key={row.id} className={styles.row}>
              <select
                className={styles.select}
                value={row.itemKey}
                aria-label={t("secretaryReport.activityItemLabel")}
                onChange={(e) => patchRow(row.id, { itemKey: e.target.value })}
              >
                {options.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="numeric"
                className={styles.count}
                value={row.count}
                onFocus={selectOnFocus}
                aria-label={t("secretaryReport.activityCountLabel")}
                onChange={(e) => patchRow(row.id, { count: toNumber(e.target.value) })}
              />
              <input
                type="text"
                className={styles.note}
                value={row.note}
                placeholder={t("secretaryReport.activityNotePlaceholder")}
                aria-label={t("secretaryReport.activityNoteLabel")}
                onChange={(e) => patchRow(row.id, { note: e.target.value })}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
              >
                {t("common.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.hint}>{t("secretaryReport.activityNoteHint")}</p>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={addRow}>
          {t("secretaryReport.activityAddRow")}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onClose}>
          {t("common.cancel")}
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleSave}>
          {t("common.save")}
        </button>
      </div>
    </dialog>
  );
}
