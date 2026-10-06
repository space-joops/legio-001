import { buildForm2026Tallies, tallyOtherActivities, type ActivityTally } from "./activityReport";
import { EMPTY_COUNTS, PRAYER_ITEMS } from "./constants";
import { computeMassCommunion, sortMonthlyReports } from "./monthlyReportUtils";
import {
  PARISH_CELLS,
  PR_CATEGORIES,
  SENATUS_ITEMS,
  WEEKDAY_MASS_LABEL,
  type FormCell,
} from "./reportForm2026";
import { computeTreasuryLedger, splitNotableExpenses, type NotableExpenses } from "./treasury";
import type {
  ActivityItem,
  EvangelizationTallies,
  MemberCounts,
  MonthlyReport,
  PrayerCounts,
} from "./types";

/**
 * 한 해치 월례 보고서를 합쳐 연간 통계를 만든다(`/secretary/stats`).
 *
 * 숫자는 전부 보고서에 저장된 원본에서 다시 계산한다 — 월별 화면이 쓰는 집계
 * 함수(`buildForm2026Tallies`, `computeTreasuryLedger` 등)를 그대로 불러 쓰므로
 * 월례 보고서에 인쇄된 숫자와 연간 합계가 어긋날 수 없다.
 *
 * 이전 양식(2024-12) 보고서의 활동은 새 양식 칸이 없으므로 "이전 양식 항목" 으로
 * 이름별로 따로 모은다. 변환하면 새 양식 칸으로 합쳐진다.
 */

export interface MonthSummary {
  yearMonth: string;
  isLegacyForm: boolean;
  officersPresent: number;
  officersTotal: number;
  membersPresent: number;
  membersTotal: number;
  massCommunion: number;
  rosaryDecades: number;
  /** 그달 활동 기록 횟수 합(양식 칸 + 기타 + 이전 양식 항목). */
  activityTotal: number;
  income: number;
  expense: number;
  balance: number;
}

export interface CellTotal {
  cell: FormCell;
  values: number[];
}

export interface AnnualStats {
  year: number;
  months: MonthSummary[];
  legacyMonthCount: number;
  attendance: { officersPresent: number; officersTotal: number; membersPresent: number; membersTotal: number };
  prayer: PrayerCounts;
  sundayMass: number;
  massCommunion: number;
  senatus: { label: string; values: number[] }[];
  weekdayMass: number;
  parish: CellTotal[];
  pr: { label: string; cells: CellTotal[]; total: number }[];
  /** 기타 활동을 이름별로. byMonth 는 yearMonth → 횟수. */
  others: (ActivityTally & { byMonth: Record<string, number> })[];
  /** 이전 양식 보고서에 남아 있는 활동(새 양식 칸이 없는 것). */
  legacy: ActivityTally[];
  treasury: {
    opening: number;
    income: number;
    expense: number;
    closing: number;
    notable: NotableExpenses;
  };
  /** 선교 실적은 양식이 이미 연초부터의 누계라, 그해 마지막 보고서 값을 쓴다. */
  evangelization: EvangelizationTallies | null;
  evangelizationMonth: string | null;
  /** 첫 보고서의 전월 인원 → 마지막 보고서의 금월 인원. */
  members: { start: MemberCounts; end: MemberCounts } | null;
}

