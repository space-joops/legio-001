import { dictionaries } from "@/i18n/dictionaries";
import { buildActivityLines } from "./activityReport";
import { PRAYER_ITEMS } from "./constants";
import { storage } from "./storage";
import { formatWon } from "./treasury";
import {
  OFFICER_ROLES,
  WEEKDAY_LABEL_KEYS,
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

/** RTF is 7-bit; every non-ASCII character goes out as a \uN escape. */
function esc(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "\\") out += "\\\\";
    else if (ch === "{" || ch === "}") out += `\\${ch}`;
    else if (ch === "\n") out += "\\line ";
    else if (code < 128) out += ch;
    // RTF's \u takes a signed 16-bit value, and the trailing "?" is the
    // fallback glyph for readers that can't handle the escape.
    else if (code <= 0xffff) out += `\\u${code < 32768 ? code : code - 65536}?`;
    else out += "?";
  }
  return out;
}

function para(text: string, opts: { bold?: boolean; align?: "l" | "c" | "r"; size?: number } = {}) {
  const align = `\\q${opts.align ?? "l"}`;
  const size = opts.size ? `\\fs${opts.size}` : "";
  const bold = opts.bold ? "\\b" : "";
  return `{\\pard${align}${bold}${size} ${esc(text)}\\par}`;
}

/** One table row. `widths` are cumulative-independent column widths in twips. */
function row(cells: string[], widths: number[], opts: { bold?: boolean } = {}): string {
  let x = 0;
  const borders = "\\clbrdrt\\brdrs\\clbrdrl\\brdrs\\clbrdrb\\brdrs\\clbrdrr\\brdrs";
  const defs = widths.map((w) => {
    x += w;
    return `${borders}\\cellx${x}`;
  });
  const body = cells
    .map((c) => `{\\intbl\\qc${opts.bold ? "\\b" : ""} ${esc(c)}\\cell}`)
    .join("");
  return `\\trowd\\trgaph60${defs.join("")}${body}\\row`;
}

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
      `7. ${sr.treasurySection} :  ${sr.broughtForwardLabel} ${formatWon(report.treasury.broughtForward)}원` +
        `   ${sr.incomeLabel} ${formatWon(report.treasury.income)}원` +
        `   ${sr.expenseLabel} ${formatWon(report.treasury.expense)}원` +
        `   ${sr.balanceLabel} ${formatWon(report.treasury.balance)}원`
    )
  );
  body.push(para(`   ${sr.expenseBreakdownLabel} : ${report.treasury.expenseBreakdown || ""}`));
  body.push(para(""));

  body.push(para(`8. ${sr.activityDetailSection}`));
  // Same builder the screen and print view use, so all three agree.
  const lines = buildActivityLines(report, storage.getActivityItems(), {
    massCommunion: sr.massCommunionLabel,
    prayer: Object.fromEntries(PRAYER_ITEMS.map((i) => [i.key, lookup(dict, i.labelKey)])),
  });
  body.push(para(`* ${sr.dioceseInstructionsLabel} : ${report.dioceseInstructions}`));
  body.push(para(`  ${lines.diocese}`));
  body.push(para(`* ${sr.parishInstructionsLabel} : ${report.parishInstructions}  ${lines.parish}`));
  body.push(para(`* ${sr.councilInstructionsLabel} : ${report.councilInstructions}`));
  body.push(para(`* ${sr.activitySummary} : ${report.activitySummary}`));
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

  // fcharset129 = Hangul, so 한글 picks a Korean face even if Malgun Gothic is absent.
  return (
    `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset129 Malgun Gothic;}}` +
    `\\viewkind4\\uc1\\f0\\fs22\n${body.join("\n")}\n}`
  );
}

/** Resolves a dotted dictionary key the same way useTranslation does. */
function lookup(dict: (typeof dictionaries)[Language], key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], dict);
  return typeof value === "string" ? value : key;
}
