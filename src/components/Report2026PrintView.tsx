import {
  buildForm2026Tallies,
  formatOtherActivitiesLine,
  type CellTally,
} from "@/lib/activityReport";
import {
  OFFICER_ROLE_LABEL,
  OFFICER_ROLES,
  WEEKDAY_LABELS,
} from "@/lib/monthlyReportUtils";
import {
  PR_GRID_ROWS,
  SENATUS_ITEMS,
  WEEKDAY_MASS_LABEL,
  formatCellValue,
  shortYear,
} from "@/lib/reportForm2026";
import { storage } from "@/lib/storage";
import { computeTreasuryLedger, formatWon, splitNotableExpenses } from "@/lib/treasury";
import type { MemberCounts, MonthlyReport } from "@/lib/types";
import styles from "./SecretaryReportPrintView.module.css";

/**
 * 2026 하늘의 문 Cu. 양식(`docs/forms/2026Cu_Report_Template.hwp`)을 그대로 옮긴
 * 월례 보고서. 번호(1~9)·표 구조·칸 순서를 종이 양식과 맞춰 두어, 서기가 한글
 * 문서에 옮겨 적을 때 위에서 아래로 그대로 베끼면 되게 했다.
 *
 * 화면 미리보기·인쇄·PDF·이미지가 모두 이 컴포넌트에서 나온다(`compact` 로 크기만 구분).
 */

/** 단원 현황 표의 열 순서 — 양식의 "행동단원(남·여·계) 쁘레또리움 협조단원(남·여·계) 아듀또리움". */
function memberCountCells(counts: MemberCounts): number[] {
  return [
    counts.activeMale,
    counts.activeFemale,
    counts.activeMale + counts.activeFemale,
    counts.praetorium,
    counts.auxiliaryMale,
    counts.auxiliaryFemale,
    counts.auxiliaryMale + counts.auxiliaryFemale,
    counts.adjutorium,
  ];
}

const MEMBER_COUNT_ROWS = [
  { key: "memberCountsPrevMonth", label: "전 월" },
  { key: "memberCountsThisMonth", label: "금 월" },
  { key: "memberCountsIncrease", label: "증" },
  { key: "memberCountsDecrease", label: "감" },
] as const;

/** "19:30" → "19시 30분". 형식이 다르면 적힌 그대로. */
function formatMeetingTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  return `${Number(match[1])}시 ${match[2]}분`;
}

/** "새가족찾기(3)", 짝 칸은 "피정/성지순례(1/0)". 0 이면 종이 양식처럼 괄호를 비운다. */
function inlineCell({ cell, values }: CellTally): string {
  return `${cell.label}(${formatCellValue(values)})`;
}

/** 격자 한 줄에서 분류마다 [이름 칸, 숫자 칸] 의 colSpan. 양식의 15열 배치 그대로. */
const PR_SPANS = [
  { label: 1, value: 1 },
  { label: 2, value: 1 },
  { label: 3, value: 2 },
  { label: 1, value: 2 },
  { label: 1, value: 1 },
];

