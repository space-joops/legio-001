"use client";

import { useEffect } from "react";
import { useToast } from "./ToastProvider";
import { useTranslation } from "@/i18n/useTranslation";
import { onStorageWriteFailure } from "@/lib/storage";

/**
 * 저장이 실패했을 때 띄우는 배너. 화면 어디에나 따라다닌다.
 *
 * `storage.ts` 의 쓰기 함수는 실패해도 예외를 던지지 않는다(던지면 앱이 죽는다).
 * 대신 알림만 보내는데, 그 알림을 받는 유일한 곳이 여기다. 이게 없으면
 * 저장이 안 되고 있다는 사실을 사용자가 전혀 알 수 없다.
 */

/**
 * Storage setters swallow write failures so a full quota can't white-screen the
 * app mid-tap. Something still has to tell the user their last change did not
 * stick, which is what this does — mounted once, globally.
 */
export function StorageFailureNotice() {
  const { showToast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    let lastShownAt = 0;
    return onStorageWriteFailure(() => {
      // A single failing keystroke can fire this many times over; one warning
      // per stretch is enough to get the point across.
      const now = Date.now();
      if (now - lastShownAt < 10000) return;
      lastShownAt = now;
      showToast(t("common.storageFull"));
    });
  }, [showToast, t]);

  return null;
}
