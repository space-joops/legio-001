import { ACTIVITY_CATEGORIES, categoryTotal } from "@/lib/activityItems";
import { annualMemberDelta, formatAttendanceRatio } from "@/lib/annualReportUtils";
import { PRAYER_ITEMS } from "@/lib/constants";
import { OFFICER_ROLES, WEEKDAY_LABEL_KEYS } from "@/lib/monthlyReportUtils";
import type { AnnualReport, MemberCounts } from "@/lib/types";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./AnnualReportPrintView.module.css";

const MEMBER_ROWS: { key: keyof MemberCounts; labelKey: string }[] = [
  { key: "activeMale", labelKey: "secretaryRoster.activeMaleLabel" },
  { key: "activeFemale", labelKey: "secretaryRoster.activeFemaleLabel" },
  { key: "praetorium", labelKey: "secretaryRoster.praetoriumLabel" },
  { key: "auxiliaryMale", labelKey: "secretaryRoster.auxiliaryMaleLabel" },
  { key: "auxiliaryFemale", labelKey: "secretaryRoster.auxiliaryFemaleLabel" },
  { key: "adjutorium", labelKey: "secretaryRoster.adjutoriumLabel" },
];

const EVENT_KINDS = [
  { kind: "event", labelKey: "secretaryAnnual.eventsSection" },
  { kind: "formation", labelKey: "secretaryAnnual.formationsSection" },
  { kind: "other", labelKey: "secretaryAnnual.othersSection" },
] as const;

