import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { PRAYER_ITEMS } from "@/lib/constants";
import { formatMeetingDateTime, formatSessionLabel } from "@/lib/reportUtils";
import type { WeeklyReport } from "@/lib/types";
import styles from "./HistoryListItem.module.css";

export function HistoryListItem({ report }: { report: WeeklyReport }) {
  const { t, language } = useTranslation();

  // Recorded numbers at a glance: without them "how much did I do last week?"
  // means opening every entry one by one.
  const summary = PRAYER_ITEMS.filter((item) => (report.counts[item.key] ?? 0) > 0)
    .map((item) => `${t(item.labelKey)} ${report.counts[item.key]}`)
    .join(" · ");

  return (
    <Link href={`/report?id=${report.id}`} className={styles.item}>
      <div className={styles.session}>
        {formatSessionLabel(report.sessionNumber, language)}
      </div>
      <span className={styles.date}>
        {formatMeetingDateTime(report.meetingDateTime, language)}
      </span>
      {summary && <span className={styles.summary}>{summary}</span>}
    </Link>
  );
}
