import type { ActivityItem, ActivityLine, ReportFormVersion, SenatusKey } from "./types";

/**
 * 2026년 하늘의 문 Cu. 쁘레시디움 월례 보고서 양식(`docs/forms/2026Cu_Report_Template.hwp`)
 * 의 "8. 주요 활동 내역" 구조를 데이터로 옮겨 둔 파일.
 *
 * 편집 화면·인쇄 화면·이전 양식 변환이 모두 여기 있는 정의만 본다. 양식의 칸
 * 순서나 문구가 바뀌면 이 파일만 고치면 된다.
 *
 * 칸(cell)은 숫자 하나를 받는 칸과, 종이 양식에 `(  /  )` 로 인쇄된 짝 칸 두
 * 종류다. 짝 칸은 반쪽마다 별도의 활동 항목(키)을 갖고 `2/1` 처럼 찍힌다.
 */

export const FORM_2026: ReportFormVersion = "2026-cu";

/** 활동 항목 키 접두사. 이전 양식 항목(접두사 없음)과 섞이지 않게 한다. */
const KEY_PREFIX = "f26.";

export interface FormHalf {
  key: string;
  label: string;
}

export interface FormCell {
  id: string;
  /** 종이 양식에 인쇄된 칸 이름 그대로. */
  label: string;
  /** 숫자 하나면 길이 1, 짝 칸이면 길이 2. */
  halves: FormHalf[];
}

function single(id: string, label: string): FormCell {
  return { id, label, halves: [{ key: id, label }] };
}

function pair(id: string, label: string, a: string, b: string): FormCell {
  return {
    id,
    label,
    halves: [
      { key: `${id}.a`, label: a },
      { key: `${id}.b`, label: b },
    ],
  };
}

// ---- 세나뚜스 지시사항 (서기가 월별 합계를 직접 입력) ------------------------

export interface SenatusItem {
  label: string;
  keys: SenatusKey[];
}

export const SENATUS_ITEMS: SenatusItem[] = [
  { label: "❶묵주기도10억단 바치기", keys: ["rosaryBillion"] },
  { label: "❷봉사자참석 및 관련 교육참석", keys: ["volunteerTraining"] },
  { label: "❸홈스테이참여", keys: ["homestay"] },
  { label: "❹세계청년대회참석/봉사자참석권유", keys: ["wydAttend", "wydVolunteerInvite"] },
  { label: "❺홍보자료 및 영상배포활동", keys: ["promotion"] },
  { label: "❻WYD 고리기도참석", keys: ["wydChainPrayer"] },
];

export const SENATUS_HALF_LABEL: Record<SenatusKey, string> = {
  rosaryBillion: "묵주기도10억단",
  volunteerTraining: "봉사자참석 및 교육",
  homestay: "홈스테이",
  wydAttend: "세계청년대회참석",
  wydVolunteerInvite: "봉사자참석권유",
  promotion: "홍보자료·영상배포",
  wydChainPrayer: "WYD 고리기도",
};

export function createEmptySenatusCounts(): Record<SenatusKey, number> {
  return {
    rosaryBillion: 0,
    volunteerTraining: 0,
    homestay: 0,
    wydAttend: 0,
    wydVolunteerInvite: 0,
    promotion: 0,
    wydChainPrayer: 0,
  };
}

// ---- 본당 사목자 지시사항 -----------------------------------------------------

/**
 * 매일미사참례는 단원 카운터(평일미사참례)에서 자동으로 오므로 활동 항목이
 * 아니다. 그래서 칸 정의에 넣지 않고 인쇄 화면이 맨 앞에 따로 그린다.
 */
export const WEEKDAY_MASS_LABEL = "매일미사참례";

