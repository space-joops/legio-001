"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import { useTranslation } from "@/i18n/useTranslation";
import {
  createActivityItem,
  createDefaultActivityItems,
  sortActivityItemsByName,
} from "@/lib/activityItems";
import { storage } from "@/lib/storage";
import type { ActivityItem, ActivityLine } from "@/lib/types";
import styles from "./page.module.css";

const LINES: { value: ActivityLine; labelKey: string }[] = [
  { value: "praesidium", labelKey: "secretaryActivityItems.linePraesidium" },
  { value: "parish", labelKey: "secretaryActivityItems.lineParish" },
];

export default function ActivityItemsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const ready = useLocalStorageReady();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftLine, setDraftLine] = useState<ActivityLine>("praesidium");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setItems(sortActivityItemsByName(storage.getActivityItems()));
  }, [ready]);

  if (!ready) {
    return <PageShell title={t("secretaryActivityItems.title")} wide>{null}</PageShell>;
  }

  /** Shown 가나다순; each item keeps its own `order`, which is what the
      report's activity lines print in. */
  const persist = (next: ActivityItem[]) => {
    setItems(sortActivityItemsByName(next));
    storage.setActivityItems(next);
  };

  const patchItem = (id: string, patch: Partial<ActivityItem>) => {
    persist(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleAdd = () => {
    const label = draftLabel.trim();
    if (!label) return;
    persist([...items, createActivityItem(label, draftLine, items.length)]);
    setDraftLabel("");
  };

  return (
    <PageShell title={t("secretaryActivityItems.title")} wide>
      <div className={styles.topActions}>
        <Link href="/secretary" className={styles.secondaryButton}>
          {t("secretaryReport.backToList")}
        </Link>
        <button type="button" className={styles.secondaryButton} onClick={() => setResetOpen(true)}>
          {t("secretaryActivityItems.restoreDefaults")}
        </button>
      </div>
      <p className={styles.hint}>{t("secretaryActivityItems.description")}</p>
      <p className={styles.autoSaveNotice}>{t("common.autoSaveNotice")}</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryActivityItems.addTitle")}</h2>
        <div className={styles.row}>
          <input
            type="text"
            className={styles.input}
            value={draftLabel}
            placeholder={t("secretaryActivityItems.labelPlaceholder")}
            aria-label={t("secretaryActivityItems.labelColumn")}
            onChange={(e) => setDraftLabel(e.target.value)}
          />
          <select
            className={styles.input}
            value={draftLine}
            aria-label={t("secretaryActivityItems.lineColumn")}
            onChange={(e) => setDraftLine(e.target.value as ActivityLine)}
          >
            {LINES.map(({ value, labelKey }) => (
              <option key={value} value={value}>
                {t(labelKey)}
              </option>
            ))}
          </select>
          <button type="button" className={styles.primaryButton} onClick={handleAdd}>
            {t("secretaryActivityItems.add")}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryActivityItems.listTitle")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("secretaryActivityItems.labelColumn")}</th>
                <th>{t("secretaryActivityItems.lineColumn")}</th>
                <th>{t("secretaryActivityItems.visibleColumn")}</th>
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
                      aria-label={t("secretaryActivityItems.labelColumn")}
                      onChange={(e) => patchItem(item.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className={styles.input}
                      value={item.line}
                      aria-label={t("secretaryActivityItems.lineColumn")}
                      onChange={(e) =>
                        patchItem(item.id, { line: e.target.value as ActivityLine })
                      }
                    >
                      {LINES.map(({ value, labelKey }) => (
                        <option key={value} value={value}>
                          {t(labelKey)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {/* Hidden rather than deleted: removing an item outright would
                        drop it from reports that already counted it. */}
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={!item.hidden}
                      aria-label={`${item.label} ${t("secretaryActivityItems.visibleColumn")}`}
                      onChange={(e) => patchItem(item.id, { hidden: !e.target.checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.hint}>{t("secretaryActivityItems.hiddenHint")}</p>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title={t("secretaryActivityItems.restoreConfirmTitle")}
        body={t("secretaryActivityItems.restoreConfirmBody")}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          persist(createDefaultActivityItems());
          setResetOpen(false);
          showToast(t("secretaryActivityItems.restored"));
        }}
      />
    </PageShell>
  );
}
