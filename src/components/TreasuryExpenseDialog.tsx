"use client";

import { useEffect, useRef, useState } from "react";
import { selectableExpenseItems } from "@/lib/expenseItems";
import { generateId } from "@/lib/id";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { formatWon } from "@/lib/treasury";
import type { ExpenseItem, TreasuryExpense } from "@/lib/types";
import styles from "./TreasuryExpenseDialog.module.css";

/**
 * 한 회차의 지출을 항목별로 입력하는 창(회계용).
 *
 * 여기서 적은 지출들이 공식 양식의 "지출 합계"와 "중요 지출 내역" 줄을 함께
 * 만들어 낸다. 즉 같은 숫자를 두 번 적을 일이 없다(`lib/treasury.ts` 참고).
 */

/** Sentinel for the "type it myself" option, which no catalogue entry can use. */
const CUSTOM = "__custom__";

interface Props {
  open: boolean;
  sessionNumber: number;
  items: ExpenseItem[];
  expenses: TreasuryExpense[];
  onClose: () => void;
  onSave: (expenses: TreasuryExpense[]) => void;
}

interface DraftRow {
  id: string;
  /** A catalogue label, or CUSTOM while the treasurer is typing their own. */
  choice: string;
  customLabel: string;
  amount: number;
}

function toAmount(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  if (digits === "") return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * What one session was spent on. Kept as a list rather than a box per
 * catalogue item, because most weeks have none and a full grid of empty
 * amounts reads as work to do.
 */
export function TreasuryExpenseDialog({
  open,
  sessionNumber,
  items,
  expenses,
  onClose,
  onSave,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<DraftRow[]>([]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const options = selectableExpenseItems(items);

  useEffect(() => {
    if (!open) return;
    // Reseed from what is saved every time it opens, so cancelling really cancels.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dialog draft, not derived render state
    setRows(
      expenses.map((expense) => {
        const known = options.some((item) => item.label === expense.label);
        return {
          id: expense.id,
          choice: known ? expense.label : CUSTOM,
          customLabel: known ? "" : expense.label,
          amount: expense.amount,
        };
      })
    );
    // `options` is derived from `items` and would re-seed the draft on every
    // render, discarding edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expenses]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: generateId(), choice: options[0]?.label ?? CUSTOM, customLabel: "", amount: 0 },
    ]);
  };

  const patchRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleSave = () => {
    onSave(
      rows
        .map((row) => ({
          id: row.id,
          label: (row.choice === CUSTOM ? row.customLabel : row.choice).trim(),
          amount: row.amount,
        }))
        .filter((expense) => expense.label !== "" && expense.amount > 0)
    );
  };

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 className={styles.title}>지출 입력</h2>
      <p className={styles.subtitle}>
        {sessionNumber}
        {"회차"}
      </p>

      {rows.length === 0 ? (
        <p className={styles.empty}>이 회차에는 지출이 없습니다. 아래 [지출 추가]를 눌러 넣으세요.</p>
      ) : (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <li key={row.id} className={styles.row}>
              <select
                className={styles.select}
                value={row.choice}
                aria-label="지출 항목"
                onChange={(e) => patchRow(row.id, { choice: e.target.value })}
              >
                {options.map((item) => (
                  <option key={item.id} value={item.label}>
                    {item.label}
                  </option>
                ))}
                <option value={CUSTOM}>직접 입력…</option>
              </select>
              {row.choice === CUSTOM && (
                <input
                  type="text"
                  className={styles.customLabel}
                  value={row.customLabel}
                  placeholder="항목 이름"
                  aria-label="지출 항목"
                  onChange={(e) => patchRow(row.id, { customLabel: e.target.value })}
                />
              )}
              <input
                type="text"
                inputMode="numeric"
                className={styles.amount}
                value={row.amount === 0 ? "" : formatWon(row.amount)}
                placeholder="0"
                aria-label="금액"
                onFocus={selectOnFocus}
                onChange={(e) => patchRow(row.id, { amount: toAmount(e.target.value) })}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.total}>
        {"지출"} {formatWon(total)}
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={addRow}>
          지출 추가
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleSave}>
          저장
        </button>
      </div>
    </dialog>
  );
}
