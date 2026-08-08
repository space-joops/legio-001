"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { PRAYER_ITEMS } from "@/lib/constants";
import {
  matchSubmissionsToRoster,
  sessionRangeNumbers,
  type SubmissionDecision,
  type SubmissionMatch,
} from "@/lib/monthlyReportUtils";
import { parseSubmissionBlocks } from "@/lib/prayerSubmission";
import type { MonthlyReport } from "@/lib/types";
import styles from "./PrayerSubmissionImportDialog.module.css";

/**
 * 단원들이 보낸 카톡 메시지를 통째로 붙여 넣으면 기도 숫자를 채워 주는 창.
 *
 * 붙여 넣은 글에서 `LEGIO1|...` 줄들을 찾아 명단의 사람과 짝지어 준다.
 * 다만 곧바로 반영하지 않고, **먼저 짝지은 결과를 표로 보여 주고 확인을 받는다.**
 * 동명이인, 명단에 없는 이름, 회차 범위 밖, 형식 오류를 각각 표시해 주기 때문이다.
 *
 * 이름 비교 전에 반드시 정규화(NFC)를 한다. 아이폰에서 온 한글은 자모가 분리된
 * 형태라, 눈에 똑같아 보여도 그냥 비교하면 다른 글자로 취급된다.
 *
 * 같은 메시지를 두 번 붙여 넣어도 결과가 달라지지 않는다(덧셈이 아니라 덮어쓰기).
 */

interface Props {
  open: boolean;
  report: MonthlyReport;
  onCancel: () => void;
  onApply: (decisions: SubmissionDecision[]) => void;
}

/** Per-row state the secretary can override before anything is written. */
interface RowState {
  personId: string;
  sessionNumber: number;
  include: boolean;
}

type Stage = "paste" | "review" | "confirm";

