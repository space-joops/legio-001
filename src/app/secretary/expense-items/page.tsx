"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import {
  createDefaultExpenseItems,
  createExpenseItem,
  sortExpenseItems,
} from "@/lib/expenseItems";
import { storage } from "@/lib/storage";
import type { ExpenseItem } from "@/lib/types";
import styles from "./page.module.css";

/**
 * 지출 항목 목록을 편집하는 화면(`/secretary/expense-items`).
 *
 * 활동 항목과 달리 여기 이름을 바꿔도 이미 기록된 지출은 그대로다. 지출은
 * 적힐 때 이름을 복사해 두기 때문이다(제출한 달의 숫자가 나중에 바뀌면 안 된다).
 */
export default function ExpenseItemsPage() {
  const { showToast } = useToast();
  const ready = useLocalStorageReady();
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [draftLabel, setDraftLabel] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setItems(sortExpenseItems(storage.getExpenseItems()));
  }, [ready]);

  if (!ready) {
    return <PageShell title="지출 항목 관리" wide>{null}</PageShell>;
  }

  const persist = (next: ExpenseItem[]) => {
    const sorted = sortExpenseItems(next);
    setItems(sorted);
    storage.setExpenseItems(sorted);
  };

  const patchItem = (id: string, patch: Partial<ExpenseItem>) => {
    persist(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleAdd = () => {
    const label = draftLabel.trim();
    if (!label) return;
    persist([...items, createExpenseItem(label, items.length)]);
    setDraftLabel("");
  };

  const move = (id: string, delta: number) => {
    const ordered = sortExpenseItems(items);
    const index = ordered.findIndex((item) => item.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const [moved] = ordered.splice(index, 1);
    ordered.splice(target, 0, moved);
    persist(ordered.map((item, i) => ({ ...item, order: i })));
  };

  return (
    <PageShell title="지출 항목 관리" wide>
      <div className={styles.topActions}>
        <Link href="/secretary" className={styles.secondaryButton}>
          보고서 목록으로
        </Link>
        <button type="button" className={styles.secondaryButton} onClick={() => setResetOpen(true)}>
          기본 항목으로 되돌리기
        </button>
      </div>
      <p className={styles.hint}>회계에서 지출을 적을 때 고를 항목을 관리합니다. 목록에 없는 지출은 입력할 때 직접 쓸 수도 있습니다.</p>
      <p className={styles.autoSaveNotice}>모든 변경 사항은 자동으로 저장됩니다.</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>항목 추가</h2>
        <div className={styles.row}>
          <input
            type="text"
            className={styles.input}
            value={draftLabel}
            placeholder="예: 성물비"
            aria-label="항목 이름"
            onChange={(e) => setDraftLabel(e.target.value)}
          />
          <button type="button" className={styles.primaryButton} onClick={handleAdd}>
            추가
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>항목 목록</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>항목 이름</th>
                <th>사용</th>
                <th>순서</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      className={styles.input}
                      value={item.label}
                      aria-label="항목 이름"
                      onChange={(e) => patchItem(item.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    {/* Hidden rather than deleted, so a name the treasurer
                        stopped using does not vanish from the picker's history. */}
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={!item.hidden}
                      aria-label={`${item.label} ${"사용"}`}
                      onChange={(e) => patchItem(item.id, { hidden: !e.target.checked })}
                    />
                  </td>
                  <td className={styles.orderCell}>
                    <button
                      type="button"
                      className={styles.moveButton}
                      aria-label={`${item.label} ${"위로"}`}
                      onClick={() => move(item.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.moveButton}
                      aria-label={`${item.label} ${"아래로"}`}
                      onClick={() => move(item.id, 1)}
                    >
                      ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.hint}>사용을 끄면 새로 입력할 때 목록에 나오지 않습니다. 이미 적어 둔 지출은 그대로 남습니다.</p>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="기본 항목으로 되돌릴까요?"
        body="직접 추가하거나 고친 항목이 모두 사라집니다. 이미 적어 둔 지출은 남습니다."
        confirmLabel="확인"
        cancelLabel="취소"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          persist(createDefaultExpenseItems());
          setResetOpen(false);
          showToast("기본 항목으로 되돌렸습니다.");
        }}
      />
    </PageShell>
  );
}
