"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * "홈 화면에 추가"(앱 설치) 버튼이 눌릴 수 있는 상태인지 알려 주는 훅.
 *
 * 이 파일에는 다른 훅에 없는 특이한 점이 있다. 상태를 컴포넌트가 아니라
 * **모듈 바깥(파일 최상단)** 에 둔다. 브라우저가 주는 설치 신호가 페이지를 열
 * 때 딱 한 번, 그것도 아주 이른 시점에 오기 때문이다. 자세한 이유는 바로
 * 아래 영문 주석에 있다.
 */
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

function detectAndroid(): boolean {
  const ua = window.navigator.userAgent;
  return /Android/.test(ua);
}

const IN_APP_BROWSER_PATTERN = /KAKAOTALK|NAVER\(|Instagram|FBAN|FBAV|Line\//i;

/** In-app webviews (KakaoTalk above all — that's how this app gets shared) have
    no install prompt and no "add to home screen" menu, so any install guidance
    shown there is a dead end. `InAppBrowserNotice` handles them instead. */
export function detectInAppBrowser(): boolean {
  return IN_APP_BROWSER_PATTERN.test(window.navigator.userAgent);
}

export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

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
    setIsAndroid(detectAndroid());
    setIsInAppBrowser(detectInAppBrowser());
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
    isAndroid,
    isInAppBrowser,
    promptInstall,
  };
}
