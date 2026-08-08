import { createDefaultActivityItems } from "./activityItems";
import { DATA_SCHEMA_VERSION } from "./constants";
import { createDefaultExpenseItems } from "./expenseItems";
import { migrateLegacyTreasury } from "./treasury";
import type {
  ActivityItem,
  ExpenseItem,
  Language,
  MemberCounts,
  MonthlyReport,
  PraesidiumRoster,
  Profile,
  ScheduleEvent,
  Settings,
  WeeklyReport,
} from "./types";

/**
 * localStorage 로 들어가고 나오는 **유일한 출입구**.
 *
 * 이 앱에는 서버도 DB도 없다. 모든 데이터는 브라우저의 localStorage 한 곳에만
 * 있고, 코드 어디에서도 `window.localStorage` 를 직접 부르지 않는다. 반드시
 * 이 파일이 내보내는 `storage` 객체를 거친다. 그래야
 *   - 키 문자열이 코드 곳곳에 흩어지지 않고,
 *   - "초기화"가 빠짐없이 동작하며,
 *   - 옛 버전에서 저장한 데이터도 한곳에서 보정할 수 있다.
 *
 * 새 저장 항목을 추가할 때는 이 파일의 패턴을 그대로 따라가면 된다.
 *   1) `KEYS` 에 키 추가  2) 기본값 상수 추가  3) getter/setter 한 쌍 추가
 */

/**
 * localStorage 에 실제로 쓰이는 키 이름 목록.
 *
 * 전부 `legioMariae.` 로 시작한다. 같은 도메인의 다른 페이지와 이름이 부딪히지
 * 않게 하려는 것이다.
 *
 * [TS] 끝의 `as const` 는 "이 객체는 앞으로 안 바뀐다"고 못 박는 표시다. 이게
 *      없으면 각 값의 타입이 그냥 `string` 이 되는데, 붙이면 `"legioMariae.profile"`
 *      이라는 **그 문자열 자체**가 타입이 된다. → docs/typescript-for-python.md#6-타입
 */
const KEYS = {
  profile: "legioMariae.profile",
  settings: "legioMariae.settings",
  currentReport: "legioMariae.currentReport",
  history: "legioMariae.history",
  schedule: "legioMariae.schedule",
  praesidiumRoster: "legioMariae.praesidiumRoster",
  monthlyReports: "legioMariae.monthlyReports",
  activityItems: "legioMariae.activityItems",
  expenseItems: "legioMariae.expenseItems",
  dataSchemaVersion: "legioMariae.dataSchemaVersion",
  // 이 앱에는 더 이상 스플래시 쿨다운이 없지만, 예전에 이 값을 쓰던 기기에서도
  // resetAll() 이 깨끗이 지워 주도록 목록에는 남겨 둔다.
  lastSplashShownAt: "legioMariae.lastSplashShownAt",
  lastExportedAt: "legioMariae.lastExportedAt",
} as const;

/**
 * 지금 브라우저에서 실행 중인지 확인한다.
 *
 * 이 앱은 정적 파일로 미리 빌드(`output: "export"`)되는데, 그 빌드는 Node.js
 * 안에서 돈다. 거기엔 `window` 가 없으므로 localStorage 를 만지면 터진다.
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * 키 하나를 읽어서 JSON 으로 되돌린다. **어떤 경우에도 예외를 던지지 않는다.**
 *
 * 값이 없거나(처음 실행), 깨졌거나, 브라우저가 아니면 `fallback` 을 그대로 준다.
 *
 * [TS] 이름 뒤의 `<T>` 는 제네릭이다. 파이썬의 `TypeVar` 와 같은 역할로,
 *      "돌려주는 타입은 fallback 으로 넘긴 값의 타입과 같다"는 약속이다. 그래서
 *      `readJson<WeeklyReport[]>(key, [])` 라고 부르면 결과가 곧바로
 *      `WeeklyReport[]` 로 취급된다. → docs/typescript-for-python.md#6-타입
 */
