"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { selectableItemsForForm } from "@/lib/activityItems";
import { FORM_2026, form2026GroupLabel } from "@/lib/reportForm2026";
import {
  EXCLUDE,
  carriedOverNotes,
  convertReportTo2026,
  initialMapping,
  isMappingComplete,
  listLegacyActivityUsage,
} from "@/lib/reportFormMigration";
import { storage } from "@/lib/storage";
import type { ActivityItem, MonthlyReport } from "@/lib/types";
import { Report2026PrintView } from "./Report2026PrintView";
import styles from "./ReportFormMigrationDialog.module.css";

/**
 * 이전 양식 보고서를 2026 양식으로 옮기는 전체화면 창(서기용).
 *
 * 두 단계다.
 *   1. 항목 지정 — 이 달에 기록된 이전 활동 항목마다 새 양식의 칸을 고른다.
 *      추천값·지난번 선택이 미리 들어가 있지만 하나도 빠짐없이 서기가 확인하게
 *      하고, 비어 있는 줄이 있으면 다음으로 넘어가지 못한다.
 *   2. 미리보기 — 변환된 보고서를 실제 인쇄 모양 그대로 보여 주고 확인을 받는다.
 * 확인 전에는 저장소에 아무것도 쓰지 않는다.
 */

interface Props {
  open: boolean;
  report: MonthlyReport;
  items: ActivityItem[];
  onCancel: () => void;
  /** 변환된 보고서. 저장은 부르는 쪽이 한다. */
  onApply: (converted: MonthlyReport) => void;
  /** 변환 전 원본을 파일로 백업한다. */
  onBackup: () => void;
}

export function ReportFormMigrationDialog({
  open,
  report,
  items,
  onCancel,
  onApply,
  onBackup,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<"map" | "preview">("map");
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const usage = useMemo(() => listLegacyActivityUsage(report, items), [report, items]);
  const targets = useMemo(() => selectableItemsForForm(items, FORM_2026), [items]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Seed afresh every time it opens, so a cancelled attempt leaves nothing behind.
    const valid = new Set(targets.map((item) => item.key));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dialog draft, not derived render state
    setMapping(initialMapping(usage, storage.getFormMigrationMap(), valid));
    setStep("map");
  }, [open, usage, targets]);

  const groups = useMemo(() => {
    const result: { label: string; items: ActivityItem[] }[] = [];
    for (const item of targets) {
      const label = form2026GroupLabel(item.key) ?? "";
      const group = result.find((g) => g.label === label);
      if (group) group.items.push(item);
      else result.push({ label, items: [item] });
    }
    return result;
  }, [targets]);

  const complete = isMappingComplete(usage, mapping);
  const notes = carriedOverNotes(report);
  const labels = Object.fromEntries(usage.map((entry) => [entry.key, entry.label]));
  const converted =
    open && complete && step === "preview" ? convertReportTo2026(report, mapping, labels) : null;

  const handleApply = () => {
    if (!converted) return;
    storage.setFormMigrationMap({ ...storage.getFormMigrationMap(), ...mapping });
    onApply(converted);
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
      <div className={styles.screen}>
        <div className={styles.header}>
          <h2 className={styles.title}>새 양식으로 변환</h2>
          <p className={styles.subtitle}>
            {step === "map" ? "1단계: 활동 항목 지정" : "2단계: 변환 결과 확인"}
          </p>
        </div>

        <div className={styles.content}>
          {step === "map" ? (
            <>
              <p className={styles.hint}>
                이 보고서에 기록된 활동을 새 양식의 어느 칸으로 옮길지 정해 주세요. 미리 골라
                둔 칸도 맞는지 하나씩 확인해 주세요.
              </p>
              <p className={styles.hint}>
                맞는 칸이 없으면 &quot;본당협조/소공동체활성화 › 기타&quot;를 고르세요. 항목 이름이
                기타 활동 이름으로 그대로 남아 보고서와 연간 통계에 나옵니다.
              </p>
              {usage.length === 0 ? (
                <p className={styles.hint}>옮길 활동 기록이 없습니다. 바로 다음 단계로 넘어가세요.</p>
              ) : (
                <ul className={styles.list}>
                  {usage.map((entry) => {
                    const value = mapping[entry.key] ?? "";
                    return (
                      <li key={entry.key} className={styles.row}>
                        <span className={styles.rowLabel}>
                          {entry.label}
                          <span className={styles.rowCount}> · {entry.total}회</span>
                        </span>
                        <select
                          className={`${styles.select} ${value ? "" : styles.selectMissing}`}
                          value={value}
                          aria-label={`${entry.label} 옮길 칸`}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, [entry.key]: e.target.value }))
                          }
                        >
                          <option value="">— 칸을 골라 주세요 —</option>
                          {groups.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.items.map((item) => (
                                <option key={item.key} value={item.key}>
                                  {item.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <option value={EXCLUDE}>옮기지 않음(기록 삭제)</option>
                        </select>
                        {!value && <span className={styles.missing}>아직 정하지 않았습니다</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {notes.length > 0 && (
                <div className={styles.notes}>
                  <p className={styles.hint}>
                    아래 내용은 새 양식에 칸이 없어 &quot;9. 기타&quot; 뒤에 그대로 옮겨 붙입니다.
                  </p>
                  {notes.map((line) => (
                    <p key={line} className={styles.noteLine}>
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            converted && (
              <>
                <p className={styles.hint}>
                  변환하면 이 보고서는 새 양식으로 바뀌고 되돌릴 수 없습니다. 걱정되면 먼저
                  [원본 백업]으로 파일을 저장해 두세요.
                </p>
                <div className={styles.preview}>
                  <Report2026PrintView report={converted} />
                </div>
              </>
            )
          )}
        </div>

        <div className={styles.actions}>
          {step === "map" ? (
            <>
              <button type="button" className={styles.secondaryButton} onClick={onCancel}>
                취소
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!complete}
                onClick={() => setStep("preview")}
              >
                다음: 미리보기
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.secondaryButton} onClick={() => setStep("map")}>
                이전
              </button>
              <button type="button" className={styles.secondaryButton} onClick={onBackup}>
                원본 백업
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleApply}>
                변환
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
