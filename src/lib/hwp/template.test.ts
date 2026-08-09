import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { inflateRaw } from "./binary.ts";
import { getStream, parseCfb } from "./cfb.ts";
import { getParaBody } from "./paragraph.ts";
import { parseRecords, TAG, type HwpRecord } from "./records.ts";
import { locateTemplate } from "./template.ts";

/**
 * 템플릿 드리프트 가드 — report.hwp나 public/report-template.hwp를 새 파일로
 * 갈아끼웠을 때 앵커가 하나라도 사라지면 npm test가 즉시 실패한다.
 */

async function loadRecords(file: string): Promise<HwpRecord[]> {
  const bytes = new Uint8Array(readFileSync(path.join(process.cwd(), file)));
  const doc = parseCfb(bytes);
  return parseRecords(await inflateRaw(getStream(doc, "BodyText/Section0")));
}

for (const file of ["report.hwp", "public/report-template.hwp"]) {
  test(`${file} — 앵커 전수 locate`, async () => {
    const records = await loadRecords(file);
    const map = locateTemplate(records);

    // 표 크기와 값 셀 좌표 스팟체크.
    assert.equal(map.officersTable.rowCount, 5);
    assert.equal(map.officersTable.colCount, 5);
    assert.equal(map.memberTable.rowCount, 6);
    assert.equal(map.memberTable.colCount, 10);
    assert.equal(map.agendaTable.rowCount, 4);
    assert.equal(map.agendaTable.colCount, 6);
    for (let row = 1; row <= 4; row += 1) {
      for (let col = 1; col <= 4; col += 1) {
        assert.ok(map.officersTable.cells.has(`${row},${col}`), `간부 명단 (${row},${col})`);
      }
    }
    for (let row = 2; row <= 5; row += 1) {
      for (let col = 2; col <= 9; col += 1) {
        assert.ok(map.memberTable.cells.has(`${row},${col}`), `단원 현황 (${row},${col})`);
      }
    }
    for (let row = 1; row <= 3; row += 1) {
      for (let col = 0; col <= 5; col += 1) {
        assert.ok(map.agendaTable.cells.has(`${row},${col}`), `주요 사항 (${row},${col})`);
      }
    }
  });
}

test("배포 템플릿에는 실물 개인정보가 남아 있지 않다", async () => {
  const records = await loadRecords("public/report-template.hwp");
  const allText = records
    .filter((record) => record.tag === TAG.PARA_HEADER)
    .map((record) => getParaBody(records, { header: record }))
    .join("\n");
  // 실물 report.hwp에 있던 이름·쁘레시디움명이 스크럽됐는지 확인한다.
  for (const name of ["이남규", "김홍식", "민경국", "김영진", "박경민", "천상은총의 어머니", "하늘의 문"]) {
    assert.ok(!allText.includes(name), `${name}이(가) 템플릿에 남아 있습니다`);
  }
});

test("배포 템플릿에서 PrvImage가 제거되어 크기가 작다", () => {
  const bytes = readFileSync(path.join(process.cwd(), "public/report-template.hwp"));
  assert.ok(bytes.length < 40000, `템플릿이 ${bytes.length}바이트로 너무 큽니다`);
  const doc = parseCfb(new Uint8Array(bytes));
  assert.ok(!doc.streams.some((s) => s.path.join("/") === "PrvImage"));
});
