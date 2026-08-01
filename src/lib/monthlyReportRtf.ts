import { dictionaries } from "@/i18n/dictionaries";
import { formatActivitySummaryLine } from "./activityItems";
import { PRAYER_ITEMS } from "./constants";
import { lookup, para, row, wrapDocument } from "./rtf";
import {
  OFFICER_ROLES,
  WEEKDAY_LABEL_KEYS,
  computeMassCommunion,
  formatYearMonthLabel,
} from "./monthlyReportUtils";
import type { EvangelizationTallies, Language, MemberCounts, MonthlyReport } from "./types";

/**
 * Builds the monthly report as RTF so it opens — and stays editable — in 한글.
 *
 * A real .hwp can't be produced here: it's an OLE compound file of zlib'd binary
 * records with no JS writer, and this app has no backend. RTF is the format both
 * 한글 and Word open natively, needs no library, and can be verified by
 * converting it with LibreOffice.
 */

const MEMBER_ROWS: { key: keyof MemberCounts; labelKey: string }[] = [
  { key: "activeMale", labelKey: "secretaryRoster.activeMaleLabel" },
  { key: "activeFemale", labelKey: "secretaryRoster.activeFemaleLabel" },
  { key: "praetorium", labelKey: "secretaryRoster.praetoriumLabel" },
  { key: "auxiliaryMale", labelKey: "secretaryRoster.auxiliaryMaleLabel" },
  { key: "auxiliaryFemale", labelKey: "secretaryRoster.auxiliaryFemaleLabel" },
  { key: "adjutorium", labelKey: "secretaryRoster.adjutoriumLabel" },
];

const EVANGELIZATION_ROWS: { key: keyof EvangelizationTallies; labelKey: string }[] = [
  { key: "baptism", labelKey: "secretaryReport.evangelizationBaptism" },
  { key: "returnToFaith", labelKey: "secretaryReport.evangelizationReturn" },
  { key: "activeMember", labelKey: "secretaryReport.evangelizationActiveMember" },
  { key: "praetorium", labelKey: "secretaryReport.evangelizationPraetorium" },
];

