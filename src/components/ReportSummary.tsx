import { useTranslation } from "@/i18n/useTranslation";
import { PRAYER_ITEMS } from "@/lib/constants";
import { formatMeetingDateTime, formatSessionLabel } from "@/lib/reportUtils";
import type { PrayerCounts, PrayerItemKey, WeeklyReport } from "@/lib/types";
import styles from "./ReportSummary.module.css";

interface ReportSummaryProps {
  report: WeeklyReport;
  editable?: boolean;
  draftCounts?: PrayerCounts;
  onDraftChange?: (key: PrayerItemKey, value: number) => void;
}

export function ReportSummary({
  report,
  editable = false,
  draftCounts,
  onDraftChange,
}: ReportSummaryProps) {
  const { t, language } = useTranslation();
  const counts = editable && draftCounts ? draftCounts : report.counts;

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
            {editable ? (
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className={styles.countInput}
                value={counts[item.key]}
                aria-label={t(item.labelKey)}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  onDraftChange?.(item.key, Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
                }}
              />
            ) : (
              <span className={styles.count}>
                {counts[item.key]}
                {item.unitLabelKey ? t(item.unitLabelKey) : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
