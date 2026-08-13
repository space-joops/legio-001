/**
 * 뗏세라 기도문을 **구절 단위로 묶는** 로직.
 *
 * 해설 데이터 자체는 `tesseraCommentary.ts` 에 있다. 여기는 타입과 묶는 함수만
 * 둔다 — `rosaryMysteries.ts`(로직) ↔ `rosaryMeditations.ts`(데이터) 와 같은 구조다.
 *
 * ## 왜 "구절"이 줄 하나가 아닌가
 *
 * `tesseraTexts.ts` 의 `lines` 는 **화면에 한 문단으로 그리는 단위**지, 뜻이 끊기는
 * 단위가 아니다. 예를 들어 까떼나의 마니피캇은 ○/● 를 번갈아 바치느라 성경 한 절이
 * 두 줄로 쪼개져 있다.
 *
 *     "○ 내 영혼이 ✝주님을 찬양하고"                      <- 루카 1,46
 *     "내 구원자 하느님 안에서 내 마음 기뻐 뛰노네."         <- 루카 1,47
 *
 * 그래서 해설은 **연속된 줄 묶음**(from..to)에 붙인다.
 *
 * ## 왜 줄 텍스트를 키로 쓰지 않는가
 *
 * 같은 문장이 여러 곳에 나온다. `"● 저희를 위하여 빌어 주소서."` 는 뗏세라 안에서만
 * 여덟 번 나오고, 성호경과 까떼나 후렴은 아예 같은 상수를 두 장에서 함께 쓴다
 * (`tesseraTexts.ts` 의 `SIGN_OF_CROSS`, `ANTIPHON`). 문장을 키로 잡으면 "묵주기도
 * 호칭기도의 성 요셉"과 "마침기도 호칭기도의 세례자 요한"에 같은 해설이 붙어 버린다.
 * 그래서 위치(`section`, `from`, `to`)로 가리킨다.
 *
 * [TS] `readonly` 가 붙은 배열은 파이썬의 튜플처럼 "받아서 읽기만 한다"는 뜻이다.
 *      → docs/typescript-for-python.md#6-타입
 */

/** 성경 인용 한 건. */
export interface BibleQuote {
  /**
   * 주교회의 「성경」 약칭 + 장,절. 예) `"루카 1,28"`, `"1코린 13,13"`, `"시편 104,30"`.
   * 표기가 흔들리지 않도록 테스트가 형식을 검사한다.
   */
  ref: string;
  /** 웹에서 해당 성경 장으로 바로 이동할 수 있는 공식 성경 링크 (선택사항) */
  link?: string;
  /** 「성경」(새번역) 본문. 인용한 절을 그대로 옮긴다. */
  text: string;
}

/** 기도문 한 구절(연속된 줄 묶음)에 붙는 해설. */
export interface VerseCommentary {
  /** `TesseraChapter.entry.sections` 안에서 몇 번째 묶음인가. */
  section: number;
  /** 그 section 안에서 이 구절이 시작하는 줄 번호. 0부터, 이 줄을 **포함**한다. */
  from: number;
  /** 끝나는 줄 번호. 이 줄도 **포함**한다. 한 줄짜리 구절이면 `from` 과 같다. */
  to: number;
  /** 팝업 제목. 구절을 대표하는 짧은 말. */
  title: string;
  /** 쉬운 풀이. 배열의 한 원소가 한 문단이 된다. */
  body: string[];
  /** 관련 성경. 없을 수는 없다(교회 전승에서 온 구절도 뿌리가 되는 말씀은 있다). */
  quotes: BibleQuote[];
}

/** 화면에 그릴 줄 묶음 하나. */
export interface VerseGroup {
  /** 이 묶음에 들어가는 기도문 줄들. */
  lines: string[];
  /** 첫 줄의 번호. React key 로 쓴다. */
  from: number;
  /** 붙은 해설. `null` 이면 눌러도 아무 일이 없는, 읽기만 하는 묶음이다. */
  commentary: VerseCommentary | null;
}

/**
 * 한 section 의 줄들을 해설 범위대로 잘라 묶음 배열로 만든다.
 *
 * 해설이 가리키지 않는 줄도 `commentary: null` 묶음으로 그대로 남는다. 즉 이 함수는
 * **줄을 잃어버리지 않는다** — 이어 붙이면 언제나 원래 `lines` 가 된다. 해설 데이터가
 * 비어 있어도 화면은 지금과 똑같이 나온다.
 *
 * @param lines      `sections[sectionIndex].lines`
 * @param all        그 장의 해설 전부 (다른 section 것이 섞여 있어도 된다)
 * @param sectionIndex 지금 그리는 section 번호
 */
export function groupSectionLines(
  lines: string[],
  all: readonly VerseCommentary[],
  sectionIndex: number,
): VerseGroup[] {
  const mine = all
    .filter((one) => one.section === sectionIndex)
    .slice()
    .sort((a, b) => a.from - b.from);

  const groups: VerseGroup[] = [];
  let cursor = 0;

  for (const commentary of mine) {
    // 해설이 시작되기 전까지 남은 줄들은 해설 없는 묶음으로 흘려보낸다.
    if (commentary.from > cursor) {
      groups.push({
        lines: lines.slice(cursor, commentary.from),
        from: cursor,
        commentary: null,
      });
    }
    groups.push({
      lines: lines.slice(commentary.from, commentary.to + 1),
      from: commentary.from,
      commentary,
    });
    cursor = commentary.to + 1;
  }

  if (cursor < lines.length) {
    groups.push({ lines: lines.slice(cursor), from: cursor, commentary: null });
  }

  return groups;
}
