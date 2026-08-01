"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// `beforeinstallprompt` fires once per page load, and it fires early. The only
// screen that shows the install button is Settings, which on the normal route
// (home → bottom tab → settings) mounts long after the event has come and gone
// — so the button used to sit greyed out forever. Capturing at module scope,
// which runs as soon as any client bundle is evaluated, is what makes the
// button work on that route.
let capturedEvent: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    capturedEvent = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    capturedEvent = null;
    notify();
  });
}

/** iPadOS 13+ reports a desktop Safari UA with no "iPad" in it, so the classic
    regex alone leaves iPad users staring at a permanently disabled button
    instead of the "add to home screen" instructions. */
function detectIos(): boolean {
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;
}

export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const sync = () => {
      setDeferredEvent(capturedEvent);
      setIsInstalled(
        installed ||
          window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true
      );
    };
    listeners.add(sync);
    // One-time read of browser/platform APIs that are unavailable at render time.
    /* eslint-disable react-hooks/set-state-in-effect */
    sync();
    setIsIos(detectIos());
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    if (choice.outcome === "accepted") {
      installed = true;
      setIsInstalled(true);
    }
    capturedEvent = null;
    setDeferredEvent(null);
  }, [deferredEvent]);

  return {
    canInstall: Boolean(deferredEvent),
    installed: isInstalled,
    isIos,
    promptInstall,
  };
}
