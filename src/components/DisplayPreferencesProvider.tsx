"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storage } from "@/lib/storage";
import type { FontScale } from "@/lib/types";

/**
 * 글자 크기와 글꼴 설정을 앱 전체에 적용한다.
 *
 * 값을 각 컴포넌트에 뿌리는 대신 `<html>` 요소에 표시를 달아 두면, CSS 변수가
 * 그걸 보고 한 번에 바뀐다. 그래서 화면 코드는 글자 크기를 신경 쓸 필요가 없다.
 * 사용자층이 어르신 중심이라 이 설정이 특히 중요하다.
 */

interface DisplayPreferencesContextValue {
  fontScale: FontScale;
  splashEnabled: boolean;
  setFontScale: (scale: FontScale) => void;
  setSplashEnabled: (enabled: boolean) => void;
  ready: boolean;
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(null);

export function DisplayPreferencesProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>("medium");
  const [splashEnabled, setSplashEnabledState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const settings = storage.getSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    setFontScaleState(settings.fontScale);
    setSplashEnabledState(settings.splashEnabled);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.fontScale = fontScale;
  }, [fontScale, ready]);

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    storage.setSettings({ ...storage.getSettings(), fontScale: scale });
  };

  const setSplashEnabled = (enabled: boolean) => {
    setSplashEnabledState(enabled);
    storage.setSettings({ ...storage.getSettings(), splashEnabled: enabled });
  };

  return (
    <DisplayPreferencesContext.Provider
      value={{
        fontScale,
        splashEnabled,
        setFontScale,
        setSplashEnabled,
        ready,
      }}
    >
      {children}
    </DisplayPreferencesContext.Provider>
  );
}

export function useDisplayPreferences(): DisplayPreferencesContextValue {
  const ctx = useContext(DisplayPreferencesContext);
  if (!ctx) {
    throw new Error("useDisplayPreferences must be used within a DisplayPreferencesProvider");
  }
  return ctx;
}
