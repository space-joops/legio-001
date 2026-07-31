import { dictionaries } from "@/i18n/dictionaries";
import { EMPTY_COUNTS, PRAYER_ITEMS } from "./constants";
import { generateId } from "./id";
import type {
  AttendanceRecord,
  Language,
  MemberCounts,
  MemberRoster,
  MonthlyReport,
  OfficerRole,
  PraesidiumRoster,
  PrayerCounts,
  WeeklyReport,
} from "./types";

export const OFFICER_ROLES: OfficerRole[] = ["president", "vicePresident", "secretary", "treasurer"];

const OFFICER_ROLE_LABEL_KO: Record<OfficerRole, string> = {
  president: "단장",
  vicePresident: "부단장",
  secretary: "서기",
  treasurer: "회계",
};

export const EMPTY_MEMBER_COUNTS: MemberCounts = {
  activeMale: 0,
  activeFemale: 0,
  praetorium: 0,
  auxiliaryMale: 0,
  auxiliaryFemale: 0,
  adjutorium: 0,
};

export function createDefaultMemberRoster(): MemberRoster {
  return {
    activeMale: [],
    activeFemale: [],
    praetorium: [],
    auxiliaryMale: [],
    auxiliaryFemale: [],
    adjutorium: [],
  };
}

export function deriveMemberCounts(memberRoster: MemberRoster): MemberCounts {
  return {
    activeMale: memberRoster.activeMale.length,
    activeFemale: memberRoster.activeFemale.length,
    praetorium: memberRoster.praetorium.length,
    auxiliaryMale: memberRoster.auxiliaryMale.length,
    auxiliaryFemale: memberRoster.auxiliaryFemale.length,
    adjutorium: memberRoster.adjutorium.length,
  };
}

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
    memberRoster: createDefaultMemberRoster(),
  };
}

function reportYearMonth(report: WeeklyReport): string {
  const iso = report.submittedAt ?? report.meetingDateTime;
  return iso.slice(0, 7);
}

export function sumPrayerCountsForSessionRange(
  history: WeeklyReport[],
  sessionStart: number,
  sessionEnd: number
): PrayerCounts {
  const matching = history.filter(
    (report) =>
      report.status === "submitted" &&
      report.sessionNumber >= sessionStart &&
      report.sessionNumber <= sessionEnd
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

export function sessionRangeNumbers(sessionStart: number, sessionEnd: number): number[] {
  if (sessionEnd < sessionStart) return [];
  const numbers: number[] = [];
  for (let n = sessionStart; n <= sessionEnd; n++) numbers.push(n);
  return numbers;
}

export function buildAttendanceRoll(
  roster: PraesidiumRoster,
  sessionStart: number,
  sessionEnd: number
): AttendanceRecord[] {
  const numbers = sessionRangeNumbers(sessionStart, sessionEnd);
  const emptySessions = (): Record<number, boolean> =>
    Object.fromEntries(numbers.map((n) => [n, false]));

  const officerRows: AttendanceRecord[] = roster.officers.map((officer) => ({
    personId: `officer:${officer.role}`,
    personLabel: officer.name
      ? `${OFFICER_ROLE_LABEL_KO[officer.role]} ${officer.name}`
      : OFFICER_ROLE_LABEL_KO[officer.role],
    isOfficer: true,
    sessions: emptySessions(),
  }));

  const memberRows: AttendanceRecord[] = [
    ...roster.memberRoster.activeMale,
    ...roster.memberRoster.activeFemale,
  ].map((member) => ({
    personId: `member:${member.id}`,
    personLabel: member.name,
    isOfficer: false,
    sessions: emptySessions(),
  }));

  return [...officerRows, ...memberRows];
}

export function resyncAttendanceSessions(
  roll: AttendanceRecord[],
  sessionStart: number,
  sessionEnd: number
): AttendanceRecord[] {
  const numbers = sessionRangeNumbers(sessionStart, sessionEnd);
  return roll.map((record) => {
    const sessions: Record<number, boolean> = {};
    for (const n of numbers) {
      sessions[n] = record.sessions[n] ?? false;
    }
    return { ...record, sessions };
  });
}

export function computeAttendanceSummary(roll: AttendanceRecord[]): MonthlyReport["attendance"] {
  let officersPresent = 0;
  let officersTotal = 0;
  let membersPresent = 0;
  let membersTotal = 0;
  for (const record of roll) {
    const sessionValues = Object.values(record.sessions);
    const present = sessionValues.filter(Boolean).length;
    const total = sessionValues.length;
    if (record.isOfficer) {
      officersPresent += present;
      officersTotal += total;
    } else {
      membersPresent += present;
      membersTotal += total;
    }
  }
  return { officersPresent, officersTotal, membersPresent, membersTotal };
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
  const attendanceRoll = buildAttendanceRoll(roster, range.start, range.end);
  return {
    id: generateId(),
    yearMonth,
    sessionRangeStart: range.start,
    sessionRangeEnd: range.end,
    meetingWeekday: "",
    meetingTime: "",
    meetingLocation: "",
    attendance: computeAttendanceSummary(attendanceRoll),
    attendanceRoll,
    roster: structuredClone(roster),
    memberCountsPrevMonth: previousReport
      ? { ...previousReport.memberCountsThisMonth }
      : { ...EMPTY_MEMBER_COUNTS },
    memberCountsThisMonth: { ...roster.memberCounts },
    memberCountsIncrease: { ...EMPTY_MEMBER_COUNTS },
    memberCountsDecrease: { ...EMPTY_MEMBER_COUNTS },
    agendaItems: [],
    treasury: { broughtForward, income: 0, expense: 0, balance: broughtForward, expenseBreakdown: "" },
    prayerCounts: sumPrayerCountsForSessionRange(history, range.start, range.end),
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