export const PARISH_CELLS: FormCell[] = [
  single(`${KEY_PREFIX}parish.newFamily`, "새가족찾기"),
  single(`${KEY_PREFIX}parish.lapsedReturn`, "냉담회두"),
  pair(`${KEY_PREFIX}parish.dailyPrayer`, "아침,저녁기도/성무일도바치기", "아침·저녁기도", "성무일도"),
  single(`${KEY_PREFIX}parish.scripture`, "성경말씀읽고묵상하기"),
  single(`${KEY_PREFIX}parish.adoration`, "성체조배"),
  pair(`${KEY_PREFIX}parish.retreat`, "피정/성지순례", "피정", "성지순례"),
  single(`${KEY_PREFIX}parish.wydPrayer`, "WYD기도"),
  single(`${KEY_PREFIX}parish.wydLodging`, "WYD숙박권유"),
  single(`${KEY_PREFIX}parish.charity`, "애덕실천사랑나눔"),
];

// ---- Pr. 활동 5대 분류 격자 ---------------------------------------------------

export interface PrCategory {
  id: string;
  label: string;
  /** 양식 위에서 아래 순서. 8칸보다 적으면 남는 줄은 빈칸으로 인쇄된다. */
  cells: FormCell[];
}

const PR = `${KEY_PREFIX}pr.`;

export const PR_CATEGORIES: PrCategory[] = [
  {
    id: "conversion",
    label: "입교권면",
    cells: [
      single(`${PR}outsiderInvite`, "외인입교권면"),
      single(`${PR}catechismDropout`, "교리중단자"),
      single(`${PR}conversionInvite`, "개종권면"),
      single(`${PR}catechumenCare`, "예비신자돌봄"),
      single(`${PR}catechismService`, "교리반봉사"),
      single(`${PR}catechumenGuided`, "타인인도예비자"),
      pair(`${PR}inviteBaptism`, "입교권면/영세", "입교권면", "영세"),
      single(`${PR}streetMission`, "가두선교"),
    ],
  },
  {
    id: "faithfulCare",
    label: "교우돌봄",
    cells: [
      single(`${PR}newlyBaptizedCare`, "새영세자돌봄"),
      single(`${PR}transferCare`, "전입교우돌봄"),
      single(`${PR}lapsedCare`, "냉담교우돌봄"),
      single(`${PR}lapsedReturn`, "냉담교우회두"),
      pair(`${PR}infantBaptism`, "유아세례/첫영성체", "유아세례", "첫영성체"),
      pair(`${PR}homeVisit`, "교우가정방문/신앙대화", "교우가정방문", "신앙대화"),
      single(`${PR}sickCommunion`, "환자봉성체"),
      single(`${PR}sacramentInvite`, "성사권면"),
    ],
  },
  {
    id: "hardshipCare",
    label: "어려움겪는분돌봄",
    cells: [
      single(`${PR}sickFaithfulVisit`, "교우환자방문"),
      single(`${PR}prayerForDead`, "위령기도(연도)"),
      pair(`${PR}coffin`, "입관/출관", "입관", "출관"),
      pair(`${PR}funeralMass`, "장례/추모미사", "장례미사", "추모미사"),
      single(`${PR}burialEscort`, "장지수행"),
      pair(`${PR}sickVisit`, "교우환자/외인환자방문", "교우환자", "외인환자"),
      single(`${PR}funeralOutsider`, "외인상가돌봄"),
      single(`${PR}funeralFaithful`, "교우상가돌봄"),
    ],
  },
  {
    id: "extension",
    label: "레지오확장/특별활동",
    cells: [
      single(`${PR}recruitActive`, "행동단원모집"),
      single(`${PR}recruitAuxiliary`, "협조단원모집"),
      single(`${PR}auxiliaryCare`, "협조단원돌봄"),
      pair(`${PR}goodDeeds`, "이웃사랑/선행", "이웃사랑", "선행"),
      pair(`${PR}welfareService`, "복지관/수녀원노력봉사", "복지관", "수녀원"),
      pair(`${PR}hospitalService`, "병원/요양원방문봉사", "병원", "요양원"),
      single(`${PR}nature`, "자연보호"),
      single(`${PR}publications`, "출판물보급"),
    ],
  },
  {
    id: "parishSupport",
    label: "본당협조/소공동체활성화",
    cells: [
      pair(`${PR}liturgyService`, "전례및헌금봉사", "전례", "헌금"),
      pair(`${PR}massGuide`, "교중미사안내/EV안내", "교중미사안내", "EV안내"),
      single(`${PR}cleaning`, "청소/미화"),
      pair(`${PR}smallCommunity`, "소공동체참석/권유", "참석", "권유"),
      single(`${PR}secondTemple`, "제2성전봉사"),
      single(`${PR}familySanctification`, "가정성화활동"),
      single(`${PR}other`, "기타"),
    ],
  },
];

