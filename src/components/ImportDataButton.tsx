"use client";

import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
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

/** 확인 창 제목. 파일 종류마다 무엇이 바뀌는지 다르게 말해 준다. */
const CONFIRM_TITLES: Record<ExportScope, string> = {
  all: "데이터를 가져올까요?",
  personal: "활동 기록을 가져올까요?",
  secretary: "서기 데이터를 가져올까요?",
  secretaryMonth: "월례 보고서를 가져올까요?",
};

const SUCCESS_MESSAGES: Record<ExportScope, string> = {
  all: "데이터를 가져왔습니다.",
  personal: "활동 기록을 가져왔습니다.",
  secretary: "서기 데이터를 가져왔습니다.",
  secretaryMonth: "월례 보고서를 가져왔습니다.",
};

/** 확인 창 본문. 무엇이 덮어써지고 무엇이 남는지 구체적으로 적는다. */
const CONFIRM_BODIES: Record<Exclude<ExportScope, "secretaryMonth">, string> = {
  all: "전체 백업 파일입니다. 가져오기를 진행하면 현재 기기의 모든 데이터가 덮어써집니다. 활동 기록뿐 아니라 명단과 월례 보고서까지 함께 바뀝니다. 아래 내용이 맞는지 확인해 주세요.",
  personal:
    "활동 기록 파일입니다. 내 활동 기록·일정·프로필이 파일 내용으로 바뀌고, 명단과 월례 보고서는 그대로 유지됩니다.",
  secretary:
    "서기 데이터 파일입니다. 명단·월례 보고서·활동 및 지출 항목이 파일 내용으로 바뀌고, 내 활동 기록은 그대로 유지됩니다.",
};

export function ImportDataButton({ label, buttonClassName, reloadTo }: ImportDataButtonProps) {
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
      showToast("파일을 읽을 수 없습니다. 올바른 내보내기 파일인지 확인해 주세요.");
      return;
    }
    const check = inspectImportFile(parsed);
    if (!check.ok) {
      clearFileInput();
      showToast(
        check.reason === "futureVersion"
          ? "더 새로운 버전에서 만든 파일입니다. 앱을 먼저 업데이트해 주세요."
          : "파일을 읽을 수 없습니다. 올바른 내보내기 파일인지 확인해 주세요."
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
    showToast(SUCCESS_MESSAGES[summary.scope]);
    // The full reload wipes React state, so give the success toast a moment on
    // screen first — reloading immediately would swallow it before anyone read it.
    window.setTimeout(() => {
      window.location.href = reloadTo;
    }, 1500);
  };

  const bodyText = (summary: ImportSummary): string => {
    if (summary.scope !== "secretaryMonth") {
      return CONFIRM_BODIES[summary.scope];
    }
    const base = summary.monthAlreadyExists
      ? "같은 달 보고서가 이미 있어 파일 내용으로 바뀝니다. 다른 달과 나머지 데이터는 바뀌지 않습니다."
      : "이 달 보고서가 목록에 새로 추가됩니다. 다른 데이터는 바뀌지 않습니다.";
    return summary.hasNewerMonthLocally
      ? `${base} 이후 달 보고서의 이월금은 자동으로 바뀌지 않으니 확인해 주세요.`
      : base;
  };

  const detailText = (summary: ImportSummary): string => {
    const exported = summary.exportedAt
      ? formatMeetingDateTime(summary.exportedAt)
      : "";
    switch (summary.scope) {
      case "personal":
        return [summary.memberName, exported, `${"지난 활동 기록"} ${summary.historyCount}`]
          .filter(Boolean)
          .join(" · ");
      case "secretary":
        return [
          exported,
          `${"월례 보고서 목록"} ${summary.monthlyReportCount}`,
          `${"현재 단원 수"} ${summary.rosterMemberCount}`,
        ]
          .filter(Boolean)
          .join(" · ");
      case "secretaryMonth":
        return [
          formatYearMonthLabel(summary.yearMonth),
          summary.praesidiumName,
          exported,
        ]
          .filter(Boolean)
          .join(" · ");
      default:
        return [
          summary.memberName,
          exported,
          `${"지난 활동 기록"} ${summary.historyCount}`,
          `${"월례 보고서 목록"} ${summary.monthlyReportCount}`,
          `${"현재 단원 수"} ${summary.rosterMemberCount}`,
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
        title={pending ? CONFIRM_TITLES[pending.summary.scope] : ""}
        body={pending ? bodyText(pending.summary) : ""}
        detail={pending ? detailText(pending.summary) : ""}
        confirmLabel="확인"
        cancelLabel="취소"
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
