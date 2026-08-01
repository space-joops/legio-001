// Generates public/sample-data.json — a filled-in praesidium for reviewing the
// app without typing a year of data in by hand. Run with `npm run sample-data`
// whenever the stored shapes change, so the file can't quietly rot.
//
// The 2024 months carry the real figures from a submitted 33차 사업 보고서, so
// creating the 2024 annual report reproduces its published totals: 교구 13,846 /
// 본당 253 / 미사영성체 498 / 묵주기도 8,483 / 52주간 / 간부 출석 48·52·42·44.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "sample-data.json");

const YEAR = 2024;
const ANNUAL_PRAYERS = {
  weekdayMass: 248,
  priestPrayer: 1004,
  chainPrayer: 2854,
  rosaryDecades: 8483,
  aspirations: 1007,
};
const MASS_COMMUNION = 498; // 평일미사 248 + 주일미사 250
const SMALL_GROUP_JOIN = 5;
const OFFICER_PRESENT = { president: 48, vicePresident: 52, secretary: 42, treasurer: 44 };
const TOTAL_SESSIONS = 52;

/** Spreads a yearly total over 12 months, remainder into January. */
function split(total, n = 12) {
  const base = Math.floor(total / n);
  const arr = Array(n).fill(base);
  arr[0] += total - base * n;
  return arr;
}

const OFFICERS = [
  { role: "president", name: "이남규", baptismalName: "알퐁소", appointedDate: "2026.01.11", note: "신임" },
  { role: "vicePresident", name: "김홍식", baptismalName: "안드레아", appointedDate: "2026.01.11", note: "신임" },
  { role: "secretary", name: "민경국", baptismalName: "마르코", appointedDate: "2026.01.11", note: "신임" },
  { role: "treasurer", name: "김영진", baptismalName: "안토니오", appointedDate: "2026.01.11", note: "신임" },
];

const MEMBERS = [
  { id: "sample-m1", name: "박정숙", baptismalName: "체칠리아" },
  { id: "sample-m2", name: "최영희", baptismalName: "안나" },
  { id: "sample-m3", name: "정미경", baptismalName: "루치아" },
];

const MEMBER_COUNTS = {
  activeMale: 4,
  activeFemale: 3,
  praetorium: 0,
  auxiliaryMale: 3,
  auxiliaryFemale: 3,
  adjutorium: 0,
};

const ROSTER = {
  praesidiumName: "천상은총의 어머니",
  councilAffiliation: "하늘의 문 Cu.",
  spiritualDirectorName: "박경민",
  spiritualDirectorBaptismalName: "베네딕토",
  officers: OFFICERS,
  memberCounts: MEMBER_COUNTS,
  memberRoster: {
    activeMale: [],
    activeFemale: MEMBERS,
    praetorium: [],
    auxiliaryMale: [],
    auxiliaryFemale: [],
    adjutorium: [],
  },
  regularMeetingWeekday: 4, // 목요일
};

const EMPTY_COUNTS = {
  weekdayMass: 0,
  priestPrayer: 0,
  chainPrayer: 0,
  rosaryDecades: 0,
  aspirations: 0,
};
const EMPTY_MEMBER_COUNTS = {
  activeMale: 0,
  activeFemale: 0,
  praetorium: 0,
  auxiliaryMale: 0,
  auxiliaryFemale: 0,
  adjutorium: 0,
};
const EMPTY_EVANGELIZATION = {
  baptism: { result: 0, target: 1 },
  returnToFaith: { result: 0, target: 3 },
  activeMember: { result: 0, target: 2 },
  praetorium: { result: 0, target: 0 },
};

const people = [
  ...OFFICERS.map((o) => ({
    personId: `officer:${o.role}`,
    label: `${{ president: "단장", vicePresident: "부단장", secretary: "서기", treasurer: "회계" }[o.role]} ${o.name}(${o.baptismalName})`,
    isOfficer: true,
  })),
  ...MEMBERS.map((m) => ({
    personId: `member:${m.id}`,
    label: `단원 ${m.name}(${m.baptismalName})`,
    isOfficer: false,
  })),
];

