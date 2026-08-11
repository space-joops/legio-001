import {
  APOSTLES_CREED,
  GLORY_BE,
  HAIL_MARY,
  OUR_FATHER,
  ROSARY_MYSTERY_SECTIONS,
  SALVATION_PRAYER,
  SALVE_REGINA,
  type PrayerTextSection,
} from "./prayerTexts";
import { MYSTERY_MEDITATIONS } from "./rosaryMeditations";

/**
 * 묵주기도 안내 화면이 따라가는 **순서표를 만드는 곳**. 화면은 여기 없다.
 *
 * 이 파일이 하는 일은 딱 두 가지다.
 *   1. 오늘이 무슨 요일인지 보고 어느 신비를 바칠지 고른다
 *   2. 그 신비의 묵주기도 전체를 **화면 77장짜리 평평한 배열**로 펼친다
 *
 * 그리고 하지 않는 일:
 *   - 기도문 원문을 여기 적지 않는다 → `prayerTexts.ts` 의 것을 가리킨다
 *   - 묵상 문장을 여기 적지 않는다 → `rosaryMeditations.ts`
 *   - React 를 모른다 → 순수 함수뿐이라 화면 없이도 테스트할 수 있다
 *
 * 실제 화면은 `src/components/RosaryGuide.tsx` 가 그린다. 이 파일이 만든
 * 배열을 인덱스 하나씩 넘겨 가며 보여 줄 뿐이다.
 *
 * 자세한 설명: `docs/rosary/01-데이터.md`
 */

/**
 * 묵주기도의 네 가지 신비.
 *
 * [TS] `|` 로 이어 붙인 유니온 타입. 파이썬의 `Literal["joyful", ...]` 과 같다.
 *      이 네 문자열 말고 다른 값을 쓰면 컴파일 단계에서 잡힌다.
 */
export type MysteryId = "joyful" | "sorrowful" | "glorious" | "luminous";

/**
 * `ROSARY_MYSTERY_SECTIONS` 배열에 네 신비가 놓여 있는 순서
 * (환희 · 고통 · 영광 · 빛).
 *
 * 그 배열들은 가톨릭 기도서 공식 문구를 검수해 담고 있고 뗏세라 화면과도
 * 공유한다. 그래서 이 파일은 20개 신비 명칭을 다시 적지 않고 **인덱스로 찾아
 * 쓴다**(아래 `getMysterySection`).
 *
 * ⚠️ 이 배열의 순서와 `prayerTexts.ts` 의 섹션 순서는 **암묵적으로 묶여 있다.**
 *    한쪽만 재정렬하면 에러 없이 조용히 엉뚱한 신비가 나온다. 둘 중 하나를
 *    건드릴 일이 생기면 반드시 양쪽을 같이 확인할 것.
 */
export const MYSTERY_ORDER: MysteryId[] = ["joyful", "sorrowful", "glorious", "luminous"];

/**
 * 요일별로 바치는 신비. `Date.getDay()` 값을 그대로 인덱스로 쓴다(0 = 일요일).
 *
 *   일 영광 · 월 환희 · 화 고통 · 수 영광 · 목 빛 · 금 고통 · 토 환희
 *
 * 각 신비 제목에 적힌 요일 표기("환희의 신비 (월요일·토요일)")와 일치한다.
 *
 * [TS] 배열 리터럴에 `MysteryId[]` 라고 타입을 붙여 두면, 오타가 난 문자열을
 *      넣는 순간 컴파일러가 잡아 준다.
 */
const MYSTERY_BY_WEEKDAY: MysteryId[] = [
  "glorious",
  "joyful",
  "sorrowful",
  "glorious",
  "luminous",
  "sorrowful",
  "joyful",
];

/** 묵주기도 한 번은 5단, 한 단은 성모송 10번. 아래 77이라는 숫자가 여기서 나온다. */
export const DECADES_PER_ROSARY = 5;
export const HAIL_MARYS_PER_DECADE = 10;
/** 시작 기도에서 바치는 성모송 3번(믿음·희망·사랑을 청하며). */
const OPENING_HAIL_MARYS = 3;

