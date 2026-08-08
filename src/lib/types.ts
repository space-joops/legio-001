/**
 * 이 앱이 다루는 모든 데이터의 "모양"을 한곳에 모아 둔 파일.
 *
 * 백엔드가 없어서 DB 스키마 문서가 따로 없다. 그래서 이 파일이 사실상
 * 스키마 정의서 역할을 한다. localStorage 에 들어가는 값은 전부 여기 있는
 * 타입 중 하나이며, 새 필드를 추가할 때도 여기서 시작한다.
 *
 * 크게 세 갈래로 읽으면 된다.
 *   1. 단원 개인용  — Profile → WeeklyReport   (홈 화면에서 만드는 주간 보고)
 *   2. 쁘레시디움 명단 — PraesidiumRoster        (서기가 관리하는 단원 명부)
 *   3. 서기용 월례 보고 — MonthlyReport          (1·2를 모두 품는 가장 큰 상자)
 *
 * [TS] 이 파일에는 실행되는 코드가 한 줄도 없다. `type`/`interface` 는 컴파일할 때
 *      검사에만 쓰이고 빌드 결과물에서는 통째로 사라진다. 파이썬의 타입 힌트가
 *      런타임에 남는 것과 다르다. → docs/typescript-for-python.md#6-타입
 */

/**
 * 홈 화면 카운터 5종의 식별자.
 *
 * [TS] `|` 로 이어붙인 것을 유니온 타입이라고 한다. 파이썬의
 *      `Literal["weekdayMass", "priestPrayer", ...]` 와 같다. 이 다섯 문자열
 *      말고 다른 값을 넣으면 컴파일 에러가 난다.
 */
export type PrayerItemKey =
  | "weekdayMass"
  | "priestPrayer"
  | "chainPrayer"
  | "rosaryDecades"
  | "aspirations";

/**
 * 기도 5종의 횟수 묶음.
 *
 * [TS] `Record<K, V>` 는 파이썬의 `dict[K, V]` 다. 단 여기서 K 가 유니온 타입이라
 *      "이 다섯 개 키가 전부 반드시 있어야 한다"는 뜻이 된다. 하나라도 빠지면 에러.
 */
export type PrayerCounts = Record<PrayerItemKey, number>;

/** 주간 보고는 작성 중(in_progress)이거나 제출됨(submitted) 둘 중 하나다. */
export type ReportStatus = "in_progress" | "submitted";

