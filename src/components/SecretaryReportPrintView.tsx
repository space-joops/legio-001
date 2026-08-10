import { buildActivityLines } from "@/lib/activityReport";
import {
  OFFICER_ROLE_LABEL,
  OFFICER_ROLES,
  WEEKDAY_LABELS,
  formatYearMonthLabel,
} from "@/lib/monthlyReportUtils";
import { storage } from "@/lib/storage";
import { formatWon } from "@/lib/treasury";
import type {
  EvangelizationTallies,
  MemberCounts,
  MonthlyReport,
} from "@/lib/types";
import styles from "./SecretaryReportPrintView.module.css";

/**
 * 월례 보고서를 공식 양식 그대로 A4 한 장에 그린다.
 *
 * 서울 무염시태 세나뚜스 양식 제6호(2024년 12월 개정)를 따른다.
 *
 * 화면 미리보기·인쇄·PDF·이미지가 **전부 이 컴포넌트 하나에서 나온다.** 각각
 * 따로 만들면 어느 하나가 조금씩 달라지는데, 실제로 제출되는 문서라 그러면 안
 * 되기 때문이다. `compact` 로 미리보기와 실제 출력 크기만 구분한다.
 */

const MEMBER_COUNT_ROWS: { key: keyof MemberCounts; label: string }[] = [
  { key: "activeMale", label: "행동단원(남)" },
  { key: "activeFemale", label: "행동단원(여)" },
  { key: "praetorium", label: "쁘레또리움 단원" },
  { key: "auxiliaryMale", label: "협조단원(남)" },
  { key: "auxiliaryFemale", label: "협조단원(여)" },
  { key: "adjutorium", label: "아듀또리움 단원" },
];

const EVANGELIZATION_ROWS: {
  key: keyof EvangelizationTallies;
  label: string;
}[] = [
  { key: "baptism", label: "영세·외짝" },
  { key: "returnToFaith", label: "냉담회두" },
  { key: "activeMember", label: "행동단원" },
  { key: "praetorium", label: "쁘레또리움" },
];

/** 남·여를 합친 "계" 행. 공식 양식이 행동단원과 협조단원에만 계를 둔다. */
const SUBTOTAL_ROWS: {
  label: string;
  male: keyof MemberCounts;
  female: keyof MemberCounts;
}[] = [
  { label: "행동단원 계", male: "activeMale", female: "activeFemale" },
  { label: "협조단원 계", male: "auxiliaryMale", female: "auxiliaryFemale" },
];

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.textBlock}>
      <span className={styles.textLabel}>{label}</span>
      <p className={styles.textValue}>{value || "-"}</p>
    </div>
  );
}

function joinLines(...parts: string[]): string {
  return parts.filter((p) => p && p.trim()).join("\n");
}

