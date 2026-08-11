import { EMPTY_COUNTS, PRAYER_ITEMS } from "./constants";
import { generateId } from "./id";
import { formatSubmissionBlock } from "./prayerSubmission";
import type { Profile, WeeklyReport } from "./types";

/**
 * 주간 보고를 만들고, 정렬하고, 사람이 읽을 글자로 바꾸는 순수 함수 모음.
 *
 * 여기 있는 함수들은 React 도 저장소도 모른다. 입력을 주면 출력이 나올 뿐이라
 * 화면 없이도 테스트할 수 있고, TypeScript 를 처음 읽을 때 JSX 에 방해받지 않는
 * 좋은 출발점이다.
 */

/** 새 주간 보고를 만든다. 이 순간의 내 정보(Profile)를 안에 복사해 박아 둔다. */
export function createNewReport(
  sessionNumber: number,
  meetingDateTime: string,
  profile: Profile
): WeeklyReport {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    schemaVersion: 1,
    sessionNumber,
    meetingDateTime,
    // [TS] `memberName: profile.name` 처럼 이름이 다르면 그대로 적고, 위의
    //      `sessionNumber,` 처럼 이름이 같으면 `sessionNumber: sessionNumber` 를
    //      줄여 쓸 수 있다. → docs/typescript-for-python.md#3-객체
    memberName: profile.name,
    baptismalName: profile.baptismalName,
    praesidiumName: profile.praesidiumName,
    parishName: profile.parishName,
    // 반드시 복사해서 넣는다. 그냥 EMPTY_COUNTS 를 넘기면 모든 보고서가 같은
    // 객체 하나를 공유하게 되어, 한 보고서의 카운터를 올리면 전부 같이 올라간다.
    counts: { ...EMPTY_COUNTS },
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };
}

/** 회차 번호가 큰(=최근) 것부터 정렬한다. 원본 배열은 건드리지 않는다. */
export function sortHistory(history: WeeklyReport[]): WeeklyReport[] {
  // [TS] `[...history]` 로 먼저 복사하는 이유: `.sort()` 는 원본 배열을 직접
  //      뒤섞는다(파이썬의 `list.sort()` 와 같다). 원본을 고치면 React 가 변화를
  //      알아채지 못하므로, 항상 복사본을 정렬해서 돌려준다.
  return [...history].sort((a, b) => b.sessionNumber - a.sessionNumber);
}

/**
 * Date 를 `<input type="datetime-local">` 이 요구하는 "2026-06-24T19:30" 꼴로 바꾼다.
 *
 * `toISOString()` 을 쓰면 안 된다. 그건 UTC 로 바꿔 버려서 한국 시간이 9시간
 * 어긋난 채 입력칸에 들어간다.
 */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  // [TS] 백틱(`)으로 감싼 문자열 안의 `${...}` 는 파이썬 f-string 의 `{...}` 다.
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 저장된 ISO 문자열을 화면에 보여 줄 날짜·시각 문구로 바꾼다. */
export function formatMeetingDateTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  // 잘못된 날짜 문자열은 NaN 이 된다. "Invalid Date" 가 화면에 뜨지 않게 막는다.
  if (Number.isNaN(date.getTime())) return "";
  // Intl 은 브라우저가 기본 제공하는 국제화 도구다. 별도 라이브러리가 필요 없다.
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** 12 → "12회차". */
export function formatSessionLabel(sessionNumber: number): string {
  return `${sessionNumber}회차`;
}

/** 카카오톡 등으로 공유할 때 쓰는 텍스트를 만든다. */
export function formatShareText(report: WeeklyReport): string {
  const title = `레지오 활동보고 (${formatSessionLabel(report.sessionNumber)})`;
  const dateLine = `주회 일시: ${formatMeetingDateTime(report.meetingDateTime)}`;
  // [TS] `||` 는 왼쪽이 "거짓 같은 값"(빈 문자열·0·null…)이면 오른쪽을 쓴다.
  //      이름이 비었을 때 "-" 를 보이려는 것이라 여기서는 `||` 가 맞다.
  //      (`??` 였다면 빈 문자열은 통과해서 아무것도 안 보였을 것이다.)
  const nameLine = `단원: ${report.memberName || "-"}`;
  const lines = PRAYER_ITEMS.map(
    (item) => `${item.label}: ${report.counts[item.key]}${item.unitLabel ?? ""}`
  );
  // 메모가 비어 있으면 줄 자체를 넣지 않는다(빈 배열이면 아래 펼치기에서 사라진다).
  const noteLines = report.activityNote?.trim()
    ? ["", `활동 사항: ${report.activityNote.trim()}`]
    : [];
  // 서기가 숫자를 손으로 옮겨 적지 않고 월례 보고서에 그대로 붙여 넣을 수 있도록,
  // 기계가 읽는 한 줄(LEGIO1|...)을 맨 뒤에 덧붙인다.
  const submissionBlock = formatSubmissionBlock(report);
  // [TS] 배열 안의 `...lines` 는 그 배열을 그 자리에 펼쳐 넣는다.
  //      파이썬의 `[title, dateLine, *lines]` 와 같다.
  return [title, dateLine, nameLine, "", ...lines, ...noteLines].join("\n") + submissionBlock;
}
