"use client";

import { useRef, type RefObject, type TouchEvent } from "react";

/**
 * 좌우 스와이프(손가락으로 쓸어 넘기기)를 감지하는 훅.
 *
 * 묵주기도 안내 화면에서 다음/이전 기도로 넘어가는 데 쓴다. 예전에는 이 로직이
 * `RosaryGuide.tsx` 안에 핸들러 3개 + ref 2개로 흩어져 있었는데, **스와이프를
 * 손보고 싶을 때 열어야 할 파일이 하나가 되도록** 여기로 모았다.
 *
 * 쓰는 법 — 반환값을 그대로 요소에 펼쳐 붙이면 된다.
 *
 *   const swipe = useSwipe({ onSwipeLeft: 다음, onSwipeRight: 이전, enabled, contentRef });
 *   return <section {...swipe}> … </section>;
 *
 * 자세한 설명: `docs/rosary/02-화면과-스와이프.md`
 */

/**
 * 이만큼(px) 이상 가로로 밀어야 "넘긴 것"으로 친다.
 *
 * 너무 작으면 세로로 스크롤하다가 손가락이 조금만 비뚤어져도 화면이 넘어가고,
 * 너무 크면 넘기려고 해도 안 넘어간다. 50px 은 그 사이의 타협점이다.
 * 값을 바꾸려면 여기 한 곳만 고치면 된다.
 */
export const SWIPE_THRESHOLD_PX = 50;

/** 손가락을 뗀 뒤 제자리로 돌아가는 데 걸리는 시간. CSS 가 아니라 여기서 넣는다. */
const SNAP_BACK_TRANSITION = "transform 0.3s ease";

interface UseSwipeOptions {
  /** 왼쪽으로 쓸었을 때(= 다음으로 넘길 때) 부를 함수. */
  onSwipeLeft: () => void;
  /** 오른쪽으로 쓸었을 때(= 이전으로 돌아갈 때) 부를 함수. */
  onSwipeRight: () => void;
  /** false 면 손가락 따라오기도, 넘김 판정도 하지 않는다(예: 확인창이 떠 있을 때). */
  enabled: boolean;
  /**
   * 손가락을 따라 움직여 줄 요소.
   *
   * [TS] `RefObject<HTMLElement | null>` — `useRef(null)` 로 만든 그 상자를
   *      통째로 받는다. 여기 담긴 DOM 요소의 `style` 을 직접 만지는데,
   *      손가락을 따라오는 애니메이션은 1초에 수십 번 바뀌므로 React state 로
   *      다루면 그때마다 화면 전체를 다시 그리게 되어 버벅인다.
   */
  contentRef: RefObject<HTMLElement | null>;
}

type Point = { x: number; y: number };

export function useSwipe({ onSwipeLeft, onSwipeRight, enabled, contentRef }: UseSwipeOptions) {
  // 손가락이 처음 닿은 곳과 마지막으로 지나간 곳.
  // state 가 아니라 ref 인 이유: 이 값이 바뀐다고 화면을 다시 그릴 필요가 없다.
  const start = useRef<Point | null>(null);
  const end = useRef<Point | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    // 지난 제스처의 잔재를 지운다. 이게 없으면 "그냥 톡 누르기"(움직임 없음)가
    // 직전 스와이프의 끝점을 물려받아 화면이 멋대로 넘어간다.
    end.current = null;
    start.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    if (contentRef.current) {
      // 따라오는 동안에는 전환 효과를 꺼서 손가락에 즉시 붙게 한다.
      contentRef.current.style.transition = "none";
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    end.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    if (start.current && contentRef.current && enabled) {
      const distanceX = start.current.x - end.current.x;
      const distanceY = Math.abs(start.current.y - end.current.y);
      // 가로로 더 많이 움직였을 때만 따라간다. 세로로 스크롤하는 중이라면
      // 화면이 옆으로 흔들리지 않아야 한다.
      if (Math.abs(distanceX) > distanceY) {
        // 왼쪽으로 밀면 distanceX 가 양수 → translateX 는 음수 → 화면도 왼쪽으로.
        contentRef.current.style.transform = `translateX(${-distanceX}px)`;
      }
    }
  };

  const onTouchEnd = () => {
    // 넘기든 안 넘기든 일단 제자리로 돌려놓는다. 넘어가는 경우에는 새 화면이
    // 통째로 갈아 끼워지므로 이 복귀는 눈에 보이지 않는다.
    if (contentRef.current) {
      contentRef.current.style.transition = SNAP_BACK_TRANSITION;
      contentRef.current.style.transform = "translateX(0)";
    }

    // 움직임이 없었다면(= 그냥 탭) 여기서 끝. 링크나 버튼을 누른 경우다.
    if (!start.current || !end.current) return;

    const distanceX = start.current.x - end.current.x;
    const distanceY = start.current.y - end.current.y;

    // 세로로 더 많이 움직였으면 스크롤이지 스와이프가 아니다.
    if (Math.abs(distanceX) <= Math.abs(distanceY)) return;

    if (!enabled) return;

    // 거리만 본다. 얼마나 빨리 움직였는지(속도)는 따지지 않는다 —
    // 천천히 확실하게 미는 어르신 사용자에게는 속도 기준이 오히려 불리하다.
    if (distanceX > SWIPE_THRESHOLD_PX) {
      onSwipeLeft();
    } else if (distanceX < -SWIPE_THRESHOLD_PX) {
      onSwipeRight();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
