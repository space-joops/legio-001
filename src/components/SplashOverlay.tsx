"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { storage } from "@/lib/storage";
import styles from "./SplashOverlay.module.css";

/**
 * How long the app has to have been in the background before coming back
 * counts as a return. Only there to swallow momentary blips — an OS share
 * sheet or permission prompt that flicks the page hidden and straight back —
 * so switching tabs or apps for real always re-greets you.
 */
const MIN_AWAY_MS = 3000;
/** How long the image stays fully visible before it starts fading away. */
const HOLD_MS = 5000;
/** Must stay in sync with the fade-out duration in SplashOverlay.module.css. */
const FADE_OUT_MS = 600;

type Phase = "hidden" | "visible" | "leaving";

/**
 * Lets Settings show the image on demand ("지금 보기"). The overlay has no
 * props and mounts once in providers.tsx, so a global event is the smallest
 * way in.
 */
export const SHOW_SPLASH_EVENT = "legio:show-splash";

function isTypingTarget(el: Element | null): boolean {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
}

/** A confirm/import dialog already has the screen — don't cover it. */
function anotherDialogIsOpen(self: HTMLDialogElement | null): boolean {
  return [...document.querySelectorAll("dialog[open]")].some((d) => d !== self);
}

export function SplashOverlay() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("hidden");
  const ref = useRef<HTMLDialogElement>(null);
  const phaseRef = useRef<Phase>("hidden");
  const hiddenAtRef = useRef<number | null>(null);
  // When shown on request, wait for a tap instead of timing out.
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Shows on first mount and every time the app comes back to the foreground —
  // switching browser tabs, or leaving the installed app for another one.
  useEffect(() => {
    // Read settings straight from storage rather than context: this closure
    // outlives several renders, and storage is always the current value.
    const maybeShow = () => {
      if (phaseRef.current !== "hidden") return;
      if (!storage.getSettings().splashEnabled) return;
      // Don't steal the screen from someone mid-typing (e.g. returning to a
      // half-filled form after time in another app).
      if (isTypingTarget(document.activeElement)) return;
      if (anotherDialogIsOpen(ref.current)) return;
      setPhase("visible");
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt !== null && Date.now() - hiddenAt < MIN_AWAY_MS) return;
      maybeShow();
    };
    // pageshow covers iOS restoring the page from the back/forward cache,
    // which doesn't always fire visibilitychange. Getting here at all means a
    // real navigation away and back, so no away-time check.
    const handlePageShow = () => maybeShow();

    // Bypasses the settings/typing/dialog gates: the user just asked for it.
    const handleShowRequest = () => {
      setPinned(true);
      setPhase("visible");
    };

    maybeShow();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener(SHOW_SPLASH_EVENT, handleShowRequest);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener(SHOW_SPLASH_EVENT, handleShowRequest);
    };
  }, []);

  useEffect(() => {
    if (phase !== "visible" || pinned) return;
    const timer = window.setTimeout(() => setPhase("leaving"), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase, pinned]);

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
  const dismiss = () => {
    setPinned(false);
    setPhase((current) => (current === "visible" ? "leaving" : current));
  };

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
