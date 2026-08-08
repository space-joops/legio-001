"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storage } from "@/lib/storage";
import type { Language } from "@/lib/types";

/**
 * 지금 화면 언어가 무엇인지를 앱 전체에 알려 주는 장치(React Context).
 *
 * Context 는 "값을 멀리 있는 자손에게 직접 건네는 통로"다. 이게 없으면 언어를
 * 쓰는 모든 컴포넌트까지 props 로 손에 손잡고 넘겨야 한다.
 *
 * 이 저장소의 Context 는 셋 다 똑같은 4단 구조로 되어 있다.
 *   1) `createContext<값 | null>(null)` — 통로를 만든다
 *   2) `<Provider value={...}>`         — 통로에 값을 흘려 넣는다
 *   3) `useContext(...)`                — 자손이 값을 꺼낸다
 *   4) 값이 null 이면 예외를 던진다     — Provider 밖에서 썼다는 뜻이니 즉시 알린다
 *
 * (같은 구조: `components/ToastProvider.tsx`, `components/DisplayPreferencesProvider.tsx`)
 */

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** localStorage 에서 저장된 언어를 읽어 왔는지. 읽기 전에는 기본값 "ko" 다. */
  ready: boolean;
}

// 1) 통로를 만든다. 기본값을 null 로 두는 건 "아직 Provider 를 못 만났다"는 표시다.
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 처음에는 무조건 "ko" 로 시작한다. 미리 만들어 둔 HTML 과 브라우저가 처음
  // 그리는 화면이 같아야 하는데(하이드레이션), 그 시점에는 localStorage 를
  // 읽을 수 없기 때문이다. 진짜 값은 아래 useEffect 에서 덮어쓴다.
  const [language, setLanguageState] = useState<Language>("ko");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션이 끝난 뒤 localStorage 에서 한 번만 읽어 오는 초기 적재
    setLanguageState(storage.getLanguage());
    setReady(true);
  }, []);

  useEffect(() => {
    // <html lang="..."> 도 같이 맞춰 준다. 스크린 리더가 어느 언어로 읽을지
    // 판단하는 근거이고, 브라우저의 번역 제안에도 쓰인다.
    if (ready) document.documentElement.lang = language;
  }, [language, ready]);

  const setLanguage = (lang: Language) => {
    // 훅들과 같은 규칙: 화면 state 와 저장소에 동시에 쓴다.
    setLanguageState(lang);
    storage.setLanguage(lang);
  };

  // 2) 통로에 값을 흘려 넣는다. children 은 이 컴포넌트가 감싸고 있는 화면 전체다.
  return (
    <LanguageContext.Provider value={{ language, setLanguage, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** 3)+4) 자손이 값을 꺼내는 통로. Provider 밖에서 부르면 바로 예외를 던진다. */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
