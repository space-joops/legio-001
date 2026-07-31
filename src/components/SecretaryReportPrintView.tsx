import { PRAYER_ITEMS } from "@/lib/constants";
import { OFFICER_ROLES, WEEKDAY_LABEL_KEYS, formatYearMonthLabel } from "@/lib/monthlyReportUtils";
import type { MemberCounts, MonthlyReport } from "@/lib/types";
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

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.textBlock}>
      <span className={styles.textLabel}>{label}</span>
      <p className={styles.textValue}>{value || "-"}</p>
    </div>
  );
}

export function SecretaryReportPrintView({ report }: { report: MonthlyReport }) {
  const { t, language } = useTranslation();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("secretaryReport.title")}</h1>
        <p className={styles.yearMonth}>{formatYearMonthLabel(report.yearMonth, language)}</p>
        <p className={styles.councilLine}>{report.roster.councilAffiliation}</p>
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
                <td>{report.treasury.broughtForward}</td>
                <th>{t("secretaryReport.incomeLabel")}</th>
                <td>{report.treasury.income}</td>
              </tr>
              <tr>
                <th>{t("secretaryReport.expenseLabel")}</th>
                <td>{report.treasury.expense}</td>
                <th>{t("secretaryReport.balanceLabel")}</th>
                <td>{report.treasury.balance}</td>
              </tr>
              <tr>
                <th>{t("secretaryReport.expenseBreakdownLabel")}</th>
                <td colSpan={3}>{report.treasury.expenseBreakdown || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.prayerSection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {PRAYER_ITEMS.map((item) => (
                  <th key={item.key}>{t(item.labelKey)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {PRAYER_ITEMS.map((item) => (
                  <td key={item.key}>{report.prayerCounts[item.key]}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.instructionsSection")}</h2>
        <TextBlock label={t("secretaryReport.dioceseInstructionsLabel")} value={report.dioceseInstructions} />
        <TextBlock label={t("secretaryReport.parishInstructionsLabel")} value={report.parishInstructions} />
        <TextBlock label={t("secretaryReport.councilInstructionsLabel")} value={report.councilInstructions} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.activitySummarySection")}</h2>
        <TextBlock label={t("secretaryReport.activitySummary")} value={report.activitySummary} />
        <TextBlock
          label={t("secretaryReport.cumulativeEvangelizationLabel")}
          value={report.cumulativeEvangelization}
        />
        <TextBlock label={t("secretaryReport.otherNotesLabel")} value={report.otherNotes} />
      </section>
    </div>
  );
}
