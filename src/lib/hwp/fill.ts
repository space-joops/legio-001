import { dictionaries } from "@/i18n/dictionaries";
import { buildActivityLines } from "../activityReport";
import { OFFICER_ROLES } from "../monthlyReportUtils";
import { formatWon } from "../treasury";
import type { ActivityItem, MemberCounts, MonthlyReport } from "../types";
import { utf16leEncode } from "./binary";
import { getParaBody, patchParaBody, setParaBody, type ParaEdit } from "./paragraph";
import { TAG, type HwpRecord } from "./records";
import type { TableSlots, TemplateMap } from "./template";

/**
 * MonthlyReport → 템플릿 치환값.
 *
 * 인쇄 화면(SecretaryReportPrintView)과 같은 빌더(buildActivityLines,
 * formatWon 등)를 그대로 써서 화면·PDF·HWP 세 출력이 어긋나지 않게 한다.
 * HWP 제출본은 언어 설정과 무관하게 항상 한국어라 라벨은 ko 사전에서
 * 직접 뽑는다(React 밖 사용 선례: formatMonthlyShareText).
 */

export interface HwpWarning {
  kind: "agendaTruncated";
  dropped: number;
}

/** 양식 표3(주요 사항)의 데이터 행 수 — 템플릿에 행 추가는 하지 않는다. */
const AGENDA_ROW_LIMIT = 3;
/** 교구 지시사항 둘째 줄의 템플릿 들여쓰기. */
const CONTINUATION_INDENT = " ".repeat(18);
/** PrvText 스트림의 규격 상한(문자 수). */
const PRV_TEXT_LIMIT = 1022;

const WEEKDAY_SHORT_KO = ["일", "월", "화", "수", "목", "금", "토"];

function sanitize(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f]/g, "");
}

/**
 * 정규식 캡처 그룹 자리를 새 값으로 바꾸는 edits.
 * 값이 null인 그룹은 템플릿 내용을 그대로 둔다.
 */
function captureEdits(body: string, pattern: RegExp, values: Array<string | null>): ParaEdit[] {
  const withIndices = new RegExp(pattern.source, "d");
  const match = withIndices.exec(body);
  if (!match?.indices) {
    throw new Error(`HWP: 템플릿 문구를 찾지 못했습니다: ${pattern.source}`);
  }
  const edits: ParaEdit[] = [];
  values.forEach((value, i) => {
    if (value === null) return;
    const range = match.indices?.[i + 1];
    if (!range) {
      throw new Error(`HWP: 템플릿 문구의 ${i + 1}번째 그룹이 없습니다: ${pattern.source}`);
    }
    edits.push({ start: range[0], end: range[1], text: sanitize(value) });
  });
  return edits;
}

/** "라벨 + 첫 줄 + (들여쓴 이어지는 줄들)" — 8항 활동 내역 줄의 공통 모양. */
function labeledLines(label: string, ...parts: string[]): string {
  const filtered = parts.map((part) => sanitize(part).trim()).filter(Boolean);
  if (filtered.length === 0) return label.trimEnd();
  return label + filtered.join("\n" + CONTINUATION_INDENT);
}

function setCell(
  records: HwpRecord[],
  table: TableSlots,
  row: number,
  col: number,
  value: string
): void {
  const slot = table.cells.get(`${row},${col}`);
  if (!slot) throw new Error(`HWP: 표 셀 (${row}, ${col})을 찾지 못했습니다`);
  setParaBody(records, slot, sanitize(value).trim());
}

/** "2026-01-11" → "2026.01.11" (양식 표기). 다른 형식은 그대로 둔다. */
function formatAppointedDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  return match ? `${match[1]}.${match[2]}.${match[3]}` : isoDate.trim();
}

/** 표2 열 → 단원 수. c4·c8은 남+여 합계인 "계" 열이다. */
function memberColumnValue(counts: MemberCounts, col: number): number {
  switch (col) {
    case 2:
      return counts.activeMale;
    case 3:
      return counts.activeFemale;
    case 4:
      return counts.activeMale + counts.activeFemale;
    case 5:
      return counts.praetorium;
    case 6:
      return counts.auxiliaryMale;
    case 7:
      return counts.auxiliaryFemale;
    case 8:
      return counts.auxiliaryMale + counts.auxiliaryFemale;
    default:
      return counts.adjutorium;
  }
}

