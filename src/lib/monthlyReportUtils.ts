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
  PrayerSessionEntry,
  WeeklyReport,
} from "./types";

export const MAX_ATTENDANCE_SESSIONS = 6;

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
    regularMeetingWeekday: -1,
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

export function countWeekdayOccurrencesInMonth(yearMonth: string, weekday: number): number {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month - 1, day).getDay() === weekday) count++;
  }
  return count;
}

function computeSessionRange(
  yearMonth: string,
  roster: PraesidiumRoster,
  previousReport: MonthlyReport | null,
  history: WeeklyReport[]
): { start: number; end: number } {
  if (roster.regularMeetingWeekday >= 0 && previousReport) {
    const start = previousReport.sessionRangeEnd + 1;
    const count = Math.min(
      countWeekdayOccurrencesInMonth(yearMonth, roster.regularMeetingWeekday),
      MAX_ATTENDANCE_SESSIONS
    );
    const end = count > 0 ? start + count - 1 : start - 1;
    return { start, end };
  }
  return sessionRangeForMonth(history, yearMonth);
}

export function sessionRangeNumbers(sessionStart: number, sessionEnd: number): number[] {
  if (sessionEnd < sessionStart) return [];
  const numbers: number[] = [];
  for (let n = sessionStart; n <= sessionEnd; n++) numbers.push(n);
  return numbers;
}

function formatPersonLabel(prefix: string, name: string, baptismalName: string): string {
  const base = name ? `${prefix} ${name}` : prefix;
  return name && baptismalName ? `${base}(${baptismalName})` : base;
}

function rosterPersons(roster: PraesidiumRoster): { id: string; label: string; isOfficer: boolean }[] {
  const officers = roster.officers.map((officer) => ({
    id: `officer:${officer.role}`,
    label: formatPersonLabel(OFFICER_ROLE_LABEL_KO[officer.role], officer.name, officer.baptismalName),
    isOfficer: true,
  }));
  const members = [...roster.memberRoster.activeMale, ...roster.memberRoster.activeFemale].map(
    (member) => ({
      id: `member:${member.id}`,
      label: formatPersonLabel("단원", member.name, member.baptismalName),
      isOfficer: false,
    })
  );
  return [...officers, ...members];
}

export function buildAttendanceRoll(
  roster: PraesidiumRoster,
  sessionStart: number,
  sessionEnd: number
): AttendanceRecord[] {
  const numbers = sessionRangeNumbers(sessionStart, sessionEnd);
  const emptySessions = (): Record<number, boolean> =>
    Object.fromEntries(numbers.map((n) => [n, false]));

  return rosterPersons(roster).map((person) => ({
    personId: person.id,
    personLabel: person.label,
    isOfficer: person.isOfficer,
    sessions: emptySessions(),
  }));
}

export function buildPrayerRoll(
  roster: PraesidiumRoster,
  sessionStart: number,
  sessionEnd: number
): PrayerSessionEntry[] {
  const numbers = sessionRangeNumbers(sessionStart, sessionEnd);
  const emptySessions = (): Record<number, PrayerCounts> =>
    Object.fromEntries(numbers.map((n) => [n, { ...EMPTY_COUNTS }]));

  return rosterPersons(roster).map((person) => ({
    personId: person.id,
    personLabel: person.label,
    sessions: emptySessions(),
  }));
}

export function resyncPrayerRollSessions(
  roll: PrayerSessionEntry[],
  sessionStart: number,
  sessionEnd: number
): PrayerSessionEntry[] {
  const numbers = sessionRangeNumbers(sessionStart, sessionEnd);
  return roll.map((entry) => {
    const sessions: Record<number, PrayerCounts> = {};
    for (const n of numbers) {
      sessions[n] = entry.sessions[n] ?? { ...EMPTY_COUNTS };
    }
    return { ...entry, sessions };
  });
}

export function computePrayerCountsFromRoll(roll: PrayerSessionEntry[]): PrayerCounts {
  const sums: PrayerCounts = { ...EMPTY_COUNTS };
  for (const entry of roll) {
    for (const counts of Object.values(entry.sessions)) {
      for (const item of PRAYER_ITEMS) {
        sums[item.key] += counts[item.key] ?? 0;
      }
    }
  }
  return sums;
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
  const range = computeSessionRange(yearMonth, roster, previousReport, history);
  const broughtForward = previousReport?.treasury.balance ?? 0;
  const attendanceRoll = buildAttendanceRoll(roster, range.start, range.end);
  const prayerRoll = buildPrayerRoll(roster, range.start, range.end);
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
    prayerRoll,
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
