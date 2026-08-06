// 다국어 기능(i18n)을 제거하면서 LanguageContext는 더 이상 언어 상태를 관리하지 않지만,
// 기존 앱 구조(Providers 등)에 남아있는 참조 에러를 막기 위해 아주 단순한 빈 껍데기만 남겨둡니다.
// 이렇게 하면 파이썬으로 치면 아무 것도 하지 않는 Pass 블록과 같은 역할을 합니다.

import { createContext, useContext, type ReactNode } from "react";

interface LanguageContextValue {
  language: "ko";
  setLanguage: (lang: "ko") => void;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 항상 "ko"를 반환하며, 언어를 바꾸는 기능(setLanguage)은 비워둡니다.
  return (
    <LanguageContext.Provider value={{ language: "ko", setLanguage: () => {}, ready: true }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