function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    // [TS] `as T` 는 "컴파일러야, 이건 T 라고 믿어라"라는 선언일 뿐 실제 검사는
    //      하지 않는다. 파이썬의 `typing.cast` 와 똑같아서, 저장된 JSON 이
    //      실제로 T 모양인지는 아무도 보장해 주지 않는다. 그래서 아래 getter 들이
    //      기본값과 한 번 더 병합해 빈 구멍을 메운다.
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type WriteFailureListener = () => void;

const writeFailureListeners = new Set<WriteFailureListener>();

/**
 * 저장이 거부됐을 때(용량 초과, Safari 비공개 모드 등) 알림을 받는다.
 *
 * 아래 setter 들은 전부 "쓰고 잊어버리는" 방식이라, 이 통로가 없으면 실패가
 * 완전히 조용히 묻힌다. 그러면 단원은 저장되지도 않는 카운터를 계속 두드리게 된다.
 *
 * [TS] 반환 타입 `() => void` 는 "함수를 돌려준다"는 뜻이다. 그 함수를 나중에
 *      부르면 구독이 해제된다. 화면이 사라질 때 정리하기 편하라고 이렇게 만든다.
 */
export function onStorageWriteFailure(listener: WriteFailureListener): () => void {
  writeFailureListeners.add(listener);
  return () => writeFailureListeners.delete(listener);
}

/** 값을 JSON 문자열로 바꿔 저장한다. 성공하면 true. **여기서도 예외를 던지지 않는다.** */
function writeJson<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // 여기서 예외를 던지면 앱 전체가 죽는다. 이 setter 들은 카운터 탭이나
    // 키 입력 같은 "렌더 바로 옆"에서 불리는데, 거기서 루트까지 예외를 받아 줄
    // 에러 경계가 없기 때문이다. 그래서 던지는 대신 구독자에게 알리기만 한다.
    writeFailureListeners.forEach((listener) => listener());
    return false;
  }
}

export const DEFAULT_PROFILE: Profile = {
  name: "",
  baptismalName: "",
  praesidiumName: "",
  parishName: "",
};
export const DEFAULT_SETTINGS: Settings = {
  language: "ko",
  fontScale: "medium",
  fontFamily: "system",
  splashEnabled: true,
};
const EMPTY_MEMBER_COUNTS_DEFAULT: MemberCounts = {
  activeMale: 0,
  activeFemale: 0,
  praetorium: 0,
  auxiliaryMale: 0,
  auxiliaryFemale: 0,
  adjutorium: 0,
};

/**
 * 옛 버전이 저장한 보고서에 없을 수 있는 필드들만 모아 둔 값.
 * 저장된 보고서 **아래**에 펼쳐서 실제 값이 항상 이기게 한다.
 */
const EMPTY_EVANGELIZATION = {
  baptism: { result: 0, target: 0 },
  returnToFaith: { result: 0, target: 0 },
  activeMember: { result: 0, target: 0 },
  praetorium: { result: 0, target: 0 },
};

/**
 * [TS] 끝의 `satisfies Partial<MonthlyReport>` 는 "이 객체가 MonthlyReport 의
 *      일부와 모양이 맞는지 검사해 달라. 단 타입을 그걸로 바꾸지는 말라"는 뜻이다.
 *      필드 이름을 잘못 적으면 여기서 바로 잡히면서도, 각 값의 구체적인 타입은
 *      그대로 남는다. → docs/typescript-for-python.md#6-타입
 */
