"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { ReportSummary } from "@/components/ReportSummary";
import { ShareButton } from "@/components/ShareButton";
import { useToast } from "@/components/ToastProvider";
import { useCurrentReport } from "@/hooks/useCurrentReport";
import { useHistory } from "@/hooks/useHistory";
import { useTranslation } from "@/i18n/useTranslation";
import { formatShareText } from "@/lib/reportUtils";
import type { PrayerCounts, PrayerItemKey } from "@/lib/types";
import styles from "./page.module.css";

function ReportPageContent() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { showToast } = useToast();
  const { ready: historyReady, findById, updateReportEntry, removeReport } = useHistory();
  const { ready: currentReady, report: currentReport } = useCurrentReport();

  const [isEditing, setIsEditing] = useState(false);
  const [draftCounts, setDraftCounts] = useState<PrayerCounts | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!historyReady || !currentReady) return null;

  const fromHistory = id ? findById(id) : null;
  const report = fromHistory ?? (currentReport && currentReport.id === id ? currentReport : null);

  if (!report) {
    return (
      <>
        <p>{t("report.notFound")}</p>
        <Link href="/history" className={styles.backLink}>
          {t("report.backToHistory")}
        </Link>
      </>
    );
  }

  const startEditing = () => {
    setDraftCounts(report.counts);
    setDraftNote(report.activityNote ?? "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftCounts(null);
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (draftCounts) updateReportEntry(report.id, draftCounts, draftNote);
    setDraftCounts(null);
    setIsEditing(false);
    showToast(t("report.saved"));
  };

  const handleDelete = () => {
    removeReport(report.id);
    setConfirmingDelete(false);
    showToast(t("report.deleted"));
    router.push("/history");
  };

  const handleDraftChange = (key: PrayerItemKey, value: number) => {
    setDraftCounts((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <>
      <ReportSummary
        report={report}
        editable={isEditing}
        draftCounts={draftCounts ?? undefined}
        onDraftChange={handleDraftChange}
        draftNote={draftNote}
        onNoteChange={setDraftNote}
      />
      {isEditing ? (
        <div className={styles.editActions}>
          <button type="button" className={styles.cancelButton} onClick={cancelEditing}>
            {t("common.cancel")}
          </button>
          <button type="button" className={styles.saveButton} onClick={saveEditing}>
            {t("common.save")}
          </button>
        </div>
      ) : (
        <>
          {fromHistory && (
            <button type="button" className={styles.editButton} onClick={startEditing}>
              {t("common.edit")}
            </button>
          )}
          <ShareButton title={t("app.shortName")} text={formatShareText(report, language)} />
          <Link href="/history" className={styles.backLink}>
            {t("report.backToHistory")}
          </Link>
          {fromHistory && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => setConfirmingDelete(true)}
            >
              {t("report.delete")}
            </button>
          )}
        </>
      )}
      <ConfirmDialog
        open={confirmingDelete}
        title={t("report.deleteConfirmTitle")}
        body={t("report.deleteConfirmBody")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
        danger
      />
    </>
  );
}

export default function ReportPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t("report.title")}>
      <Suspense fallback={null}>
        <ReportPageContent />
      </Suspense>
    </PageShell>
  );
}