export function AnnualReportPrintView({ report }: { report: AnnualReport }) {
  const { t } = useTranslation();
  const agg = report.aggregate;
  const delta = annualMemberDelta(agg);
  const president = report.roster.officers.find((o) => o.role === "president");

  // 교구 지시사항 activity count is the sum of the five prayer figures — the
  // number the form prints beside the category.
  const dioceseItems = [
    { label: t("secretaryReport.massCommunionLabel"), value: agg.massCommunion },
    ...PRAYER_ITEMS.filter((i) => i.key !== "weekdayMass").map((item) => ({
      label: t(item.labelKey),
      value: agg.prayerCounts[item.key] ?? 0,
    })),
  ];
  const dioceseTotal = dioceseItems.reduce((sum, i) => sum + i.value, 0);

  const parishExtra = ACTIVITY_CATEGORIES.find((c) => c.key === "parish");
  const parishItems = [
    { label: t("counters.weekdayMass"), value: agg.prayerCounts.weekdayMass ?? 0 },
    ...(parishExtra?.items ?? []).map((item) => ({
      label: item.label,
      value: agg.activityTallies[item.key] ?? 0,
    })),
  ];
  const parishTotal = parishItems.reduce((sum, i) => sum + i.value, 0);

  const otherCategories = ACTIVITY_CATEGORIES.filter((c) => c.key !== "parish");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.orgLine}>{t("app.name")}</p>
        <h1 className={styles.title}>
          {t("secretaryAnnual.titlePrefix")} {report.reportNumber}
          {t("secretaryAnnual.titleSuffix")}
        </h1>
        <p className={styles.councilLine}>
          {report.parishName} {report.roster.praesidiumName} {report.roster.councilAffiliation}{" "}
          {t("secretaryReport.directlyUnder")}
        </p>
        <p className={styles.submitLine}>
          {t("secretaryAnnual.submittedOn")}: {report.submittedOn || "-"}
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>{t("secretaryAnnual.foundedOn")}</th>
                <td>{report.foundedOn || "-"}</td>
                <th>{t("secretaryAnnual.approvedOn")}</th>
                <td>{report.approvedOn || "-"}</td>
              </tr>
              <tr>
                <th>{t("secretaryAnnual.periodLabel")}</th>
                <td colSpan={3}>
                  {report.year}
                  {t("secretaryAnnual.yearSuffix")} · {t("week.sessionNumber")}{" "}
                  {agg.sessionRangeStart} ~ {agg.sessionRangeEnd} · {agg.weekCount}
                  {t("secretaryAnnual.weekSuffix")}
                </td>
              </tr>
              <tr>
                <th>{t("secretaryReport.meetingScheduleLabel")}</th>
                <td colSpan={3}>
                  {agg.meetingWeekday >= 0 ? t(WEEKDAY_LABEL_KEYS[agg.meetingWeekday]) : "-"}{" "}
                  {agg.meetingTime} · {agg.meetingLocation}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryAnnual.officersSection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("secretaryRoster.officersSection")}</th>
                <th>{t("secretaryRoster.nameLabel")}</th>
                <th>{t("secretaryAnnual.praesidiumAttendance")}</th>
                <th>{t("secretaryAnnual.councilAttendance")}</th>
                <th>{t("secretaryAnnual.officerTransfer")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>{t("secretaryRoster.spiritualDirectorNameLabel")}</th>
                <td colSpan={4}>
                  {report.roster.spiritualDirectorName}{" "}
                  {report.roster.spiritualDirectorBaptismalName}
                </td>
              </tr>
              <tr>
                <th>{t("secretaryAnnual.deputyDirector")}</th>
                <td colSpan={4}>
                  {report.deputyDirectorName} {report.deputyDirectorBaptismalName}
                </td>
              </tr>
              {OFFICER_ROLES.map((role) => {
                const officer = report.roster.officers.find((o) => o.role === role);
                const att = report.officerAttendance.find((a) => a.role === role);
                return (
                  <tr key={role}>
                    <th>{t(`secretaryRoster.roleLabel.${role}`)}</th>
                    <td>
                      {officer?.name} {officer?.baptismalName ? `(${officer.baptismalName})` : ""}
                    </td>
                    <td>
                      {formatAttendanceRatio(
                        att?.praesidiumPresent ?? 0,
                        att?.praesidiumTotal ?? 0
                      )}
                    </td>
                    <td>{att?.councilAttendance || "-"}</td>
                    <td>{att?.transferNote || ""}</td>
                  </tr>
                );
              })}
              <tr>
                <th>{t("secretaryAnnual.memberAttendance")}</th>
                <td colSpan={4}>
                  {formatAttendanceRatio(agg.membersPresent, agg.membersTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryAnnual.memberCountsSection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th>{t("secretaryAnnual.previousReport")}</th>
                <th>{t("secretaryAnnual.current")}</th>
                <th>{t("secretaryAnnual.change")}</th>
              </tr>
            </thead>
            <tbody>
              {MEMBER_ROWS.map(({ key, labelKey }) => (
                <tr key={key}>
                  <th>{t(labelKey)}</th>
                  <td>{agg.memberCountsStart[key]}</td>
                  <td>{agg.memberCountsEnd[key]}</td>
                  <td>{delta[key] > 0 ? `+${delta[key]}` : delta[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryReport.treasurySection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>{t("secretaryAnnual.broughtForward")}</th>
                <td>{agg.treasuryBroughtForward.toLocaleString()}</td>
                <th>{t("secretaryAnnual.incomeTotal")}</th>
                <td>{agg.treasuryIncome.toLocaleString()}</td>
              </tr>
              <tr>
                <th>{t("secretaryAnnual.expenseTotal")}</th>
                <td>{agg.treasuryExpense.toLocaleString()}</td>
                <th>{t("secretaryReport.balanceLabel")}</th>
                <td>{agg.treasuryBalance.toLocaleString()}</td>
              </tr>
              {report.incomeLines.map((line) => (
                <tr key={line.id}>
                  <th>{t("secretaryReport.incomeLabel")}</th>
                  <td colSpan={3}>
                    {line.label} {line.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {report.expenseLines.map((line) => (
                <tr key={line.id}>
                  <th>{t("secretaryReport.expenseLabel")}</th>
                  <td colSpan={3}>
                    {line.label} {line.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {EVENT_KINDS.map(({ kind, labelKey }) => {
        const rows = report.events.filter((e) => e.kind === kind);
        if (rows.length === 0) return null;
        return (
          <section key={kind} className={styles.section}>
            <h2 className={styles.sectionTitle}>{t(labelKey)}</h2>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("secretaryReport.agendaTitleLabel")}</th>
                    <th>{t("secretaryReport.agendaDateTimeLabel")}</th>
                    <th>{t("secretaryReport.agendaAttendanceNoteLabel")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.date}</td>
                      <td>{row.attendance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryAnnual.activitySection")}</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("secretaryAnnual.activityCategory")}</th>
                <th>{t("secretaryAnnual.activityCount")}</th>
                <th>{t("secretaryAnnual.activityDetail")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>{t("secretaryAnnual.dioceseCategory")}</th>
                <td>{dioceseTotal.toLocaleString()}</td>
                <td>{dioceseItems.map((i) => `${i.label}(${i.value})`).join(", ")}</td>
              </tr>
              <tr>
                <th>{t("secretaryAnnual.parishCategory")}</th>
                <td>{parishTotal.toLocaleString()}</td>
                <td>{parishItems.map((i) => `${i.label}(${i.value})`).join(", ")}</td>
              </tr>
              {otherCategories.map((category) => (
                <tr key={category.key}>
                  <th>{category.label}</th>
                  <td>{categoryTotal(agg.activityTallies, category).toLocaleString()}</td>
                  <td>
                    {category.items
                      .map((item) => `${item.label}(${agg.activityTallies[item.key] ?? 0})`)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("secretaryAnnual.operationSection")}</h2>
        <div className={styles.textBlock}>
          <span className={styles.textLabel}>{t("secretaryAnnual.operationNotes")}</span>
          <p className={styles.textValue}>{report.operationNotes || "-"}</p>
        </div>
        <div className={styles.textBlock}>
          <span className={styles.textLabel}>{t("secretaryAnnual.issueTitle")}</span>
          <p className={styles.textValue}>{report.issueTitle || "-"}</p>
        </div>
        <div className={styles.textBlock}>
          <span className={styles.textLabel}>{t("secretaryAnnual.issueBody")}</span>
          <p className={styles.textValue}>{report.issueBody || "-"}</p>
        </div>
        <div className={styles.textBlock}>
          <span className={styles.textLabel}>{t("secretaryAnnual.issueAction")}</span>
          <p className={styles.textValue}>{report.issueAction || "-"}</p>
        </div>
      </section>

      <footer className={styles.signature}>
        <p className={styles.signatureLine}>
          {report.roster.praesidiumName} {t("secretaryReport.praesidiumSuffix")}{" "}
          {t("secretaryRoster.roleLabel.president")} {president?.name || "-"}{" "}
          {president?.baptismalName || ""} ({t("secretaryReport.signature")})
        </p>
        <p className={styles.formNumber}>{t("secretaryAnnual.formNumber")}</p>
      </footer>
    </div>
  );
}
