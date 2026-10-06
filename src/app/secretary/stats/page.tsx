"use client";

import Link from "next/link";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/ToastProvider";
import { useMonthlyReports } from "@/hooks/useMonthlyReports";
import {
  annualStatsToCsv,
  availableYears,
  buildAnnualStats,
  formatRatio,
  sumMemberCounts,
  type AnnualStats,
} from "@/lib/annualStats";
import { PRAYER_ITEMS } from "@/lib/constants";
import { shareOrDownloadFile } from "@/lib/exportData";
import { formatYearMonthLabel } from "@/lib/monthlyReportUtils";
import { WEEKDAY_MASS_LABEL, formatCellValue } from "@/lib/reportForm2026";
import { storage } from "@/lib/storage";
import { formatWon } from "@/lib/treasury";
import styles from "./page.module.css";

/**
 * 연간 통계 화면(`/secretary/stats`).
 *
 * 그해 월례 보고서를 전부 합쳐 보여 준다. 연간 사업보고서를 쓸 때 옮겨 적거나
 * CSV 로 받아 엑셀에서 정리하는 용도다. 계산은 전부 `lib/annualStats.ts`.
 */

/** 0 은 "-" — 큰 표에서 숫자가 있는 칸이 눈에 들어오도록. */
function cellText(values: number[]): string {
  return formatCellValue(values) || "-";
}