export function buildMonthlyReportRtf(report: MonthlyReport, language: Language): string {
  const dict = dictionaries[language];
  const sr = dict.secretaryReport;
  const rosterDict = dict.secretaryRoster;
  const president = report.roster.officers.find((o) => o.role === "president");
  // >= 0, not truthiness: Sunday is 0.
  const weekday =
    report.meetingWeekday >= 0 ? lookup(dict, WEEKDAY_LABEL_KEYS[report.meetingWeekday]) : "-";

  const body: string[] = [];

  body.push(para(dict.app.name, { align: "c", bold: true, size: 32 }));
  body.push(para(sr.title, { align: "c", bold: true, size: 40 }));
  body.push(
    para(
      `${formatYearMonthLabel(report.yearMonth, language)} ${sr.asOfSuffix}   ` +
        `${dict.week.sessionNumber} ${report.sessionRangeStart} ~ ${report.sessionRangeEnd}`,
      { align: "c" }
    )
  );
  body.push(para(""));

  body.push(
    para(
      `1. ${sr.meetingScheduleLabel} : ${sr.everyWeek} ${weekday} ${report.meetingTime || ""}` +
        `      2. ${sr.meetingLocationLabel} : ${report.meetingLocation || ""}`
    )
  );
  body.push(
    para(
      `3. ${sr.attendanceSection} : ${sr.officers} ${report.attendance.officersPresent} / ${report.attendance.officersTotal}` +
        `   ${sr.members} ${report.attendance.membersPresent} / ${report.attendance.membersTotal}`
    )
  );
  body.push(
    para(
      `4. ${rosterDict.officersSection} : ( ${rosterDict.spiritualDirectorNameLabel} : ` +
        `${report.roster.spiritualDirectorName} ${report.roster.spiritualDirectorBaptismalName} )`
    )
  );

  const officerWidths = [1700, 2300, 2000, 2300, 2300];
  body.push(
    row(
      [
        sr.rosterSection,
        rosterDict.nameLabel,
        rosterDict.baptismalNameLabel,
        rosterDict.appointedDateLabel,
        rosterDict.noteLabel,
      ],
      officerWidths,
      { bold: true }
    )
  );
  for (const role of OFFICER_ROLES) {
    const officer = report.roster.officers.find((o) => o.role === role);
    if (!officer) continue;
    body.push(
      row(
        [
          rosterDict.roleLabel[role],
          officer.name,
          officer.baptismalName,
          officer.appointedDate,
          officer.note,
        ],
        officerWidths
      )
    );
  }
  body.push(para(""));

  body.push(para(`5. ${sr.memberCountsSection}`));
  const memberWidths = [3000, 1800, 1800, 1600, 1600];
  body.push(
    row(
      ["", sr.prevMonthLabel, sr.thisMonthLabel, sr.increaseLabel, sr.decreaseLabel],
      memberWidths,
      { bold: true }
    )
  );
  for (const { key, labelKey } of MEMBER_ROWS) {
    body.push(
      row(
        [
          lookup(dict, labelKey),
          String(report.memberCountsPrevMonth[key]),
          String(report.memberCountsThisMonth[key]),
          String(report.memberCountsIncrease[key]),
          String(report.memberCountsDecrease[key]),
        ],
        memberWidths
      )
    );
  }
  // The official form totals 남+여 for 행동단원 and 협조단원.
  for (const { label, male, female } of [
    { label: sr.activeSubtotalLabel, male: "activeMale", female: "activeFemale" },
    { label: sr.auxiliarySubtotalLabel, male: "auxiliaryMale", female: "auxiliaryFemale" },
  ] as const) {
    body.push(
      row(
        [
          label,
          String(report.memberCountsPrevMonth[male] + report.memberCountsPrevMonth[female]),
          String(report.memberCountsThisMonth[male] + report.memberCountsThisMonth[female]),
          String(report.memberCountsIncrease[male] + report.memberCountsIncrease[female]),
          String(report.memberCountsDecrease[male] + report.memberCountsDecrease[female]),
        ],
        memberWidths,
        { bold: true }
      )
    );
  }
  body.push(para(""));

  body.push(para(`6. ${sr.agendaSection}`));
  if (report.agendaItems.length === 0) {
    body.push(para("-"));
  } else {
    const agendaWidths = [1200, 2600, 1600, 2000, 1600, 1400];
    body.push(
      row(
        [
          sr.agendaStatusLabel,
          sr.agendaTitleLabel,
          sr.agendaOrganizerLabel,
          sr.agendaDateTimeLabel,
          sr.agendaLocationLabel,
          sr.agendaAttendanceNoteLabel,
        ],
        agendaWidths,
        { bold: true }
      )
    );
    for (const item of report.agendaItems) {
      body.push(
        row(
          [item.status, item.title, item.organizer, item.dateTime, item.location, item.attendanceNote],
          agendaWidths
        )
      );
    }
  }
  body.push(para(""));

  body.push(
    para(
      `7. ${sr.treasurySection} :  ${sr.broughtForwardLabel} ${report.treasury.broughtForward.toLocaleString()}` +
        `   ${sr.incomeLabel} ${report.treasury.income.toLocaleString()}` +
        `   ${sr.expenseLabel} ${report.treasury.expense.toLocaleString()}` +
        `   ${sr.balanceLabel} ${report.treasury.balance.toLocaleString()}`
    )
  );
  body.push(para(`   ${sr.expenseBreakdownLabel} : ${report.treasury.expenseBreakdown || ""}`));
  body.push(para(""));

  body.push(para(`8. ${sr.activityDetailSection}`));
  const dioceseTally = [
    `${sr.massCommunionLabel}(${computeMassCommunion(report)})`,
    ...PRAYER_ITEMS.filter((i) => i.key !== "weekdayMass").map(
      (item) => `${lookup(dict, item.labelKey)}(${report.prayerCounts[item.key] ?? 0})`
    ),
  ].join(",");
  body.push(para(`* ${sr.dioceseInstructionsLabel} : ${report.dioceseInstructions}`));
  body.push(para(`  ${dioceseTally}`));
  body.push(
    para(
      `* ${sr.parishInstructionsLabel} : ${report.parishInstructions}` +
        `  ${dict.counters.weekdayMass}(${report.prayerCounts.weekdayMass ?? 0})`
    )
  );
  body.push(para(`* ${sr.councilInstructionsLabel} : ${report.councilInstructions}`));
  const activityLine = formatActivitySummaryLine(report.activityTallies ?? {});
  body.push(para(`* ${sr.activitySummary} : ${activityLine}`));
  if (report.activitySummary.trim()) body.push(para(`  ${report.activitySummary}`));
  const evangelization = EVANGELIZATION_ROWS.map(({ key, labelKey }) => {
    const tally = report.evangelization?.[key];
    return `${lookup(dict, labelKey)}(${tally?.result ?? 0}/${tally?.target ?? 0})`;
  }).join(", ");
  body.push(para(`* ${sr.cumulativeEvangelizationLabel} : ${evangelization}`));
  if (report.cumulativeEvangelization.trim()) {
    body.push(para(`  ${report.cumulativeEvangelization}`));
  }
  body.push(para(""));

  body.push(para(`9. ${sr.otherNotesLabel} : ${report.otherNotes}`));
  body.push(para(""));
  body.push(
    para(`(${rosterDict.councilAffiliationLabel}) ${report.roster.councilAffiliation} ${sr.directlyUnder}`, {
      align: "c",
    })
  );
  body.push(
    para(
      `${report.roster.praesidiumName} ${sr.praesidiumSuffix}  ${rosterDict.roleLabel.president}  ` +
        `${president?.name ?? ""}  ${president?.baptismalName ?? ""}  (${sr.signature})`,
      { align: "c", bold: true }
    )
  );
  body.push(para(sr.formNumber, { align: "r", size: 18 }));

  return wrapDocument(body);
}

