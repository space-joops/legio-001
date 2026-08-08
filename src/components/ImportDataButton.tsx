"use client";

import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { useTranslation } from "@/i18n/useTranslation";
import {
  applyImportedFile,
  inspectImportFile,
  type ImportSummary,
} from "@/lib/exportData";
import { formatYearMonthLabel } from "@/lib/monthlyReportUtils";
import { formatMeetingDateTime } from "@/lib/reportUtils";
import type { AnyExportFile, ExportScope } from "@/lib/types";
import styles from "./ImportDataButton.module.css";

/**
 * 데이터 가져오기의 유일한 입구.
 *
 * 무엇이 덮어써질지는 **사용자가 어느 버튼을 눌렀는지가 아니라 고른 파일의
 * 범위(exportScope)** 가 정한다. 그래서 설정 화면과 서기 화면이 각각 버튼을
 * 하나씩 둘 수 있고, 확인 창이 "이 파일은 무엇을 바꾸고 무엇을 건드리지
 * 않는지"를 그때그때 설명해 준다.
 *
 * The one import entry point: which slices get replaced is decided by the
 * picked file's scope, not by which button the user found — so the settings
 * page and the secretary screens can each offer one and the confirm dialog
 * explains what this particular file will and will not touch.
 */
interface ImportDataButtonProps {
  label: string;
  buttonClassName: string;
  /** Where the post-import full reload lands. */
  reloadTo: string;
}

interface PendingImport {
  fileName: string;
  data: AnyExportFile;
  summary: ImportSummary;
}

const TITLE_KEYS: Record<ExportScope, string> = {
  all: "settings.importConfirmTitle",
  personal: "settings.importPersonalConfirmTitle",
  secretary: "settings.importSecretaryConfirmTitle",
  secretaryMonth: "settings.importMonthConfirmTitle",
};

const SUCCESS_KEYS: Record<ExportScope, string> = {
  all: "settings.importSuccess",
  personal: "settings.importPersonalSuccess",
  secretary: "settings.importSecretarySuccess",
  secretaryMonth: "settings.importMonthSuccess",
};

export function ImportDataButton({ label, buttonClassName, reloadTo }: ImportDataButtonProps) {
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const [pending, setPending] = useState<PendingImport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFileInput = () => {
    setPending(null);
    // Without this, re-picking the same file fires no change event and the
    // button appears dead.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Validate up front so a wrong file is caught before the confirm dialog, and
  // so the dialog can describe what is actually about to be replaced.
  const handleFilePicked = async (file: File | undefined) => {
    if (!file) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      clearFileInput();
      showToast(t("settings.importError"));
      return;
    }
    const check = inspectImportFile(parsed);
    if (!check.ok) {
      clearFileInput();
      showToast(
        check.reason === "futureVersion"
          ? t("settings.importFutureVersion")
          : t("settings.importError")
      );
      return;
    }
    setPending({ fileName: file.name, data: check.data, summary: check.summary });
  };

  const handleConfirm = () => {
    if (!pending) return;
    const { data, summary } = pending;
    clearFileInput();
    applyImportedFile(data);
    showToast(t(SUCCESS_KEYS[summary.scope]));
    // The full reload wipes React state, so give the success toast a moment on
    // screen first — reloading immediately would swallow it before anyone read it.
    window.setTimeout(() => {
      window.location.href = reloadTo;
    }, 1500);
  };

  const bodyText = (summary: ImportSummary): string => {
    if (summary.scope !== "secretaryMonth") {
      return t(
        summary.scope === "personal"
          ? "settings.importPersonalConfirmBody"
          : summary.scope === "secretary"
            ? "settings.importSecretaryConfirmBody"
            : "settings.importConfirmBody"
      );
    }
    const base = t(
      summary.monthAlreadyExists
        ? "settings.importMonthConfirmBodyReplace"
        : "settings.importMonthConfirmBodyNew"
    );
    return summary.hasNewerMonthLocally ? `${base} ${t("settings.importMonthCaution")}` : base;
  };

  const detailText = (summary: ImportSummary): string => {
    const exported = summary.exportedAt
      ? formatMeetingDateTime(summary.exportedAt, language)
      : "";
    switch (summary.scope) {
      case "personal":
        return [summary.memberName, exported, `${t("history.title")} ${summary.historyCount}`]
          .filter(Boolean)
          .join(" · ");
      case "secretary":
        return [
          exported,
          `${t("secretary.listTitle")} ${summary.monthlyReportCount}`,
          `${t("secretaryRoster.memberCountsSection")} ${summary.rosterMemberCount}`,
        ]
          .filter(Boolean)
          .join(" · ");
      case "secretaryMonth":
        return [
          formatYearMonthLabel(summary.yearMonth, language),
          summary.praesidiumName,
          exported,
        ]
          .filter(Boolean)
          .join(" · ");
      default:
        return [
          summary.memberName,
          exported,
          `${t("history.title")} ${summary.historyCount}`,
          `${t("secretary.listTitle")} ${summary.monthlyReportCount}`,
          `${t("secretaryRoster.memberCountsSection")} ${summary.rosterMemberCount}`,
        ]
          .filter(Boolean)
          .join(" · ");
    }
  };

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => fileInputRef.current?.click()}
      >
        {label}
      </button>
      {pending && <p className={styles.fileName}>{pending.fileName}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className={styles.hiddenFileInput}
        onChange={(e) => {
          void handleFilePicked(e.target.files?.[0]);
        }}
      />
      <ConfirmDialog
        open={pending !== null}
        title={pending ? t(TITLE_KEYS[pending.summary.scope]) : ""}
        body={pending ? bodyText(pending.summary) : ""}
        detail={pending ? detailText(pending.summary) : ""}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        // Adding a month that doesn't exist here yet destroys nothing, so it
        // gets a plain confirm; everything else overwrites and stays red.
        danger={
          !pending ||
          pending.summary.scope !== "secretaryMonth" ||
          pending.summary.monthAlreadyExists
        }
        onCancel={clearFileInput}
        onConfirm={handleConfirm}
      />
    </>
  );
}
