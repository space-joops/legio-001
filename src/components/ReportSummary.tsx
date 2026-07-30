import { useTranslation } from "@/i18n/useTranslation";
import { PRAYER_ITEMS } from "@/lib/constants";
import { formatMeetingDateTime, formatSessionLabel } from "@/lib/reportUtils";
import type { WeeklyReport } from "@/lib/types";
import styles from "./ReportSummary.module.css";

export function ReportSummary({ report }: { report: WeeklyReport }) {
  const { t, language } = useTranslation();

  return (
    <div className={styles.card}>
      <div className={styles.meta}>
        <div className={styles.sessionBadge}>
          {formatSessionLabel(report.sessionNumber, language)}
        </div>
        <div className={styles.metaText}>
          <p>
            {t("report.meetingLabel")}:{" "}
            {formatMeetingDateTime(report.meetingDateTime, language)}
          </p>
          <p>
            {t("report.memberLabel")}: {report.memberName || "-"}
          </p>
        </div>
      </div>
      <ul className={styles.list}>
        {PRAYER_ITEMS.map((item) => (
          <li key={item.key} className={styles.listItem}>
            <span>{t(item.labelKey)}</span>
            <span className={styles.count}>
              {report.counts[item.key]}
              {item.unitLabelKey ? t(item.unitLabelKey) : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
