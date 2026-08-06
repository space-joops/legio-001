"use client";

// 디스플레이 설정(화면 글꼴 크기, 스플래시 화면)을 전역으로 관리하는 프로바이더입니다.
// 파이썬의 전역 변수 설정이나 설정 클래스와 비슷한 역할을 합니다.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storage } from "@/lib/storage";
import type { FontScale } from "@/lib/types";

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