export function PrayerSubmissionImportDialog({ open, report, onCancel, onApply }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<Stage>("paste");
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<SubmissionMatch[]>([]);
  const [malformed, setMalformed] = useState<string[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);
  const [notFound, setNotFound] = useState(false);

  const sessions = useMemo(
    () => sessionRangeNumbers(report.sessionRangeStart, report.sessionRangeEnd),
    [report.sessionRangeStart, report.sessionRangeEnd]
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) return;
    // Reset once closed so the next open starts from a clean paste box.
    /* eslint-disable react-hooks/set-state-in-effect -- resetting dialog state on close, not deriving render state */
    setStage("paste");
    setText("");
    setMatches([]);
    setMalformed([]);
    setRows([]);
    setNotFound(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  const handleLoad = () => {
    const { submissions, malformed: bad } = parseSubmissionBlocks(text);
    setMalformed(bad);
    if (submissions.length === 0) {
      setNotFound(bad.length === 0);
      setMatches([]);
      setRows([]);
      if (bad.length > 0) setStage("review");
      return;
    }
    const matched = matchSubmissionsToRoster(submissions, report);
    setNotFound(false);
    setMatches(matched);
    setRows(
      matched.map((match) => ({
        personId: match.personId ?? "",
        sessionNumber: match.submission.sessionNumber,
        // Anything the secretary must decide starts unchecked, so a careless
        // Apply can never guess on their behalf.
        include: Boolean(match.personId) && match.inRange,
      }))
    );
    setStage("review");
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {
      // Not supported everywhere (Firefox) and can be denied; the textarea is
      // the real path, so a failure here needs no announcement.
    }
  };

  const decisions: SubmissionDecision[] = rows.flatMap((row, index) => {
    if (!row.include || !row.personId) return [];
    if (!sessions.includes(row.sessionNumber)) return [];
    return [
      {
        personId: row.personId,
        sessionNumber: row.sessionNumber,
        counts: matches[index].submission.counts,
      },
    ];
  });

  const overwriteCount = rows.reduce((sum, row, index) => {
    if (!row.include || !row.personId) return sum;
    const match = matches[index];
    const sameTarget =
      match.personId === row.personId && match.submission.sessionNumber === row.sessionNumber;
    return sum + (sameTarget ? match.overwriteCount : 0);
  }, 0);

  const handleApplyClick = () => {
    if (decisions.length === 0) return;
    if (overwriteCount > 0) {
      setStage("confirm");
      return;
    }
    onApply(decisions);
  };

  const statusLabel = (match: SubmissionMatch, row: RowState) => {
    if (!sessions.includes(row.sessionNumber)) return t("secretaryReport.importStatusOutOfRange");
    if (match.confidence === "ambiguous") return t("secretaryReport.importStatusAmbiguous");
    if (match.confidence === "none" && !row.personId)
      return t("secretaryReport.importStatusNone");
    if (row.include && match.overwriteCount > 0 && match.personId === row.personId)
      return t("secretaryReport.importStatusOverwrite");
    if (match.confidence === "nameOnly") return t("secretaryReport.importStatusNameOnly");
    return t("secretaryReport.importStatusExact");
  };

  const updateRow = (index: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 className={styles.title}>{t("secretaryReport.importTitle")}</h2>

      {stage === "paste" && (
        <>
          <p className={styles.hint}>{t("secretaryReport.importPasteHint")}</p>
          <textarea
            className={styles.textarea}
            rows={8}
            value={text}
            placeholder={t("secretaryReport.importPastePlaceholder")}
            onChange={(e) => setText(e.target.value)}
          />
          {notFound && <p className={styles.error}>{t("secretaryReport.importNothingFound")}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                void handlePasteFromClipboard();
              }}
            >
              {t("secretaryReport.importPasteFromClipboard")}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleLoad}
              disabled={!text.trim()}
            >
              {t("secretaryReport.importLoad")}
            </button>
          </div>
        </>
      )}

      {stage === "review" && (
        <>
          <p className={styles.hint}>
            {t("secretaryReport.importSessionRangeHint")} {report.sessionRangeStart}~
            {report.sessionRangeEnd}
          </p>
          {matches.length > 0 && (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("secretaryReport.importColumnSender")}</th>
                    <th>{t("secretaryReport.importColumnPerson")}</th>
                    <th>{t("secretaryReport.importColumnSession")}</th>
                    <th>{t("secretaryReport.importColumnCounts")}</th>
                    <th>{t("secretaryReport.importColumnStatus")}</th>
                    <th>{t("secretaryReport.importColumnInclude")}</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, index) => {
                    const row = rows[index];
                    if (!row) return null;
                    return (
                      <tr key={`${match.submission.raw}-${index}`}>
                        <td className={styles.sender}>
                          {match.submission.name}
                          {match.submission.baptismalName
                            ? `(${match.submission.baptismalName})`
                            : ""}
                          {match.submission.meetingDate && (
                            <span className={styles.subText}>{match.submission.meetingDate}</span>
                          )}
                        </td>
                        <td>
                          <select
                            className={styles.select}
                            value={row.personId}
                            aria-label={t("secretaryReport.importColumnPerson")}
                            onChange={(e) =>
                              updateRow(index, {
                                personId: e.target.value,
                                include: Boolean(e.target.value),
                              })
                            }
                          >
                            <option value="">{t("secretaryReport.importSelectPerson")}</option>
                            {match.candidates.map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className={styles.select}
                            value={row.sessionNumber}
                            aria-label={t("secretaryReport.importColumnSession")}
                            onChange={(e) =>
                              updateRow(index, { sessionNumber: Number(e.target.value) })
                            }
                          >
                            {!sessions.includes(row.sessionNumber) && (
                              <option value={row.sessionNumber}>{row.sessionNumber}</option>
                            )}
                            {sessions.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className={styles.counts}>
                          {PRAYER_ITEMS.map((item) => match.submission.counts[item.key]).join(" · ")}
                        </td>
                        <td className={styles.status}>{statusLabel(match, row)}</td>
                        <td>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={row.include}
                            disabled={!row.personId || !sessions.includes(row.sessionNumber)}
                            aria-label={`${match.submission.name} ${t("secretaryReport.importColumnInclude")}`}
                            onChange={(e) => updateRow(index, { include: e.target.checked })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {malformed.length > 0 && (
            <div className={styles.malformed}>
              <p className={styles.malformedLabel}>
                {t("secretaryReport.importMalformedLabel")} {malformed.length}
              </p>
              <ul>
                {malformed.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.summary}>
            {t("secretaryReport.importFoundLabel")} {decisions.length}
            {t("secretaryReport.importUnit")}
          </p>
          {decisions.length === 0 && matches.length > 0 && (
            <p className={styles.error}>{t("secretaryReport.importNoneSelected")}</p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setStage("paste")}
            >
              {t("secretaryReport.importBack")}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleApplyClick}
              disabled={decisions.length === 0}
            >
              {t("secretaryReport.importApply")}
            </button>
          </div>
        </>
      )}

      {/* Rendered inline rather than as a nested <dialog>: stacking two top-layer
          modals is more fragile than a third step in the same one. */}
      {stage === "confirm" && (
        <>
          <p className={styles.hint}>{t("secretaryReport.importOverwriteConfirmTitle")}</p>
          <p className={styles.error}>{t("secretaryReport.importOverwriteConfirmBody")}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setStage("review")}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => onApply(decisions)}
            >
              {t("secretaryReport.importApply")}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