function buildMonthlyReports() {
  const prayerParts = Object.fromEntries(
    Object.entries(ANNUAL_PRAYERS).map(([k, v]) => [k, split(v)])
  );
  const sundayParts = split(MASS_COMMUNION - ANNUAL_PRAYERS.weekdayMass);
  const smallGroupParts = split(SMALL_GROUP_JOIN);
  const incomeParts = split(913000);
  const expenseParts = split(920000);
  const weeksPerMonth = split(TOTAL_SESSIONS);

  // Officer absences are dealt out from the front so the yearly ratios land
  // exactly on the published 48/52, 52/52, 42/52, 44/52.
  const absencesLeft = Object.fromEntries(
    Object.entries(OFFICER_PRESENT).map(([role, present]) => [role, TOTAL_SESSIONS - present])
  );

  const reports = [];
  let cursor = 1600; // 실제 문서처럼 네 자리 누적 회차
  let balance = 27000;

  for (let i = 0; i < 12; i++) {
    const weeks = weeksPerMonth[i];
    const start = cursor + 1;
    const end = cursor + weeks;
    cursor = end;
    const sessions = Array.from({ length: weeks }, (_, k) => start + k);

    const attendanceRoll = people.map((person) => {
      const role = person.personId.startsWith("officer:")
        ? person.personId.slice("officer:".length)
        : null;
      const map = {};
      for (const n of sessions) {
        let present = true;
        if (role && absencesLeft[role] > 0) {
          present = false;
          absencesLeft[role] -= 1;
        }
        map[n] = present;
      }
      return {
        personId: person.personId,
        personLabel: person.label,
        isOfficer: person.isOfficer,
        sessions: map,
      };
    });

    // Put the month's prayer totals on the president's first session; the roll
    // only has to add up to prayerCounts, and spreading it evenly would invent
    // detail this sample doesn't need.
    const monthCounts = Object.fromEntries(
      Object.entries(prayerParts).map(([k, arr]) => [k, arr[i]])
    );
    const prayerRoll = people.map((person, index) => ({
      personId: person.personId,
      personLabel: person.label,
      sessions: Object.fromEntries(
        sessions.map((n, s) => [
          n,
          index === 0 && s === 0 ? { ...monthCounts } : { ...EMPTY_COUNTS },
        ])
      ),
    }));

    const income = incomeParts[i];
    const expense = expenseParts[i];
    const broughtForward = balance;
    balance = broughtForward + income - expense;

    let officersPresent = 0;
    let officersTotal = 0;
    let membersPresent = 0;
    let membersTotal = 0;
    for (const record of attendanceRoll) {
      const values = Object.values(record.sessions);
      if (record.isOfficer) {
        officersPresent += values.filter(Boolean).length;
        officersTotal += values.length;
      } else {
        membersPresent += values.filter(Boolean).length;
        membersTotal += values.length;
      }
    }

    reports.push({
      id: `sample-monthly-${YEAR}-${i + 1}`,
      yearMonth: `${YEAR}-${String(i + 1).padStart(2, "0")}`,
      sessionRangeStart: start,
      sessionRangeEnd: end,
      meetingWeekday: 4,
      meetingTime: "20:10",
      meetingLocation: "진실방",
      attendance: { officersPresent, officersTotal, membersPresent, membersTotal },
      attendanceRoll,
      prayerRoll,
      roster: ROSTER,
      memberCountsPrevMonth: i === 0 ? { ...MEMBER_COUNTS, activeFemale: 4 } : MEMBER_COUNTS,
      memberCountsThisMonth: MEMBER_COUNTS,
      memberCountsIncrease: { ...EMPTY_MEMBER_COUNTS },
      memberCountsDecrease:
        i === 0 ? { ...EMPTY_MEMBER_COUNTS, activeFemale: 1 } : { ...EMPTY_MEMBER_COUNTS },
      agendaItems:
        i === 2
          ? [
              {
                id: `sample-agenda-${i}`,
                status: "실시",
                title: "아치에스",
                organizer: "꾸리아",
                dateTime: "03.24",
                location: "대성당",
                attendanceNote: "6",
              },
            ]
          : [],
      treasury: {
        broughtForward,
        income,
        expense,
        balance,
        expenseBreakdown: i === 0 ? "(의연금) 70,000원  (꽃값) 20,000원" : "",
      },
      prayerCounts: { ...monthCounts },
      sundayMassTotal: sundayParts[i],
      activityTallies: {
        smallGroupJoin: smallGroupParts[i],
        ...(i === 0 ? { funeralMass: 2, funeralFaithful: 3, prayerForDead: 1 } : {}),
        ...(i === 5 ? { welfareService: 3, recruitActive: 1 } : {}),
      },
      evangelization: EMPTY_EVANGELIZATION,
      dioceseInstructions: "해외 선교사제와 선교지를 위한 기도",
      parishInstructions: "",
      councilInstructions: "",
      activitySummary: "",
      cumulativeEvangelization: "",
      otherNotes: "",
      createdAt: `${YEAR}-01-01T00:00:00.000Z`,
      updatedAt: `${YEAR}-12-31T00:00:00.000Z`,
    });
  }
  return reports;
}

/** A few submitted weeks so the member-facing screens aren't empty either. */
function buildHistory() {
  return [3, 2, 1].map((session) => ({
    id: `sample-weekly-${session}`,
    schemaVersion: 1,
    sessionNumber: 1650 + session,
    meetingDateTime: `2026-07-${String(2 + session * 7).padStart(2, "0")}T20:10`,
    memberName: "민경국",
    baptismalName: "마르코",
    praesidiumName: ROSTER.praesidiumName,
    parishName: "별양동성당",
    activityNote: session === 3 ? "교우 상가 방문 2회, 연도 참여" : "",
    counts: {
      weekdayMass: 2 + session,
      priestPrayer: 7,
      chainPrayer: 7,
      rosaryDecades: 15 + session,
      aspirations: 30,
    },
    status: "submitted",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    submittedAt: `2026-07-${String(2 + session * 7).padStart(2, "0")}T21:00`,
  }));
}

const data = {
  exportedAt: new Date(`${YEAR}-12-31T09:00:00.000Z`).toISOString(),
  dataSchemaVersion: 1,
  profile: {
    name: "민경국",
    baptismalName: "마르코",
    praesidiumName: ROSTER.praesidiumName,
    parishName: "별양동성당",
  },
  history: buildHistory(),
  currentReport: null,
  schedule: [],
  roster: ROSTER,
  monthlyReports: buildMonthlyReports(),
  // Left empty on purpose: creating it is what exercises the aggregation.
  annualReports: [],
};

writeFileSync(OUT, JSON.stringify(data));
console.log(
  `[generate-sample-data] wrote ${OUT} ` +
    `(${data.monthlyReports.length} monthly reports, ${data.history.length} weekly reports)`
);
