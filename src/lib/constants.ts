import type { PrayerCounts, PrayerItemKey } from "./types";

/**
 * 홈 화면 카운터 5종의 정의와, 앱 전체가 공유하는 몇 안 되는 상수.
 *
 * 화면에 카운터를 늘리거나 순서를 바꾸고 싶다면 아래 `PRAYER_ITEMS` 배열만
 * 고치면 된다. 홈 화면(`CounterGrid`)·월례 보고서의 기도 표·서기 전송 텍스트가
 * 전부 이 배열을 순회해서 만들어지기 때문에, 한 곳만 고쳐도 다 따라온다.
 */

/** 카운터 한 종류의 설정. */
export interface PrayerItemConfig {
  key: PrayerItemKey;
  /** 화면에 그대로 보이는 이름. */
  label: string;
  /** 월례 보고서의 좁은 표 머리에 쓰는 줄임말. */
  abbrev: string;
  icon: "mass" | "priest" | "chain" | "rosary" | "aspiration";
  /** 이름 옆과 공유 텍스트에 붙는 단위(묵주기도만 "단"을 갖는다). */
  unitLabel?: string;
  /**
   * 탭 한 번이 숫자를 1 올리는 대신, 이 개수만큼 구슬을 채우고 나서야 숫자가
   * 움직인다. 묵주기도만 해당 — 묵주기도는 5단을 한 묶음으로 바치기 때문이다.
   */
  setSize?: number;
}

/** 묵주기도는 5단이 한 묶음이라, 탭 5번이 모여야 5단이 한 번에 기록된다. */
export const ROSARY_SET_SIZE = 5;

/** 홈 화면에 위에서부터 이 순서대로 카운터가 그려진다. */
export const PRAYER_ITEMS: PrayerItemConfig[] = [
  { key: "weekdayMass", label: "평일미사참례", abbrev: "미", icon: "mass" },
  { key: "priestPrayer", label: "사제를 위한 기도", abbrev: "사", icon: "priest" },
  { key: "chainPrayer", label: "주모경", abbrev: "주", icon: "chain" },
  {
    key: "rosaryDecades",
    label: "묵주기도",
    abbrev: "묵",
    icon: "rosary",
    unitLabel: "단",
    setSize: ROSARY_SET_SIZE,
  },
  { key: "aspirations", label: "화살기도", abbrev: "화", icon: "aspiration" },
];

/**
 * 새 주간 보고를 만들 때 쓰는 0으로 채워진 카운터.
 *
 * 쓸 때는 반드시 `{ ...EMPTY_COUNTS }` 처럼 복사해서 쓸 것. 그냥 넘기면 모든
 * 보고서가 같은 객체 하나를 공유해서 한 곳을 고치면 전부 같이 바뀐다.
 * (파이썬에서 기본 인자로 `def f(x={})` 를 쓰면 안 되는 것과 똑같은 함정이다.)
 */
export const EMPTY_COUNTS: PrayerCounts = {
  weekdayMass: 0,
  priestPrayer: 0,
  chainPrayer: 0,
  rosaryDecades: 0,
  aspirations: 0,
};

/**
 * 저장된 데이터의 형식 버전.
 *
 * 2: 출석 기본값이 "결석"이다. 버전 1로 쓰인 보고서는 모든 회차를 출석으로
 * 채워 두었는데, 이는 "기도 숫자가 곧 출석 표시"라는 화면 자체의 규칙과
 * 어긋났다.
 */
export const DATA_SCHEMA_VERSION = 2;

/**
 * 범위를 나눈 내보내기 파일(개인 / 서기 / 한 달)에 찍히는 버전.
 * 이 파일들만 `DATA_SCHEMA_VERSION` 대신 이 값을 쓴다.
 *
 * 반드시 지켜야 하는 규칙: **전체 백업은 계속 2, 범위 파일은 3.**
 *
 * 왜 그런가. 범위 구분이 없던 옛 버전 앱은 가져오기를 하면 모든 항목을 통째로
 * 덮어쓴다. 그런데 개인용 파일은 그 앱의 검사(프로필 + 기록이 있는가)를
 * 통과해 버리므로, 버전으로 막지 않으면 서기의 데이터가 조용히 날아간다.
 * 3 으로 찍어 두면 옛 앱이 "앱을 업데이트하세요"라며 거부한다.
 * 반대로 전체 백업을 3 으로 올리면 옛 앱이 멀쩡한 백업까지 거부하게 된다.
 */
export const SCOPED_EXPORT_VERSION = 3;
