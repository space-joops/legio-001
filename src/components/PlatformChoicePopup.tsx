"use client";

import { useEffect, useRef, useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useLocalStorageReady } from "@/hooks/useLocalStorageReady";
import { storage } from "@/lib/storage";
import { useTranslation } from "@/i18n/useTranslation";
import Image from "next/image";
import styles from "./PlatformChoicePopup.module.css";

/**
 * "홈 화면에 추가하면 앱처럼 쓸 수 있어요"를 기기에 맞게 안내하는 팝업.
 *
 * 설치 방법이 안드로이드·아이폰·PC 마다 전부 달라서, 어떤 기기인지 먼저
 * 판별한 뒤 그 기기의 방법만 보여 준다. 한 번 닫으면 다시 뜨지 않는다.
 */

/** Give the app a moment to settle before interrupting. */
const FIRST_CHECK_MS = 1500;
/** How often to re-check once something else (the splash) is holding the screen. */
const RECHECK_MS = 700;
/** Stop waiting eventually — better to skip the popup than to poll forever. */
const GIVE_UP_MS = 20000;

/**
 * Which install story applies to this device. Only one is ever true, because
 * showing two contradicts itself: a browser that can prompt does not also need
 * "open the menu and pick Add to Home screen".
 */
type Variant = "prompt" | "ios" | "androidManual" | "none";

export function PlatformChoicePopup() {
  const { t } = useTranslation();
  const ready = useLocalStorageReady();
  const { installed, canInstall, isIos, isAndroid, isInAppBrowser, promptInstall } =
    useInstallPrompt();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // "none" also covers desktop Firefox/Safari: with no prompt and no home-screen
  // menu there is nothing true to say, so say nothing.
  let variant: Variant = "none";
  if (installed || isInAppBrowser) {
    variant = "none";
  } else if (canInstall) {
    variant = "prompt";
  } else if (isIos) {
    variant = "ios";
  } else if (isAndroid) {
    variant = "androidManual";
  }

  useEffect(() => {
    if (!ready || open || variant === "none") return;
    if (storage.getSettings().hidePlatformChoicePopup) return;

    // The splash is a `showModal()` dialog, so it lives in the top layer where
    // z-index cannot reach it. Opening underneath would be both invisible and
    // inert, so wait until nothing else owns the screen.
    const deadline = Date.now() + GIVE_UP_MS;
    let timer = 0;
    const check = () => {
      if (Date.now() > deadline) return;
      if (document.querySelector("dialog[open]")) {
        timer = window.setTimeout(check, RECHECK_MS);
        return;
      }
      setOpen(true);
    };
    timer = window.setTimeout(check, FIRST_CHECK_MS);
    return () => window.clearTimeout(timer);
  }, [ready, open, variant]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (variant === "none") return null;

  const handleClose = () => {
    if (dontShowAgain) {
      const settings = storage.getSettings();
      storage.setSettings({ ...settings, hidePlatformChoicePopup: true });
    }
    setOpen(false);
  };

  const copy = {
    prompt: { title: "platformChoice.installTitle", body: "platformChoice.installBody" },
    ios: { title: "platformChoice.iosTitle", body: "platformChoice.iosBody" },
    androidManual: {
      title: "platformChoice.androidManualTitle",
      body: "platformChoice.androidManualBody",
    },
  }[variant];

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      <div className={styles.iconWrapper}>
        <Image src="/icons/icon-192.png" alt="App Icon" className={styles.appIcon} width={64} height={64} unoptimized />
      </div>
      <h2 className={styles.title}>{t(copy.title)}</h2>
      <p className={styles.body}>{t(copy.body)}</p>

      {variant === "prompt" && (
        <button
          type="button"
          className={styles.installButton}
          onClick={() => {
            void promptInstall();
            handleClose();
          }}
        >
          {t("platformChoice.installAction")}
        </button>
      )}

      <button type="button" className={styles.laterButton} onClick={handleClose}>
        {t("platformChoice.later")}
      </button>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
          className={styles.checkbox}
        />
        {t("platformChoice.dontShowAgain")}
      </label>
    </dialog>
  );
}
