import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { formatMeetingDateTime, formatSessionLabel } from "@/lib/reportUtils";
import type { WeeklyReport } from "@/lib/types";
import styles from "./HistoryListItem.module.css";

export function HistoryListItem({ report }: { report: WeeklyReport }) {
  const { language } = useTranslation();

  return (
    <Link href={`/report?id=${report.id}`} className={styles.item}>
      <div className={styles.session}>
        {formatSessionLabel(report.sessionNumber, language)}
      </div>
      <span className={styles.date}>
        {formatMeetingDateTime(report.meetingDateTime, language)}
      </span>
    </Link>
  );
}
