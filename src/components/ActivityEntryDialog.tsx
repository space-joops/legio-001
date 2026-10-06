"use client";

import { useEffect, useRef, useState } from "react";
import { createActivityItem, selectableItemsForForm } from "@/lib/activityItems";
import { generateId } from "@/lib/id";
import { PR_OTHER_KEY, form2026GroupLabel, normalizeActivityLabel } from "@/lib/reportForm2026";
import { selectOnFocus } from "@/lib/selectOnFocus";
import { storage } from "@/lib/storage";
import type { ActivityEntry, ActivityItem, ReportFormVersion } from "@/lib/types";
import { ActivityItemPicker, type PickerGroup } from "./ActivityItemPicker";
import styles from "./ActivityEntryDialog.module.css";

/**
 * 단원 한 명이 한 회차에 한 활동들을 입력하는 창(서기용).
 *
 * 화면이 두 개다.
 *   - 기록 목록: 입력한 활동 카드. **새로 고른 활동은 맨 위에** 붙고 횟수 칸에 바로
 *     커서가 간다(예전엔 맨 아래에 붙어 매번 스크롤해야 했다).
 *   - 항목 고르기(`ActivityItemPicker`): 검색(초성 가능) + 묶음별 버튼.
 *
 * 2026 양식 보고서는 양식의 고정 칸을 고르고, 맞는 칸이 없으면 "기타 (직접 입력)"
 * 으로 활동 이름을 적는다. 이 기록은 Pr. "기타" 칸 숫자로 합산되면서 이름
 * (`customLabel`)도 남아 "9. 기타" 줄과 연간 통계에 쓰인다. 카탈로그에 새 항목을
 * 만들지는 않는다(양식에 칸이 없는 항목이 늘어나지 않도록).
 *
 * 이전 양식 보고서는 목록에 없는 활동을 직접 적으면 그 자리에서 카탈로그에 새
 * 항목으로 추가된다(월례 보고 도중 목록 관리 화면까지 다녀오지 않아도 되도록).
 */

/** Sentinel for the "type it myself" rows, which no catalogue key can use. */
const CUSTOM = "__custom__";
/** Picker option id for "기타 (직접 입력)" with no name yet. */
const PICK_CUSTOM_BLANK = "__custom_blank__";
/** Picker option ids for a 기타 name used before: prefix + the name. */
const PICK_CUSTOM_PREFIX = "__custom__:";

interface Props {
  open: boolean;
  personLabel: string;
  sessionNumber: number;
  items: ActivityItem[];
  /** 보고서의 양식. 고를 수 있는 항목이 달라진다. */
  formVersion: ReportFormVersion | undefined;
  /** Entries already recorded for this person and session. */
  entries: ActivityEntry[];
  onClose: () => void;
  onSave: (entries: ActivityEntry[]) => void;
  /** Called when a row created a brand-new catalogue item. */
  onItemsChange: (items: ActivityItem[]) => void;
  /** 예전에 쓴 기타 활동 이름들 — 같은 활동을 같은 이름으로 적도록 검색 목록과 자동완성에 띄운다. */
  otherLabelSuggestions?: string[];
}

interface DraftRow {
  id: string;
  /** A catalogue key, or CUSTOM for a name typed by hand. */
  itemKey: string;
  customLabel: string;
  count: number;
  note: string;
}

/** 항목 고르기 화면을 연 이유: 새 줄 추가, 또는 이 줄의 항목 바꾸기. */
type PickTarget = { kind: "add" } | { kind: "change"; rowId: string };