/** 보고서가 있는 연도들(최근 연도 먼저). */
export function availableYears(reports: MonthlyReport[]): number[] {
  const years = new Set<number>();
  for (const report of reports) {
    const year = Number(report.yearMonth.slice(0, 4));
    if (year) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}

function addTally(target: ActivityTally[], label: string, count: number): void {
  const existing = target.find((t) => t.label === label);
  if (existing) existing.count += count;
  else target.push({ label, count });
}

export function buildAnnualStats(
  reports: MonthlyReport[],
  items: ActivityItem[],
  year: number
): AnnualStats {
  // 오래된 달부터 — 이월금은 첫 달, 잔액·선교 누계·인원은 마지막 달에서 읽는다.
  const yearReports = sortMonthlyReports(reports)
    .filter((report) => report.yearMonth.startsWith(`${year}-`))
    .reverse();

  const prayer: PrayerCounts = { ...EMPTY_COUNTS };
  const attendance = { officersPresent: 0, officersTotal: 0, membersPresent: 0, membersTotal: 0 };
  const senatus = SENATUS_ITEMS.map((item) => ({ label: item.label, values: item.keys.map(() => 0) }));
  const parish: CellTotal[] = PARISH_CELLS.map((cell) => ({ cell, values: cell.halves.map(() => 0) }));
  const pr = PR_CATEGORIES.map((category) => ({
    label: category.label,
    cells: category.cells.map((cell) => ({ cell, values: cell.halves.map(() => 0) })),
    total: 0,
  }));
  const others: AnnualStats["others"] = [];
  const legacy: ActivityTally[] = [];
  const notable: NotableExpenses = { donation: 0, flowers: 0, other: 0 };
  const months: MonthSummary[] = [];
  let sundayMass = 0;
  let massCommunion = 0;
  let weekdayMass = 0;
  let income = 0;
  let expense = 0;

  for (const report of yearReports) {
    const tallies = buildForm2026Tallies(report, items);
    const ledger = computeTreasuryLedger(report);
    const monthNotable = splitNotableExpenses(ledger.breakdown);

    for (const item of PRAYER_ITEMS) prayer[item.key] += report.prayerCounts[item.key] ?? 0;
    attendance.officersPresent += report.attendance.officersPresent;
    attendance.officersTotal += report.attendance.officersTotal;
    attendance.membersPresent += report.attendance.membersPresent;
    attendance.membersTotal += report.attendance.membersTotal;
    sundayMass += report.sundayMassTotal ?? 0;
    massCommunion += computeMassCommunion(report);
    weekdayMass += tallies.weekdayMass;

    SENATUS_ITEMS.forEach((item, i) => {
      item.keys.forEach((key, j) => {
        senatus[i].values[j] += report.senatusCounts?.[key] ?? 0;
      });
    });
    tallies.parish.forEach((tally, i) => {
      tally.values.forEach((v, j) => (parish[i].values[j] += v));
    });
    tallies.pr.forEach((category, i) => {
      category.cells.forEach((tally, j) => {
        tally.values.forEach((v, k) => (pr[i].cells[j].values[k] += v));
      });
    });

    for (const tally of tallyOtherActivities(report)) {
      let row = others.find((o) => o.label === tally.label);
      if (!row) {
        row = { label: tally.label, count: 0, byMonth: {} };
        others.push(row);
      }
      row.count += tally.count;
      row.byMonth[report.yearMonth] = (row.byMonth[report.yearMonth] ?? 0) + tally.count;
    }
    for (const tally of tallies.unmapped) addTally(legacy, tally.label, tally.count);

    notable.donation += monthNotable.donation;
    notable.flowers += monthNotable.flowers;
    notable.other += monthNotable.other;
    income += ledger.income;
    expense += ledger.expense;

    months.push({
      yearMonth: report.yearMonth,
      isLegacyForm: report.formVersion !== "2026-cu",
      ...report.attendance,
      massCommunion: computeMassCommunion(report),
      rosaryDecades: report.prayerCounts.rosaryDecades ?? 0,
      activityTotal: (report.activityEntries ?? []).reduce((sum, e) => sum + e.count, 0),
      income: ledger.income,
      expense: ledger.expense,
      balance: ledger.balance,
    });
  }

  for (const category of pr) {
    category.total = category.cells.reduce(
      (sum, c) => sum + c.values.reduce((a, b) => a + b, 0),
      0
    );
  }
  others.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));
  legacy.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));

  const first = yearReports[0];
  const last = yearReports[yearReports.length - 1];

  return {
    year,
    months,
    legacyMonthCount: months.filter((m) => m.isLegacyForm).length,
    attendance,
    prayer,
    sundayMass,
    massCommunion,
    senatus,
    weekdayMass,
    parish,
    pr,
    others,
    legacy,
    treasury: {
      opening: first ? computeTreasuryLedger(first).opening : 0,
      income,
      expense,
      closing: last ? computeTreasuryLedger(last).balance : 0,
      notable,
    },
    evangelization: last ? last.evangelization : null,
    evangelizationMonth: last ? last.yearMonth : null,
    members: first && last ? { start: first.memberCountsPrevMonth, end: last.memberCountsThisMonth } : null,
  };
}

