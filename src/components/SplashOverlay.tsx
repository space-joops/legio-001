"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { storage } from "@/lib/storage";
import styles from "./SplashOverlay.module.css";

/** Minimum gap between splash appearances, so it greets you but never nags. */
const SPLASH_INTERVAL_MS = 3 * 60 * 60 * 1000;
/** How long the image stays fully visible before it starts fading away. */
const HOLD_MS = 5000;
/** Must stay in sync with the fade-out duration in SplashOverlay.module.css. */
const FADE_OUT_MS = 600;

type Phase = "hidden" | "visible" | "leaving";

function isTypingTarget(el: Element | null): boolean {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
}

export function SplashOverlay() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("hidden");
  const ref = useRef<HTMLDialogElement>(null);
  const phaseRef = useRef<Phase>("hidden");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Runs on first mount and again whenever the app is brought back to the
  // foreground, so returning from another app re-greets you — still subject to
  // the interval, so tabbing away for a moment doesn't trigger it.
  useEffect(() => {
    // Read settings straight from storage rather than context: this closure
    // outlives several renders, and storage is always the current value.
    const maybeShow = () => {
      if (phaseRef.current !== "hidden") return;
      if (!storage.getSettings().splashEnabled) return;
      if (Date.now() - storage.getLastSplashShownAt() < SPLASH_INTERVAL_MS) return;
      // Don't steal the screen from someone mid-typing (e.g. returning to a
      // half-filled form after a long time in another app).
      if (isTypingTarget(document.activeElement)) return;
      storage.setLastSplashShownAt(Date.now());
      setPhase("visible");
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") maybeShow();
    };
    // pageshow covers iOS restoring the page from the back/forward cache,
    // which doesn't always fire visibilitychange.
    const handlePageShow = () => maybeShow();

    maybeShow();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

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

  // No buttons by design: a tap anywhere (or Esc, or the 5s timer) closes it.
  // Turning the splash off entirely lives in Settings > 시작 화면 성화.
  const dismiss = () => setPhase((current) => (current === "visible" ? "leaving" : current));

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${phase === "leaving" ? styles.leaving : ""}`}
      data-app-chrome
      onClick={dismiss}
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
    >
      {phase !== "hidden" && (
        <div className={styles.screen}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export with images.unoptimized, so next/image would only add weight */}
          <img className={styles.backdrop} src="/splash.jpg" alt="" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static export with images.unoptimized, so next/image would only add weight */}
          <img className={styles.image} src="/splash.jpg" alt={t("splash.imageAlt")} />
        </div>
      )}
    </dialog>
  );
}
