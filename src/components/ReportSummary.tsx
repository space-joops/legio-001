import { useTranslation } from "@/i18n/useTranslation";
import { PRAYER_ITEMS } from "@/lib/constants";
import { formatMeetingDateTime, formatSessionLabel } from "@/lib/reportUtils";
import { selectOnFocus } from "@/lib/selectOnFocus";
import type { PrayerCounts, PrayerItemKey, WeeklyReport } from "@/lib/types";
import styles from "./ReportSummary.module.css";

/**
 * 주간 보고 한 건의 내용을 표로 보여 준다.
 *
 * `editable` 이 true 면 같은 표가 그대로 입력칸으로 바뀐다. 보기용과 수정용
 * 화면을 따로 만들면 둘이 조금씩 어긋나기 때문에 하나로 합쳐 두었다.
 */

interface ReportSummaryProps {
  report: WeeklyReport;
  editable?: boolean;
  draftCounts?: PrayerCounts;
  onDraftChange?: (key: PrayerItemKey, value: number) => void;
  draftNote?: string;
  onNoteChange?: (value: string) => void;
}

export function ReportSummary({
  report,
  editable = false,
  draftCounts,
  onDraftChange,
  draftNote,
  onNoteChange,
}: ReportSummaryProps) {
  const { t } = useTranslation();
  const counts = editable && draftCounts ? draftCounts : report.counts;
  const note = editable ? draftNote ?? "" : report.activityNote ?? "";

  return (
    <div className={styles.card}>
      <div className={styles.meta}>
        <div className={styles.sessionBadge}>
          {formatSessionLabel(report.sessionNumber)}
        </div>
        <div className={styles.metaText}>
          <p>
            {t("report.meetingLabel")}:{" "}
            {formatMeetingDateTime(report.meetingDateTime)}
          </p>
          <p>
            {t("report.memberLabel")}: {report.memberName || "-"}
          </p>
        </div>
      </div>
      <ul className={styles.list}>
        {PRAYER_ITEMS.map((item) => (
          <li key={item.key} className={styles.listItem}>
            <span>{item.label}</span>
            {editable ? (
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className={styles.countInput}
                value={counts[item.key]}
                aria-label={item.label}
                onFocus={selectOnFocus}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  onDraftChange?.(item.key, Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
                }}
              />
            ) : (
              <span className={styles.count}>
                {counts[item.key]}
                {item.unitLabel ?? ""}
              </span>
            )}
          </li>
        ))}
      </ul>
      {editable ? (
        <label className={styles.noteField}>
          <span className={styles.noteLabel}>{t("report.activityNoteLabel")}</span>
          <textarea
            className={styles.noteInput}
            rows={4}
            value={note}
            onChange={(e) => onNoteChange?.(e.target.value)}
          />
        </label>
      ) : (
        note && (
          <div className={styles.noteField}>
            <span className={styles.noteLabel}>{t("report.activityNoteLabel")}</span>
            <p className={styles.noteText}>{note}</p>
          </div>
        )
      )}
    </div>
  );
}
