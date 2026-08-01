"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import { useTranslation } from "@/i18n/useTranslation";
import {
  createDefaultExpenseItems,
  createExpenseItem,
  sortExpenseItems,
} from "@/lib/expenseItems";
import { storage } from "@/lib/storage";
import type { ExpenseItem } from "@/lib/types";
import styles from "./page.module.css";

export default function ExpenseItemsPage() {
  const { t } = useTranslation();
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
    return <PageShell title={t("secretaryExpenseItems.title")} wide>{null}</PageShell>;
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
    <PageShell title={t("secretaryExpenseItems.title")} wide>
      <div className={styles.topActions}>
        <Link href="/secretary" className={styles.secondaryButton}>
          {t("secretaryReport.backToList")}
        </Link>
        <button type="button" className={styles.secondaryButton} onClick={() => setResetOpen(true)}>
          {t("secretaryExpenseItems.restoreDefaults")}
        </button>
      </div>
      <p className={styles.hint}>{t("secretaryExpenseItems.description")}</p>
      <p className={styles.autoSaveNotice}>{t("common.autoSaveNotice")}</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryExpenseItems.addTitle")}</h2>
        <div className={styles.row}>
          <input
            type="text"
            className={styles.input}
            value={draftLabel}
            placeholder={t("secretaryExpenseItems.labelPlaceholder")}
            aria-label={t("secretaryExpenseItems.labelColumn")}
            onChange={(e) => setDraftLabel(e.target.value)}
          />
          <button type="button" className={styles.primaryButton} onClick={handleAdd}>
            {t("secretaryExpenseItems.add")}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryExpenseItems.listTitle")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("secretaryExpenseItems.labelColumn")}</th>
                <th>{t("secretaryExpenseItems.visibleColumn")}</th>
                <th>{t("secretaryExpenseItems.orderColumn")}</th>
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
                      aria-label={t("secretaryExpenseItems.labelColumn")}
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
                      aria-label={`${item.label} ${t("secretaryExpenseItems.visibleColumn")}`}
                      onChange={(e) => patchItem(item.id, { hidden: !e.target.checked })}
                    />
                  </td>
                  <td className={styles.orderCell}>
                    <button
                      type="button"
                      className={styles.moveButton}
                      aria-label={`${item.label} ${t("secretaryExpenseItems.moveUp")}`}
                      onClick={() => move(item.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.moveButton}
                      aria-label={`${item.label} ${t("secretaryExpenseItems.moveDown")}`}
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
        <p className={styles.hint}>{t("secretaryExpenseItems.hiddenHint")}</p>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title={t("secretaryExpenseItems.restoreConfirmTitle")}
        body={t("secretaryExpenseItems.restoreConfirmBody")}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          persist(createDefaultExpenseItems());
          setResetOpen(false);
          showToast(t("secretaryExpenseItems.restored"));
        }}
      />
    </PageShell>
  );
}