function StatsBody({ stats }: { stats: AnnualStats }) {
  const otherMonths = [...new Set(stats.others.flatMap((o) => Object.keys(o.byMonth)))].sort();

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>개요</h2>
        <dl className={styles.summaryGrid}>
          <div>
            <dt>보고 개월 수</dt>
            <dd>{stats.months.length}개월</dd>
          </div>
          <div>
            <dt>간부 출석</dt>
            <dd>{formatRatio(stats.attendance.officersPresent, stats.attendance.officersTotal)}</dd>
          </div>
          <div>
            <dt>단원 출석</dt>
            <dd>{formatRatio(stats.attendance.membersPresent, stats.attendance.membersTotal)}</dd>
          </div>
          {stats.members && (
            <div>
              <dt>단원 수 (연초 → 최근)</dt>
              <dd>
                {sumMemberCounts(stats.members.start)}명 → {sumMemberCounts(stats.members.end)}명
              </dd>
            </div>
          )}
        </dl>
        {stats.legacyMonthCount > 0 && (
          <p className={styles.notice}>
            이전 양식으로 작성된 보고서가 {stats.legacyMonthCount}개월 있습니다. 그 달의 활동은 아래
            &quot;이전 양식 항목&quot;에 따로 모았습니다. 보고서를 새 양식으로 변환하면 양식 칸으로
            합쳐집니다.
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>월별 요약</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>월</th>
                <th>간부 출석</th>
                <th>단원 출석</th>
                <th>미사 영성체</th>
                <th>묵주기도</th>
                <th>활동 횟수</th>
                <th>수입</th>
                <th>지출</th>
                <th>잔액</th>
              </tr>
            </thead>
            <tbody>
              {stats.months.map((m) => (
                <tr key={m.yearMonth}>
                  <th scope="row">
                    {Number(m.yearMonth.slice(5))}월{m.isLegacyForm && <span className={styles.tag}> (이전 양식)</span>}
                  </th>
                  <td>{m.officersPresent}/{m.officersTotal}</td>
                  <td>{m.membersPresent}/{m.membersTotal}</td>
                  <td>{m.massCommunion.toLocaleString("ko-KR")}</td>
                  <td>{m.rosaryDecades.toLocaleString("ko-KR")}</td>
                  <td>{m.activityTotal}</td>
                  <td>{formatWon(m.income)}</td>
                  <td>{formatWon(m.expense)}</td>
                  <td>{formatWon(m.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>교구 지시사항 (기도)</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">미사 영성체</th>
                <td>
                  {stats.massCommunion.toLocaleString("ko-KR")}
                  <span className={styles.subtle}>
                    {" "}(평일 {stats.weekdayMass.toLocaleString("ko-KR")} + 주일 {stats.sundayMass.toLocaleString("ko-KR")})
                  </span>
                </td>
              </tr>
              {PRAYER_ITEMS.filter((item) => item.key !== "weekdayMass").map((item) => (
                <tr key={item.key}>
                  <th scope="row">{item.label}</th>
                  <td>
                    {stats.prayer[item.key].toLocaleString("ko-KR")}
                    {item.unitLabel ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>세나뚜스 · 본당 사목자 지시사항</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              {stats.senatus.map((item) => (
                <tr key={item.label}>
                  <th scope="row">{item.label}</th>
                  <td>{cellText(item.values)}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">{WEEKDAY_MASS_LABEL}</th>
                <td>{cellText([stats.weekdayMass])}</td>
              </tr>
              {stats.parish.map((total) => (
                <tr key={total.cell.id}>
                  <th scope="row">{total.cell.label}</th>
                  <td>{cellText(total.values)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pr. 활동</h2>
        <div className={styles.categoryGrid}>
          {stats.pr.map((category) => (
            <div key={category.label} className={styles.tableScroll}>
              <table className={styles.table}>
                <caption className={styles.caption}>
                  {category.label} <span className={styles.subtle}>· 합계 {category.total}</span>
                </caption>
                <tbody>
                  {category.cells.map((total) => (
                    <tr key={total.cell.id}>
                      <th scope="row">{total.cell.label}</th>
                      <td className={styles.number}>{cellText(total.values)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기타 활동 (직접 입력)</h2>
        {stats.others.length === 0 ? (
          <p className={styles.hint}>
            이 해에 &quot;기타 (직접 입력)&quot;으로 적은 활동이 없습니다.
          </p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>활동 이름</th>
                  <th>합계</th>
                  {otherMonths.map((ym) => (
                    <th key={ym}>{Number(ym.slice(5))}월</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.others.map((other) => (
                  <tr key={other.label}>
                    <th scope="row">{other.label}</th>
                    <td className={styles.number}>
                      <b>{other.count}</b>
                    </td>
                    {otherMonths.map((ym) => (
                      <td key={ym} className={styles.number}>
                        {other.byMonth[ym] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {stats.legacy.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>이전 양식 항목</h2>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <tbody>
                {stats.legacy.map((item) => (
                  <tr key={item.label}>
                    <th scope="row">{item.label}</th>
                    <td className={styles.number}>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>회계 · 선교</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">연초 이월금</th>
                <td>{formatWon(stats.treasury.opening)}원</td>
              </tr>
              <tr>
                <th scope="row">수입 합계</th>
                <td>{formatWon(stats.treasury.income)}원</td>
              </tr>
              <tr>
                <th scope="row">지출 합계</th>
                <td>
                  {formatWon(stats.treasury.expense)}원
                  <span className={styles.subtle}>
                    {" "}(의연금 {formatWon(stats.treasury.notable.donation)} · 꽃값{" "}
                    {formatWon(stats.treasury.notable.flowers)} · 기타 {formatWon(stats.treasury.notable.other)})
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">최근 잔액</th>
                <td>{formatWon(stats.treasury.closing)}원</td>
              </tr>
              {stats.evangelization && (
                <>
                  <tr>
                    <th scope="row">선교 영세자 (결과/목표)</th>
                    <td>
                      {stats.evangelization.baptism.result} / {stats.evangelization.baptism.target}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">선교 냉담회두 (결과/목표)</th>
                    <td>
                      {stats.evangelization.returnToFaith.result} /{" "}
                      {stats.evangelization.returnToFaith.target}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {stats.evangelizationMonth && (
          <p className={styles.hint}>
            선교 실적은 보고서에 연초부터의 누계로 적으므로 {formatYearMonthLabel(stats.evangelizationMonth)}{" "}
            보고서의 값을 보여 줍니다.
          </p>
        )}
      </section>
    </>
  );
}

export default function AnnualStatsPage() {
  const { showToast } = useToast();
  const { ready, reports } = useMonthlyReports();
  const years = availableYears(reports);
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const year = chosenYear ?? years[0] ?? null;

  if (!ready) {
    return <PageShell title="연간 통계" wide>{null}</PageShell>;
  }

  const stats = year ? buildAnnualStats(reports, storage.getActivityItems(), year) : null;

  const handleCsv = async () => {
    if (!stats) return;
    const blob = new Blob([annualStatsToCsv(stats)], { type: "text/csv;charset=utf-8" });
    const name = `${storage.getRoster().praesidiumName || "레지오"}_${stats.year}_연간통계.csv`;
    try {
      const outcome = await shareOrDownloadFile(blob, name);
      if (outcome === "downloaded") showToast("CSV 파일로 저장했습니다.");
    } catch {
      showToast("저장에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <PageShell title="연간 통계" wide>
      <div className={styles.topActions} data-app-chrome>
        <Link href="/secretary" className={styles.secondaryButton}>
          보고서 목록으로
        </Link>
        {stats && (
          <>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                void handleCsv();
              }}
            >
              CSV(엑셀) 저장
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => window.print()}>
              인쇄
            </button>
          </>
        )}
      </div>

      {year === null || !stats ? (
        <p className={styles.hint}>작성된 월례 보고서가 없어 통계를 만들 수 없습니다.</p>
      ) : (
        <>
          <div className={styles.yearRow}>
            <label className={styles.field}>
              <span className={styles.label}>연도</span>
              <select
                className={styles.input}
                value={year}
                onChange={(e) => setChosenYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </label>
            <h2 className={styles.printTitle}>
              {storage.getRoster().praesidiumName} 쁘레시디움 {year}년 연간 통계
            </h2>
          </div>
          <StatsBody stats={stats} />
        </>
      )}
    </PageShell>
  );
}
