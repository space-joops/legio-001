import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { concatBytes, inflateRaw, readU32, utf16leEncode, writeU32 } from "./binary.ts";
import { getStream, parseCfb } from "./cfb.ts";
import {
  getParaBody,
  patchParaBody,
  setParaBody,
  validateSection,
} from "./paragraph.ts";
import { TAG, type HwpRecord } from "./records.ts";

function paraHeader(charCount: number, msb = false): HwpRecord {
  const data = new Uint8Array(24);
  writeU32(data, 0, (charCount | (msb ? 0x80000000 : 0)) >>> 0);
  return { tag: TAG.PARA_HEADER, level: 0, data };
}

/** {cold} 같은 8 wchar 컨트롤 블록 — 코드가 처음/끝에 오는 실물 배치를 흉내낸다. */
function controlBlock(code: number): Uint8Array {
  const block = new Uint8Array(16);
  writeU32(block, 0, code);
  writeU32(block, 12, code << 16);
  return block;
}

function paraText(prefixCodes: number[], body: string): HwpRecord {
  const data = concatBytes([
    ...prefixCodes.map(controlBlock),
    utf16leEncode(body),
    new Uint8Array([0x0d, 0]),
  ]);
  return { tag: TAG.PARA_TEXT, level: 1, data };
}

function charShape(pairs: Array<[number, number]>): HwpRecord {
  const data = new Uint8Array(pairs.length * 8);
  pairs.forEach(([pos, id], i) => {
    writeU32(data, i * 8, pos);
    writeU32(data, i * 8 + 4, id);
  });
  return { tag: TAG.PARA_CHAR_SHAPE, level: 1, data };
}

function makePara(
  body: string,
  options: { prefixCodes?: number[]; pairs?: Array<[number, number]>; msb?: boolean } = {}
): HwpRecord[] {
  const prefixCodes = options.prefixCodes ?? [];
  const charCount = prefixCodes.length * 8 + body.length + 1;
  const records: HwpRecord[] = [paraHeader(charCount, options.msb ?? false)];
  if (body.length > 0 || prefixCodes.length > 0) {
    records.push(paraText(prefixCodes, body));
  }
  records.push(charShape(options.pairs ?? [[0, 12]]));
  return records;
}

test("단순 본문 교체 — nChars와 텍스트가 함께 갱신된다", () => {
  const records = makePara("이남규");
  const slot = { header: records[0] };
  setParaBody(records, slot, "홍길동입니다");
  assert.equal(getParaBody(records, slot), "홍길동입니다");
  assert.equal(readU32(records[0].data, 0), 7);
  validateSection(records);
});

test("{cold} 선두 블록은 그대로 보존된다", () => {
  const records = makePara("이남규", { prefixCodes: [2], msb: true });
  const slot = { header: records[0] };
  const originalPrefix = records[1].data.slice(0, 16);
  setParaBody(records, slot, "김홍식");
  assert.deepEqual(records[1].data.slice(0, 16), originalPrefix);
  assert.equal(getParaBody(records, slot), "김홍식");
  // MSB 보존 + nChars = 8(블록) + 3 + 1(CR)
  assert.equal(readU32(records[0].data, 0), (0x80000000 | 12) >>> 0);
  validateSection(records);
});

test("본문 중간 줄바꿈(LF)은 일반 문자로 다룬다", () => {
  const records = makePara("첫줄\n둘째줄");
  const slot = { header: records[0] };
  assert.equal(getParaBody(records, slot), "첫줄\n둘째줄");
  setParaBody(records, slot, "하나\n둘\n셋");
  assert.equal(getParaBody(records, slot), "하나\n둘\n셋");
  validateSection(records);
});

test("다중 charshape — 수정 지점 뒤 위치가 시프트된다", () => {
  // rec31(출석) 축소판: "간부 16 / 20  단원" 에서 16→6.
  const body = "간부 16 / 20  단원";
  const records = makePara(body, {
    pairs: [
      [0, 1],
      [3, 2],
      [8, 3],
      [14, 4],
    ],
  });
  const slot = { header: records[0] };
  patchParaBody(records, slot, [{ start: 3, end: 5, text: "6" }]);
  assert.equal(getParaBody(records, slot), "간부 6 / 20  단원");
  const shape = records[2].data;
  assert.equal(readU32(shape, 0), 0);
  assert.equal(readU32(shape, 8), 3);
  assert.equal(readU32(shape, 16), 7);
  assert.equal(readU32(shape, 24), 13);
  validateSection(records);
});

