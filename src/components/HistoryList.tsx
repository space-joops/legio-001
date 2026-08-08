import { useTranslation } from "@/i18n/useTranslation";
import type { WeeklyReport } from "@/lib/types";
import { HistoryListItem } from "./HistoryListItem";
import styles from "./HistoryList.module.css";

/** 제출한 주간 보고들을 줄 단위로 늘어놓는다. 한 줄의 생김새는 `HistoryListItem`. */

export function HistoryList({ history }: { history: WeeklyReport[] }) {
  const { t } = useTranslation();

  if (history.length === 0) {
    return <p className={styles.empty}>{t("history.empty")}</p>;
  }

  return (
    <ul className={styles.list}>
      {history.map((report) => (
        <li key={report.id}>
          <HistoryListItem report={report} />
        </li>
      ))}
    </ul>
  );
}
