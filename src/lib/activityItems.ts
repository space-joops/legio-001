import { generateId } from "./id";
import type { ActivityItem, ActivityLine } from "./types";

/**
 * 단원이 활동을 기록할 때 고르는 항목 목록(카탈로그). 서기가 편집할 수 있다.
 * 항목마다 "공식 양식의 어느 줄로 집계되는지"를 자기가 들고 있다.
 *
 * The catalogue of activities members can record against a session.
 *
 * Each item declares which line of the official form it belongs to, which is
 * what lets one popup serve both: members just pick an activity, and the report
 * splits them into the 본당 지시사항 and Pr.활동사항 lines on its own.
 *
 * Editable by the secretary (Pr.활동사항 관리), because every praesidium words
 * these slightly differently.
 */

interface SeedItem {
  key: string;
  label: string;
  line: ActivityLine;
}

/** Wording follows the praesidium's submitted reports. */
const SEED_ITEMS: SeedItem[] = [
  { key: "prayerForDead", label: "연도", line: "praesidium" },
  { key: "funeralMass", label: "장례미사", line: "praesidium" },
  { key: "funeralOutsider", label: "외인상가방문", line: "praesidium" },
  { key: "funeralFaithful", label: "교우상가방문", line: "praesidium" },
  { key: "sickFaithful", label: "교우환자돌봄", line: "praesidium" },
  { key: "secondTempleService", label: "제2성전노력봉사", line: "praesidium" },
  { key: "parishCleaning", label: "본당청소", line: "praesidium" },
  { key: "welfareService", label: "복지시설노력봉사", line: "praesidium" },
  { key: "recruitActive", label: "행동단원모집", line: "praesidium" },
  // 본당 지시사항 줄로 가는 항목들. 평일미사 참례는 단원 카운터(미)에서
  // 이미 세므로 여기 두지 않는다 — 두면 이중 집계가 된다.
  { key: "newFamily", label: "새가족 찾기", line: "parish" },
  { key: "lapsedEncourage", label: "냉담회두 권면", line: "parish" },
  { key: "smallGroupJoin", label: "소공동체 참여", line: "parish" },
];

export function createDefaultActivityItems(): ActivityItem[] {
  return SEED_ITEMS.map((item, index) => ({
    id: item.key,
    key: item.key,
    label: item.label,
    line: item.line,
    order: index,
    hidden: false,
  }));
}

export function createActivityItem(label: string, line: ActivityLine, order: number): ActivityItem {
  return { id: generateId(), key: generateId(), label, line, order, hidden: false };
}

/**
 * Catalogue order. This is what the report's activity lines print in, so it
 * follows the order the praesidium has always written them (연도, 장례미사, …)
 * rather than the alphabetical order the screens show.
 */
export function sortActivityItems(items: ActivityItem[]): ActivityItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/** 가나다순 — for finding an item in a list, not for printing one. */
export function sortActivityItemsByName(items: ActivityItem[]): ActivityItem[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label, "ko"));
}

/** Hidden items stay out of the picker but keep totalling in old reports. */
export function selectableActivityItems(items: ActivityItem[]): ActivityItem[] {
  return sortActivityItemsByName(items).filter((item) => !item.hidden);
}

export function findActivityItem(items: ActivityItem[], key: string): ActivityItem | null {
  return items.find((item) => item.key === key) ?? null;
}