export function applyReport(
  records: HwpRecord[],
  map: TemplateMap,
  report: MonthlyReport,
  activityItems: ActivityItem[]
): HwpWarning[] {
  const warnings: HwpWarning[] = [];
  const ko = dictionaries.ko;

  // ① 연·월 + 회차 범위
  {
    const body = getParaBody(records, map.yearMonthSession);
    const [year, month] = report.yearMonth.split("-").map((v) => Number.parseInt(v, 10));
    patchParaBody(records, map.yearMonthSession, [
      ...captureEdits(body, /(\d{4})\s*년/, [String(year)]),
      ...captureEdits(body, /년\s*(\d{1,2})월말/, [String(month)]),
      ...captureEdits(body, /제\s*(\d+)\s*차\s*~\s*제\s*(\d+)\s*차/, [
        String(report.sessionRangeStart),
        String(report.sessionRangeEnd),
      ]),
    ]);
  }

  // ② 주회합 요일·시각·장소
  {
    const body = getParaBody(records, map.meeting);
    const weekday = report.meetingWeekday >= 0 ? WEEKDAY_SHORT_KO[report.meetingWeekday] : null;
    const time = /^(\d{1,2}):(\d{2})/.exec(report.meetingTime.trim());
    const location = report.meetingLocation.trim();
    patchParaBody(records, map.meeting, [
      ...captureEdits(body, /매주\s+(\S+)\s+요일/, [weekday]),
      ...(time
        ? captureEdits(body, /(\d{1,2})\s*시\s*(\d{1,2})\s*분/, [
            String(Number.parseInt(time[1], 10)),
            time[2],
          ])
        : []),
      ...(location ? captureEdits(body, /장\s+소\s*:\s*(\S.*?)\s*$/, [location]) : []),
    ]);
  }

  // ③ 출석
  {
    const body = getParaBody(records, map.attendance);
    patchParaBody(records, map.attendance, [
      ...captureEdits(body, /간부\s+(\d+)\s*\/\s*(\d+)/, [
        String(report.attendance.officersPresent),
        String(report.attendance.officersTotal),
      ]),
      ...captureEdits(body, /단원\s+(\d+)\s*\/\s*(\d+)/, [
        String(report.attendance.membersPresent),
        String(report.attendance.membersTotal),
      ]),
    ]);
  }

  // ④ 영적지도자
  {
    const name = `${report.roster.spiritualDirectorName} ${report.roster.spiritualDirectorBaptismalName}`.trim();
    if (name) {
      const body = getParaBody(records, map.spiritualDirector);
      patchParaBody(
        records,
        map.spiritualDirector,
        captureEdits(body, /영적지도자\s*:\s*(\S.*?)\s*\)/, [name])
      );
    }
  }

  // ⑤ 회계 네 금액
  {
    const body = getParaBody(records, map.treasury);
    const { broughtForward, income, expense, balance } = report.treasury;
    patchParaBody(records, map.treasury, [
      ...captureEdits(body, /이월금\s+([\d,]+)원/, [formatWon(broughtForward)]),
      ...captureEdits(body, /수입\s+([\d,]+)원/, [formatWon(income)]),
      ...captureEdits(body, /지\s*출\s+([\d,]+)원/, [formatWon(expense)]),
      ...captureEdits(body, /잔\s*액\s+([\d,]+)원/, [formatWon(balance)]),
    ]);
  }

  // ⑥ 중요 지출 내역
  setParaBody(
    records,
    map.expenseBreakdown,
    labeledLines("  중요 지출 내역 : ", report.treasury.expenseBreakdown)
  );

  // ⑦~⑩ 8항 활동 내역 네 줄 + 선교실적
  {
    const lines = buildActivityLines(report, activityItems, {
      massCommunion: ko.secretaryReport.massCommunionLabel,
      prayer: {
        weekdayMass: ko.counters.weekdayMass,
        priestPrayer: ko.counters.priestPrayer,
        chainPrayer: ko.counters.chainPrayer,
        rosaryDecades: ko.counters.rosaryDecades,
        aspirations: ko.counters.aspirations,
      },
    });
    setParaBody(
      records,
      map.diocese,
      labeledLines("* 교구 지시사항 : ", report.dioceseInstructions, lines.diocese)
    );
    setParaBody(
      records,
      map.parish,
      labeledLines("* 본당 지시사항 : ", report.parishInstructions, lines.parish)
    );
    setParaBody(
      records,
      map.council,
      labeledLines("* 상급평의회 지시사항 : ", report.councilInstructions)
    );
    setParaBody(
      records,
      map.prActivity,
      labeledLines("* Pr.활동사항 : ", lines.praesidium, report.activitySummary)
    );

    const tallies = (
      [
        ["baptism", ko.secretaryReport.evangelizationBaptism],
        ["returnToFaith", ko.secretaryReport.evangelizationReturn],
        ["activeMember", ko.secretaryReport.evangelizationActiveMember],
        ["praetorium", ko.secretaryReport.evangelizationPraetorium],
      ] as const
    ).map(([key, label]) => {
      const tally = report.evangelization?.[key];
      const result = tally?.result ?? 0;
      const target = tally?.target ?? 0;
      // 둘 다 0이면 템플릿 관례대로 "(/)"로 비워 둔다.
      return `${label}(${result === 0 && target === 0 ? "/" : `${result}/${target}`})`;
    });
    const yy = report.yearMonth.slice(2, 4);
    setParaBody(
      records,
      map.evangelization,
      labeledLines(`* ${yy}′선교실적 누계: `, tallies.join(", "), report.cumulativeEvangelization)
    );
  }

  // ⑪ 기타(질의 및 건의) — 템플릿처럼 선두 줄바꿈을 유지한다.
  setParaBody(
    records,
    map.otherNotes,
    "\n" + labeledLines("9. 기타(질의 및 건의) : ", report.otherNotes)
  );

  // ⑫ 평의회 줄 + 서명란
  {
    const affiliation = report.roster.councilAffiliation.trim();
    if (affiliation) {
      const body = getParaBody(records, map.councilLine);
      patchParaBody(
        records,
        map.councilLine,
        captureEdits(body, /\(평의회\)\s+(\S.*?)\s+직속/, [affiliation])
      );
    }
    const president = report.roster.officers.find((officer) => officer.role === "president");
    const presidentName = president
      ? `${president.name} ${president.baptismalName}`.trim()
      : "";
    const praesidiumName = report.roster.praesidiumName.trim();
    const body = getParaBody(records, map.signature);
    patchParaBody(records, map.signature, [
      ...captureEdits(body, /^\s*(\S.*?)\s+쁘레시디움/, [praesidiumName || null]),
      ...captureEdits(body, /단장\s+(\S.*?)\s+\(서명\)/, [presidentName || null]),
    ]);
  }

  // ⑬ 표1 간부 명단 — 단장/부단장/서기/회계 순서 고정.
  OFFICER_ROLES.forEach((role, index) => {
    const officer = report.roster.officers.find((entry) => entry.role === role);
    const row = index + 1;
    setCell(records, map.officersTable, row, 1, officer?.name ?? "");
    setCell(records, map.officersTable, row, 2, officer?.baptismalName ?? "");
    setCell(records, map.officersTable, row, 3, officer ? formatAppointedDate(officer.appointedDate) : "");
    setCell(records, map.officersTable, row, 4, officer?.note ?? "");
  });

  // ⑭ 표2 단원 현황 — 0은 템플릿 관례대로 빈 셀.
  const memberRows: Array<[number, MemberCounts]> = [
    [2, report.memberCountsPrevMonth],
    [3, report.memberCountsThisMonth],
    [4, report.memberCountsIncrease],
    [5, report.memberCountsDecrease],
  ];
  for (const [row, counts] of memberRows) {
    for (let col = 2; col <= 9; col += 1) {
      const value = memberColumnValue(counts, col);
      setCell(records, map.memberTable, row, col, value === 0 ? "" : String(value));
    }
  }

  // ⑮ 표3 주요 사항 — 템플릿 행 수(3)까지만 싣는다.
  const agendaItems = report.agendaItems.slice(0, AGENDA_ROW_LIMIT);
  if (report.agendaItems.length > AGENDA_ROW_LIMIT) {
    warnings.push({
      kind: "agendaTruncated",
      dropped: report.agendaItems.length - AGENDA_ROW_LIMIT,
    });
  }
  for (let row = 1; row <= AGENDA_ROW_LIMIT; row += 1) {
    const item = agendaItems[row - 1];
    const values = item
      ? [
          item.status,
          item.title,
          item.organizer,
          item.dateTime.replace("T", " "),
          item.location,
          item.attendanceNote,
        ]
      : ["", "", "", "", "", ""];
    values.forEach((value, col) => setCell(records, map.agendaTable, row, col, value));
  }

  return warnings;
}

/**
 * 치환이 끝난 본문에서 PrvText(탐색기·모바일 미리보기 텍스트)를 다시 만든다.
 * 본문과 항상 일치함이 보장되는 가장 단순한 방법이다.
 */
export function buildPrvText(records: HwpRecord[]): Uint8Array {
  const linesOut: string[] = [];
  for (const record of records) {
    if (record.tag !== TAG.PARA_HEADER) continue;
    const body = getParaBody(records, { header: record }).trim();
    if (body) linesOut.push(body.replace(/\n/g, "\r\n"));
  }
  return utf16leEncode(linesOut.join("\r\n").slice(0, PRV_TEXT_LIMIT));
}
