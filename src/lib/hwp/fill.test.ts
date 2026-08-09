import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { inflateRaw, readU32, utf16leDecode } from "./binary.ts";
import { getStream, parseCfb } from "./cfb.ts";
import { buildMonthlyReportHwpBytes } from "./index.ts";
import { getParaBody, validateSection } from "./paragraph.ts";
import { parseRecords, TAG, type HwpRecord } from "./records.ts";
import { buildSampleMonthlyReport } from "./sampleReport.ts";
import { locateTemplate } from "./template.ts";

const templateBytes = new Uint8Array(
  readFileSync(path.join(process.cwd(), "public/report-template.hwp"))
);

interface BuiltDoc {
  records: HwpRecord[];
  bodies: string[];
  prvText: string;
}

async function buildAndReparse(
  mutate?: (report: ReturnType<typeof buildSampleMonthlyReport>) => void
): Promise<BuiltDoc & { warnings: unknown[] }> {
  const report = buildSampleMonthlyReport();
  mutate?.(report);
  const { bytes, warnings } = await buildMonthlyReportHwpBytes(report, templateBytes, []);
  const doc = parseCfb(bytes);
  const records = parseRecords(await inflateRaw(getStream(doc, "BodyText/Section0")));
  const bodies = records
    .filter((record) => record.tag === TAG.PARA_HEADER)
    .map((record) => getParaBody(records, { header: record }));
  return { records, bodies, prvText: utf16leDecode(getStream(doc, "PrvText")), warnings };
}

function findBody(bodies: string[], needle: string | RegExp): string {
  const found = bodies.find((body) =>
    typeof needle === "string" ? body.includes(needle) : needle.test(body)
  );
  assert.ok(found, `본문에서 찾지 못함: ${needle}`);
  return found as string;
}

test("표본 보고서 치환 — 문단 값들이 양식 자리에 들어간다", async () => {
  const { records, bodies } = await buildAndReparse((report) => {
    report.yearMonth = "2026-03";
    report.sessionRangeStart = 1201;
    report.sessionRangeEnd = 1205;
    report.attendance = { officersPresent: 4, officersTotal: 4, membersPresent: 11, membersTotal: 12 };
    report.treasury = {
      broughtForward: 1234567,
      income: 0,
      expense: 89,
      balance: 1234478,
      expenseBreakdown: "(경조사비) 89원",
    };
    report.otherNotes = "다음 달 피정 문의";
  });
  validateSection(records);

  findBody(bodies, /2026 년 3월말 현재\s+제\s+1201 차 ~ 제\s+1205 차/);
  findBody(bodies, /간부 4 \/ 4\s+단원\s+11 \/ 12/);
  findBody(bodies, /매주\s+토 요일\s+19 시\s+30 분/);
  findBody(bodies, /장\s+소 :\s+성당 소회의실/);
  findBody(bodies, "영적지도자 : 김어진 사도요한");
  findBody(bodies, /이월금\s+1,234,567원\s+수입\s+0원\s+지 출\s+89원\s+잔 액\s+1,234,478원/);
  findBody(bodies, "중요 지출 내역 : (경조사비) 89원");
  findBody(bodies, "9. 기타(질의 및 건의) : 다음 달 피정 문의");
});

test("8항 활동 줄 — 미사영성체 파생값과 기도 5종이 교구/본당 줄에 실린다", async () => {
  const { bodies } = await buildAndReparse();
  // 미사영성체 = 평일미사 12 + 주일미사 40 = 52. 평일미사는 본당 줄로 간다.
  const diocese = findBody(bodies, "* 교구 지시사항 : ");
  assert.ok(diocese.includes("성모님과 함께하는 기도"), diocese);
  assert.ok(
    diocese.includes("미사영성체(52), 사제를 위한 기도(34), 주모경(56), 묵주기도(78), 화살기도(90)"),
    diocese
  );
  const parish = findBody(bodies, "* 본당 지시사항 : ");
  assert.ok(parish.includes("평일미사참례(12)"), parish);
  findBody(bodies, "* Pr.활동사항 : 구역 봉사(2)");
  // 0/0은 (/), 값이 있으면 (실적/목표).
  findBody(bodies, "* 26′선교실적 누계: 영세·외짝(/), 냉담회두(1/3), 행동단원(0/2), 쁘레또리움(/)");
});