const EMPTY_MONTHLY_REPORT_DEFAULTS = {
  attendanceRoll: [],
  prayerRoll: [],
  agendaItems: [],
  activityEntries: [],
  treasuryLedger: [],
  sundayMassTotal: 0,
  evangelization: EMPTY_EVANGELIZATION,
  memberCountsPrevMonth: EMPTY_MEMBER_COUNTS_DEFAULT,
  memberCountsThisMonth: EMPTY_MEMBER_COUNTS_DEFAULT,
  memberCountsIncrease: EMPTY_MEMBER_COUNTS_DEFAULT,
  memberCountsDecrease: EMPTY_MEMBER_COUNTS_DEFAULT,
  dioceseInstructions: "",
  parishInstructions: "",
  councilInstructions: "",
  activitySummary: "",
  cumulativeEvangelization: "",
  otherNotes: "",
  meetingTime: "",
  meetingLocation: "",
} satisfies Partial<MonthlyReport>;

/**
 * 필드가 생기기 전에 저장된 보고서를 그대로 쓰면 인쇄 화면 깊은 곳에서
 * `undefined` 가 튀어나온다. MonthlyReport 는 너무 커서 손으로 다 확인할 수 없으니
 * 읽어 들이는 길목에서 한 번에 메운다.
 */
function normalizeMonthlyReport(stored: MonthlyReport): MonthlyReport {
  // 순서가 곧 로직이다. 재정 마이그레이션은 "ledger 필드가 아예 없는지"를 보고
  // 옛 형식을 판별하므로, 아래 기본값이 빈 ledger 를 먼저 끼워 넣기 *전에*
  // 원본을 봐야 한다.
  //
  // [TS] `{ ...A, ...B }` 는 파이썬의 `{**A, **B}` 다. 뒤에 오는 쪽이 이긴다.
  //      즉 저장된 값이 있으면 기본값을 덮어쓴다. 순서를 뒤집으면 사용자의
  //      데이터가 기본값으로 밀려 날아간다. → docs/typescript-for-python.md#3-객체
  return { ...EMPTY_MONTHLY_REPORT_DEFAULTS, ...migrateLegacyTreasury(stored) };
}

