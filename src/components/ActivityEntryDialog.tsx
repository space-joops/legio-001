"use client";

import { useEffect, useRef, useState } from "react";
import { createActivityItem, selectableItemsForForm } from "@/lib/activityItems";
import { generateId } from "@/lib/id";
import { form2026GroupLabel } from "@/lib/reportForm2026";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { storage } from "@/lib/storage";
import type { ActivityEntry, ActivityItem, ReportFormVersion } from "@/lib/types";
import styles from "./ActivityEntryDialog.module.css";

/**
 * 단원 한 명이 한 회차에 한 활동들을 여러 줄로 입력하는 창(서기용).
 *
 * 이전 양식 보고서에서는 목록에 없는 활동을 직접 적을 수 있고, 그 자리에서 활동
 * 목록에 새 항목을 추가할 수도 있다(월례 보고 도중 목록 관리 화면까지 다녀오지
 * 않아도 되도록).
 *
 * 2026 양식 보고서는 양식의 고정 칸만 고를 수 있다. 칸이 없는 이름을 새로 만들면
 * 인쇄물 어디에도 찍히지 않기 때문이다. 양식 묶음별로 <optgroup> 을 나눠 보여 준다.
 */

/** Sentinel for the "type it myself" option, which no catalogue key can use. */
const CUSTOM = "__custom__";

interface Props {
  open: boolean;
  personLabel: string;
  sessionNumber: number;
  items: ActivityItem[];
  /** 보고서의 양식. 고를 수 있는 항목이 달라진다. */
  formVersion: ReportFormVersion | undefined;
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
  formVersion,
  entries,
  onClose,
  onSave,
  onItemsChange,
}: Props) {
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
      entries.map((e) => ({
        id: e.id,
        itemKey: e.itemKey,
        customLabel: "",
        count: e.count,
        note: e.note,
      }))
    );
  }, [open, entries]);

  const isForm2026 = formVersion === "2026-cu";
  const options = selectableItemsForForm(items, formVersion);

  /** "본당 사목자 지시사항" 같은 묶음 제목별로 나눈다(2026 양식만). */
  const groupedOptions: { label: string; items: ActivityItem[] }[] = [];
  if (isForm2026) {
    for (const item of options) {
      const label = form2026GroupLabel(item.key) ?? "";
      const group = groupedOptions.find((g) => g.label === label);
      if (group) group.items.push(item);
      else groupedOptions.push({ label, items: [item] });
    }
  }

  /** 이미 기록된 항목이 지금 목록에 없을 때(숨김·다른 양식) 선택값이 엉뚱하게 보이지 않도록. */
  const missingOption = (key: string) =>
    key === CUSTOM || options.some((item) => item.key === key)
      ? null
      : items.find((item) => item.key === key) ?? { key, label: key };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: generateId(),
        itemKey: options[0]?.key ?? (isForm2026 ? "" : CUSTOM),
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
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className={styles.screen}>
        <div className={styles.header}>
          <h2 className={styles.title}>활동 입력</h2>
          <p className={styles.subtitle}>
            {personLabel} · {sessionNumber}
            {"회차"}
          </p>
        </div>

        <div className={styles.content}>
          {rows.length === 0 ? (
            <p className={styles.empty}>입력된 활동이 없습니다. 아래 [항목 추가]를 눌러 주세요.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>활동 항목</th>
                    <th className={styles.countColumn}>
                      횟수
                    </th>
                    <th>내용</th>
                    <th>
                      <span className={styles.srOnly}>삭제</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td data-label="활동 항목">
                        <select
                          className={styles.select}
                          value={row.itemKey}
                          aria-label="활동 항목"
                          onChange={(e) => patchRow(row.id, { itemKey: e.target.value })}
                        >
                          {(() => {
                            const missing = missingOption(row.itemKey);
                            return missing ? (
                              <option value={missing.key}>{missing.label}</option>
                            ) : null;
                          })()}
                          {isForm2026
                            ? groupedOptions.map((group) => (
                                <optgroup key={group.label} label={group.label}>
                                  {group.items.map((item) => (
                                    <option key={item.key} value={item.key}>
                                      {item.label}
                                    </option>
                                  ))}
                                </optgroup>
                              ))
                            : options.map((item) => (
                                <option key={item.key} value={item.key}>
                                  {item.label}
                                </option>
                              ))}
                          {!isForm2026 && <option value={CUSTOM}>직접 입력…</option>}
                        </select>
                        {row.itemKey === CUSTOM && (
                          <input
                            type="text"
                            className={styles.customLabel}
                            value={row.customLabel}
                            placeholder="새 활동 이름"
                            aria-label="새 활동 이름"
                            onChange={(e) => patchRow(row.id, { customLabel: e.target.value })}
                          />
                        )}
                      </td>
                      <td data-label="횟수">
                        <input
                          type="number"
                          inputMode="numeric"
                          className={styles.count}
                          value={row.count}
                          onFocus={selectOnFocus}
                          aria-label="횟수"
                          onChange={(e) => patchRow(row.id, { count: toNumber(e.target.value) })}
                        />
                      </td>
                      <td data-label="내용">
                        <input
                          type="text"
                          className={styles.note}
                          value={row.note}
                          placeholder="예: 김요한 형제 상가"
                          aria-label="내용"
                          onChange={(e) => patchRow(row.id, { note: e.target.value })}
                        />
                      </td>
                      <td className={styles.removeCell}>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button type="button" className={styles.addButton} onClick={addRow}>
            항목 추가
          </button>
          <p className={styles.hint}>내용은 앱에서만 참고용으로 보이고 보고서에는 나오지 않습니다.</p>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            취소
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </dialog>
  );
}