test("표 치환 — 간부 명단·단원 현황·주요 사항", async () => {
  const { records } = await buildAndReparse();
  const map = locateTemplate(records);
  const cell = (table: "officersTable" | "memberTable" | "agendaTable", row: number, col: number) =>
    getParaBody(records, map[table].cells.get(`${row},${col}`)!);

  assert.equal(cell("officersTable", 1, 1), "홍길동");
  assert.equal(cell("officersTable", 1, 2), "요셉");
  assert.equal(cell("officersTable", 1, 3), "2026.01.05");
  assert.equal(cell("officersTable", 3, 1), "이믿음");
  assert.equal(cell("officersTable", 3, 4), "연임");

  // 전월 5/3/8, 금월 5/4/9, 증가는 여 1(계 1), 0은 빈 셀.
  assert.equal(cell("memberTable", 2, 2), "5");
  assert.equal(cell("memberTable", 2, 3), "3");
  assert.equal(cell("memberTable", 2, 4), "8");
  assert.equal(cell("memberTable", 3, 3), "4");
  assert.equal(cell("memberTable", 3, 4), "9");
  assert.equal(cell("memberTable", 4, 2), "");
  assert.equal(cell("memberTable", 4, 3), "1");
  assert.equal(cell("memberTable", 4, 4), "1");
  assert.equal(cell("memberTable", 5, 9), "");

  assert.equal(cell("agendaTable", 1, 0), "실시");
  assert.equal(cell("agendaTable", 1, 1), "성모의 밤");
  assert.equal(cell("agendaTable", 1, 3), "2026-01-17 19:00");
  assert.equal(cell("agendaTable", 2, 0), "계획");
  assert.equal(cell("agendaTable", 3, 1), "");
});

test("주요 사항 4건 이상이면 3건까지만 싣고 경고를 돌려준다", async () => {
  const { warnings, records } = await buildAndReparse((report) => {
    const base = report.agendaItems[0];
    report.agendaItems = [1, 2, 3, 4, 5].map((n) => ({
      ...base,
      id: `agenda-${n}`,
      title: `행사 ${n}`,
    }));
  });
  assert.deepEqual(warnings, [{ kind: "agendaTruncated", dropped: 2 }]);
  const map = locateTemplate(records);
  assert.equal(getParaBody(records, map.agendaTable.cells.get("3,1")!), "행사 3");
});

test("서명란·평의회 줄 — 쁘레시디움명과 단장 이름", async () => {
  const { bodies } = await buildAndReparse();
  findBody(bodies, /\(평의회\)\s+성모 Cu\.\s+직속/);
  findBody(bodies, /평화의 모후\s+쁘레시디움\s+단장\s+홍길동 요셉\s+\(서명\)/);
});

test("PrvText가 치환된 본문으로 재생성된다", async () => {
  const { prvText } = await buildAndReparse();
  assert.ok(prvText.includes("홍길동"));
  assert.ok(prvText.includes("2026 년 1월말 현재"));
  assert.ok(prvText.length <= 1022);
});

test("전 문단 nChars invariant — 치환 후에도 유지된다", async () => {
  const { records } = await buildAndReparse((report) => {
    // 극단값: 아주 긴 지시사항 + 빈 값들.
    report.dioceseInstructions = "기도 지향 ".repeat(200);
    report.meetingLocation = "";
    report.roster.praesidiumName = "";
    report.agendaItems = [];
  });
  validateSection(records);
  for (const record of records) {
    if (record.tag !== TAG.PARA_HEADER) continue;
    assert.ok((readU32(record.data, 0) & 0x7fffffff) >= 1);
  }
});