/**
 * 그날 바칠 신비를 고른다.
 *
 * **반드시 브라우저에서만 부를 것.** 이 앱은 빌드할 때 화면을 미리 만들어 두는데
 * (정적 export), 그 시점의 "오늘"은 배포하는 날이지 사용자가 앱을 여는 날이
 * 아니다. 그래서 `RosaryGuide` 는 이 함수를 `useEffect` 안에서 부른다.
 */
export function getMysteryIdForDate(date: Date): MysteryId {
  return MYSTERY_BY_WEEKDAY[date.getDay()];
}

/**
 * 신비 하나의 제목 묶음을 꺼낸다 — 큰 제목(heading) 1개 + 단별 제목(lines) 5개.
 *
 * [TS] `MYSTERY_ORDER.indexOf(id)` 는 파이썬의 `list.index(id)` 다. 위에서 경고한
 *      "암묵적 순서 결합"이 바로 이 한 줄이다.
 */
export function getMysterySection(id: MysteryId): PrayerTextSection {
  return ROSARY_MYSTERY_SECTIONS[MYSTERY_ORDER.indexOf(id)];
}

/**
 * 안내 화면 **한 장**의 내용.
 *
 * 이 객체 하나가 화면 하나다. 77개가 모이면 묵주기도 한 바퀴가 된다.
 */
export interface RosaryStep {
  /** 화면 가운데 큰 글씨. 신비 선포 화면에서는 이것이 곧 본문 전체다. */
  title: string;
  /** 반복되는 기도에만 붙는 순번. 예) `"3 / 10"` */
  ordinal?: string;
  /** 기도문 본문. 한 줄이 한 문단이다. 신비 선포 화면은 빈 배열. */
  lines: string[];
  /** 단 안에 있을 때만 1~5. 시작·마침 기도에는 없다. */
  decade?: number;
  /**
   * 그 단 내내 화면 위에 함께 떠 있는 묵상 문장. "N단: " 접두어는 뗀다 —
   * 단 번호는 창 제목 라인("묵주기도 · 고통의 신비 … · 1단")이 이미 보여 준다.
   * 신비 선포 화면에는 없다: 그 화면은 제목 자체가 이 문장이라 두 번 보일 필요가 없다.
   * 시작·마침 기도에도 없다.
   */
  meditation?: string;
  /** 성화 이미지 경로. 신비 선포 화면 5장에만 붙는다. */
  image?: string;
  /** 성화를 눌렀을 때 뜨는 묵상 문장들. 묵상문이 없는 단은 빈 배열. */
  explanation?: string[];
}

/** 화면 제목으로 쓰는 기도 이름 6개. 기도문 본문은 `prayerTexts.ts` 에 있다. */
const PRAYER_TITLE = {
  creed: "시작 기도 · 사도신경",
  ourFather: "주님의 기도",
  hailMary: "성모송",
  gloryBe: "영광송",
  salvation: "구원을 비는 기도",
  closing: "마침 기도 · 성모찬송",
};

/**
 * 묵주기도 한 바퀴를 화면 77장의 **평평한 배열**로 펼친다.
 *
 *   시작   사도신경 · 주님의 기도 · 성모송 ×3 · 영광송              →  6장
 *   각 단  신비 선포 · 주님의 기도 · 성모송 ×10 · 영광송 · 구원기도  → 14장 × 5단
 *   마침   성모찬송                                                →  1장
 *
 *   6 + 14×5 + 1 = 77
 *
 * "평평한(flat)" 것이 핵심이다. 중첩 구조로 두면 화면 쪽에서 "지금 몇 단의 몇
 * 번째 기도인가"를 매번 계산해야 하지만, 한 줄로 펴 두면 **인덱스 하나만 있으면
 * 된다.** 그래서 다음/이전이 `index + 1` / `index - 1` 로 끝난다.
 */
