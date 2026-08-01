"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useMonthlyReports } from "@/hooks/useMonthlyReports";
import { useRoster } from "@/hooks/useRoster";
import { useTranslation } from "@/i18n/useTranslation";
import { addMonthToYearMonth, formatYearMonthLabel } from "@/lib/monthlyReportUtils";
import styles from "./page.module.css";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function SecretaryPage() {
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const { ready: reportsReady, reports, createReport, removeReport } = useMonthlyReports();
  const { ready: rosterReady, roster } = useRoster();

  const [yearMonth, setYearMonth] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!reportsReady) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- default derived from storage-backed reports, not pure render state
    setYearMonth(reports[0] ? addMonthToYearMonth(reports[0].yearMonth) : currentYearMonth());
  }, [reportsReady, reports]);

  if (!reportsReady || !rosterReady || !roster) {
    return <PageShell title={t("secretary.title")} wide>{null}</PageShell>;
  }

  const handleCreate = () => {
    if (!yearMonth) return;
    if (reports.some((r) => r.yearMonth === yearMonth)) {
      showToast(t("secretary.alreadyExists"));
      return;
    }
    const created = createReport(yearMonth, roster);
    router.push(`/secretary/report?id=${created.id}`);
  };

  return (
    <PageShell title={t("secretary.title")} wide>
      <p className={styles.subtitle}>{t("secretary.subtitle")}</p>

      <div className={styles.topRow}>
        <section className={styles.section}>
          <Link href="/secretary/roster" className={styles.secondaryButton}>
            {t("secretary.rosterLink")}
          </Link>
          <p className={styles.description}>{t("secretary.rosterLinkDescription")}</p>
          <Link href="/secretary/activity-items" className={styles.secondaryButton}>
            {t("secretaryActivityItems.link")}
          </Link>
          <p className={styles.description}>{t("secretaryActivityItems.linkDescription")}</p>
          <Link href="/secretary/expense-items" className={styles.secondaryButton}>
            {t("secretaryExpenseItems.link")}
          </Link>
          <p className={styles.description}>{t("secretaryExpenseItems.linkDescription")}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("secretary.newReportTitle")}</h2>
          <label className={styles.field}>
            <span className={styles.label}>{t("secretary.yearMonthLabel")}</span>
            <input
              type="month"
              className={styles.input}
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
            />
          </label>
          <button type="button" className={styles.primaryButton} onClick={handleCreate}>
            {t("secretary.create")}
          </button>
        </section>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretary.listTitle")}</h2>
        {reports.length === 0 ? (
          <p className={styles.empty}>{t("secretary.empty")}</p>
        ) : (
          <ul className={styles.list}>
            {reports.map((report) => (
              <li key={report.id} className={styles.item}>
                <Link href={`/secretary/report?id=${report.id}`} className={styles.itemLink}>
                  {formatYearMonthLabel(report.yearMonth, language)}
                </Link>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setDeleteTarget(report.id)}
                >
                  {t("secretary.delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("secretary.deleteConfirmTitle")}
        body={t("secretary.deleteConfirmBody")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removeReport(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </PageShell>
  );
}
