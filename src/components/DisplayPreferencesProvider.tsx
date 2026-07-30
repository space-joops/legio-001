"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storage } from "@/lib/storage";
import type { FontFamily, FontScale } from "@/lib/types";

interface DisplayPreferencesContextValue {
  fontScale: FontScale;
  fontFamily: FontFamily;
  setFontScale: (scale: FontScale) => void;
  setFontFamily: (family: FontFamily) => void;
  ready: boolean;
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(null);

export function DisplayPreferencesProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>("medium");
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const settings = storage.getSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    setFontScaleState(settings.fontScale);
    setFontFamilyState(settings.fontFamily);
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

  return (
    <DisplayPreferencesContext.Provider
      value={{ fontScale, fontFamily, setFontScale, setFontFamily, ready }}
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