export const DEFAULT_ROSTER: PraesidiumRoster = {
  praesidiumName: "",
  councilAffiliation: "",
  spiritualDirectorName: "",
  spiritualDirectorBaptismalName: "",
  officers: [
    { role: "president", name: "", baptismalName: "", appointedDate: "", note: "" },
    { role: "vicePresident", name: "", baptismalName: "", appointedDate: "", note: "" },
    { role: "secretary", name: "", baptismalName: "", appointedDate: "", note: "" },
    { role: "treasurer", name: "", baptismalName: "", appointedDate: "", note: "" },
  ],
  memberCounts: {
    activeMale: 0,
    activeFemale: 0,
    praetorium: 0,
    auxiliaryMale: 0,
    auxiliaryFemale: 0,
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
  regularMeetingWeekday: -1,
};

/**
 * 앱이 저장소에 접근하는 유일한 창구.
 *
 * getter/setter 를 쌍으로 두는 형태가 계속 반복되며, 네 가지 변형이 있다.
 *   ① 기본값 병합  — 옛 데이터에 없던 필드를 메운다 (profile, settings, roster)
 *   ② 그대로 전달  — 배열이나 null 을 그냥 읽는다 (currentReport, history, schedule)
 *   ③ 한 번 다듬기 — 읽으면서 보정한다 (monthlyReports)
 *   ④ 내장 목록으로 대체 — 비어 있으면 기본 카탈로그를 준다 (activityItems, expenseItems)
 */
export const storage = {
  getProfile(): Profile {
    // 이 필드가 생기기 전에 저장된 프로필도 `undefined` 없이 돌아오도록 기본값과 병합한다.
    return { ...DEFAULT_PROFILE, ...readJson<Partial<Profile>>(KEYS.profile, {}) };
  },
  setProfile(profile: Profile): void {
    writeJson(KEYS.profile, profile);
  },

  getSettings(): Settings {
    // 이 필드가 생기기 전에 저장된 설정도 `undefined` 없이 돌아오도록 기본값과 병합한다.
    return { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>(KEYS.settings, {}) };
  },
  setSettings(settings: Settings): void {
    writeJson(KEYS.settings, settings);
  },
  // 언어는 자기 키가 없다. Settings 안의 한 필드를 읽고 쓰는 지름길일 뿐이다.
  //
  // [TS] 객체 안에서 `this` 는 그 객체 자신(`storage`)을 가리킨다. 파이썬의
  //      `self` 와 비슷해 보이지만 JS 의 `this` 는 "어떻게 호출됐는지"에 따라
  //      달라진다. `storage.getLanguage()` 처럼 점을 찍어 부르는 한 안전하다.
  getLanguage(): Language {
    return this.getSettings().language;
  },
  setLanguage(language: Language): void {
    this.setSettings({ ...this.getSettings(), language });
  },

  getCurrentReport(): WeeklyReport | null {
    return readJson<WeeklyReport | null>(KEYS.currentReport, null);
  },
  setCurrentReport(report: WeeklyReport | null): void {
    writeJson(KEYS.currentReport, report);
  },

  getHistory(): WeeklyReport[] {
    return readJson<WeeklyReport[]>(KEYS.history, []);
  },
  setHistory(history: WeeklyReport[]): void {
    writeJson(KEYS.history, history);
  },

  getSchedule(): ScheduleEvent[] {
    return readJson<ScheduleEvent[]>(KEYS.schedule, []);
  },
  setSchedule(schedule: ScheduleEvent[]): void {
    writeJson(KEYS.schedule, schedule);
  },

  getRoster(): PraesidiumRoster {
    return { ...DEFAULT_ROSTER, ...readJson<Partial<PraesidiumRoster>>(KEYS.praesidiumRoster, {}) };
  },
  setRoster(roster: PraesidiumRoster): void {
    writeJson(KEYS.praesidiumRoster, roster);
  },

  getMonthlyReports(): MonthlyReport[] {
    const stored = readJson<MonthlyReport[]>(KEYS.monthlyReports, []);
    // 저장된 값이 배열이 아니면(손으로 건드렸거나 옛 형식) 통째로 버린다.
    if (!Array.isArray(stored)) return [];
    return stored.map(normalizeMonthlyReport);
  },
  setMonthlyReports(reports: MonthlyReport[]): void {
    writeJson(KEYS.monthlyReports, reports);
  },

  /** 서기가 직접 목록을 손보기 전까지는 내장 카탈로그를 쓴다. */
  getActivityItems(): ActivityItem[] {
    const stored = readJson<ActivityItem[]>(KEYS.activityItems, []);
    if (!Array.isArray(stored) || stored.length === 0) return createDefaultActivityItems();
    return stored;
  },
  setActivityItems(items: ActivityItem[]): void {
    writeJson(KEYS.activityItems, items);
  },

  getExpenseItems(): ExpenseItem[] {
    const stored = readJson<ExpenseItem[]>(KEYS.expenseItems, []);
    if (!Array.isArray(stored) || stored.length === 0) return createDefaultExpenseItems();
    return stored;
  },
  setExpenseItems(items: ExpenseItem[]): void {
    writeJson(KEYS.expenseItems, items);
  },

  /** 마지막으로 내보내기에 성공한 시각(epoch ms). 0 이면 한 번도 백업한 적 없다는 뜻. */
  getLastExportedAt(): number {
    return readJson<number>(KEYS.lastExportedAt, 0);
  },
  setLastExportedAt(timestamp: number): void {
    writeJson(KEYS.lastExportedAt, timestamp);
  },

  getSchemaVersion(): number {
    return readJson<number>(KEYS.dataSchemaVersion, 0);
  },
  ensureSchemaVersion(): void {
    writeJson(KEYS.dataSchemaVersion, DATA_SCHEMA_VERSION);
  },

  /**
   * 설정 화면의 "데이터 초기화".
   *
   * `KEYS` 를 통째로 순회하므로, 위에 키를 하나 추가하면 초기화도 자동으로
   * 따라온다. 지워야 할 항목을 깜빡할 일이 없도록 일부러 이렇게 짰다.
   */
  resetAll(): void {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
  },
};