export function Report2026PrintView({
  report,
  compact,
}: {
  report: MonthlyReport;
  compact?: boolean;
}) {
  const tallies = buildForm2026Tallies(report, storage.getActivityItems());
  const president = report.roster.officers.find((officer) => officer.role === "president");
  const notable = splitNotableExpenses(computeTreasuryLedger(report).breakdown);
  const senatus = report.senatusCounts;
  const [year, month] = report.yearMonth.split("-").map(Number);

  return (
    <div className={`${styles.page} ${compact ? styles.compact : ""}`}>
      <header className={styles.header}>
        <p className={styles.orgLine}>레지오 마리애</p>
        <h1 className={styles.title}>쁘레시디움 월례 보고서</h1>
        <p className={styles.yearMonth}>
          {year}년 {month}월말 현재 제 {report.sessionRangeStart}차 ~ 제 {report.sessionRangeEnd}차
        </p>
      </header>

      <section className={styles.section}>
        <p className={styles.formLine}>
          <span>
            <b>1. 주회합 일시 :</b> 매주{" "}
            {report.meetingWeekday >= 0 ? WEEKDAY_LABELS[report.meetingWeekday] : "-"}{" "}
            {formatMeetingTime(report.meetingTime) || "-"}
          </span>
          <span>
            <b>2. 장 소 :</b> {report.meetingLocation || "-"}
          </span>
        </p>
        <p className={styles.formLine}>
          <span>
            <b>3. 출 석 :</b> 간부 {report.attendance.officersPresent} /{" "}
            {report.attendance.officersTotal}　단원 {report.attendance.membersPresent} /{" "}
            {report.attendance.membersTotal}
          </span>
        </p>
        <p className={styles.formLine}>
          <span>
            <b>4. 간부 명단 :</b> ( 영적지도자 : {report.roster.spiritualDirectorName}{" "}
            {report.roster.spiritualDirectorBaptismalName} )
          </span>
        </p>
        <div className={styles.tableScroll}>
          <table className={`${styles.table} ${styles.centered}`}>
            <thead>
              <tr>
                <th>직 책</th>
                <th>성 명</th>
                <th>세 례 명</th>
                <th>임 명 일</th>
                <th>참고 사항</th>
              </tr>
            </thead>
            <tbody>
              {OFFICER_ROLES.map((role) => {
                const officer = report.roster.officers.find((o) => o.role === role);
                return (
                  <tr key={role}>
                    <th>{OFFICER_ROLE_LABEL[role]}</th>
                    <td>{officer?.name}</td>
                    <td>{officer?.baptismalName}</td>
                    <td>{officer?.appointedDate}</td>
                    <td>{officer?.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.formHeading}>5. 단원 현황</h2>
        <div className={styles.tableScroll}>
          <table className={`${styles.table} ${styles.centered}`}>
            <thead>
              <tr>
                <th rowSpan={2}>구 분</th>
                <th colSpan={3}>행동단원</th>
                <th rowSpan={2}>쁘레또리움 단원</th>
                <th colSpan={3}>협조단원</th>
                <th rowSpan={2}>아듀또리움 단원</th>
              </tr>
              <tr>
                <th>남</th>
                <th>여</th>
                <th>계</th>
                <th>남</th>
                <th>여</th>
                <th>계</th>
              </tr>
            </thead>
            <tbody>
              {MEMBER_COUNT_ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <th>{label}</th>
                  {memberCountCells(report[key]).map((value, index) => (
                    <td key={index}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.formHeading}>6. 주요 사항(행사/교육/피정) &lt;구분: 실시 또는 계획&gt;</h2>
        <div className={styles.tableScroll}>
          <table className={`${styles.table} ${styles.centered}`}>
            <thead>
              <tr>
                <th>구분</th>
                <th>제 목</th>
                <th>주 관</th>
                <th>일 시</th>
                <th>장 소</th>
                <th>참 석</th>
              </tr>
            </thead>
            <tbody>
              {report.agendaItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>-</td>
                </tr>
              ) : (
                report.agendaItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.status}</td>
                    <td>{item.title}</td>
                    <td>{item.organizer}</td>
                    <td>{item.dateTime}</td>
                    <td>{item.location}</td>
                    <td>{item.attendanceNote}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.formHeading}>7. 회계 보고 : &lt;잔액에 관계없이 월말기준&gt;</h2>
        <p className={styles.formLine}>
          <span>이월금 {formatWon(report.treasury.broughtForward)}</span>
          <span>수입 {formatWon(report.treasury.income)}</span>
          <span>지출 {formatWon(report.treasury.expense)}</span>
          <span>잔액 {formatWon(report.treasury.balance)}</span>
        </p>
        <p className={styles.formLine}>
          <span>중요 지출 내역 :</span>
          <span>(의연금) {notable.donation ? formatWon(notable.donation) : ""}</span>
          <span>(꽃값) {notable.flowers ? formatWon(notable.flowers) : ""}</span>
          <span>(기타) {notable.other ? formatWon(notable.other) : ""}</span>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.formHeading}>8. 주요 활동 내역</h2>
        <div className={styles.tableScroll}>
          <table className={`${styles.table} ${styles.activityGrid}`}>
            <tbody>
              <tr>
                <th colSpan={2}>교구 지시사항</th>
                <td colSpan={13}>
                  <span className={styles.gridEmphasis}>*해외 선교사제와 선교지를 위한 기도</span>{" "}
                  {tallies.diocese
                    .map(({ label, value }) => `${label}(${value || ""})`)
                    .join(" ")}
                </td>
              </tr>
              <tr>
                <th colSpan={2}>세나뚜스 지시사항</th>
                <td colSpan={13}>
                  {SENATUS_ITEMS.map((item) => (
                    <span key={item.label} className={styles.gridItem}>
                      {item.label}({formatCellValue(item.keys.map((key) => senatus?.[key] ?? 0))})
                    </span>
                  ))}
                </td>
              </tr>
              <tr>
                <th colSpan={2}>본당 사목자 지시사항</th>
                <td colSpan={13}>
                  <span className={styles.gridItem}>
                    {WEEKDAY_MASS_LABEL}({formatCellValue([tallies.weekdayMass])})
                  </span>
                  {tallies.parish.map((tally) => (
                    <span key={tally.cell.id} className={styles.gridItem}>
                      {inlineCell(tally)}
                    </span>
                  ))}
                </td>
              </tr>
              <tr>
                {tallies.pr.map((category, index) => (
                  <th
                    key={category.label}
                    colSpan={PR_SPANS[index].label + PR_SPANS[index].value}
                  >
                    {category.label}
                  </th>
                ))}
              </tr>
              {Array.from({ length: PR_GRID_ROWS }, (_, row) => (
                <tr key={row}>
                  {tallies.pr.map((category, index) => {
                    const tally = category.cells[row];
                    return [
                      <td key={`${category.label}-label`} colSpan={PR_SPANS[index].label}>
                        {tally?.cell.label}
                      </td>,
                      <td
                        key={`${category.label}-value`}
                        colSpan={PR_SPANS[index].value}
                        className={styles.gridValue}
                      >
                        {tally ? formatCellValue(tally.values) : ""}
                      </td>,
                    ];
                  })}
                </tr>
              ))}
              <tr>
                <th colSpan={2}>{shortYear(report.yearMonth)}선교(결과/목표)</th>
                <td colSpan={3}>
                  영세자( {report.evangelization.baptism.result} /{" "}
                  {report.evangelization.baptism.target} )
                </td>
                <td colSpan={5}>
                  냉담회두( {report.evangelization.returnToFaith.result} /{" "}
                  {report.evangelization.returnToFaith.target} )
                </td>
                <td colSpan={5} />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.formHeading}>9. 기타(질의 및 건의) :</h2>
        {/* 격자의 "기타" 칸은 숫자뿐이라, 무슨 활동이었는지는 여기 이름으로 남긴다. */}
        <p className={styles.textValue}>
          {[formatOtherActivitiesLine(tallies.others), report.otherNotes.trim()]
            .filter(Boolean)
            .join("\n") || "-"}
        </p>
      </section>

      <footer className={styles.signature}>
        <p>(평의회) {report.roster.councilAffiliation || "-"} 직속</p>
        <p className={styles.signatureLine}>
          {report.roster.praesidiumName || "-"} 쁘레시디움 단장 {president?.name || "-"}{" "}
          {president?.baptismalName || ""} (서명)
        </p>
        <p className={styles.referenceNote}>
          ※ 참고용 문서 — 공식 보고서는 세나뚜스 양식(한글 문서)에 옮겨 적어 제출합니다.
        </p>
      </footer>
    </div>
  );
}
