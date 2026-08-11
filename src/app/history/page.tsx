"use client";

import { HistoryList } from "@/components/HistoryList";
import { PageShell } from "@/components/PageShell";
import { useHistory } from "@/hooks/useHistory";

/** 제출한 주간 보고들을 최근 회차부터 보여 주는 목록 화면(`/history`). */
export default function HistoryPage() {
  const { ready, history } = useHistory();

  return (
    <PageShell title="지난 활동 기록">
      {ready ? <HistoryList history={history} /> : null}
    </PageShell>
  );
}
