import { createMonthlyReport } from "../monthlyReportUtils";
import type { MonthlyReport, PraesidiumRoster } from "../types";

/**
 * 템플릿 스크럽(scripts/build-hwp-template.mts)과 HWP 테스트가 함께 쓰는
 * 표본 보고서. 실물 report.hwp의 실명·실값을 이 견본 값으로 갈아끼운 것이
 * public/report-template.hwp로 커밋된다 — 앱과 함께 배포되는 파일이라
 * 실제 개인정보가 남으면 안 된다.
 */

export function buildSampleRoster(): PraesidiumRoster {
  return {
    praesidiumName: "평화의 모후",
    councilAffiliation: "성모 Cu.",
    spiritualDirectorName: "김어진",
    spiritualDirectorBaptismalName: "사도요한",
    officers: [
      { role: "president", name: "홍길동", baptismalName: "요셉", appointedDate: "2026-01-05", note: "신임" },
      { role: "vicePresident", name: "김사랑", baptismalName: "마리아", appointedDate: "2026-01-05", note: "신임" },
      { role: "secretary", name: "이믿음", baptismalName: "베드로", appointedDate: "2026-01-05", note: "연임" },
      { role: "treasurer", name: "박소망", baptismalName: "안나", appointedDate: "2026-01-05", note: "신임" },
    ],
    memberCounts: {
      activeMale: 5,
      activeFemale: 4,
      praetorium: 1,
      auxiliaryMale: 2,
      auxiliaryFemale: 3,
      adjutorium: 0,
    },
    memberRoster: {
      activeMale: [],
      activeFemale: [],
      praetorium: [],
      auxiliaryMale: [],
      auxiliaryFemale: [],
      adjutorium: [],
    },
    regularMeetingWeekday: 6,
  };
}

export function buildSampleMonthlyReport(): MonthlyReport {
  const report = createMonthlyReport("2026-01", buildSampleRoster(), null, []);
  return {
    ...report,
    sessionRangeStart: 10,
    sessionRangeEnd: 14,
    meetingWeekday: 6,
    meetingTime: "19:30",
    meetingLocation: "성당 소회의실",
    attendance: { officersPresent: 3, officersTotal: 4, membersPresent: 8, membersTotal: 9 },
    memberCountsPrevMonth: {
      activeMale: 5,
      activeFemale: 3,
      praetorium: 1,
      auxiliaryMale: 2,
      auxiliaryFemale: 3,
      adjutorium: 0,
    },
    memberCountsIncrease: {
      activeMale: 0,
      activeFemale: 1,
      praetorium: 0,
      auxiliaryMale: 0,
      auxiliaryFemale: 0,
      adjutorium: 0,
    },
    treasury: {
      broughtForward: 12000,
      income: 34000,
      expense: 5600,
      balance: 40400,
      expenseBreakdown: "(간식비) 5,600원",
    },
    prayerCounts: {
      weekdayMass: 12,
      priestPrayer: 34,
      chainPrayer: 56,
      rosaryDecades: 78,
      aspirations: 90,
    },
    sundayMassTotal: 40,
    evangelization: {
      baptism: { result: 0, target: 0 },
      returnToFaith: { result: 1, target: 3 },
      activeMember: { result: 0, target: 2 },
      praetorium: { result: 0, target: 0 },
    },
    agendaItems: [
      {
        id: "sample-agenda-1",
        status: "실시",
        title: "성모의 밤",
        organizer: "본당",
        dateTime: "2026-01-17T19:00",
        location: "대성전",
        attendanceNote: "5/9",
      },
      {
        id: "sample-agenda-2",
        status: "계획",
        title: "단원 피정",
        organizer: "꾸리아",
        dateTime: "2026-02-07T10:00",
        location: "피정의 집",
        attendanceNote: "",
      },
    ],
    dioceseInstructions: "성모님과 함께하는 기도",
    parishInstructions: "",
    councilInstructions: "",
    activitySummary: "구역 봉사(2)",
    cumulativeEvangelization: "",
    otherNotes: "특이사항 없음",
  };
}