/** 격자 한 분류가 차지하는 줄 수(양식 기준). */
export const PR_GRID_ROWS = 8;

// ---- 활동 항목 카탈로그 시드 --------------------------------------------------

interface FormGroup {
  /** 활동 입력 팝업의 묶음 제목. */
  label: string;
  line: ActivityLine;
  cells: FormCell[];
}

export const FORM_2026_GROUPS: FormGroup[] = [
  { label: "본당 사목자 지시사항", line: "parish", cells: PARISH_CELLS },
  ...PR_CATEGORIES.map((category) => ({
    label: `Pr. ${category.label}`,
    line: "praesidium" as const,
    cells: category.cells,
  })),
];

/** 짝 칸의 반쪽이면 "입관/출관 · 입관", 아니면 칸 이름 그대로. */
function halfItemLabel(cell: FormCell, half: FormHalf): string {
  return cell.halves.length === 1 ? cell.label : `${cell.label} · ${half.label}`;
}

/**
 * 이전 양식 항목들 뒤에 오도록 order 를 크게 잡는다. 이전 양식 인쇄는 order 순서로
 * 항목을 나열하므로, 새 항목이 그 앞에 끼어들지 않게 하려는 것.
 */
const SEED_ORDER_BASE = 1000;

export function createForm2026ActivityItems(): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const group of FORM_2026_GROUPS) {
    for (const cell of group.cells) {
      for (const half of cell.halves) {
        items.push({
          id: half.key,
          key: half.key,
          label: halfItemLabel(cell, half),
          line: group.line,
          order: SEED_ORDER_BASE + items.length,
          hidden: false,
          form: FORM_2026,
        });
      }
    }
  }
  return items;
}

/** 저장된 카탈로그에 빠진 새 양식 항목을 덧붙인다. 이미 있는 항목은 건드리지 않는다. */
export function mergeForm2026ActivityItems(stored: ActivityItem[]): ActivityItem[] {
  const existing = new Set(stored.map((item) => item.key));
  const missing = createForm2026ActivityItems().filter((item) => !existing.has(item.key));
  return missing.length === 0 ? stored : [...stored, ...missing];
}

/** 활동 키 → 그 키가 속한 묶음 제목. 새 양식 항목이 아니면 null. */
export function form2026GroupLabel(itemKey: string): string | null {
  for (const group of FORM_2026_GROUPS) {
    if (group.cells.some((cell) => cell.halves.some((half) => half.key === itemKey))) {
      return group.label;
    }
  }
  return null;
}

export function isForm2026Key(itemKey: string): boolean {
  return itemKey.startsWith(KEY_PREFIX);
}

// ---- 출력 ---------------------------------------------------------------------

/** 종이 양식처럼 0 은 빈칸으로 둔다. 짝 칸은 한쪽이라도 있으면 `2/0` 꼴. */
export function formatCellValue(values: number[]): string {
  if (values.every((v) => v === 0)) return "";
  return values.map((v) => v.toLocaleString("ko-KR")).join("/");
}

/** "2026-06" → "26". 양식의 "26선교" 머리말에 쓴다. */
export function shortYear(yearMonth: string): string {
  return yearMonth.slice(2, 4);
}
