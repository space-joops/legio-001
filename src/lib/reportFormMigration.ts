import {
  createEmptySenatusCounts,
  FORM_2026,
  PR_OTHER_KEY,
  isForm2026Key,
  normalizeActivityLabel,
} from "./reportForm2026";
import type { ActivityItem, MonthlyReport } from "./types";

/**
 * 이전 양식(2024-12)으로 작성한 월례 보고서를 2026 양식으로 옮기는 순수 함수들.
 *
 * 순서는 이렇다. 화면(`ReportFormMigrationDialog`)이 그대로 따라간다.
 *   1. listLegacyActivityUsage — 이 보고서에 기록된 이전 양식 항목을 뽑는다
 *   2. initialMapping          — 기억된 선택 → 추천값 순으로 미리 채운다
 *   3. 서기가 항목마다 새 칸(또는 "제외")을 확인·지정한다
 *   4. convertReportTo2026     — 새 보고서 객체를 만든다(원본은 그대로)
 *
 * 양식에 자리가 없는 자유문은 버리지 않고 "기타(질의 및 건의)" 뒤에 붙여 옮긴다.
 */

/** 매핑 값으로 쓰는 "이 항목의 기록은 옮기지 않는다" 표시. 어떤 항목 키와도 겹치지 않는다. */
export const EXCLUDE = "__exclude__";

/**
 * 이전 양식 기본 항목 → 2026 양식 칸. 어디까지나 **추천**이라 화면에서 서기가
 * 확인하고 바꿀 수 있다. 서기가 직접 만든 항목은 추천이 없다.
 */
export const SUGGESTED_MAPPING: Record<string, string> = {
  prayerForDead: "f26.pr.prayerForDead",
  funeralMass: "f26.pr.funeralMass.a",
  funeralOutsider: "f26.pr.funeralOutsider",
  funeralFaithful: "f26.pr.funeralFaithful",
  sickFaithful: "f26.pr.sickFaithfulVisit",
  secondTempleService: "f26.pr.secondTemple",
  parishCleaning: "f26.pr.cleaning",
  welfareService: "f26.pr.welfareService.a",
  recruitActive: "f26.pr.recruitActive",
  newFamily: "f26.parish.newFamily",
  lapsedEncourage: "f26.parish.lapsedReturn",
  smallGroupJoin: "f26.pr.smallCommunity.a",
};

export interface LegacyActivityUsage {
  key: string;
  label: string;
  /** 이 보고서에서 모든 단원·회차를 합친 횟수. */
  total: number;
}

/** 이 보고서에 기록된 이전 양식 항목들(처음 나온 순서). */
export function listLegacyActivityUsage(
  report: MonthlyReport,
  items: ActivityItem[]
): LegacyActivityUsage[] {
  const usage = new Map<string, number>();
  for (const entry of report.activityEntries ?? []) {
    if (isForm2026Key(entry.itemKey)) continue;
    usage.set(entry.itemKey, (usage.get(entry.itemKey) ?? 0) + entry.count);
  }
  return [...usage].map(([key, total]) => ({
    key,
    // 카탈로그에서 지워진 항목이면 키라도 보여 준다 — 서기가 판단할 수 있도록.
    label: items.find((item) => item.key === key)?.label ?? key,
    total,
  }));
}

/**
 * 기억된 선택이 있으면 그것, 없으면 추천값, 둘 다 없으면 빈 문자열(미지정).
 * 기억된 값이나 추천값이 더 이상 카탈로그에 없는 키면 미지정으로 둔다.
 */
export function initialMapping(
  usage: LegacyActivityUsage[],
  remembered: Record<string, string>,
  validTargets: Set<string>
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const { key } of usage) {
    const candidate = remembered[key] ?? SUGGESTED_MAPPING[key] ?? "";
    mapping[key] = candidate === EXCLUDE || validTargets.has(candidate) ? candidate : "";
  }
  return mapping;
}

export function isMappingComplete(
  usage: LegacyActivityUsage[],
  mapping: Record<string, string>
): boolean {
  return usage.every(({ key }) => Boolean(mapping[key]));
}

/** 2026 양식에 칸이 없어 "기타" 뒤로 옮겨 붙일 이전 양식의 글들. */
export function carriedOverNotes(report: MonthlyReport): string[] {
  const lines: string[] = [];
  const add = (label: string, value: string | undefined) => {
    const text = value?.trim();
    if (text) lines.push(`[이전 양식] ${label}: ${text}`);
  };
  add("교구 지시사항", report.dioceseInstructions);
  add("본당 지시사항", report.parishInstructions);
  add("평의회 지시사항", report.councilInstructions);
  add("활동사항", report.activitySummary);
  add("선교실적 누계", report.cumulativeEvangelization);

  // 새 양식의 선교 칸은 영세자·냉담회두 둘뿐이다. 나머지 둘이 비어 있지 않으면 적어 둔다.
  const extra = (
    [
      ["행동단원", report.evangelization?.activeMember],
      ["쁘레또리움", report.evangelization?.praetorium],
    ] as const
  )
    .filter(([, tally]) => tally && (tally.result > 0 || tally.target > 0))
    .map(([label, tally]) => `${label}(${tally!.result}/${tally!.target})`);
  if (extra.length > 0) lines.push(`[이전 양식] 선교실적: ${extra.join(", ")}`);
  return lines;
}

/**
 * 새 양식 보고서를 만든다. 원본 객체는 건드리지 않는다.
 * 매핑이 하나라도 비어 있으면 던진다 — 화면이 그 전에 버튼을 막아야 한다.
 *
 * "기타" 칸으로 보낸 항목은 이전 항목 이름(`labels`)을 기타 활동 이름으로 붙여
 * 옮긴다. 그래야 인쇄물의 "9. 기타" 줄과 연간 통계에 이름이 남는다.
 */
export function convertReportTo2026(
  report: MonthlyReport,
  mapping: Record<string, string>,
  labels: Record<string, string> = {}
): MonthlyReport {
  const activityEntries = [];
  for (const entry of report.activityEntries ?? []) {
    if (isForm2026Key(entry.itemKey)) {
      activityEntries.push(entry);
      continue;
    }
    const target = mapping[entry.itemKey];
    if (!target) throw new Error(`unmapped activity item: ${entry.itemKey}`);
    if (target === EXCLUDE) continue;
    if (target === PR_OTHER_KEY) {
      const customLabel = normalizeActivityLabel(labels[entry.itemKey] ?? entry.itemKey);
      activityEntries.push({ ...entry, itemKey: target, customLabel });
    } else {
      activityEntries.push({ ...entry, itemKey: target });
    }
  }

  const notes = carriedOverNotes(report);
  const otherNotes = [report.otherNotes?.trim() ?? "", ...notes].filter(Boolean).join("\n");

  return {
    ...report,
    formVersion: FORM_2026,
    activityEntries,
    senatusCounts: report.senatusCounts ?? createEmptySenatusCounts(),
    otherNotes,
    // 옮겨 붙였으니 비운다. 남겨 두면 화면에선 안 보이는데 데이터에만 남는다.
    dioceseInstructions: "",
    parishInstructions: "",
    councilInstructions: "",
    activitySummary: "",
    cumulativeEvangelization: "",
    updatedAt: new Date().toISOString(),
  };
}