/** "45 / 48 (94%)" — 분모가 0 이면 비율 없이. */
export function formatRatio(present: number, total: number): string {
  if (total === 0) return `${present} / ${total}`;
  return `${present} / ${total} (${Math.round((present / total) * 100)}%)`;
}

export function sumMemberCounts(counts: MemberCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * 엑셀에서 바로 열리는 CSV. 맨 앞 BOM 이 없으면 엑셀이 한글을 깨뜨린다.
 * 구분·항목·값 세 열로 연간 합계를 적고, 그 아래 월별 요약 표를 붙인다.
 */
export function annualStatsToCsv(stats: AnnualStats): string {
  const rows: (string | number)[][] = [["구분", "항목", "값"]];
  const join = (values: number[]) => values.join("/");

  rows.push(["출석", "간부", formatRatio(stats.attendance.officersPresent, stats.attendance.officersTotal)]);
  rows.push(["출석", "단원", formatRatio(stats.attendance.membersPresent, stats.attendance.membersTotal)]);
  rows.push(["교구 지시사항", "미사 영성체", stats.massCommunion]);
  for (const item of PRAYER_ITEMS) {
    if (item.key === "weekdayMass") continue;
    rows.push(["교구 지시사항", item.label, stats.prayer[item.key]]);
  }
  for (const item of stats.senatus) rows.push(["세나뚜스 지시사항", item.label, join(item.values)]);
  rows.push(["본당 사목자 지시사항", WEEKDAY_MASS_LABEL, stats.weekdayMass]);
  for (const total of stats.parish) rows.push(["본당 사목자 지시사항", total.cell.label, join(total.values)]);
  for (const category of stats.pr) {
    for (const total of category.cells) rows.push([`Pr. ${category.label}`, total.cell.label, join(total.values)]);
  }
  for (const other of stats.others) rows.push(["기타 활동", other.label, other.count]);
  for (const item of stats.legacy) rows.push(["이전 양식 항목", item.label, item.count]);
  rows.push(["회계", "연초 이월금", stats.treasury.opening]);
  rows.push(["회계", "수입", stats.treasury.income]);
  rows.push(["회계", "지출", stats.treasury.expense]);
  rows.push(["회계", "연말 잔액", stats.treasury.closing]);
  rows.push(["회계", "의연금", stats.treasury.notable.donation]);
  rows.push(["회계", "꽃값", stats.treasury.notable.flowers]);
  rows.push(["회계", "기타 지출", stats.treasury.notable.other]);
  if (stats.evangelization) {
    const { baptism, returnToFaith } = stats.evangelization;
    rows.push(["선교(결과/목표)", "영세자", `${baptism.result}/${baptism.target}`]);
    rows.push(["선교(결과/목표)", "냉담회두", `${returnToFaith.result}/${returnToFaith.target}`]);
  }

  rows.push([]);
  rows.push(["월", "간부 출석", "단원 출석", "미사 영성체", "묵주기도", "활동 횟수", "수입", "지출", "잔액"]);
  for (const m of stats.months) {
    rows.push([
      m.yearMonth,
      `${m.officersPresent}/${m.officersTotal}`,
      `${m.membersPresent}/${m.membersTotal}`,
      m.massCommunion,
      m.rosaryDecades,
      m.activityTotal,
      m.income,
      m.expense,
      m.balance,
    ]);
  }

  return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
