import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { inflateRaw } from "./binary.ts";
import { getStream, parseCfb } from "./cfb.ts";
import { parseRecords, serializeRecords, TAG } from "./records.ts";

const templateFile = new Uint8Array(readFileSync(path.join(process.cwd(), "report.hwp")));

test("report.hwp Section0 파싱 — 분석 당시 구조가 유지된다", async () => {
  const doc = parseCfb(templateFile);
  const section = await inflateRaw(getStream(doc, "BodyText/Section0"));
  const records = parseRecords(section);
  assert.equal(records.length, 491);
  assert.equal(records.filter((r) => r.tag === TAG.PARA_HEADER).length, 134);
  assert.equal(records.filter((r) => r.tag === TAG.PARA_TEXT).length, 88);
  assert.equal(records.filter((r) => r.tag === TAG.PARA_LINE_SEG).length, 0);
});

test("Section0/DocInfo 직렬화 라운드트립 — 바이트 동일", async () => {
  const doc = parseCfb(templateFile);
  for (const streamPath of ["BodyText/Section0", "DocInfo"]) {
    const section = await inflateRaw(getStream(doc, streamPath));
    assert.deepEqual(serializeRecords(parseRecords(section)), section, streamPath);
  }
});

test("0xFFF 이상 크기 레코드는 확장 헤더로 라운드트립된다", () => {
  const big = { tag: 67, level: 1, data: new Uint8Array(5000).fill(7) };
  const small = { tag: 66, level: 0, data: new Uint8Array(24) };
  const bytes = serializeRecords([small, big]);
  const restored = parseRecords(bytes);
  assert.equal(restored.length, 2);
  assert.deepEqual(restored[1].data, big.data);
  assert.equal(restored[1].tag, 67);
  assert.equal(restored[1].level, 1);
});
