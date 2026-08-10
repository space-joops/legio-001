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

/**
 * 주간 보고 한 건을 보여 주는 화면(`/report?id=...`).
 *
 * 제출 직후에도 여기로 오고, 기록 목록에서 눌러도 여기로 온다. 둘의 차이가
 * 이 화면의 유일한 까다로운 점이다.
 *   - 기록에 있는 보고서 → 수정·삭제할 수 있다
 *   - 방금 제출한 것이 아직 기록에 반영되기 전 → 보기와 공유만 된다
 *
 * 주소의 `?id=` 를 읽으려면 `useSearchParams()` 를 써야 하는데, 이 훅은 정적
 * export 에서 `<Suspense>` 로 감싸야 한다는 규칙이 있다. 그래서 파일이
 * `ReportPageContent`(알맹이)와 `ReportPage`(감싸개) 둘로 나뉘어 있다.
 */

/** 수정 중일 때의 버튼 줄 — 취소 / 저장. */
function EditActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const { t } = useTranslation();

  return (
    <div className={styles.editActions}>
      <button type="button" className={styles.cancelButton} onClick={onCancel}>
        {t("common.cancel")}
      </button>
      <button type="button" className={styles.saveButton} onClick={onSave}>
        {t("common.save")}
      </button>
    </div>
  );
}

interface ViewActionsProps {
  /** 기록에 저장된 보고서일 때만 true. 수정·삭제 버튼이 여기에 달려 있다. */
  canModify: boolean;
  shareText: string;
  onStartEditing: () => void;
  onRequestDelete: () => void;
}

/** 그냥 보고 있을 때의 버튼 줄 — 수정 / 공유 / 목록으로 / 삭제. */
function ViewActions({
  canModify,
  shareText,
  onStartEditing,
  onRequestDelete,
}: ViewActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      {canModify && (
        <button type="button" className={styles.editButton} onClick={onStartEditing}>
          {t("common.edit")}
        </button>
      )}
      <ShareButton title={t("app.shortName")} text={shareText} />
      <Link href="/history" className={styles.backLink}>
        {t("report.backToHistory")}
      </Link>
      {canModify && (
        <button type="button" className={styles.deleteButton} onClick={onRequestDelete}>
          {t("report.delete")}
        </button>
      )}
    </>
  );
}

function ReportPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { showToast } = useToast();
  const { ready: historyReady, findById, updateReportEntry, removeReport } = useHistory();
  const { ready: currentReady, report: currentReport } = useCurrentReport();

  const [isEditing, setIsEditing] = useState(false);
  // 수정 중에만 쓰는 임시본. 저장을 눌러야 진짜 기록에 반영된다.
  const [draftCounts, setDraftCounts] = useState<PrayerCounts | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // 저장소를 아직 못 읽었으면 아무것도 그리지 않는다.
  if (!historyReady || !currentReady) return null;

  // 먼저 기록에서 찾고, 없으면 "작성 중인 보고서"가 그 id 인지 본다.
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
    // [TS] `prev ? {...} : prev` — 아직 임시본이 없으면 그대로 둔다.
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
        <EditActions onCancel={cancelEditing} onSave={saveEditing} />
      ) : (
        <ViewActions
          canModify={fromHistory !== null}
          shareText={formatShareText(report)}
          onStartEditing={startEditing}
          onRequestDelete={() => setConfirmingDelete(true)}
        />
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
      {/* useSearchParams() 를 쓰는 컴포넌트는 반드시 Suspense 안에 있어야 한다.
          정적 export 에서는 빌드 시점에 주소를 알 수 없기 때문이다. */}
      <Suspense fallback={null}>
        <ReportPageContent />
      </Suspense>
    </PageShell>
  );
}
