"use client";

import { dictionaries } from "./dictionaries";
import { useLanguage } from "./LanguageContext";

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function useTranslation() {
  const { language } = useLanguage();
  const dict = dictionaries[language];

  const t = (path: string): string => {
    const value = getPath(dict, path);
    return typeof value === "string" ? value : path;
  };

  return { t, language };
}
