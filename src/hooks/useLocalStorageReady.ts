"use client";

import { useEffect, useState } from "react";

/**
 * "이제 브라우저에서 돌고 있으니 localStorage 를 읽어도 된다"를 알려 주는 스위치.
 *
 * 이 앱에서 가장 작은 커스텀 훅이라, React 훅이 처음이라면 여기서 시작하면 된다.
 *
 * 왜 필요한가:
 * 이 앱은 빌드할 때 화면을 미리 HTML 로 만들어 둔다(정적 export). 그 시점은
 * Node.js 안이라 localStorage 가 없다. 그런데 브라우저가 그 HTML 을 받아서
 * React 를 붙일 때(하이드레이션), 미리 만들어 둔 화면과 지금 그리려는 화면이
 * 다르면 React 가 오류를 낸다. 그래서 저장소를 읽는 훅은 전부 이 값이 true 가
 * 될 때까지 기다렸다가 읽는다.
 *
 * 결과적으로 화면은 두 번 그려진다.
 *   1) ready = false — 저장소를 안 읽은, 서버가 만든 것과 똑같은 화면
 *   2) ready = true  — 저장소를 읽은 진짜 화면
 *
 * [TS] `useState(false)` 는 "이 값이 바뀌면 화면을 다시 그려라"는 React 의 변수다.
 *      `useEffect(fn, [])` 의 `[]` 는 "화면이 처음 붙은 뒤 딱 한 번만 실행"을 뜻한다.
 *      → docs/typescript-for-python.md#9-react-훅
 */
export function useLocalStorageReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션이 끝났음을 알리는 의도적인 전환이지, 다른 값에서 계산해 낸 상태가 아니다
    setReady(true);
  }, []);

  return ready;
}