test("치환 구간을 가로지르는 charshape 경계는 시작점으로 클램프된다", () => {
  const records = makePara("가나다라마바사", {
    pairs: [
      [0, 1],
      [3, 2],
      [5, 3],
    ],
  });
  const slot = { header: records[0] };
  patchParaBody(records, slot, [{ start: 2, end: 6, text: "X" }]);
  assert.equal(getParaBody(records, slot), "가나X사");
  // (3,2)와 (5,3)은 구간 안 → 2로 클램프 → 앞선 쌍만 남는다.
  const shape = records[2].data;
  assert.equal(shape.length, 16);
  assert.equal(readU32(shape, 8), 2);
  assert.equal(readU32(shape, 12), 2);
  validateSection(records);
});

test("빈 문단에 값을 넣으면 PARA_TEXT가 생성된다", () => {
  const records = makePara("", { msb: true });
  assert.equal(records.length, 2); // header + charshape
  const slot = { header: records[0] };
  setParaBody(records, slot, "37");
  assert.equal(records.length, 3);
  assert.equal(records[1].tag, TAG.PARA_TEXT);
  assert.equal(records[1].level, 1);
  assert.equal(getParaBody(records, slot), "37");
  assert.equal(readU32(records[0].data, 0), (0x80000000 | 3) >>> 0);
  validateSection(records);
});

test("본문을 비우면 PARA_TEXT가 제거되고 nChars=1이 된다", () => {
  const records = makePara("37", {
    msb: true,
    pairs: [
      [0, 12],
      [1, 25],
    ],
  });
  const slot = { header: records[0] };
  setParaBody(records, slot, "");
  assert.equal(records.length, 2);
  assert.equal(records.find((r) => r.tag === TAG.PARA_TEXT), undefined);
  assert.equal(readU32(records[0].data, 0), (0x80000000 | 1) >>> 0);
  assert.equal(records[1].data.length, 8); // charshape는 첫 쌍만 남는다
  validateSection(records);
});

test("patchParaBody — 여러 구간을 한 번에 치환해도 좌표가 맞는다", () => {
  const body = "이월금 20,000원 수입 114,000원";
  const records = makePara(body);
  const slot = { header: records[0] };
  const first = { start: body.indexOf("20,000"), end: body.indexOf("20,000") + 6, text: "1,020,000" };
  const second = { start: body.indexOf("114,000"), end: body.indexOf("114,000") + 7, text: "5,000" };
  patchParaBody(records, slot, [second, first]);
  assert.equal(getParaBody(records, slot), "이월금 1,020,000원 수입 5,000원");
  validateSection(records);
});

test("겹치는 치환 구간은 거부한다", () => {
  const records = makePara("가나다라");
  const slot = { header: records[0] };
  assert.throws(() =>
    patchParaBody(records, slot, [
      { start: 0, end: 2, text: "x" },
      { start: 1, end: 3, text: "y" },
    ])
  );
});

test("제어문자가 섞인 치환 텍스트는 거부한다", () => {
  const records = makePara("가나다");
  const slot = { header: records[0] };
  assert.throws(() => setParaBody(records, slot, "탭\t금지"));
});

test("validateSection — nChars가 어긋난 문단을 잡아낸다", () => {
  const records = makePara("가나다");
  writeU32(records[0].data, 0, 99);
  assert.throws(() => validateSection(records));
});

test("실물 report.hwp Section0이 validateSection을 통과한다", async () => {
  const file = new Uint8Array(readFileSync(path.join(process.cwd(), "report.hwp")));
  const doc = parseCfb(file);
  const section = await inflateRaw(getStream(doc, "BodyText/Section0"));
  const { parseRecords } = await import("./records.ts");
  validateSection(parseRecords(section));
});
