import { buildActivityLines } from "@/lib/activityReport";
import { PRAYER_ITEMS } from "@/lib/constants";
import {
  OFFICER_ROLE_LABEL,
  OFFICER_ROLES,
  WEEKDAY_LABELS,
  formatYearMonthLabel,
} from "@/lib/monthlyReportUtils";
import { storage } from "@/lib/storage";
import { formatWon } from "@/lib/treasury";
import type {
  EvangelizationTallies,
  MemberCounts,
  MonthlyReport,
} from "@/lib/types";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./SecretaryReportPrintView.module.css";

/**
 * 월례 보고서를 공식 양식 그대로 A4 한 장에 그린다.
 *
 * 서울 무염시태 세나뚜스 양식 제6호(2024년 12월 개정)를 따른다.
 *
 * 화면 미리보기·인쇄·PDF·이미지가 **전부 이 컴포넌트 하나에서 나온다.** 각각
 * 따로 만들면 어느 하나가 조금씩 달라지는데, 실제로 제출되는 문서라 그러면 안
 * 되기 때문이다. `compact` 로 미리보기와 실제 출력 크기만 구분한다.
 */

const MEMBER_COUNT_ROWS: { key: keyof MemberCounts; label: string }[] = [
  { key: "activeMale", label: "행동단원(남)" },
  { key: "activeFemale", label: "행동단원(여)" },
  { key: "praetorium", label: "쁘레또리움 단원" },
  { key: "auxiliaryMale", label: "협조단원(남)" },
  { key: "auxiliaryFemale", label: "협조단원(여)" },
  { key: "adjutorium", label: "아듀또리움 단원" },
];

const EVANGELIZATION_ROWS: {
  key: keyof EvangelizationTallies;
  label: string;
}[] = [
  { key: "baptism", label: "영세·외짝" },
  { key: "returnToFaith", label: "냉담회두" },
  { key: "activeMember", label: "행동단원" },
  { key: "praetorium", label: "쁘레또리움" },
];

/** 남·여를 합친 "계" 행. 공식 양식이 행동단원과 협조단원에만 계를 둔다. */
const SUBTOTAL_ROWS: {
  label: string;
  male: keyof MemberCounts;
  female: keyof MemberCounts;
}[] = [
  { label: "행동단원 계", male: "activeMale", female: "activeFemale" },
  { label: "협조단원 계", male: "auxiliaryMale", female: "auxiliaryFemale" },
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
  const { t } = useTranslation();
  const president = report.roster.officers.find((officer) => officer.role === "president");

  // All three outputs (this view, the editor and the RTF) go through the same
  // builder so the strings can't drift apart.
  const lines = buildActivityLines(report, storage.getActivityItems());

  const evangelizationLine = EVANGELIZATION_ROWS.map(({ key, label }) => {
    const tally = report.evangelization?.[key];
    return `${label}(${tally?.result ?? 0}/${tally?.target ?? 0})`;
  }).join(", ");

  return (
    <div className={`${styles.page} ${compact ? styles.compact : ""}`}>
      <header className={styles.header}>
        <p className={styles.orgLine}>{t("app.name")}</p>
        <h1 className={styles.title}>{t("secretaryReport.title")}</h1>
        <p className={styles.yearMonth}>
          {formatYearMonthLabel(report.yearMonth)} {t("secretaryReport.asOfSuffix")} · {t("week.sessionNumber")}{" "}
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
                  {report.meetingWeekday >= 0 ? WEEKDAY_LABELS[report.meetingWeekday] : "-"}
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
                    <th>{OFFICER_ROLE_LABEL[role]}</th>
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
              {MEMBER_COUNT_ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <th>{label}</th>
                  <td>{report.memberCountsPrevMonth[key]}</td>
                  <td>{report.memberCountsThisMonth[key]}</td>
                  <td>{report.memberCountsIncrease[key]}</td>
                  <td>{report.memberCountsDecrease[key]}</td>
                </tr>
              ))}
              {/* The official form carries a 계 column for 행동단원 and 협조단원;
                  derived from 남+여 so nobody has to keep it in sync by hand. */}
              {SUBTOTAL_ROWS.map(({ label, male, female }) => (
                <tr key={label} className={styles.subtotalRow}>
                  <th>{label}</th>
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
          {OFFICER_ROLE_LABEL.president} {president?.name || "-"}{" "}
          {president?.baptismalName || ""} ({t("secretaryReport.signature")})
        </p>
        {/* The official form number stays off this sheet on purpose: the app's
            output is a transcription reference, not the Senatus form itself. */}
        <p className={styles.referenceNote}>{t("secretaryReport.referenceNote")}</p>
      </footer>
    </div>
  );
}
