"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { createActivityItem, selectableActivityItems } from "@/lib/activityItems";
import { generateId } from "@/lib/id";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { storage } from "@/lib/storage";
import type { ActivityEntry, ActivityItem } from "@/lib/types";
import styles from "./ActivityEntryDialog.module.css";

/**
 * 단원 한 명이 한 회차에 한 활동들을 여러 줄로 입력하는 창(서기용).
 *
 * 목록에 없는 활동은 직접 적을 수 있고, 그 자리에서 활동 목록에 새 항목을
 * 추가할 수도 있다(월례 보고 도중 목록 관리 화면까지 다녀오지 않아도 되도록).
 */

/** Sentinel for the "type it myself" option, which no catalogue key can use. */
const CUSTOM = "__custom__";

interface Props {
  open: boolean;
  personLabel: string;
  sessionNumber: number;
  items: ActivityItem[];
  /** Entries already recorded for this person and session. */
  entries: ActivityEntry[];
  onClose: () => void;
  onSave: (entries: ActivityEntry[]) => void;
  /** Called when a row created a brand-new catalogue item. */
  onItemsChange: (items: ActivityItem[]) => void;
}

interface DraftRow {
  id: string;
  /** A catalogue key, or CUSTOM while a new item's name is being typed. */
  itemKey: string;
  customLabel: string;
  count: number;
  note: string;
}

function toNumber(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * Records what one member did in one session. Full screen with a row per
 * activity — a month often has several, and the old centred box showed about
 * two before it had to scroll.
 */
export function ActivityEntryDialog({
  open,
  personLabel,
  sessionNumber,
  items,
  entries,
  onClose,
  onSave,
  onItemsChange,
}: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
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
      entries.map((e) => ({
        id: e.id,
        itemKey: e.itemKey,
        customLabel: "",
        count: e.count,
        note: e.note,
      }))
    );
  }, [open, entries]);

  const options = selectableActivityItems(items);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: generateId(),
        itemKey: options[0]?.key ?? CUSTOM,
        customLabel: "",
        count: 1,
        note: "",
      },
    ]);
  };

  const patchRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleSave = () => {
    // Activities are tallied by catalogue key, so a name typed here has to
    // become a real item before an entry can point at it. New items go to the
    // Pr.활동사항 line; Pr.활동사항 관리 moves them if that is wrong.
    let catalogue = items;
    const resolved = rows.map((row) => {
      if (row.itemKey !== CUSTOM) return { ...row, resolvedKey: row.itemKey };
      const label = row.customLabel.trim();
      if (!label) return { ...row, resolvedKey: "" };
      const existing = catalogue.find((item) => item.label === label);
      if (existing) return { ...row, resolvedKey: existing.key };
      const created = createActivityItem(label, "praesidium", catalogue.length);
      catalogue = [...catalogue, created];
      return { ...row, resolvedKey: created.key };
    });

    if (catalogue !== items) {
      storage.setActivityItems(catalogue);
      onItemsChange(catalogue);
    }

    onSave(
      resolved
        .filter((row) => row.count > 0 && row.resolvedKey !== "")
        .map((row) => ({
          id: row.id,
          personId: "",
          sessionNumber,
          itemKey: row.resolvedKey,
          count: row.count,
          note: row.note,
        }))
    );
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className={styles.screen}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{t("secretaryReport.activityDialogTitle")}</h2>
          <p className={styles.subtitle}>
            {personLabel} · {sessionNumber}
            {t("week.sessionNumberUnit")}
          </p>
        </div>

        <div className={styles.content}>
          {rows.length === 0 ? (
            <p className={styles.empty}>{t("secretaryReport.activityDialogEmpty")}</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("secretaryReport.activityItemLabel")}</th>
                    <th className={styles.countColumn}>
                      {t("secretaryReport.activityCountLabel")}
                    </th>
                    <th>{t("secretaryReport.activityNoteLabel")}</th>
                    <th>
                      <span className={styles.srOnly}>{t("common.delete")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td data-label={t("secretaryReport.activityItemLabel")}>
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
                          <option value={CUSTOM}>
                            {t("secretaryReport.activityCustomOption")}
                          </option>
                        </select>
                        {row.itemKey === CUSTOM && (
                          <input
                            type="text"
                            className={styles.customLabel}
                            value={row.customLabel}
                            placeholder={t("secretaryReport.activityCustomPlaceholder")}
                            aria-label={t("secretaryReport.activityCustomPlaceholder")}
                            onChange={(e) => patchRow(row.id, { customLabel: e.target.value })}
                          />
                        )}
                      </td>
                      <td data-label={t("secretaryReport.activityCountLabel")}>
                        <input
                          type="number"
                          inputMode="numeric"
                          className={styles.count}
                          value={row.count}
                          onFocus={selectOnFocus}
                          aria-label={t("secretaryReport.activityCountLabel")}
                          onChange={(e) => patchRow(row.id, { count: toNumber(e.target.value) })}
                        />
                      </td>
                      <td data-label={t("secretaryReport.activityNoteLabel")}>
                        <input
                          type="text"
                          className={styles.note}
                          value={row.note}
                          placeholder={t("secretaryReport.activityNotePlaceholder")}
                          aria-label={t("secretaryReport.activityNoteLabel")}
                          onChange={(e) => patchRow(row.id, { note: e.target.value })}
                        />
                      </td>
                      <td className={styles.removeCell}>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                        >
                          {t("common.delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button type="button" className={styles.addButton} onClick={addRow}>
            {t("secretaryReport.activityAddRow")}
          </button>
          <p className={styles.hint}>{t("secretaryReport.activityNoteHint")}</p>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleSave}>
            {t("common.save")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
