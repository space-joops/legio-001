import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { formatMeetingDateTime, formatSessionLabel } from "@/lib/reportUtils";
import type { WeeklyReport } from "@/lib/types";
import styles from "./HistoryListItem.module.css";

export function HistoryListItem({ report }: { report: WeeklyReport }) {
  const { language } = useTranslation();
  const total = Object.values(report.counts).reduce((a, b) => a + b, 0);

  return (
    <Link href={`/report?id=${report.id}`} className={styles.item}>
      <div className={styles.session}>
        {formatSessionLabel(report.sessionNumber, language)}
      </div>
      <div className={styles.details}>
        <span className={styles.date}>
          {formatMeetingDateTime(report.meetingDateTime, language)}
        </span>
        <span className={styles.total}>{total}</span>
      </div>
    </Link>
  );
}
