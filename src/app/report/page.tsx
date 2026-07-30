"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { ReportSummary } from "@/components/ReportSummary";
import { ShareButton } from "@/components/ShareButton";
import { useCurrentReport } from "@/hooks/useCurrentReport";
import { useHistory } from "@/hooks/useHistory";
import { useTranslation } from "@/i18n/useTranslation";
import { formatShareText } from "@/lib/reportUtils";

function ReportPageContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { ready: historyReady, findById } = useHistory();
  const { ready: currentReady, report: currentReport } = useCurrentReport();

  if (!historyReady || !currentReady) return null;

  const fromHistory = id ? findById(id) : null;
  const report = fromHistory ?? (currentReport && currentReport.id === id ? currentReport : null);

  if (!report) {
    return <p>{t("report.notFound")}</p>;
  }

  return (
    <>
      <ReportSummary report={report} />
      <ShareButton title={t("app.shortName")} text={formatShareText(report, language)} />
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
