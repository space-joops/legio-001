import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { PRAYER_ITEMS } from "@/lib/constants";
import { formatMeetingDateTime, formatSessionLabel } from "@/lib/reportUtils";
import type { WeeklyReport } from "@/lib/types";
import styles from "./HistoryListItem.module.css";

/**
 * 기록 목록의 한 줄 — 회차·주회 일시와 기도 숫자 미리보기.
 *
 * 숫자를 미리 보여 주는 이유: 회차 번호만으로는 어느 주가 어느 주인지
 * 구별되지 않아, 열어 보기 전에는 찾을 수가 없었다.
 */

export function HistoryListItem({ report }: { report: WeeklyReport }) {
  const { t } = useTranslation();

  // Recorded numbers at a glance: without them "how much did I do last week?"
  // means opening every entry one by one.
  const summary = PRAYER_ITEMS.filter((item) => (report.counts[item.key] ?? 0) > 0)
    .map((item) => `${item.label} ${report.counts[item.key]}`)
    .join(" · ");

  return (
    <Link href={`/report?id=${report.id}`} className={styles.item}>
      <div className={styles.session}>
        {formatSessionLabel(report.sessionNumber)}
      </div>
      <span className={styles.date}>
        {formatMeetingDateTime(report.meetingDateTime)}
      </span>
      {summary && <span className={styles.summary}>{summary}</span>}
    </Link>
  );
}
