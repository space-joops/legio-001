"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ReportSummary } from "@/components/ReportSummary";
import { ShareButton } from "@/components/ShareButton";
import { useCurrentReport } from "@/hooks/useCurrentReport";
import { useHistory } from "@/hooks/useHistory";
import { useTranslation } from "@/i18n/useTranslation";
import { formatShareText } from "@/lib/reportUtils";
import type { PrayerCounts, PrayerItemKey } from "@/lib/types";
import styles from "./page.module.css";

function ReportPageContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { ready: historyReady, findById, updateReportEntry } = useHistory();
  const { ready: currentReady, report: currentReport } = useCurrentReport();

  const [isEditing, setIsEditing] = useState(false);
  const [draftCounts, setDraftCounts] = useState<PrayerCounts | null>(null);
  const [draftNote, setDraftNote] = useState("");

  if (!historyReady || !currentReady) return null;

  const fromHistory = id ? findById(id) : null;
  const report = fromHistory ?? (currentReport && currentReport.id === id ? currentReport : null);

  if (!report) {
    return <p>{t("report.notFound")}</p>;
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
        </>
      )}
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