function toNumber(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function ActivityEntryDialog({
  open,
  personLabel,
  sessionNumber,
  items,
  formVersion,
  entries,
  onClose,
  onSave,
  onItemsChange,
  otherLabelSuggestions = [],
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [missingLabel, setMissingLabel] = useState(false);
  const [picking, setPicking] = useState<PickTarget | null>(null);
  /** 방금 추가했거나 이미 있던 줄 — 화면에 보이게 하고 횟수 칸에 커서를 둔다. */
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const isForm2026 = formVersion === "2026-cu";

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Seed from the saved entries every time it opens, so cancelling really cancels.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dialog draft, not derived render state
    setRows(
      entries.map((e) => {
        // 2026 양식의 "기타" 기록은 이름 입력칸이 있는 직접 입력 줄로 다시 연다.
        const isOther = formVersion === "2026-cu" && e.itemKey === PR_OTHER_KEY;
        return {
          id: e.id,
          itemKey: isOther ? CUSTOM : e.itemKey,
          customLabel: isOther ? (e.customLabel ?? "") : "",
          count: e.count,
          note: e.note,
        };
      })
    );
    setMissingLabel(false);
    setNotice("");
    setFocusRowId(null);
    // 비어 있으면 바로 고르기 화면부터 — 활동을 넣으려고 연 것이므로.
    setPicking(entries.length === 0 ? { kind: "add" } : null);
  }, [open, entries, formVersion]);

  useEffect(() => {
    if (!focusRowId || picking) return;
    const input = document.getElementById(`activity-count-${focusRowId}`) as HTMLInputElement | null;
    input?.scrollIntoView({ block: "center" });
    input?.focus();
  }, [focusRowId, picking]);

  // 2026 양식의 "기타" 칸은 이름과 함께 "기타 (직접 입력)" 으로만 고른다 — 이름 없는 기타가 쌓이지 않도록.
  const options = selectableItemsForForm(items, formVersion).filter(
    (item) => !isForm2026 || item.key !== PR_OTHER_KEY
  );

  const groups: PickerGroup[] = [];
  for (const item of options) {
    const label = isForm2026 ? (form2026GroupLabel(item.key) ?? "") : "활동 항목";
    const option = { id: item.key, label: item.label };
    const group = groups.find((g) => g.label === label);
    if (group) group.options.push(option);
    else groups.push({ label, options: [option] });
  }
  if (isForm2026) {
    groups.push({
      label: "기타 (양식에 없는 활동)",
      options: [
        ...otherLabelSuggestions.map((label) => ({
          id: `${PICK_CUSTOM_PREFIX}${label}`,
          label: `기타 · ${label}`,
        })),
        { id: PICK_CUSTOM_BLANK, label: "기타 (직접 입력)…" },
      ],
    });
  }

  const itemLabel = (row: DraftRow): string => {
    if (row.itemKey === CUSTOM) return isForm2026 ? "기타 활동" : "새 항목";
    return items.find((item) => item.key === row.itemKey)?.label ?? row.itemKey;
  };

  const groupLabel = (row: DraftRow): string => {
    if (!isForm2026) return "";
    if (row.itemKey === CUSTOM) return "Pr. 본당협조/소공동체활성화 › 기타";
    return form2026GroupLabel(row.itemKey) ?? "";
  };

  const patchRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  /** 고른 항목을 반영한다. 새 줄은 맨 위에, 이미 있는 항목이면 그 줄로 안내만 한다. */
  const applyPick = (itemKey: string, customLabel: string) => {
    const target = picking;
    setPicking(null);
    if (!target) return;
    if (target.kind === "change") {
      patchRow(target.rowId, { itemKey, customLabel });
      setFocusRowId(target.rowId);
      setNotice("");
      return;
    }
    const existing = rows.find(
      (r) =>
        r.itemKey === itemKey &&
        (itemKey !== CUSTOM ||
          (customLabel !== "" && normalizeActivityLabel(r.customLabel) === customLabel))
    );
    if (existing) {
      setFocusRowId(existing.id);
      setNotice(
        `"${customLabel || itemLabel(existing)}"은(는) 이미 입력되어 있습니다. 횟수를 고쳐 주세요.`
      );
      return;
    }
    const id = generateId();
    setRows((prev) => [{ id, itemKey, customLabel, count: 1, note: "" }, ...prev]);
    setFocusRowId(id);
    setNotice("");
    listRef.current?.scrollTo({ top: 0 });
  };

  const handlePick = (optionId: string) => {
    if (optionId === PICK_CUSTOM_BLANK) applyPick(CUSTOM, "");
    else if (optionId.startsWith(PICK_CUSTOM_PREFIX))
      applyPick(CUSTOM, optionId.slice(PICK_CUSTOM_PREFIX.length));
    else applyPick(optionId, "");
  };

  const handleSave = () => {
    if (
      rows.some(
        (row) => row.itemKey === CUSTOM && row.count > 0 && !normalizeActivityLabel(row.customLabel)
      )
    ) {
      setMissingLabel(true);
      return;
    }

    if (isForm2026) {
      onSave(
        rows
          .filter((row) => row.count > 0 && row.itemKey !== "")
          .map((row) => {
            const isOther = row.itemKey === CUSTOM;
            return {
              id: row.id,
              personId: "",
              sessionNumber,
              itemKey: isOther ? PR_OTHER_KEY : row.itemKey,
              count: row.count,
              note: row.note,
              ...(isOther ? { customLabel: normalizeActivityLabel(row.customLabel) } : {}),
            };
          })
      );
      return;
    }

    // Activities are tallied by catalogue key, so a name typed here has to
    // become a real item before an entry can point at it. New items go to the
    // Pr.활동사항 line; Pr.활동사항 관리 moves them if that is wrong.
    let catalogue = items;
    const resolved = rows.map((row) => {
      if (row.itemKey !== CUSTOM) return { ...row, resolvedKey: row.itemKey };
      const label = normalizeActivityLabel(row.customLabel);
      if (!label) return { ...row, resolvedKey: "" };
      const existing = catalogue.find((item) => item.label === label);
      if (existing) return { ...row, resolvedKey: existing.key };
      const created = createActivityItem(label, "praesidium", catalogue.length);
      catalogue = [...catalogue, created];
      return { ...row, resolvedKey: created.key };
    });

    if (catalogue !== items) {
      storage.setActivityItems(catalogue);
      onItemsChange(catalogue);
    }

    onSave(
      resolved
        .filter((row) => row.count > 0 && row.resolvedKey !== "")
        .map((row) => ({
          id: row.id,
          personId: "",
          sessionNumber,
          itemKey: row.resolvedKey,
          count: row.count,
          note: row.note,
        }))
    );
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        // Esc 는 고르기 화면에서는 "뒤로", 목록 화면에서는 "닫기".
        if (picking) setPicking(null);
        else onClose();
      }}
    >
      <div className={styles.screen}>
        <div className={styles.header}>
          <h2 className={styles.title}>{picking ? "활동 고르기" : "활동 입력"}</h2>
          <p className={styles.subtitle}>
            {personLabel} · {sessionNumber}
            {"회차"}
          </p>
        </div>

        {picking ? (
          <>
            <div className={styles.pickerArea}>
              <ActivityItemPicker
                groups={groups}
                customActionLabel={(q) =>
                  isForm2026 ? `"${q}" 기타 활동으로 입력` : `"${q}" 새 항목으로 추가`
                }
                onPick={handlePick}
                onPickCustom={(label) => applyPick(CUSTOM, normalizeActivityLabel(label))}
              />
            </div>
            <div className={styles.actions}>
              {rows.length === 0 ? (
                <button type="button" className={styles.secondaryButton} onClick={onClose}>
                  닫기
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setPicking(null)}
                >
                  뒤로
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={styles.content} ref={listRef}>
              <button
                type="button"
                className={styles.addButton}
                onClick={() => setPicking({ kind: "add" })}
              >
                ＋ 활동 추가 (검색)
              </button>
              {notice && (
                <p className={styles.notice} role="status">
                  {notice}
                </p>
              )}

              {rows.length === 0 ? (
                <p className={styles.empty}>입력된 활동이 없습니다. 위 [활동 추가]를 눌러 주세요.</p>
              ) : (
                <ul className={styles.rowList}>
                  {rows.map((row) => {
                    const isCustom = row.itemKey === CUSTOM;
                    const labelMissing = missingLabel && isCustom && !row.customLabel.trim();
                    const group = groupLabel(row);
                    return (
                      <li
                        key={row.id}
                        className={`${styles.rowCard} ${
                          row.id === focusRowId ? styles.rowCardFocus : ""
                        }`}
                      >
                        <div className={styles.rowHead}>
                          <div className={styles.rowTitle}>
                            <span className={styles.rowLabel}>
                              {isCustom && row.customLabel.trim()
                                ? `${itemLabel(row)} · ${row.customLabel}`
                                : itemLabel(row)}
                            </span>
                            {group && <span className={styles.rowGroup}>{group}</span>}
                          </div>
                          <button
                            type="button"
                            className={styles.changeButton}
                            onClick={() => setPicking({ kind: "change", rowId: row.id })}
                          >
                            바꾸기
                          </button>
                        </div>

                        {isCustom && (
                          <input
                            type="text"
                            className={`${styles.customLabel} ${
                              labelMissing ? styles.customLabelMissing : ""
                            }`}
                            value={row.customLabel}
                            placeholder={
                              isForm2026 ? "기타 활동 이름 (예: 바자회 봉사)" : "새 활동 이름"
                            }
                            aria-label={isForm2026 ? "기타 활동 이름" : "새 활동 이름"}
                            list={isForm2026 ? "other-activity-labels" : undefined}
                            onChange={(e) => {
                              patchRow(row.id, { customLabel: e.target.value });
                              setMissingLabel(false);
                            }}
                          />
                        )}

                        <div className={styles.rowFields}>
                          <div className={styles.stepper}>
                            <button
                              type="button"
                              className={styles.stepButton}
                              aria-label="횟수 1 줄이기"
                              onClick={() => patchRow(row.id, { count: Math.max(0, row.count - 1) })}
                            >
                              −
                            </button>
                            <input
                              id={`activity-count-${row.id}`}
                              type="number"
                              inputMode="numeric"
                              className={styles.count}
                              value={row.count}
                              onFocus={selectOnFocus}
                              aria-label="횟수"
                              onChange={(e) => patchRow(row.id, { count: toNumber(e.target.value) })}
                            />
                            <button
                              type="button"
                              className={styles.stepButton}
                              aria-label="횟수 1 늘리기"
                              onClick={() => patchRow(row.id, { count: row.count + 1 })}
                            >
                              ＋
                            </button>
                          </div>
                          <input
                            type="text"
                            className={styles.note}
                            value={row.note}
                            placeholder="내용 (예: 김요한 형제 상가)"
                            aria-label="내용"
                            onChange={(e) => patchRow(row.id, { note: e.target.value })}
                          />
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {isForm2026 && (
                <datalist id="other-activity-labels">
                  {otherLabelSuggestions.map((label) => (
                    <option key={label} value={label} />
                  ))}
                </datalist>
              )}
              {missingLabel && (
                <p className={styles.error} role="alert">
                  {isForm2026 ? "기타 활동" : "새 항목"} 줄에 활동 이름을 적어 주세요.
                </p>
              )}
              <p className={styles.hint}>
                {isForm2026 &&
                  "양식에 없는 활동은 검색한 뒤 \"기타 활동으로 입력\"을 누르세요. 보고서의 기타 칸에 합산되고, 이름은 \"9. 기타\" 줄과 연간 통계에 나옵니다. "}
                내용은 앱에서만 참고용으로 보이고 보고서에는 나오지 않습니다.
              </p>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={onClose}>
                취소
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleSave}>
                저장
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
