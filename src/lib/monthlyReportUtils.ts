import { dictionaries } from "@/i18n/dictionaries";
import { EMPTY_COUNTS, PRAYER_ITEMS } from "./constants";
import { generateId } from "./id";
import type {
  Language,
  MemberCounts,
  MonthlyReport,
  OfficerRole,
  PraesidiumRoster,
  PrayerCounts,
  WeeklyReport,
} from "./types";

export const OFFICER_ROLES: OfficerRole[] = ["president", "vicePresident", "secretary", "treasurer"];

export const EMPTY_MEMBER_COUNTS: MemberCounts = {
  activeMale: 0,
  activeFemale: 0,
  praetorium: 0,
  auxiliaryMale: 0,
  auxiliaryFemale: 0,
  adjutorium: 0,
};

export function createDefaultRoster(): PraesidiumRoster {
  return {
    councilAffiliation: "",
    spiritualDirectorName: "",
    spiritualDirectorBaptismalName: "",
    officers: OFFICER_ROLES.map((role) => ({
      role,
      name: "",
      baptismalName: "",
      appointedDate: "",
      note: "",
    })),
    memberCounts: { ...EMPTY_MEMBER_COUNTS },
  };
}

function reportYearMonth(report: WeeklyReport): string {
  const iso = report.submittedAt ?? report.meetingDateTime;
  return iso.slice(0, 7);
}

export function sumPrayerCountsForMonth(history: WeeklyReport[], yearMonth: string): PrayerCounts {
  const matching = history.filter(
    (report) => report.status === "submitted" && reportYearMonth(report) === yearMonth
  );
  const sums: PrayerCounts = { ...EMPTY_COUNTS };
  for (const report of matching) {
    for (const item of PRAYER_ITEMS) {
      sums[item.key] += report.counts[item.key] ?? 0;
    }
  }
  return sums;
}

function sessionRangeForMonth(history: WeeklyReport[], yearMonth: string): { start: number; end: number } {
  const numbers = history
    .filter((report) => report.status === "submitted" && reportYearMonth(report) === yearMonth)
    .map((report) => report.sessionNumber);
  if (numbers.length === 0) return { start: 0, end: 0 };
  return { start: Math.min(...numbers), end: Math.max(...numbers) };
}

export function createMonthlyReport(
  yearMonth: string,
  roster: PraesidiumRoster,
  previousReport: MonthlyReport | null,
  history: WeeklyReport[]
): MonthlyReport {
  const now = new Date().toISOString();
  const range = sessionRangeForMonth(history, yearMonth);
  const broughtForward = previousReport?.treasury.balance ?? 0;
  return {
    id: generateId(),
    yearMonth,
    sessionRangeStart: range.start,
    sessionRangeEnd: range.end,
    meetingWeekday: "",
    meetingTime: "",
    meetingLocation: "",
    attendance: { officersPresent: 0, officersTotal: 0, membersPresent: 0, membersTotal: 0 },
    roster: structuredClone(roster),
    memberCountsPrevMonth: previousReport
      ? { ...previousReport.memberCountsThisMonth }
      : { ...EMPTY_MEMBER_COUNTS },
    memberCountsThisMonth: { ...roster.memberCounts },
    memberCountsIncrease: { ...EMPTY_MEMBER_COUNTS },
    memberCountsDecrease: { ...EMPTY_MEMBER_COUNTS },
    agendaItems: [],
    treasury: { broughtForward, income: 0, expense: 0, balance: broughtForward, expenseBreakdown: "" },
    prayerCounts: sumPrayerCountsForMonth(history, yearMonth),
    dioceseInstructions: "",
    parishInstructions: "",
    councilInstructions: "",
    activitySummary: "",
    cumulativeEvangelization: "",
    otherNotes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function sortMonthlyReports(reports: MonthlyReport[]): MonthlyReport[] {
  return [...reports].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
}

export function formatYearMonthLabel(yearMonth: string, language: Language): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  return language === "ko" ? `${year}년 ${month}월` : `${year}-${String(month).padStart(2, "0")}`;
}

export function formatMonthlyShareText(report: MonthlyReport, language: Language): string {
  const dict = dictionaries[language];
  const title = `${dict.app.shortName} ${formatYearMonthLabel(report.yearMonth, language)} ${dict.secretaryReport.title}`;
  const prayerLines = PRAYER_ITEMS.map(
    (item) => `${dict.counters[item.key]}: ${report.prayerCounts[item.key]}`
  );
  const attendanceLine = `${dict.secretaryReport.attendance}: ${dict.secretaryReport.officers} ${report.attendance.officersPresent}/${report.attendance.officersTotal}, ${dict.secretaryReport.members} ${report.attendance.membersPresent}/${report.attendance.membersTotal}`;
  const treasuryLine = `${dict.secretaryReport.treasuryBalance}: ${report.treasury.balance}`;
  const noteLines = report.activitySummary.trim()
    ? ["", `${dict.secretaryReport.activitySummary}: ${report.activitySummary.trim()}`]
    : [];
  return [title, "", attendanceLine, ...prayerLines, treasuryLine, ...noteLines].join("\n");
}
