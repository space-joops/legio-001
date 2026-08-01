/**
 * The activity taxonomy of the annual business report (세나뚜스 양식 제7호).
 *
 * Recorded monthly so the annual report can add twelve months up instead of the
 * secretary counting a year of activity by hand. The order and wording follow
 * the printed form exactly — the annual report reproduces these lines verbatim,
 * and its per-category "활동횟수" is the plain sum of the items beneath it
 * (verified against a submitted report: 498+8483+1004+2854+1007 = 13,846).
 */

export type ActivityCategoryKey =
  | "parish"
  | "conversion"
  | "catechumen"
  | "faithful"
  | "hardship"
  | "expansion"
  | "special"
  | "parishHelp"
  | "smallGroup"
  | "family"
  | "etc";

export interface ActivityItem {
  key: string;
  /** Korean label exactly as printed on the form. */
  label: string;
}

export interface ActivityCategory {
  key: ActivityCategoryKey;
  label: string;
  items: ActivityItem[];
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    key: "parish",
    label: "본당 사목자 지시 사항",
    // 평일미사 참례 is deliberately absent: it already comes from the members'
    // weekly counters (prayerCounts.weekdayMass) and would be double-counted.
    items: [
      { key: "newFamily", label: "새가족 찾기" },
      { key: "lapsedEncourage", label: "냉담회두 권면" },
      { key: "smallGroupJoin", label: "소공동체 참여" },
    ],
  },
  {
    key: "conversion",
    label: "입교 권면",
    items: [
      { key: "outsiderConversion", label: "외인 입교 권면" },
      { key: "catechismDropout", label: "교리 중단자 재권면" },
      { key: "denominationChange", label: "개종 권면" },
      { key: "streetMission", label: "가두 선교" },
      { key: "visitMission", label: "방문 선교" },
    ],
  },
  {
    key: "catechumen",
    label: "예비신자 돌봄",
    items: [
      { key: "catechumenGuide", label: "교리반 인도 예비신자 돌봄" },
      { key: "correspondenceCare", label: "통신교리자 돌봄" },
      { key: "catechismHelp", label: "교리반 봉사 또는 협조" },
    ],
  },
  {
    key: "faithful",
    label: "교우 돌봄",
    items: [
      { key: "newlyBaptized", label: "새 영세자 돌봄" },
      { key: "transferred", label: "전입교우 돌봄" },
      { key: "lapsedCare", label: "냉담 교우 돌봄" },
      { key: "marriageIssue", label: "조당(혼인장애)자 안내" },
      { key: "sacramentEncourage", label: "성사 권면" },
      { key: "infantBaptism", label: "유아 세례 권면" },
      { key: "firstCommunion", label: "첫 영성체" },
      { key: "homeVisit", label: "교우 가정 방문" },
    ],
  },
  {
    key: "hardship",
    label: "어려움 겪는 분 돌봄",
    items: [
      { key: "sickFaithful", label: "교우 환자 방문" },
      { key: "sickOutsider", label: "외인 환자 방문" },
      { key: "multicultural", label: "다문화 가정 돌봄" },
      { key: "funeralOutsider", label: "외인 상가 돌봄" },
      { key: "funeralFaithful", label: "교우 상가 돌봄" },
      { key: "prayerForDead", label: "위령기도[연도]" },
      { key: "funeralMass", label: "장례미사" },
      { key: "memorialMass", label: "추모미사" },
      { key: "coffining", label: "입출관" },
      { key: "burialAccompany", label: "장지수행" },
    ],
  },
  {
    key: "expansion",
    label: "레지오 확장",
    items: [
      { key: "recruitActive", label: "행동단원 모집" },
      { key: "recruitAuxiliary", label: "협조단원 모집 및 돌봄" },
      { key: "juniorLegion", label: "소년 레지오 지도" },
    ],
  },
  {
    key: "special",
    label: "특별 활동",
    items: [
      { key: "disasterCare", label: "재해 및 사고 피해자 돌봄" },
      { key: "welfareService", label: "복지시설 노력 봉사" },
      { key: "hospitalVisit", label: "병원방문 활동" },
    ],
  },
  {
    key: "parishHelp",
    label: "본당 협조",
    items: [
      { key: "eventHelp", label: "행사 준비 및 협조" },
      { key: "sundaySchool", label: "주일학교 돌봄" },
      { key: "cleaning", label: "청소 미화" },
      { key: "massGuide", label: "미사안내 봉사" },
      { key: "otherParishHelp", label: "기타 본당 협조" },
    ],
  },
  {
    key: "smallGroup",
    label: "소공동체 활동 (본당과 직장)",
    items: [
      { key: "smallGroupMeeting", label: "소공동체 모임 참석" },
      { key: "districtTraining", label: "구역·반장교육 참석" },
      { key: "meetingInvite", label: "반모임 참석 권유" },
      { key: "smallGroupEtc", label: "기타" },
    ],
  },
  {
    key: "family",
    label: "가정성화 활동 (가족 단위)",
    items: [
      { key: "familyPrayer", label: "가족이 함께 기도하기" },
      { key: "scriptureReading", label: "성경 봉독 및 묵상" },
      { key: "familyMass", label: "미사참례" },
      { key: "familyWelfare", label: "복지시설 봉사" },
    ],
  },
  {
    key: "etc",
    label: "기타 활동",
    items: [
      { key: "nature", label: "자연보호 활동" },
      { key: "otherActivity", label: "기타 활동" },
    ],
  },
];

/** Flat lookup for label rendering and validation. */
export const ACTIVITY_ITEMS: ActivityItem[] = ACTIVITY_CATEGORIES.flatMap((c) => c.items);

export const ACTIVITY_LABELS: Record<string, string> = Object.fromEntries(
  ACTIVITY_ITEMS.map((item) => [item.key, item.label])
);

/** Sparse on purpose: most months only a handful of items are nonzero. */
export type ActivityTallies = Record<string, number>;

export function categoryTotal(tallies: ActivityTallies, category: ActivityCategory): number {
  return category.items.reduce((sum, item) => sum + (tallies[item.key] ?? 0), 0);
}

export function sumActivityTallies(list: ActivityTallies[]): ActivityTallies {
  const out: ActivityTallies = {};
  for (const tallies of list) {
    for (const [key, value] of Object.entries(tallies ?? {})) {
      out[key] = (out[key] ?? 0) + value;
    }
  }
  return out;
}

/**
 * The monthly form's "Pr.활동사항" line — nonzero items only, in form order,
 * e.g. "위령기도[연도](5), 장례미사(2), 교우 상가 돌봄(10)".
 */
export function formatActivitySummaryLine(tallies: ActivityTallies): string {
  return ACTIVITY_ITEMS.filter((item) => (tallies[item.key] ?? 0) > 0)
    .map((item) => `${item.label}(${tallies[item.key]})`)
    .join(", ");
}
