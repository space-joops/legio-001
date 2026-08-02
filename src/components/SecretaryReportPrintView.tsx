import { buildActivityLines } from "@/lib/activityReport";
import { PRAYER_ITEMS } from "@/lib/constants";
import { OFFICER_ROLES, WEEKDAY_LABEL_KEYS, formatYearMonthLabel } from "@/lib/monthlyReportUtils";
import { storage } from "@/lib/storage";
import { formatWon } from "@/lib/treasury";
import type {
  EvangelizationTallies,
  MemberCounts,
  MonthlyReport,
} from "@/lib/types";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./SecretaryReportPrintView.module.css";

const MEMBER_COUNT_ROWS: { key: keyof MemberCounts; labelKey: string }[] = [
  { key: "activeMale", labelKey: "secretaryRoster.activeMaleLabel" },
  { key: "activeFemale", labelKey: "secretaryRoster.activeFemaleLabel" },
  { key: "praetorium", labelKey: "secretaryRoster.praetoriumLabel" },
  { key: "auxiliaryMale", labelKey: "secretaryRoster.auxiliaryMaleLabel" },
  { key: "auxiliaryFemale", labelKey: "secretaryRoster.auxiliaryFemaleLabel" },
  { key: "adjutorium", labelKey: "secretaryRoster.adjutoriumLabel" },
];

const EVANGELIZATION_ROWS: {
  key: keyof EvangelizationTallies;
  labelKey: string;
}[] = [
  { key: "baptism", labelKey: "secretaryReport.evangelizationBaptism" },
  { key: "returnToFaith", labelKey: "secretaryReport.evangelizationReturn" },
  { key: "activeMember", labelKey: "secretaryReport.evangelizationActiveMember" },
  { key: "praetorium", labelKey: "secretaryReport.evangelizationPraetorium" },
];

/** 남·여를 합친 "계" 행. 공식 양식이 행동단원과 협조단원에만 계를 둔다. */
const SUBTOTAL_ROWS: {
  labelKey: string;
  male: keyof MemberCounts;
  female: keyof MemberCounts;
}[] = [
  { labelKey: "secretaryReport.activeSubtotalLabel", male: "activeMale", female: "activeFemale" },
  {
    labelKey: "secretaryReport.auxiliarySubtotalLabel",
    male: "auxiliaryMale",
    female: "auxiliaryFemale",
  },
];

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.textBlock}>
      <span className={styles.textLabel}>{label}</span>
      <p className={styles.textValue}>{value || "-"}</p>
    </div>
  );
}

function joinLines(...parts: string[]): string {
  return parts.filter((p) => p && p.trim()).join("\n");
}

