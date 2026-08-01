import { dictionaries } from "@/i18n/dictionaries";
import { EMPTY_COUNTS, PRAYER_ITEMS } from "./constants";
import { generateId } from "./id";
import { normalizeName, type ParsedSubmission } from "./prayerSubmission";
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

export const WEEKDAY_LABEL_KEYS = [
  "secretaryRoster.weekdaySun",
  "secretaryRoster.weekdayMon",
  "secretaryRoster.weekdayTue",
  "secretaryRoster.weekdayWed",
  "secretaryRoster.weekdayThu",
  "secretaryRoster.weekdayFri",
  "secretaryRoster.weekdaySat",
] as const;

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


function reportYearMonth(report: WeeklyReport): string {
  const iso = report.submittedAt ?? report.meetingDateTime;
  return iso.slice(0, 7);
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
  const weekday =
    previousReport && previousReport.meetingWeekday >= 0
      ? previousReport.meetingWeekday
      : roster.regularMeetingWeekday;
  if (weekday >= 0 && previousReport) {
    const start = previousReport.sessionRangeEnd + 1;
    const count = Math.min(
      countWeekdayOccurrencesInMonth(yearMonth, weekday),
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

export interface RosterPerson {
  id: string;
  label: string;
  /** Kept alongside the label so matching compares fields instead of trying to
      pick names back out of the formatted "단원 홍길동(요한)" string. */
  name: string;
  baptismalName: string;
  isOfficer: boolean;
}

export function rosterPersons(roster: PraesidiumRoster): RosterPerson[] {
  const officers = roster.officers.map((officer) => ({
    id: `officer:${officer.role}`,
    label: formatPersonLabel(OFFICER_ROLE_LABEL_KO[officer.role], officer.name, officer.baptismalName),
    name: officer.name,
    baptismalName: officer.baptismalName,
    isOfficer: true,
  }));
  const members = [...roster.memberRoster.activeMale, ...roster.memberRoster.activeFemale].map(
    (member) => ({
      id: `member:${member.id}`,
      label: formatPersonLabel("단원", member.name, member.baptismalName),
      name: member.name,
      baptismalName: member.baptismalName,
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
    Object.fromEntries(numbers.map((n) => [n, true]));

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
      sessions[n] = record.sessions[n] ?? true;
    }
    return { ...record, sessions };
  });
}

export type MatchConfidence = "exact" | "nameOnly" | "ambiguous" | "none";

export interface SubmissionMatch {
  submission: ParsedSubmission;
  /** Pre-filled suggestion; null whenever the secretary must decide. */
  personId: string | null;
  confidence: MatchConfidence;
  candidates: RosterPerson[];
  inRange: boolean;
  /** How many of the five target cells already hold a nonzero value. */
  overwriteCount: number;
}

export interface SubmissionDecision {
  personId: string;
  sessionNumber: number;
  counts: PrayerCounts;
}

function countExistingValues(
  roll: PrayerSessionEntry[],
  personId: string,
  sessionNumber: number
): number {
  const entry = roll.find((e) => e.personId === personId);
  const counts = entry?.sessions[sessionNumber];
  if (!counts) return 0;
  return PRAYER_ITEMS.filter((item) => (counts[item.key] ?? 0) > 0).length;
}

/**
 * Matches pasted submissions against the roster snapshot stored *on the report*
 * (not the live one): prayerRoll's personIds were generated from that snapshot,
 * so ids are guaranteed to line up, and members added after the report was
 * created honestly show up as unmatched rather than silently vanishing.
 *
 * Nothing here applies anything — every match, however confident, still goes
 * through the secretary's preview.
 */
export function matchSubmissionsToRoster(
  submissions: ParsedSubmission[],
  report: MonthlyReport
): SubmissionMatch[] {
  const people = rosterPersons(report.roster);
  const sessions = sessionRangeNumbers(report.sessionRangeStart, report.sessionRangeEnd);

  return submissions.map((submission) => {
    const targetName = normalizeName(submission.name);
    const nameMatches = people.filter(
      (person) => person.name && normalizeName(person.name) === targetName
    );

    let personId: string | null = null;
    let confidence: MatchConfidence = "none";
    let candidates: RosterPerson[] = [];

    if (nameMatches.length === 1) {
      const only = nameMatches[0];
      const baptismalGiven = Boolean(submission.baptismalName && only.baptismalName);
      const baptismalAgrees =
        baptismalGiven &&
        normalizeName(only.baptismalName) === normalizeName(submission.baptismalName);
      personId = only.id;
      confidence = baptismalAgrees ? "exact" : "nameOnly";
      candidates = nameMatches;
    } else if (nameMatches.length > 1) {
      // Same name twice, or one person listed both as an officer and a member.
      const exact = submission.baptismalName
        ? nameMatches.filter(
            (person) =>
              person.baptismalName &&
              normalizeName(person.baptismalName) === normalizeName(submission.baptismalName)
          )
        : [];
      if (exact.length === 1) {
        personId = exact[0].id;
        confidence = "exact";
      } else {
        confidence = "ambiguous";
      }
      candidates = nameMatches;
    } else {
      candidates = people;
    }

    const inRange = sessions.includes(submission.sessionNumber);
    return {
      submission,
      personId,
      confidence,
      candidates,
      inRange,
      overwriteCount:
        personId && inRange
          ? countExistingValues(report.prayerRoll, personId, submission.sessionNumber)
          : 0,
    };
  });
}

/** Pure: returns the next roll and leaves persistence to the caller, matching
    how patchPrayerRollCell already works. Re-applying the same decisions is a
    no-op, so pasting twice can't double-count and no ledger is needed. */
export function applySubmissionsToPrayerRoll(
  roll: PrayerSessionEntry[],
  decisions: SubmissionDecision[]
): PrayerSessionEntry[] {
  if (decisions.length === 0) return roll;
  return roll.map((entry) => {
    const forEntry = decisions.filter((d) => d.personId === entry.personId);
    if (forEntry.length === 0) return entry;
    const sessions = { ...entry.sessions };
    for (const decision of forEntry) {
      sessions[decision.sessionNumber] = { ...decision.counts };
    }
    return { ...entry, sessions };
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
    meetingWeekday: previousReport?.meetingWeekday ?? roster.regularMeetingWeekday,
    meetingTime: previousReport?.meetingTime ?? "",
    meetingLocation: previousReport?.meetingLocation ?? "",
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
    prayerCounts: computePrayerCountsFromRoll(prayerRoll),
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

export function addMonthToYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  const next = new Date(year, month, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
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
