"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storage } from "@/lib/storage";
import type { FontFamily, FontScale } from "@/lib/types";

interface DisplayPreferencesContextValue {
  fontScale: FontScale;
  fontFamily: FontFamily;
  splashEnabled: boolean;
  setFontScale: (scale: FontScale) => void;
  setFontFamily: (family: FontFamily) => void;
  setSplashEnabled: (enabled: boolean) => void;
  ready: boolean;
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(null);

export function DisplayPreferencesProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>("medium");
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("system");
  const [splashEnabled, setSplashEnabledState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const settings = storage.getSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    setFontScaleState(settings.fontScale);
    setFontFamilyState(settings.fontFamily);
    setSplashEnabledState(settings.splashEnabled);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.fontScale = fontScale;
    document.documentElement.dataset.fontFamily = fontFamily;
  }, [fontScale, fontFamily, ready]);

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    storage.setSettings({ ...storage.getSettings(), fontScale: scale });
  };

  const setFontFamily = (family: FontFamily) => {
    setFontFamilyState(family);
    storage.setSettings({ ...storage.getSettings(), fontFamily: family });
  };

  const setSplashEnabled = (enabled: boolean) => {
    setSplashEnabledState(enabled);
    storage.setSettings({ ...storage.getSettings(), splashEnabled: enabled });
    // Re-enabling should be verifiable right away — without this, the 3-hour
    // cooldown keeps the splash invisible and the toggle looks broken.
    if (enabled) storage.setLastSplashShownAt(0);
  };

  return (
    <DisplayPreferencesContext.Provider
      value={{
        fontScale,
        fontFamily,
        splashEnabled,
        setFontScale,
        setFontFamily,
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
