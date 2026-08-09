import assert from "node:assert";
import test from "node:test";
import {
  concatBytes,
  deflateRaw,
  inflateRaw,
  readU16,
  readU32,
  utf16leDecode,
  utf16leEncode,
  writeU16,
  writeU32,
} from "./binary.ts";

test("u16/u32 읽기·쓰기 라운드트립", () => {
  const buffer = new Uint8Array(8);
  writeU16(buffer, 0, 0xabcd);
  writeU32(buffer, 4, 0xdeadbeef);
  assert.equal(readU16(buffer, 0), 0xabcd);
  assert.equal(readU32(buffer, 4), 0xdeadbeef);
});

test("utf16le 인코딩·디코딩 — 한글 포함", () => {
  const text = "쁘레시디움 월례 보고서 Legio";
  assert.equal(utf16leDecode(utf16leEncode(text)), text);
});

test("concatBytes", () => {
  const merged = concatBytes([new Uint8Array([1, 2]), new Uint8Array(0), new Uint8Array([3])]);
  assert.deepEqual(Array.from(merged), [1, 2, 3]);
});

test("deflate-raw 라운드트립", async () => {
  const original = utf16leEncode("가나다라마바사".repeat(500));
  const compressed = await deflateRaw(original);
  assert.ok(compressed.length < original.length);
  const restored = await inflateRaw(compressed);
  assert.deepEqual(restored, original);
});