/** 단원 한 명이 한 회차(주회~주회) 동안 기록하는 개인 주간 보고. */
export interface WeeklyReport {
  id: string;
  schemaVersion: 1;
  sessionNumber: number;
  meetingDateTime: string;
  memberName: string;
  // [TS] 이름 뒤의 `?` 는 "없어도 된다"는 뜻(파이썬의 `NotRequired`/`Optional`).
  // 이 필드들이 생기기 전에 제출된 보고서에는 실제로 값이 없다.
  baptismalName?: string;
  praesidiumName?: string;
  parishName?: string;
  activityNote?: string;
  counts: PrayerCounts;
  /**
   * 현재 묵주 세트에서 채운 구슬 수(0~4). 5가 되는 순간
   * `counts.rosaryDecades` 에 5를 더하고 0으로 되돌린다. 그래서 채우다 만
   * 세트는 보고서에 절대 올라가지 않는다.
   *
   * `counts` 안에 넣지 않고 일부러 형제 필드로 뒀다. `PRAYER_ITEMS` 를 순회하는
   * 모든 곳(월례 보고서의 기도 표, 교구 지시사항 줄, LEGIO1 서기 전송 payload)에
   * 공식 양식에는 자리가 없는 열이 하나 더 생기기 때문이다.
   *
   * 읽을 때는 항상 `?? 0` 을 붙일 것 — 이 필드가 생기기 전에 저장된 보고서에는 없다.
   */
  rosarySetProgress?: number;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

/** 설정 화면에서 입력하는 내 정보. 새 주간 보고를 만들 때 여기서 값을 복사해 간다. */
export interface Profile {
  name: string;
  baptismalName: string;
  praesidiumName: string;
  parishName: string;
}

export type Language = "ko" | "en";

export type FontScale = "small" | "medium" | "large" | "xlarge";
export type FontFamily = "system" | "nanum" | "catholic";

/** 앱 전역 설정. 화면에 보이는 것(언어·글자)과 동작(스플래시)만 담는다. */
export interface Settings {
  language: Language;
  fontScale: FontScale;
  fontFamily: FontFamily;
  /** 앱을 열 때 레지오 마리애 성화 스플래시를 보여줄지. */
  splashEnabled: boolean;
  hidePlatformChoicePopup?: boolean;
}

/** 일정 화면에서 등록하는 예정 + 알림. */
export interface ScheduleEvent {
  id: string;
  title: string;
  dateTime: string; // ISO 문자열
  reminderMinutesBefore: number;
  createdAt: string;
  /** 알림을 이미 띄웠으면 그 시각(ISO). 같은 알림이 두 번 뜨는 걸 막는 표시다. */
  notifiedAt?: string;
}

export type OfficerRole = "president" | "vicePresident" | "secretary" | "treasurer";

/** 간부 한 명(단장·부단장·서기·회계). */
export interface OfficerEntry {
  role: OfficerRole;
  name: string;
  baptismalName: string;
  appointedDate: string; // ISO 날짜
  note: string;
}

/** 공식 양식의 단원 수 칸 6종. 숫자만 담는다. */
export interface MemberCounts {
  activeMale: number;
  activeFemale: number;
  praetorium: number;
  auxiliaryMale: number;
  auxiliaryFemale: number;
  adjutorium: number;
}

/** 명단에 실제로 이름이 올라간 단원 한 명. */
export interface MemberEntry {
  id: string;
  name: string;
  baptismalName: string;
}

/**
 * 구분별 단원 명단. `MemberCounts` 와 정확히 같은 6개 키를 갖되 값이 이름 배열이다.
 *
 * [TS] `keyof MemberCounts` 는 "MemberCounts 가 가진 키들의 유니온"을 뽑아낸다.
 *      즉 `"activeMale" | "activeFemale" | ...`. 이렇게 써 두면 `MemberCounts` 에
 *      칸을 하나 추가할 때 이쪽도 자동으로 따라오므로 두 곳이 어긋날 수 없다.
 */
export type MemberRoster = Record<keyof MemberCounts, MemberEntry[]>;

/** 쁘레시디움 명단 전체. 서기가 관리하고, 월례 보고서가 통째로 스냅샷해 간다. */
export interface PraesidiumRoster {
  /** 보고서 서명란에 인쇄된다. */
  praesidiumName: string;
  councilAffiliation: string;
  spiritualDirectorName: string;
  spiritualDirectorBaptismalName: string;
  officers: OfficerEntry[];
  memberCounts: MemberCounts;
  memberRoster: MemberRoster;
  /** 0 = 일요일 … 6 = 토요일. -1 은 아직 설정 안 함. */
  regularMeetingWeekday: number;
}

/** 월례 보고서의 의안(회의 안건) 한 줄. */
export interface AgendaItem {
  id: string;
  status: "실시" | "계획";
  title: string;
  organizer: string;
  dateTime: string;
  location: string;
  attendanceNote: string;
}

/**
 * 출석부 한 줄(사람 한 명).
 *
 * [TS] `sessions: Record<number, boolean>` 은 파이썬의 `dict[int, bool]`.
 *      회차 번호 → 출석 여부다. 예) `{ 1: true, 2: false }`
 */
export interface AttendanceRecord {
  personId: string;
  personLabel: string;
  isOfficer: boolean;
  sessions: Record<number, boolean>;
}

/** 기도표 한 줄(사람 한 명). 회차 번호 → 그 회차에 바친 기도 5종. */
export interface PrayerSessionEntry {
  personId: string;
  personLabel: string;
  sessions: Record<number, PrayerCounts>;
}

/** "영세·외짝(0/1), 냉담회두(0/3), …" 처럼 실적/목표 꼴로 인쇄된다. */
export interface EvangelizationTally {
  result: number;
  target: number;
}

export interface EvangelizationTallies {
  baptism: EvangelizationTally;
  returnToFaith: EvangelizationTally;
  activeMember: EvangelizationTally;
  praetorium: EvangelizationTally;
}

/** 이 활동이 공식 양식의 어느 줄로 집계되는지. */
export type ActivityLine = "praesidium" | "parish";

/** 활동 항목 카탈로그의 한 줄. 서기가 목록을 직접 편집할 수 있다. */
export interface ActivityItem {
  id: string;
  /** 이름을 바꿔도 그대로인 값 — 활동 기록이 이 값을 참조한다. */
  key: string;
  label: string;
  line: ActivityLine;
  order: number;
  /** 선택 목록에서 감추되, 이미 이 항목을 쓴 보고서에서는 계속 집계된다. */
  hidden: boolean;
}

/** 단원 한 명이 한 회차에 기록한 활동 하나. */
export interface ActivityEntry {
  id: string;
  personId: string;
  sessionNumber: number;
  itemKey: string;
  count: number;
  /** 서기 본인 참고용. 인쇄물에는 절대 나가지 않는다. */
  note: string;
}

/**
 * 회계가 지출을 적을 때 골라 쓰는 이름 후보.
 *
 * 안정적인 key 가 없다 — 지출은 이름(label) 자체를 복사해 저장하므로 이 목록은
 * 그냥 타이핑을 줄여 주는 단축키일 뿐이다.
 */
export interface ExpenseItem {
  id: string;
  label: string;
  order: number;
  /** 이미 이 항목을 쓴 달을 건드리지 않고 선택 목록에서만 감춘다. */
  hidden: boolean;
}

/** 한 회차에 기록된 지출 한 줄. */
export interface TreasuryExpense {
  id: string;
  /**
   * 기록하던 시점의 항목 이름 그대로.
   *
   * 참조가 아니라 값을 복사해 두는 이유: 카탈로그에서 이름을 바꾸거나 감춰도
   * 이미 제출한 달의 숫자가 뒤늦게 달라지는 일이 있어서는 안 되기 때문이다.
   * (활동 기록이 `itemKey` 로 참조하는 것과 정반대의 선택이다.)
   */
  label: string;
  amount: number;
}

/** 회계 장부에서 한 회차에 해당하는 쪽. */
export interface TreasurySessionEntry {
  sessionNumber: number;
  /** 이 회차에 보고된 비밀헌금. */
  offering: number;
  expenses: TreasuryExpense[];
}

/**
 * 서기가 작성하는 월례 보고서 한 건. 이 앱에서 가장 큰 데이터 구조다.
 *
 * 읽을 때 핵심은 **원본과 파생을 구분**하는 것이다. 아래 네 쌍은 왼쪽이 원본이고
 * 오른쪽은 원본이 바뀔 때마다 다시 계산해 덮어써야 하는 값이다.
 *
 *   attendanceRoll  → attendance
 *   prayerRoll      → prayerCounts
 *   treasuryLedger  → treasury 의 income/expense/balance/expenseBreakdown
 *   roster          → memberCounts
 *
 * 파생값을 굳이 저장해 두는 이유는 인쇄 화면·RTF 내보내기·공유 텍스트가 전부
 * 이 값을 그대로 읽어 쓰기 때문이다.
 */
export interface MonthlyReport {
  id: string;
  yearMonth: string; // "2026-06"
  sessionRangeStart: number;
  sessionRangeEnd: number;
  /** 0 = 일요일 … 6 = 토요일. -1 은 아직 설정 안 함. */
  meetingWeekday: number;
  meetingTime: string;
  meetingLocation: string;
  /** attendanceRoll 에서 파생. */
  attendance: {
    officersPresent: number;
    officersTotal: number;
    membersPresent: number;
    membersTotal: number;
  };
  attendanceRoll: AttendanceRecord[];
  prayerRoll: PrayerSessionEntry[];
  /** 보고서를 만든 시점의 명단 스냅샷. 이후 명단이 바뀌어도 이 달은 그대로다. */
  roster: PraesidiumRoster;
  memberCountsPrevMonth: MemberCounts;
  memberCountsThisMonth: MemberCounts;
  memberCountsIncrease: MemberCounts;
  memberCountsDecrease: MemberCounts;
  agendaItems: AgendaItem[];
  treasury: {
    /** 그달의 이월금. 이 안에서 유일하게 사람이 직접 입력하는 숫자다. */
    broughtForward: number;
    /**
     * income / expense / balance / expenseBreakdown 은 treasuryLedger 에서
     * 파생된 값이고, prayerCounts 가 prayerRoll 에서 파생되는 것과 같은 방식으로
     * 함께 저장된다. 인쇄 화면·RTF 내보내기·공유 텍스트가 이 값을 읽으므로
     * 장부를 고칠 때마다 반드시 다시 써 줘야 한다.
     */
    income: number;
    expense: number;
    balance: number;
    expenseBreakdown: string;
  };
  /** 위 네 개의 재정 숫자를 계산해 내는 회차별 장부(원본). */
  treasuryLedger: TreasurySessionEntry[];
  prayerCounts: PrayerCounts;
  /** 단원별 활동 기록. 공식 양식의 활동 줄로 합산된다. */
  activityEntries: ActivityEntry[];
  /**
   * 그달 쁘레시디움 전체의 주일미사 참례 합계.
   *
   * 처음에는 (기도표에 오른 인원 × 그달 주일 수)로 자동 계산된다. 단원이 따로
   * 보고하지 않으면 주일미사는 전원 참석한 것으로 보기 때문이다. 대축일 미사나
   * 결석이 있으면 서기가 손으로 조정한다.
   */
  sundayMassTotal: number;
  /** 공식 양식대로, 연초 누계 선교 실적을 목표 대비로 적는다. */
  evangelization: EvangelizationTallies;
  dioceseInstructions: string;
  parishInstructions: string;
  councilInstructions: string;
  activitySummary: string;
  cumulativeEvangelization: string;
  otherNotes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 내보내기 파일이 어느 범위를 담고 있는지.
 *
 * 파일 하나가 무엇을 덮어쓸 수 있는지를 이 값이 정한다. 단원용 파일을 잘못
 * 넣어 서기의 명단이 통째로 지워지는 사고를 막기 위해 도입됐다.
 *   all            — 옛 형식(전부 덮어씀)
 *   personal       — 내 기록만
 *   secretary      — 서기 데이터만
 *   secretaryMonth — 월례 보고서 한 건만
 */
export type ExportScope = "all" | "personal" | "secretary" | "secretaryMonth";

/** 예전 "전체 내보내기"가 만들어 내던 JSON 파일의 형태. */
export interface ExportedData {
  exportedAt: string;
  dataSchemaVersion: number;
  /** 범위 구분이 생기기 전에 내보낸 파일에는 이 값이 아예 없다. */
  exportScope?: "all";
  profile: Profile;
  history: WeeklyReport[];
  currentReport: WeeklyReport | null;
  schedule: ScheduleEvent[];
  roster: PraesidiumRoster;
  monthlyReports: MonthlyReport[];
}

/** 단원 개인 데이터만. 이 파일을 가져와도 서기 데이터는 건드리지 않는다. */
export interface PersonalExportFile {
  exportScope: "personal";
  exportedAt: string;
  dataSchemaVersion: number;
  profile: Profile;
  history: WeeklyReport[];
  currentReport: WeeklyReport | null;
  schedule: ScheduleEvent[];
}

/** 서기 데이터만. 이 파일을 가져와도 단원 본인의 기록은 건드리지 않는다. */
export interface SecretaryExportFile {
  exportScope: "secretary";
  exportedAt: string;
  dataSchemaVersion: number;
  roster: PraesidiumRoster;
  monthlyReports: MonthlyReport[];
  activityItems: ActivityItem[];
  expenseItems: ExpenseItem[];
}

/**
 * 월례 보고서 한 건.
 *
 * 현재 명단은 넣지 않는다. 보고서는 저마다 만들어질 당시의 명단 스냅샷을
 * 자기 안에 품고 있어서 파일 하나로 완결되며, 이걸 가져왔다고 해서 그 기기의
 * 현재 명단을 덮어써서는 안 되기 때문이다.
 */
export interface SecretaryMonthExportFile {
  exportScope: "secretaryMonth";
  exportedAt: string;
  dataSchemaVersion: number;
  /** 항상 한 건만 들어간다. 다른 파일들과 모양을 맞추려고 배열로 두었다. */
  monthlyReports: MonthlyReport[];
}

/**
 * 가져오기가 받아들일 수 있는 파일 네 종류.
 *
 * [TS] 여러 타입을 `|` 로 묶은 유니온이다. `exportScope` 값을 확인하면
 *      TypeScript 가 넷 중 어느 것인지 알아서 좁혀 준다(태그 유니온).
 */
export type AnyExportFile =
  | ExportedData
  | PersonalExportFile
  | SecretaryExportFile
  | SecretaryMonthExportFile;
