"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ImportDataButton } from "@/components/ImportDataButton";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useMonthlyReports } from "@/hooks/useMonthlyReports";
import { useRoster } from "@/hooks/useRoster";
import { shareOrDownloadMonthExport, shareOrDownloadSecretaryExport } from "@/lib/exportData";
import { addMonthToYearMonth, formatYearMonthLabel } from "@/lib/monthlyReportUtils";
import type { MonthlyReport } from "@/lib/types";
import styles from "./page.module.css";

/**
 * 서기 기능의 첫 화면(`/secretary`). 월례 보고서 목록 + 새로 만들기 + 삭제.
 */
function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function SecretaryPage() {
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
    return <PageShell title="월례보고서(서기용)" wide>{null}</PageShell>;
  }

  const handleCreate = () => {
    if (!yearMonth) return;
    if (reports.some((r) => r.yearMonth === yearMonth)) {
      showToast("이미 작성된 연월입니다. 목록에서 열어 수정해 주세요.");
      return;
    }
    const created = createReport(yearMonth, roster);
    router.push(`/secretary/report?id=${created.id}`);
  };

  const handleExportMonth = async (report: MonthlyReport) => {
    const outcome = await shareOrDownloadMonthExport(report, "레지오 활동보고");
    if (outcome === "downloaded") showToast("파일이 저장되었습니다.");
  };

  const handleExportSecretary = async () => {
    const outcome = await shareOrDownloadSecretaryExport();
    if (outcome === "downloaded") showToast("파일이 저장되었습니다.");
  };

  return (
    <PageShell title="월례보고서(서기용)" wide>
      <p className={styles.subtitle}>쁘레시디움 월례 보고서를 작성하고 인쇄·공유할 수 있습니다.</p>

      <div className={styles.topRow}>
        <section className={styles.section}>
          <Link href="/secretary/roster" className={styles.secondaryButton}>
            현재 명단 관리
          </Link>
          <p className={styles.description}>간부 명단과 단원 수를 관리합니다.</p>
          <Link href="/secretary/activity-items" className={styles.secondaryButton}>
            Pr.활동사항 관리
          </Link>
          <p className={styles.description}>단원이 고르는 활동 항목을 추가하거나 이름을 고칩니다.</p>
          <Link href="/secretary/expense-items" className={styles.secondaryButton}>
            지출 항목 관리
          </Link>
          <p className={styles.description}>회계에서 고르는 지출 항목을 추가하거나 이름을 고칩니다.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>새 보고서 작성</h2>
          <label className={styles.field}>
            <span className={styles.label}>작성할 연월</span>
            <input
              type="month"
              className={styles.input}
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
            />
          </label>
          <button type="button" className={styles.primaryButton} onClick={handleCreate}>
            만들기
          </button>
        </section>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>월례 보고서 목록</h2>
        {reports.length === 0 ? (
          <p className={styles.empty}>작성된 월례 보고서가 없습니다.</p>
        ) : (
          <ul className={styles.list}>
            {reports.map((report) => (
              <li key={report.id} className={styles.item}>
                <Link href={`/secretary/report?id=${report.id}`} className={styles.itemLink}>
                  {formatYearMonthLabel(report.yearMonth)}
                </Link>
                <button
                  type="button"
                  className={styles.exportButton}
                  onClick={() => {
                    void handleExportMonth(report);
                  }}
                >
                  내보내기
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setDeleteTarget(report.id)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>데이터 옮기기</h2>
        <p className={styles.description}>PC와 휴대폰 사이에서 서기 자료(명단·월례 보고서·활동/지출 항목)를 파일로 주고받습니다. 가져오기를 해도 내 활동 기록은 지워지지 않습니다.</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            void handleExportSecretary();
          }}
        >
          서기 데이터 내보내기
        </button>
        <ImportDataButton
          label="파일 가져오기"
          buttonClassName={styles.secondaryButton}
          reloadTo="/secretary/"
        />
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 월례 보고서를 삭제할까요?"
        body="삭제하면 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
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
