import { dictionaries } from "@/i18n/dictionaries";
import { ACTIVITY_CATEGORIES, categoryTotal } from "./activityItems";
import { annualMemberDelta, formatAttendanceRatio } from "./annualReportUtils";
import { PRAYER_ITEMS } from "./constants";
import { OFFICER_ROLES, WEEKDAY_LABEL_KEYS } from "./monthlyReportUtils";
import { lookup, para, row, wrapDocument } from "./rtf";
import type { AnnualReport, Language, MemberCounts } from "./types";

/** Same approach as the monthly builder — see src/lib/rtf.ts for why RTF. */

const MEMBER_ROWS: { key: keyof MemberCounts; labelKey: string }[] = [
  { key: "activeMale", labelKey: "secretaryRoster.activeMaleLabel" },
  { key: "activeFemale", labelKey: "secretaryRoster.activeFemaleLabel" },
  { key: "praetorium", labelKey: "secretaryRoster.praetoriumLabel" },
  { key: "auxiliaryMale", labelKey: "secretaryRoster.auxiliaryMaleLabel" },
  { key: "auxiliaryFemale", labelKey: "secretaryRoster.auxiliaryFemaleLabel" },
  { key: "adjutorium", labelKey: "secretaryRoster.adjutoriumLabel" },
];

