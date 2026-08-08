"use client";

import { dictionaries } from "./dictionaries";
import { useLanguage } from "./LanguageContext";

/**
 * 화면 문구를 꺼내 쓰는 훅. 이 앱의 모든 텍스트는 여기를 거친다.
 *
 *   const { t } = useTranslation();
 *   t("counters.weekdayMass")   // → "평일미사참례"
 *
 * 번역 문구는 `dictionaries/ko.ts`(원본)와 `en.ts` 에 중첩된 객체로 들어 있고,
 * 위처럼 점으로 이어 붙인 문자열로 그 안을 파고든다.
 */

/**
 * 중첩 객체에서 "a.b.c" 경로를 따라 값을 꺼낸다. 도중에 길이 끊기면 undefined.
 *
 * 예) getPath({counters: {weekdayMass: "평일미사참례"}}, "counters.weekdayMass")
 */
function getPath(obj: unknown, path: string): unknown {
  // [TS] `let` 은 값을 바꿀 수 있는 변수, `const` 는 못 바꾸는 변수다.
  //      여기처럼 한 칸씩 파고들며 갈아 끼워야 할 때만 `let` 을 쓴다.
  let current: unknown = obj;
  for (const key of path.split(".")) {
    // 객체가 아니거나 그런 키가 없으면 더 들어갈 수 없다.
    if (!current || typeof current !== "object" || !(key in current)) {
      return undefined;
    }
    // [TS] `as Record<string, unknown>` 은 "이건 문자열 키를 가진 객체라고 보자"는
    //      선언이다. TypeScript 는 임의의 문자열로 객체를 뒤지는 걸 기본적으로
    //      막기 때문에, 바로 위에서 `key in current` 로 확인한 뒤 이렇게 알려 준다.
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function useTranslation() {
  const { language } = useLanguage();
  const dict = dictionaries[language];

  /**
   * 경로에 해당하는 문구를 준다.
   *
   * 못 찾으면 **경로 문자열을 그대로** 돌려준다. 화면이 깨지는 대신
   * "counters.foo" 같은 글자가 눈에 띄게 보여서 오타를 바로 알아챌 수 있다.
   * (번역 키는 문자열이라 오타가 나도 컴파일러가 잡아 주지 못한다.)
   */
  const t = (path: string): string => {
    const value = getPath(dict, path);
    return typeof value === "string" ? value : path;
  };

  // `language` 도 함께 돌려준다. 날짜 포맷 같은 lib 함수에 그대로 넘겨 쓴다.
  return { t, language };
}
