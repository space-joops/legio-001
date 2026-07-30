"use client";

import { HistoryList } from "@/components/HistoryList";
import { PageShell } from "@/components/PageShell";
import { useHistory } from "@/hooks/useHistory";
import { useTranslation } from "@/i18n/useTranslation";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { ready, history } = useHistory();

  return (
    <PageShell title={t("history.title")}>
      {ready ? <HistoryList history={history} /> : null}
    </PageShell>
  );
}