export function buildAnnualReportRtf(report: AnnualReport, language: Language): string {
  const dict = dictionaries[language];
  const sa = dict.secretaryAnnual;
  const sr = dict.secretaryReport;
  const rosterDict = dict.secretaryRoster;
  const agg = report.aggregate;
  const delta = annualMemberDelta(agg);
  const president = report.roster.officers.find((o) => o.role === "president");
  const weekday =
    agg.meetingWeekday >= 0 ? lookup(dict, WEEKDAY_LABEL_KEYS[agg.meetingWeekday]) : "-";

  const body: string[] = [];

  body.push(para(dict.app.name, { align: "c", bold: true, size: 32 }));
  body.push(
    para(`${sa.titlePrefix} ${report.reportNumber}${sa.titleSuffix}`, {
      align: "c",
      bold: true,
      size: 40,
    })
  );
  body.push(
    para(
      `${report.parishName}   ${report.roster.praesidiumName}   ` +
        `${report.roster.councilAffiliation} ${sr.directlyUnder}`,
      { align: "c" }
    )
  );
  body.push(para(`${sa.submittedOn}: ${report.submittedOn || ""}`, { align: "r" }));
  body.push(para(""));

  body.push(
    para(
      `${sa.foundedOn} : ${report.foundedOn || ""}      ${sa.approvedOn} : ${report.approvedOn || ""}`
    )
  );
  body.push(
    para(
      `${sa.periodLabel} : ${report.year}${sa.yearSuffix}   ` +
        `${dict.week.sessionNumber} ${agg.sessionRangeStart} ~ ${agg.sessionRangeEnd}   ` +
        `${agg.weekCount}${sa.weekSuffix}`
    )
  );
  body.push(
    para(
      `${sr.meetingScheduleLabel} : ${weekday} ${agg.meetingTime}   ` +
        `${sr.meetingLocationLabel} : ${agg.meetingLocation}`
    )
  );
  body.push(para(""));

  // 간부 표
  body.push(para(sa.officersSection));
  const officerWidths = [1900, 2600, 1700, 1700, 2100];
  body.push(
    row(
      [
        rosterDict.officersSection,
        rosterDict.nameLabel,
        sa.praesidiumAttendance,
        sa.councilAttendance,
        sa.officerTransfer,
      ],
      officerWidths,
      { bold: true }
    )
  );
  body.push(
    row(
      [
        rosterDict.spiritualDirectorNameLabel,
        `${report.roster.spiritualDirectorName} ${report.roster.spiritualDirectorBaptismalName}`,
        "",
        "",
        "",
      ],
      officerWidths
    )
  );
  body.push(
    row(
      [
        sa.deputyDirector,
        `${report.deputyDirectorName} ${report.deputyDirectorBaptismalName}`,
        "",
        "",
        "",
      ],
      officerWidths
    )
  );
  for (const role of OFFICER_ROLES) {
    const officer = report.roster.officers.find((o) => o.role === role);
    const att = report.officerAttendance.find((a) => a.role === role);
    body.push(
      row(
        [
          rosterDict.roleLabel[role],
          `${officer?.name ?? ""}${officer?.baptismalName ? `(${officer.baptismalName})` : ""}`,
          formatAttendanceRatio(att?.praesidiumPresent ?? 0, att?.praesidiumTotal ?? 0),
          att?.councilAttendance ?? "",
          att?.transferNote ?? "",
        ],
        officerWidths
      )
    );
  }
  body.push(
    row(
      [
        sa.memberAttendance,
        formatAttendanceRatio(agg.membersPresent, agg.membersTotal),
        "",
        "",
        "",
      ],
      officerWidths
    )
  );
  body.push(para(""));

  // 단원 수
  body.push(para(sa.memberCountsSection));
  const memberWidths = [3200, 2000, 2000, 2000];
  body.push(row(["", sa.previousReport, sa.current, sa.change], memberWidths, { bold: true }));
  for (const { key, labelKey } of MEMBER_ROWS) {
    const d = delta[key];
    body.push(
      row(
        [
          lookup(dict, labelKey),
          String(agg.memberCountsStart[key]),
          String(agg.memberCountsEnd[key]),
          d > 0 ? `+${d}` : String(d),
        ],
        memberWidths
      )
    );
  }
  body.push(para(""));

  // 회계
  body.push(
    para(
      `${sr.treasurySection} :  ${sa.broughtForward} ${agg.treasuryBroughtForward.toLocaleString()}` +
        `   ${sa.incomeTotal} ${agg.treasuryIncome.toLocaleString()}` +
        `   ${sa.expenseTotal} ${agg.treasuryExpense.toLocaleString()}` +
        `   ${sr.balanceLabel} ${agg.treasuryBalance.toLocaleString()}`
    )
  );
  for (const line of report.incomeLines) {
    body.push(para(`   ${sr.incomeLabel} - ${line.label} : ${line.amount.toLocaleString()}`));
  }
  for (const line of report.expenseLines) {
    body.push(para(`   ${sr.expenseLabel} - ${line.label} : ${line.amount.toLocaleString()}`));
  }
  body.push(para(""));

  // 행사 / 교육 및 피정 / 기타
  for (const [kind, label] of [
    ["event", sa.eventsSection],
    ["formation", sa.formationsSection],
    ["other", sa.othersSection],
  ] as const) {
    const rows = report.events.filter((e) => e.kind === kind);
    if (rows.length === 0) continue;
    body.push(para(label));
    const w = [4400, 2400, 2400];
    body.push(
      row([sr.agendaTitleLabel, sr.agendaDateTimeLabel, sr.agendaAttendanceNoteLabel], w, {
        bold: true,
      })
    );
    for (const r of rows) body.push(row([r.title, r.date, r.attendance], w));
    body.push(para(""));
  }

  // 활동 사항 — 종목 / 활동횟수 / 활동 내용
  body.push(para(sa.activitySection));
  const activityWidths = [2600, 1500, 5500];
  body.push(
    row([sa.activityCategory, sa.activityCount, sa.activityDetail], activityWidths, { bold: true })
  );

  const dioceseItems = [
    { label: sr.massCommunionLabel, value: agg.massCommunion },
    ...PRAYER_ITEMS.filter((i) => i.key !== "weekdayMass").map((item) => ({
      label: lookup(dict, item.labelKey),
      value: agg.prayerCounts[item.key] ?? 0,
    })),
  ];
  body.push(
    row(
      [
        sa.dioceseCategory,
        String(dioceseItems.reduce((s, i) => s + i.value, 0)),
        dioceseItems.map((i) => `${i.label}(${i.value})`).join(", "),
      ],
      activityWidths
    )
  );

  const parishCategory = ACTIVITY_CATEGORIES.find((c) => c.key === "parish");
  const parishItems = [
    { label: dict.counters.weekdayMass, value: agg.prayerCounts.weekdayMass ?? 0 },
    ...(parishCategory?.items ?? []).map((item) => ({
      label: item.label,
      value: agg.activityTallies[item.key] ?? 0,
    })),
  ];
  body.push(
    row(
      [
        sa.parishCategory,
        String(parishItems.reduce((s, i) => s + i.value, 0)),
        parishItems.map((i) => `${i.label}(${i.value})`).join(", "),
      ],
      activityWidths
    )
  );

  for (const category of ACTIVITY_CATEGORIES.filter((c) => c.key !== "parish")) {
    body.push(
      row(
        [
          category.label,
          String(categoryTotal(agg.activityTallies, category)),
          category.items
            .map((item) => `${item.label}(${agg.activityTallies[item.key] ?? 0})`)
            .join(", "),
        ],
        activityWidths
      )
    );
  }
  body.push(para(""));

  body.push(para(sa.operationSection));
  body.push(para(`${sa.operationNotes} : ${report.operationNotes}`));
  body.push(para(`0. ${sa.issueTitle} : ${report.issueTitle}`));
  body.push(para(`0. ${sa.issueBody} : ${report.issueBody}`));
  body.push(para(`0. ${sa.issueAction} : ${report.issueAction}`));
  body.push(para(""));

  body.push(
    para(
      `${report.roster.praesidiumName} ${sr.praesidiumSuffix}  ${rosterDict.roleLabel.president}  ` +
        `${president?.name ?? ""}  ${president?.baptismalName ?? ""}  (${sr.signature})`,
      { align: "c", bold: true }
    )
  );
  body.push(para(sa.formNumber, { align: "r", size: 18 }));

  return wrapDocument(body);
}
