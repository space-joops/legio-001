import { sumActivityTallies } from "./activityItems";
import { EMPTY_COUNTS, PRAYER_ITEMS } from "./constants";
import { generateId } from "./id";
import { EMPTY_MEMBER_COUNTS, OFFICER_ROLES, computeMassCommunion } from "./monthlyReportUtils";
import type {
  AnnualAggregate,
  AnnualReport,
  EvangelizationTallies,
  MemberCounts,
  MonthlyReport,
  OfficerAttendance,
  PraesidiumRoster,
  PrayerCounts,
} from "./types";

/**
 * Rolls a year of monthly reports up into the annual business report
 * (세나뚜스 양식 제7호).
 *
 * The form's per-category "활동횟수" is the plain sum of the items under it —
 * checked against a submitted report where 교구 지시사항 reads 13,846 and its
 * five prayer figures add to exactly that. So everything here is addition; the
 * only judgement calls are which month supplies the opening and closing
 * balances.
 */

const EMPTY_EVANGELIZATION: EvangelizationTallies = {
  baptism: { result: 0, target: 0 },
  returnToFaith: { result: 0, target: 0 },
  activeMember: { result: 0, target: 0 },
  praetorium: { result: 0, target: 0 },
};

export function reportsForYear(reports: MonthlyReport[], year: number): MonthlyReport[] {
  return reports
    .filter((r) => r.yearMonth.startsWith(`${year}-`))
    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

function sumPrayerCounts(reports: MonthlyReport[]): PrayerCounts {
  const out: PrayerCounts = { ...EMPTY_COUNTS };
  for (const report of reports) {
    for (const item of PRAYER_ITEMS) {
      out[item.key] += report.prayerCounts?.[item.key] ?? 0;
    }
  }
  return out;
}

function subtractCounts(end: MemberCounts, start: MemberCounts): MemberCounts {
  const out = { ...EMPTY_MEMBER_COUNTS };
  for (const key of Object.keys(out) as (keyof MemberCounts)[]) {
    out[key] = (end[key] ?? 0) - (start[key] ?? 0);
  }
  return out;
}

/**
 * Per-officer Pr. attendance across the year, printed as "48/52". Officer rows
 * are keyed by role (`officer:<role>`), which is stable even when the person
 * in the post changes, so a year's rows line up.
 */
function officerAttendanceForYear(
  reports: MonthlyReport[],
  roster: PraesidiumRoster
): OfficerAttendance[] {
  return OFFICER_ROLES.map((role) => {
    const personId = `officer:${role}`;
    let present = 0;
    let total = 0;
    for (const report of reports) {
      const record = report.attendanceRoll?.find((r) => r.personId === personId);
      if (!record) continue;
      const values = Object.values(record.sessions ?? {});
      present += values.filter(Boolean).length;
      total += values.length;
    }
    return {
      role,
      praesidiumPresent: present,
      praesidiumTotal: total,
      councilAttendance: "",
      transferNote: "",
    };
  }).filter(() => roster.officers.length > 0);
}

function memberAttendanceForYear(reports: MonthlyReport[]): { present: number; total: number } {
  let present = 0;
  let total = 0;
  for (const report of reports) {
    for (const record of report.attendanceRoll ?? []) {
      if (record.isOfficer) continue;
      const values = Object.values(record.sessions ?? {});
      present += values.filter(Boolean).length;
      total += values.length;
    }
  }
  return { present, total };
}

export function aggregateYear(reports: MonthlyReport[], year: number): AnnualAggregate {
  const months = reportsForYear(reports, year);
  const first = months[0];
  const last = months[months.length - 1];

  const sessionStarts = months.map((r) => r.sessionRangeStart).filter((n) => n > 0);
  const sessionEnds = months.map((r) => r.sessionRangeEnd).filter((n) => n > 0);
  const weekCount = months.reduce(
    (sum, r) => sum + Math.max(0, r.sessionRangeEnd - r.sessionRangeStart + 1),
    0
  );

  const members = memberAttendanceForYear(months);
  const roster = last?.roster;

  return {
    monthCount: months.length,
    sessionRangeStart: sessionStarts.length ? Math.min(...sessionStarts) : 0,
    sessionRangeEnd: sessionEnds.length ? Math.max(...sessionEnds) : 0,
    weekCount,
    meetingWeekday: last?.meetingWeekday ?? -1,
    meetingTime: last?.meetingTime ?? "",
    meetingLocation: last?.meetingLocation ?? "",
    prayerCounts: sumPrayerCounts(months),
    // Derived per month (weekday Mass + that month's Sundays), so sum the
    // monthly results rather than recomputing from yearly totals.
    massCommunion: months.reduce((sum, r) => sum + computeMassCommunion(r), 0),
    activityTallies: sumActivityTallies(months.map((r) => r.activityTallies ?? {})),
    officerAttendance: roster ? officerAttendanceForYear(months, roster) : [],
    membersPresent: members.present,
    membersTotal: members.total,
    memberCountsStart: first?.memberCountsPrevMonth ?? { ...EMPTY_MEMBER_COUNTS },
    memberCountsEnd: last?.memberCountsThisMonth ?? { ...EMPTY_MEMBER_COUNTS },
    treasuryBroughtForward: first?.treasury.broughtForward ?? 0,
    treasuryIncome: months.reduce((sum, r) => sum + (r.treasury?.income ?? 0), 0),
    treasuryExpense: months.reduce((sum, r) => sum + (r.treasury?.expense ?? 0), 0),
    treasuryBalance: last?.treasury.balance ?? 0,
    evangelization: last?.evangelization ?? EMPTY_EVANGELIZATION,
  };
}

/** Net change per member category over the year. */
export function annualMemberDelta(aggregate: AnnualAggregate): MemberCounts {
  return subtractCounts(aggregate.memberCountsEnd, aggregate.memberCountsStart);
}

export function createAnnualReport(
  year: number,
  roster: PraesidiumRoster,
  monthlyReports: MonthlyReport[],
  previous: AnnualReport | null
): AnnualReport {
  const now = new Date().toISOString();
  const aggregate = aggregateYear(monthlyReports, year);
  return {
    id: generateId(),
    year,
    reportNumber: previous ? previous.reportNumber + 1 : 0,
    submittedOn: "",
    parishName: "",
    foundedOn: previous?.foundedOn ?? "",
    approvedOn: previous?.approvedOn ?? "",
    deputyDirectorName: previous?.deputyDirectorName ?? "",
    deputyDirectorBaptismalName: previous?.deputyDirectorBaptismalName ?? "",
    roster: structuredClone(roster),
    aggregate,
    officerAttendance: aggregate.officerAttendance,
    incomeLines: [],
    expenseLines: [],
    events: [],
    operationNotes: "",
    issueTitle: "",
    issueBody: "",
    issueAction: "",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Re-runs the roll-up after the underlying monthly reports change. Officer rows
 * keep the council attendance and transfer notes the secretary typed — the app
 * has no source for those, so recomputing must not wipe them.
 */
export function refreshAggregate(
  report: AnnualReport,
  monthlyReports: MonthlyReport[]
): Partial<AnnualReport> {
  const aggregate = aggregateYear(monthlyReports, report.year);
  const kept = new Map(report.officerAttendance.map((o) => [o.role, o]));
  return {
    aggregate,
    officerAttendance: aggregate.officerAttendance.map((row) => ({
      ...row,
      councilAttendance: kept.get(row.role)?.councilAttendance ?? "",
      transferNote: kept.get(row.role)?.transferNote ?? "",
    })),
  };
}

export function sortAnnualReports(reports: AnnualReport[]): AnnualReport[] {
  return [...reports].sort((a, b) => b.year - a.year);
}

export function formatAttendanceRatio(present: number, total: number): string {
  return total > 0 ? `${present}/${total}` : "-";
}