export function SecretaryReportPrintView({
  report,
  compact,
}: {
  report: MonthlyReport;
  /** One-page A4 tuning shared by print, the PDF button, and the image button. */
  compact?: boolean;
}) {
  const president = report.roster.officers.find((officer) => officer.role === "president");

  // All three outputs (this view, the editor and the RTF) go through the same
  // builder so the strings can't drift apart.
  const lines = buildActivityLines(report, storage.getActivityItems());

  const evangelizationLine = EVANGELIZATION_ROWS.map(({ key, label }) => {
    const tally = report.evangelization?.[key];
    return `${label}(${tally?.result ?? 0}/${tally?.target ?? 0})`;
  }).join(", ");

  return (
    <div className={`${styles.page} ${compact ? styles.compact : ""}`}>
      <header className={styles.header}>
        <p className={styles.orgLine}>레지오 마리애 주간 활동 보고</p>
        <h1 className={styles.title}>월례 보고서</h1>
        <p className={styles.yearMonth}>
          {formatYearMonthLabel(report.yearMonth)} {"말 현재"} · {"회차"}{" "}
          {report.sessionRangeStart} ~ {report.sessionRangeEnd}
        </p>
        <p className={styles.councilLine}>
          {report.roster.praesidiumName} {report.roster.councilAffiliation}
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>회합 정보</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>회차</th>
                <td>
                  {report.sessionRangeStart} ~ {report.sessionRangeEnd}
                </td>
                <th>요일</th>
                {/* >= 0, not truthiness: Sunday is 0 and used to print as "-". */}
                <td>
                  {report.meetingWeekday >= 0 ? WEEKDAY_LABELS[report.meetingWeekday] : "-"}
                </td>
              </tr>
              <tr>
                <th>시간</th>
                <td>{report.meetingTime || "-"}</td>
                <th>장소</th>
                <td>{report.meetingLocation || "-"}</td>
              </tr>
              <tr>
                <th>{"출석"} ({"간부"})</th>
                <td>
                  {report.attendance.officersPresent} / {report.attendance.officersTotal}
                </td>
                <th>{"출석"} ({"단원"})</th>
                <td>
                  {report.attendance.membersPresent} / {report.attendance.membersTotal}
                </td>
              </tr>
              <tr>
                <th>영적지도자 성명</th>
                <td colSpan={3}>
                  {report.roster.spiritualDirectorName} {report.roster.spiritualDirectorBaptismalName}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>간부 명단</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>간부 명단</th>
                <th>성명</th>
                <th>세례명</th>
                <th>임명일</th>
                <th>참고사항</th>
              </tr>
            </thead>
            <tbody>
              {OFFICER_ROLES.map((role) => {
                const officer = report.roster.officers.find((o) => o.role === role);
                if (!officer) return null;
                return (
                  <tr key={role}>
                    <th>{OFFICER_ROLE_LABEL[role]}</th>
                    <td>{officer.name}</td>
                    <td>{officer.baptismalName}</td>
                    <td>{officer.appointedDate}</td>
                    <td>{officer.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>단원 현황</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th>전월</th>
                <th>금월</th>
                <th>증가</th>
                <th>감소</th>
              </tr>
            </thead>
            <tbody>
              {MEMBER_COUNT_ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <th>{label}</th>
                  <td>{report.memberCountsPrevMonth[key]}</td>
                  <td>{report.memberCountsThisMonth[key]}</td>
                  <td>{report.memberCountsIncrease[key]}</td>
                  <td>{report.memberCountsDecrease[key]}</td>
                </tr>
              ))}
              {/* The official form carries a 계 column for 행동단원 and 협조단원;
                  derived from 남+여 so nobody has to keep it in sync by hand. */}
              {SUBTOTAL_ROWS.map(({ label, male, female }) => (
                <tr key={label} className={styles.subtotalRow}>
                  <th>{label}</th>
                  <td>{report.memberCountsPrevMonth[male] + report.memberCountsPrevMonth[female]}</td>
                  <td>{report.memberCountsThisMonth[male] + report.memberCountsThisMonth[female]}</td>
                  <td>{report.memberCountsIncrease[male] + report.memberCountsIncrease[female]}</td>
                  <td>{report.memberCountsDecrease[male] + report.memberCountsDecrease[female]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>주요 사항</h2>
        {report.agendaItems.length === 0 ? (
          <p className={styles.empty}>-</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>사항</th>
                  <th>주관</th>
                  <th>일시</th>
                  <th>장소</th>
                  <th>참석/비고</th>
                </tr>
              </thead>
              <tbody>
                {report.agendaItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.status}</td>
                    <td>{item.title}</td>
                    <td>{item.organizer}</td>
                    <td>{item.dateTime}</td>
                    <td>{item.location}</td>
                    <td>{item.attendanceNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>회계</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>전월이월금</th>
                <td>{formatWon(report.treasury.broughtForward)}</td>
                <th>수입</th>
                <td>{formatWon(report.treasury.income)}</td>
              </tr>
              <tr>
                <th>지출</th>
                <td>{formatWon(report.treasury.expense)}</td>
                <th>잔액</th>
                <td>{formatWon(report.treasury.balance)}</td>
              </tr>
              <tr>
                <th>중요 지출 내역</th>
                <td colSpan={3}>{report.treasury.expenseBreakdown || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* The official form has no standalone prayer table: the tallies belong on
          the 교구/본당 지시사항 lines, which is where a reviewer looks for them. */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>주요 활동 내역</h2>
        <TextBlock
          label="교구 지시사항"
          value={joinLines(report.dioceseInstructions, lines.diocese)}
        />
        <TextBlock
          label="본당 지시사항"
          value={joinLines(report.parishInstructions, lines.parish)}
        />
        <TextBlock
          label="평의회 지시사항"
          value={report.councilInstructions}
        />
        <TextBlock label="활동사항" value={joinLines(lines.praesidium, report.activitySummary)} />
        <TextBlock
          label="선교실적 누계"
          value={joinLines(evangelizationLine, report.cumulativeEvangelization)}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기타</h2>
        <TextBlock label="기타" value={report.otherNotes} />
      </section>

      <footer className={styles.signature}>
        <p>
          ({"소속 평의회"}) {report.roster.councilAffiliation || "-"}{" "}
          {"직속"}
        </p>
        <p className={styles.signatureLine}>
          {report.roster.praesidiumName || "-"} {"쁘레시디움"}{" "}
          {OFFICER_ROLE_LABEL.president} {president?.name || "-"}{" "}
          {president?.baptismalName || ""} ({"서명"})
        </p>
        {/* The official form number stays off this sheet on purpose: the app's
            output is a transcription reference, not the Senatus form itself. */}
        <p className={styles.referenceNote}>※ 참고용 문서 — 공식 보고서는 세나뚜스 양식(한글 문서)에 옮겨 적어 제출합니다.</p>
      </footer>
    </div>
  );
}
