"use client";

import { useEffect, useRef, useState } from "react";
import { useDisplayPreferences } from "./DisplayPreferencesProvider";
import { useTranslation } from "@/i18n/useTranslation";
import { storage } from "@/lib/storage";
import styles from "./SplashOverlay.module.css";

/** Minimum gap between splash appearances, so it greets you but never nags. */
const SPLASH_INTERVAL_MS = 3 * 60 * 60 * 1000;
/** How long the image stays fully visible before it starts fading away. */
const HOLD_MS = 2000;
/** Must stay in sync with the fade-out duration in SplashOverlay.module.css. */
const FADE_OUT_MS = 600;

type Phase = "hidden" | "visible" | "leaving";

export function SplashOverlay() {
  const { t } = useTranslation();
  const { splashEnabled, setSplashEnabled, ready } = useDisplayPreferences();
  const [phase, setPhase] = useState<Phase>("hidden");
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const decided = useRef(false);

  // Decide exactly once, and only after preferences have been read from
  // localStorage — before that `splashEnabled` is still the optimistic default
  // and we'd show the splash to someone who had turned it off.
  useEffect(() => {
    if (!ready || decided.current) return;
    decided.current = true;
    if (!splashEnabled) return;
    if (Date.now() - storage.getLastSplashShownAt() < SPLASH_INTERVAL_MS) return;
    storage.setLastSplashShownAt(Date.now());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time decision from localStorage, unavailable at render time
    setPhase("visible");
  }, [ready, splashEnabled]);

  useEffect(() => {
    if (phase !== "visible") return;
    const timer = window.setTimeout(() => setPhase("leaving"), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("hidden"), FADE_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const open = phase !== "hidden";
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [phase]);

  const dismiss = () => setPhase((current) => (current === "visible" ? "leaving" : current));

  const handleDontShowAgain = (checked: boolean) => {
    setDontShowAgain(checked);
    setSplashEnabled(!checked);
  };

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${phase === "leaving" ? styles.leaving : ""}`}
      data-app-chrome
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
    >
      {phase !== "hidden" && (
        <div className={styles.screen}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export with images.unoptimized, so next/image would only add weight */}
          <img className={styles.image} src="/splash.jpg" alt={t("splash.imageAlt")} />
          <div className={styles.actions}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={dontShowAgain}
                onChange={(e) => handleDontShowAgain(e.target.checked)}
              />
              {t("splash.dontShowAgain")}
            </label>
            <button type="button" className={styles.skipButton} onClick={dismiss}>
              {t("splash.skip")}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