export function SecretaryReportPrintView({
  report,
  compact,
}: {
  report: MonthlyReport;
  /** One-page A4 tuning shared by print, the PDF button, and the image button. */
  compact?: boolean;
}) {
  const { t, language } = useTranslation();
  const president = report.roster.officers.find((officer) => officer.role === "president");

  // All three outputs (this view, the editor and the RTF) go through the same
  // builder so the strings can't drift apart.
  const lines = buildActivityLines(report, storage.getActivityItems(), {
    massCommunion: t("secretaryReport.massCommunionLabel"),
    prayer: Object.fromEntries(PRAYER_ITEMS.map((i) => [i.key, t(i.labelKey)])),
  });

  const evangelizationLine = EVANGELIZATION_ROWS.map(({ key, labelKey }) => {
    const tally = report.evangelization?.[key];
    return `${t(labelKey)}(${tally?.result ?? 0}/${tally?.target ?? 0})`;
  }).join(", ");

  return (
    <div className={`${styles.page} ${compact ? styles.compact : ""}`}>
      <header className={styles.header}>
        <p className={styles.orgLine}>{t("app.name")}</p>
        <h1 className={styles.title}>{t("secretaryReport.title")}</h1>
        <p className={styles.yearMonth}>
          {formatYearMonthLabel(report.yearMonth, language)} {t("secretaryReport.asOfSuffix")} · {t("week.sessionNumber")}{" "}
          {report.sessionRangeStart} ~ {report.sessionRangeEnd}
        </p>
        <p className={styles.councilLine}>
          {report.roster.praesidiumName} {report.roster.councilAffiliation}
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.meetingInfoSection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>{t("week.sessionNumber")}</th>
                <td>
                  {report.sessionRangeStart} ~ {report.sessionRangeEnd}
                </td>
                <th>{t("secretaryReport.meetingWeekdayLabel")}</th>
                {/* >= 0, not truthiness: Sunday is 0 and used to print as "-". */}
                <td>
                  {report.meetingWeekday >= 0 ? t(WEEKDAY_LABEL_KEYS[report.meetingWeekday]) : "-"}
                </td>
              </tr>
              <tr>
                <th>{t("secretaryReport.meetingTimeLabel")}</th>
                <td>{report.meetingTime || "-"}</td>
                <th>{t("secretaryReport.meetingLocationLabel")}</th>
                <td>{report.meetingLocation || "-"}</td>
              </tr>
              <tr>
                <th>{t("secretaryReport.attendanceSection")} ({t("secretaryReport.officers")})</th>
                <td>
                  {report.attendance.officersPresent} / {report.attendance.officersTotal}
                </td>
                <th>{t("secretaryReport.attendanceSection")} ({t("secretaryReport.members")})</th>
                <td>
                  {report.attendance.membersPresent} / {report.attendance.membersTotal}
                </td>
              </tr>
              <tr>
                <th>{t("secretaryRoster.spiritualDirectorNameLabel")}</th>
                <td colSpan={3}>
                  {report.roster.spiritualDirectorName} {report.roster.spiritualDirectorBaptismalName}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.rosterSection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("secretaryRoster.officersSection")}</th>
                <th>{t("secretaryRoster.nameLabel")}</th>
                <th>{t("secretaryRoster.baptismalNameLabel")}</th>
                <th>{t("secretaryRoster.appointedDateLabel")}</th>
                <th>{t("secretaryRoster.noteLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {OFFICER_ROLES.map((role) => {
                const officer = report.roster.officers.find((o) => o.role === role);
                if (!officer) return null;
                return (
                  <tr key={role}>
                    <th>{t(`secretaryRoster.roleLabel.${role}`)}</th>
                    <td>{officer.name}</td>
                    <td>{officer.baptismalName}</td>
                    <td>{officer.appointedDate}</td>
                    <td>{officer.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.memberCountsSection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th>{t("secretaryReport.prevMonthLabel")}</th>
                <th>{t("secretaryReport.thisMonthLabel")}</th>
                <th>{t("secretaryReport.increaseLabel")}</th>
                <th>{t("secretaryReport.decreaseLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {MEMBER_COUNT_ROWS.map(({ key, labelKey }) => (
                <tr key={key}>
                  <th>{t(labelKey)}</th>
                  <td>{report.memberCountsPrevMonth[key]}</td>
                  <td>{report.memberCountsThisMonth[key]}</td>
                  <td>{report.memberCountsIncrease[key]}</td>
                  <td>{report.memberCountsDecrease[key]}</td>
                </tr>
              ))}
              {/* The official form carries a 계 column for 행동단원 and 협조단원;
                  derived from 남+여 so nobody has to keep it in sync by hand. */}
              {SUBTOTAL_ROWS.map(({ labelKey, male, female }) => (
                <tr key={labelKey} className={styles.subtotalRow}>
                  <th>{t(labelKey)}</th>
                  <td>{report.memberCountsPrevMonth[male] + report.memberCountsPrevMonth[female]}</td>
                  <td>{report.memberCountsThisMonth[male] + report.memberCountsThisMonth[female]}</td>
                  <td>{report.memberCountsIncrease[male] + report.memberCountsIncrease[female]}</td>
                  <td>{report.memberCountsDecrease[male] + report.memberCountsDecrease[female]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.agendaSection")}</h2>
        {report.agendaItems.length === 0 ? (
          <p className={styles.empty}>-</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("secretaryReport.agendaStatusLabel")}</th>
                  <th>{t("secretaryReport.agendaTitleLabel")}</th>
                  <th>{t("secretaryReport.agendaOrganizerLabel")}</th>
                  <th>{t("secretaryReport.agendaDateTimeLabel")}</th>
                  <th>{t("secretaryReport.agendaLocationLabel")}</th>
                  <th>{t("secretaryReport.agendaAttendanceNoteLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {report.agendaItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.status}</td>
                    <td>{item.title}</td>
                    <td>{item.organizer}</td>
                    <td>{item.dateTime}</td>
                    <td>{item.location}</td>
                    <td>{item.attendanceNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.treasurySection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>{t("secretaryReport.broughtForwardLabel")}</th>
                <td>{formatWon(report.treasury.broughtForward)}</td>
                <th>{t("secretaryReport.incomeLabel")}</th>
                <td>{formatWon(report.treasury.income)}</td>
              </tr>
              <tr>
                <th>{t("secretaryReport.expenseLabel")}</th>
                <td>{formatWon(report.treasury.expense)}</td>
                <th>{t("secretaryReport.balanceLabel")}</th>
                <td>{formatWon(report.treasury.balance)}</td>
              </tr>
              <tr>
                <th>{t("secretaryReport.expenseBreakdownLabel")}</th>
                <td colSpan={3}>{report.treasury.expenseBreakdown || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* The official form has no standalone prayer table: the tallies belong on
          the 교구/본당 지시사항 lines, which is where a reviewer looks for them. */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.activityDetailSection")}</h2>
        <TextBlock
          label={t("secretaryReport.dioceseInstructionsLabel")}
          value={joinLines(report.dioceseInstructions, lines.diocese)}
        />
        <TextBlock
          label={t("secretaryReport.parishInstructionsLabel")}
          value={joinLines(report.parishInstructions, lines.parish)}
        />
        <TextBlock
          label={t("secretaryReport.councilInstructionsLabel")}
          value={report.councilInstructions}
        />
        <TextBlock label={t("secretaryReport.activitySummary")} value={joinLines(lines.praesidium, report.activitySummary)} />
        <TextBlock
          label={t("secretaryReport.cumulativeEvangelizationLabel")}
          value={joinLines(evangelizationLine, report.cumulativeEvangelization)}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.otherNotesLabel")}</h2>
        <TextBlock label={t("secretaryReport.otherNotesLabel")} value={report.otherNotes} />
      </section>

      <footer className={styles.signature}>
        <p>
          ({t("secretaryRoster.councilAffiliationLabel")}) {report.roster.councilAffiliation || "-"}{" "}
          {t("secretaryReport.directlyUnder")}
        </p>
        <p className={styles.signatureLine}>
          {report.roster.praesidiumName || "-"} {t("secretaryReport.praesidiumSuffix")}{" "}
          {t("secretaryRoster.roleLabel.president")} {president?.name || "-"}{" "}
          {president?.baptismalName || ""} ({t("secretaryReport.signature")})
        </p>
        {/* The official form number stays off this sheet on purpose: the app's
            output is a transcription reference, not the Senatus form itself. */}
        <p className={styles.referenceNote}>{t("secretaryReport.referenceNote")}</p>
      </footer>
    </div>
  );
}
