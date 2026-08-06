// 이제 다국어(i18n) 기능을 사용하지 않으며 단일 언어(한국어)만 지원합니다.
// 파이썬 개발자분이 읽기 쉽도록, 기존 useTranslation 훅 대신 단순히 한국어 문자열 객체(strings)를 반환하도록 간소화했습니다.

import { ko as strings } from "@/lib/strings";

// 문자열 경로(예: "common.confirm")를 받아 해당 값을 찾아주는 유틸리티 함수입니다.
function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function useTranslation() {
  // 컴포넌트들에서 t("common.confirm")과 같은 형태로 기존처럼 쓸 수 있게 유지하지만,
  // 내부 로직은 단일 한국어 객체에서 값을 가져오도록 아주 단순해졌습니다.
  const t = (path: string): string => {
    const value = getPath(strings, path);
    return typeof value === "string" ? value : path;
  };

  return { t, language: "ko" as const };
}
