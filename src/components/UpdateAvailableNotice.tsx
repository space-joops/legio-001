"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./UpdateAvailableNotice.module.css";

export function UpdateAvailableNotice() {
  const { t } = useTranslation();
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const handleControllerChange = () => {
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
