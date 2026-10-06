import { sortActivityItems } from "./activityItems";
import { PRAYER_ITEMS } from "./constants";
import { computeMassCommunion } from "./monthlyReportUtils";
import {
  PARISH_CELLS,
  PR_CATEGORIES,
  PR_OTHER_KEY,
  isForm2026Key,
  normalizeActivityLabel,
  type FormCell,
} from "./reportForm2026";
import type { ActivityItem, ActivityLine, MonthlyReport } from "./types";

/**
 * 단원들의 활동 기록을 합쳐 공식 양식의 "주요 활동 내역" 네 줄을 만든다.
 * 편집 화면과 인쇄 화면이 모두 이 결과를 그대로 쓴다. 예전에는 두 화면이 각자
 * 문자열을 조립하느라 구분자가 서로 달랐는데, 출처를 하나로 모아 맞췄다.
 */

export interface ActivityTally {
  label: string;
  count: number;
}

/** Totals every member's entries for one line of the form. */
export function tallyActivities(
  report: MonthlyReport,
  items: ActivityItem[],
  line: ActivityLine
): ActivityTally[] {
  const totals = new Map<string, number>();
  for (const entry of report.activityEntries ?? []) {
    totals.set(entry.itemKey, (totals.get(entry.itemKey) ?? 0) + entry.count);
  }
  return sortActivityItems(items)
    .filter((item) => item.line === line)
    .map((item) => ({ label: item.label, count: totals.get(item.key) ?? 0 }));
}

/** "장례미사(2), 교우상가방문(3)" — months with no activity are left out. */
export function formatTallies(tallies: ActivityTally[]): string {
  return tallies
    .filter((t) => t.count > 0)
    .map((t) => `${t.label}(${t.count})`)
    .join(", ");
}

export interface ActivityLines {
  /** 미사영성체(N),사제를 위한기도(N),… */
  diocese: string;
  /** 평일미사 참례(N), 소공동체 참여(N), … */
  parish: string;
  /** 연도(3), 장례미사(2), … */
  praesidium: string;
}

export function buildActivityLines(report: MonthlyReport, items: ActivityItem[]): ActivityLines {
  const weekdayMass = PRAYER_ITEMS.find((item) => item.key === "weekdayMass")!;
  const diocese = [
    `미사영성체(${computeMassCommunion(report)})`,
    // Weekday Mass belongs to the parish line, not this one.
    ...PRAYER_ITEMS.filter((item) => item.key !== "weekdayMass").map(
      (item) => `${item.label}(${report.prayerCounts[item.key] ?? 0})`
    ),
  ].join(", ");

  const parish = formatTallies([
    { label: weekdayMass.label, count: report.prayerCounts.weekdayMass ?? 0 },
    ...tallyActivities(report, items, "parish"),
  ]);

  return {
    diocese,
    parish,
    praesidium: formatTallies(tallyActivities(report, items, "praesidium")),
  };
}

/** Total a single member has recorded in this session — shown in the table cell. */
export function personActivityCount(
  report: MonthlyReport,
  personId: string,
  sessionNumber: number
): number {
  return (report.activityEntries ?? [])
    .filter((e) => e.personId === personId && e.sessionNumber === sessionNumber)
    .reduce((sum, e) => sum + e.count, 0);
}

// ---- 2026 양식 ----------------------------------------------------------------

/** 칸 하나의 집계. 짝 칸이면 값이 둘이다. */
export interface CellTally {
  cell: FormCell;
  values: number[];
}

export interface Form2026Tallies {
  /** 교구 지시사항 줄: 미사영성체·묵주기도·사제·주모경·화살 */
  diocese: { label: string; value: number }[];
  weekdayMass: number;
  parish: CellTally[];
  /** PR_CATEGORIES 와 같은 순서, 같은 칸 수. */
  pr: { label: string; cells: CellTally[] }[];
  /**
   * 2026 양식 보고서에 남아 있는, 양식에 칸이 없는 활동(이전 양식 항목).
   * 인쇄물에는 나가지 않으므로 편집 화면이 경고해야 한다.
   */
  unmapped: ActivityTally[];
  /** "기타" 칸에 들어간 활동을 이름별로. 합계는 Pr. 격자의 기타 칸 숫자와 같다. */
  others: ActivityTally[];
}

/** 이름 없이 "기타" 칸에 들어간 기록(예전 기록 등)을 묶는 이름. */
export const UNNAMED_OTHER_LABEL = "기타(이름 없음)";

/** "기타 활동: 바자회 봉사(2), 성지순례 안내(1)" — 보고서 "9. 기타" 줄 머리에 붙는다. 없으면 "". */
export function formatOtherActivitiesLine(others: ActivityTally[]): string {
  const text = formatTallies(others);
  return text ? `기타 활동: ${text}` : "";
}

/** "기타" 칸 기록을 활동 이름별로 합산한다(처음 나온 순서). */
export function tallyOtherActivities(report: MonthlyReport): ActivityTally[] {
  const totals = new Map<string, number>();
  for (const entry of report.activityEntries ?? []) {
    if (entry.itemKey !== PR_OTHER_KEY || entry.count === 0) continue;
    const label = normalizeActivityLabel(entry.customLabel ?? "") || UNNAMED_OTHER_LABEL;
    totals.set(label, (totals.get(label) ?? 0) + entry.count);
  }
  return [...totals].map(([label, count]) => ({ label, count }));
}

function totalsByKey(report: MonthlyReport): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of report.activityEntries ?? []) {
    totals.set(entry.itemKey, (totals.get(entry.itemKey) ?? 0) + entry.count);
  }
  return totals;
}

export function buildForm2026Tallies(
  report: MonthlyReport,
  items: ActivityItem[]
): Form2026Tallies {
  const totals = totalsByKey(report);
  const tallyCell = (cell: FormCell): CellTally => ({
    cell,
    values: cell.halves.map((half) => totals.get(half.key) ?? 0),
  });

  const counts = report.prayerCounts;
  const diocese = [
    { label: "미사 영성체", value: computeMassCommunion(report) },
    { label: "묵주기도", value: counts.rosaryDecades ?? 0 },
    { label: "사제를 위한 기도", value: counts.priestPrayer ?? 0 },
    { label: "주모경", value: counts.chainPrayer ?? 0 },
    { label: "화살기도", value: counts.aspirations ?? 0 },
  ];

  const unmapped: ActivityTally[] = [];
  for (const [key, count] of totals) {
    if (isForm2026Key(key) || count === 0) continue;
    const item = items.find((i) => i.key === key);
    unmapped.push({ label: item?.label ?? key, count });
  }

  return {
    diocese,
    weekdayMass: counts.weekdayMass ?? 0,
    parish: PARISH_CELLS.map(tallyCell),
    pr: PR_CATEGORIES.map((category) => ({
      label: category.label,
      cells: category.cells.map(tallyCell),
    })),
    unmapped,
    others: tallyOtherActivities(report),
  };
}

/** 모든 보고서에서 쓴 기타 활동 이름(가나다순, 중복 없음). 활동 입력의 자동완성용. */
export function collectOtherActivityLabels(reports: MonthlyReport[]): string[] {
  const labels = new Set<string>();
  for (const report of reports) {
    for (const entry of report.activityEntries ?? []) {
      if (entry.itemKey !== PR_OTHER_KEY) continue;
      const label = normalizeActivityLabel(entry.customLabel ?? "");
      if (label) labels.add(label);
    }
  }
  return [...labels].sort((a, b) => a.localeCompare(b, "ko"));
}
