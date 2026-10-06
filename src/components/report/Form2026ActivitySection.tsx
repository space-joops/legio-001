"use client";

import styles from "@/app/secretary/report/page.module.css";
import { buildForm2026Tallies, formatOtherActivitiesLine } from "@/lib/activityReport";
import {
  SENATUS_HALF_LABEL,
  SENATUS_ITEMS,
  WEEKDAY_MASS_LABEL,
  createEmptySenatusCounts,
  formatCellValue,
  shortYear,
} from "@/lib/reportForm2026";
import { selectOnFocus } from "@/lib/selectOnFocus";
import type {
  ActivityItem,
  EvangelizationTallies,
  MonthlyReport,
  SenatusKey,
} from "@/lib/types";

/**
 * 2026 양식 보고서의 "8. 주요 활동 내역" ~ "9. 기타" 편집 구역.
 *
 * 사람이 직접 넣는 건 세나뚜스 지시사항 숫자, 선교 결과/목표, 기타 글뿐이다.
 * 교구·본당·Pr. 칸은 위의 활동보고 표(기도 숫자 + 활동 입력)에서 자동으로 합산되고,
 * 여기서는 인쇄될 모양을 회색 줄로 보여 주기만 한다.
 */

const EVANGELIZATION_FIELDS: { key: keyof EvangelizationTallies; label: string }[] = [
  { key: "baptism", label: "영세자" },
  { key: "returnToFaith", label: "냉담회두" },
];

function toNumber(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

interface Props {
  report: MonthlyReport;
  items: ActivityItem[];
  patch: (p: Partial<MonthlyReport>) => void;
  /** 양식에 칸이 없는 활동이 남아 있을 때 변환 창을 다시 연다. */
  onRemap: () => void;
}

export function Form2026ActivitySection({ report, items, patch, onRemap }: Props) {
  const tallies = buildForm2026Tallies(report, items);
  const senatus = report.senatusCounts ?? createEmptySenatusCounts();

  const patchSenatus = (key: SenatusKey, value: string) => {
    patch({ senatusCounts: { ...senatus, [key]: toNumber(value) } });
  };

  const dioceseLine = tallies.diocese.map(({ label, value }) => `${label}(${value})`).join(", ");
  const parishLine = [
    `${WEEKDAY_MASS_LABEL}(${tallies.weekdayMass})`,
    ...tallies.parish
      .filter((t) => t.values.some((v) => v > 0))
      .map((t) => `${t.cell.label}(${formatCellValue(t.values)})`),
  ].join(", ");
  const prLines = tallies.pr
    .map((category) => {
      const filled = category.cells
        .filter((t) => t.values.some((v) => v > 0))
        .map((t) => `${t.cell.label}(${formatCellValue(t.values)})`);
      return filled.length > 0 ? `[${category.label}] ${filled.join(", ")}` : "";
    })
    .filter(Boolean);

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. 주요 활동 내역</h2>
        <p className={styles.hint}>
          회색 줄은 보고서에 인쇄될 내용입니다. 위 활동보고 표의 기도 숫자와 [활동] 입력에서
          자동으로 합산됩니다.
        </p>

        {tallies.unmapped.length > 0 && (
          <div className={styles.warningBox} role="alert">
            <p>
              <b>⚠ 새 양식에 칸이 없는 활동이 있어 인쇄되지 않습니다:</b>{" "}
              {tallies.unmapped.map((t) => `${t.label}(${t.count})`).join(", ")}
            </p>
            <button type="button" className={styles.secondaryButton} onClick={onRemap}>
              칸 지정하기
            </button>
          </div>
        )}

        <span className={styles.label}>교구 지시사항</span>
        <output className={styles.autoLine}>
          *해외 선교사제와 선교지를 위한 기도 — {dioceseLine}
        </output>

        <h3 className={styles.sectionTitle}>세나뚜스 지시사항</h3>
        <p className={styles.hint}>이번 달 쁘레시디움 전체 합계를 직접 입력해 주세요.</p>
        {SENATUS_ITEMS.map((item) => (
          <div key={item.label} className={styles.memberCountRow}>
            <span className={styles.label}>{item.label}</span>
            <div className={styles.row}>
              {item.keys.map((key) => (
                <label key={key} className={styles.field}>
                  {item.keys.length > 1 && (
                    <span className={styles.smallLabel}>{SENATUS_HALF_LABEL[key]}</span>
                  )}
                  <input
                    type="number"
                    inputMode="numeric"
                    className={styles.input}
                    value={senatus[key]}
                    onFocus={selectOnFocus}
                    aria-label={SENATUS_HALF_LABEL[key]}
                    onChange={(e) => patchSenatus(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}

        <span className={styles.label}>본당 사목자 지시사항</span>
        <output className={styles.autoLine}>{parishLine}</output>

        <span className={styles.label}>Pr. 활동</span>
        <output className={styles.autoLine}>
          {prLines.length > 0 ? prLines.map((line) => <span key={line} className={styles.autoLineRow}>{line}</span>) : "-"}
        </output>

        <h3 className={styles.sectionTitle}>{shortYear(report.yearMonth)}선교 (결과/목표)</h3>
        {EVANGELIZATION_FIELDS.map(({ key, label }) => (
          <div key={key} className={styles.memberCountRow}>
            <span className={styles.label}>{label}</span>
            <div className={styles.row}>
              {(["result", "target"] as const).map((slot) => (
                <label key={slot} className={styles.field}>
                  <span className={styles.smallLabel}>{slot === "result" ? "결과" : "목표"}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={styles.input}
                    value={report.evangelization[key][slot]}
                    onFocus={selectOnFocus}
                    onChange={(e) =>
                      patch({
                        evangelization: {
                          ...report.evangelization,
                          [key]: { ...report.evangelization[key], [slot]: toNumber(e.target.value) },
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>9. 기타 (질의 및 건의)</h2>
        {tallies.others.length > 0 && (
          <>
            <p className={styles.hint}>
              활동 입력에서 &quot;기타 (직접 입력)&quot;으로 적은 활동입니다. 보고서 9번 줄 맨 앞에 자동으로
              인쇄됩니다.
            </p>
            <output className={styles.autoLine}>{formatOtherActivitiesLine(tallies.others)}</output>
          </>
        )}
        <label className={styles.field}>
          <span className={styles.label}>기타</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={report.otherNotes}
            onChange={(e) => patch({ otherNotes: e.target.value })}
          />
        </label>
      </section>
    </>
  );
}
