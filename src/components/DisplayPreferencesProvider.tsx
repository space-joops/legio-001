"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storage } from "@/lib/storage";
import type { FontFamily, FontScale, Theme } from "@/lib/types";

interface DisplayPreferencesContextValue {
  fontScale: FontScale;
  fontFamily: FontFamily;
  theme: Theme;
  splashEnabled: boolean;
  setFontScale: (scale: FontScale) => void;
  setFontFamily: (family: FontFamily) => void;
  setTheme: (theme: Theme) => void;
  setSplashEnabled: (enabled: boolean) => void;
  ready: boolean;
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(null);

export function DisplayPreferencesProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>("medium");
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("system");
  const [theme, setThemeState] = useState<Theme>("classic");
  const [splashEnabled, setSplashEnabledState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const settings = storage.getSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    setFontScaleState(settings.fontScale);
    setFontFamilyState(settings.fontFamily);
    setThemeState(settings.theme || "classic");
    setSplashEnabledState(settings.splashEnabled);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.fontScale = fontScale;
    document.documentElement.dataset.fontFamily = fontFamily;
    document.documentElement.dataset.theme = theme;
  }, [fontScale, fontFamily, theme, ready]);

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    storage.setSettings({ ...storage.getSettings(), fontScale: scale });
  };

  const setFontFamily = (family: FontFamily) => {
    setFontFamilyState(family);
    storage.setSettings({ ...storage.getSettings(), fontFamily: family });
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    storage.setSettings({ ...storage.getSettings(), theme: t });
  };

  const setSplashEnabled = (enabled: boolean) => {
    setSplashEnabledState(enabled);
    storage.setSettings({ ...storage.getSettings(), splashEnabled: enabled });
  };

  return (
    <DisplayPreferencesContext.Provider
      value={{
        fontScale,
        fontFamily,
        theme,
        splashEnabled,
        setFontScale,
        setFontFamily,
        setTheme,
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
