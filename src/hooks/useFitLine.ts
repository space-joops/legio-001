"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// 정적 export 라 서버 렌더 중에는 useLayoutEffect 가 경고를 낸다.
// 브라우저에서는 페인트 전에 맞춰야 "커졌다 작아지는" 깜박임이 없다.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * 글자가 칸 폭을 넘치면 폰트를 1px씩 줄여 **한 줄**에 맞춘다.
 *
 * 글자 크기 설정(설정 > 글자 크기)을 키우면 "시작 기도 · 사도신경" 같은 제목이
 * 두 줄로 꺾이는데, 제목류는 줄바꿈되느니 조금 작아지는 편이 낫다는 사용자
 * 피드백으로 만들었다. 본문 기도문에는 쓰지 않는다 — 본문은 줄바꿈이 정상이다.
 *
 * 동작:
 *   1. 인라인 스타일을 지워 CSS 원래 크기에서 다시 시작한다.
 *   2. `white-space: nowrap`(+ flex 줄바꿈 금지)으로 강제 한 줄을 만든 뒤,
 *      넘치는 동안 폰트를 1px씩 줄인다.
 *   3. 최소 크기(`minRem`, 루트 rem 기준이라 글자 크기 설정과 함께 커진다)까지
 *      줄여도 안 들어가면 포기하고 원래 크기·줄바꿈으로 되돌린다. 아주 긴
 *      문장(신비 선포 등)을 깨알같이 만드는 것보다 두 줄이 낫기 때문이다.
 *
 * `dep` 는 "다시 재야 하는 순간"을 알리는 값 — 글자 내용이 같아도 요소가
 * key 로 새로 만들어지는 화면(RosaryStepView)에서는 stepIndex 를 섞어 넘길 것.
 */
export function useFitLine<T extends HTMLElement>(dep: string, minRem = 1) {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 아직 안 보이는 요소(닫힌 <dialog> 안 등)는 폭이 0이라 잴 수 없다.
    // 보이게 되면서 내용이 채워지면 dep 가 바뀌어 다시 불린다.
    if (el.clientWidth === 0) return;

    // CSS 가 정한 원래 크기에서 다시 시작한다.
    el.style.fontSize = "";
    el.style.whiteSpace = "nowrap";
    el.style.flexWrap = "nowrap"; // .heading 처럼 flex 인 요소의 줄바꿈도 막는다

    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const minPx = minRem * rootPx;
    let size = parseFloat(getComputedStyle(el).fontSize);

    // +1 은 소수점 반올림 오차 허용치.
    while (el.scrollWidth > el.clientWidth + 1 && size - 1 >= minPx) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }

    if (el.scrollWidth > el.clientWidth + 1) {
      // 최소 크기로도 안 들어가는 긴 문장 — 원래 크기로 되돌리고 줄바꿈을 허용한다.
      el.style.fontSize = "";
      el.style.whiteSpace = "";
      el.style.flexWrap = "";
    }
  }, [dep, minRem]);

  return ref;
}
