"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./UpdateAvailableNotice.module.css";

/**
 * 새 버전이 준비됐을 때 "새로고침하시겠어요?" 배너를 띄운다.
 *
 * 주의할 점이 하나 있다. 앱을 **처음** 방문하면 서비스 워커가 설치되면서
 * 마찬가지로 "제어자가 바뀌었다"는 신호가 온다. 예전에는 이걸 업데이트로
 * 착각해 1초 만에 화면을 통째로 새로고침해 버렸다(첫 방문 스플래시가 사라진
 * 원인이었다). 그래서 **이미 제어자가 있었을 때만** 업데이트로 본다.
 */

export function UpdateAvailableNotice() {
  const { t } = useTranslation();
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    // sw.js calls clients.claim(), so controllerchange ALSO fires on the very
    // first install. Only a change FROM an existing controller is an update
    // worth reloading for — reloading on first install visibly restarted the
    // app ~1s in and killed the opening splash (its 3h cooldown was already
    // stamped, so it never came back).
    let hadController = Boolean(navigator.serviceWorker.controller);
    const handleControllerChange = () => {
      const wasControlled = hadController;
      hadController = true;
      if (!wasControlled) return;
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Only treat a waiting worker as an "update" once this client already has an
        // active controller — on the very first install there's nothing to update from.
        const checkWaiting = () => {
          if (registration.waiting && navigator.serviceWorker.controller) {
            setWaitingWorker(registration.waiting);
          }
        };
        checkWaiting();

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") checkWaiting();
          });
        });
      })
      .catch(() => {
        // installability degrades gracefully without a service worker
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!waitingWorker) return null;

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>{t("update.available")}</p>
      <button
        type="button"
        className={styles.button}
        onClick={() => waitingWorker.postMessage("SKIP_WAITING")}
      >
        {t("update.action")}
      </button>
    </div>
  );
}
