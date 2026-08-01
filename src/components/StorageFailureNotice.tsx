"use client";

import { useEffect } from "react";
import { useToast } from "./ToastProvider";
import { useTranslation } from "@/i18n/useTranslation";
import { onStorageWriteFailure } from "@/lib/storage";

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
