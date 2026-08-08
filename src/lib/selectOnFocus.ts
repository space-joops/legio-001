import type { FocusEvent } from "react";

/**
 * 숫자 입력칸을 누르면 안에 있던 값을 통째로 선택해 준다.
 *
 * 이렇게 해 두면 기존 숫자를 하나하나 지우지 않고 바로 새 숫자를 칠 수 있다.
 * 화면을 크게 쓰는 어르신 사용자에게 특히 차이가 크다.
 */
export function selectOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select();
}