export function buildRosarySteps(id: MysteryId): RosaryStep[] {
  const mystery = getMysterySection(id);

  /**
   * 성모송 화면을 `count` 장 만든다. `decade` 를 주면 각 화면에 몇 단인지 표시된다.
   *
   * [TS] `Array.from({ length: count }, (_, i) => ...)` 는 파이썬의
   *      `[f(i) for i in range(count)]` 와 같다. 첫 인자 `{length: count}` 는
   *      "길이만 있는 가짜 배열", 둘째 인자는 각 자리를 채우는 함수다.
   *      `_` 는 안 쓰는 값이라는 관례적 이름(파이썬과 같다).
   *      → docs/typescript-for-python.md#4-배열
   */
  const hailMarys = (count: number, decade?: number, meditation?: string): RosaryStep[] =>
    Array.from({ length: count }, (_, i) => ({
      title: PRAYER_TITLE.hailMary,
      // [TS] 백틱 문자열 안의 `${...}` 는 파이썬 f-string 과 같다. → "3 / 10"
      ordinal: `${i + 1} / ${count}`,
      lines: HAIL_MARY,
      decade,
      meditation,
    }));

  // "1단: 예수님께서 …" → "예수님께서 …". 단 번호는 창 제목 라인이 따로 보여 준다.
  const stripDecadePrefix = (line: string) => line.replace(/^\d+단:\s*/, "");

  return [
    // ── 시작 기도 6장 ────────────────────────────────────────────
    { title: PRAYER_TITLE.creed, lines: APOSTLES_CREED },
    { title: PRAYER_TITLE.ourFather, lines: OUR_FATHER },
    // [TS] `...` 는 배열을 그 자리에 펼쳐 넣는다. 파이썬의 `*hail_marys(3)`.
    //      이게 없으면 배열이 통째로 한 원소로 들어가 버린다.
    ...hailMarys(OPENING_HAIL_MARYS),
    { title: PRAYER_TITLE.gloryBe, lines: GLORY_BE },

    // ── 1단~5단, 각 14장 ─────────────────────────────────────────
    // [TS] 여기 `Array.from(...)` 은 "배열 5개가 든 배열"(5 × 14장)을 만들고,
    //      뒤의 `.flat()` 이 그걸 70장짜리 한 줄로 편다. `.flat()` 은 한 겹만
    //      펴기 때문에, 안쪽의 `hailMarys(...)` 는 `...` 로 미리 풀어 둬야 한다.
    ...Array.from({ length: DECADES_PER_ROSARY }, (_, d) => {
      const meditation = stripDecadePrefix(mystery.lines[d]);
      return [
        // 신비 선포 화면. 제목이 곧 본문이라 `lines` 가 빈 배열이고, 대신 성화와
        // 묵상이 붙는다. meditation 필드는 일부러 안 준다 — 제목과 같은 문장이
        // 두 번 보이기 때문이다.
        {
          title: meditation,
          lines: [],
          decade: d + 1,
          // 경로를 문자열로 조립한다. 그래서 파일이 없어도 빌드는 통과하고,
          // 대신 화면에서 404 가 난다(`RosaryStepView` 가 조용히 숨긴다).
          image: `/images/rosary/${id}-${d + 1}.jpeg`,
          explanation: MYSTERY_MEDITATIONS[id]?.[d + 1] ?? [],
        },
        { title: PRAYER_TITLE.ourFather, lines: OUR_FATHER, decade: d + 1, meditation },
        ...hailMarys(HAIL_MARYS_PER_DECADE, d + 1, meditation),
        { title: PRAYER_TITLE.gloryBe, lines: GLORY_BE, decade: d + 1, meditation },
        { title: PRAYER_TITLE.salvation, lines: SALVATION_PRAYER, decade: d + 1, meditation },
      ];
    }).flat(),

    // ── 마침 기도 1장 ────────────────────────────────────────────
    { title: PRAYER_TITLE.closing, lines: SALVE_REGINA },
  ];
}
