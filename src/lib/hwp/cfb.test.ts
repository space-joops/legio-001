import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildCfb,
  compareDirNames,
  getStream,
  parseCfb,
  removeStream,
  setStream,
  type CfbDocument,
} from "./cfb.ts";

const templateFile = new Uint8Array(readFileSync(path.join(process.cwd(), "report.hwp")));

function sortedPaths(doc: CfbDocument): string[] {
  return doc.streams.map((s) => s.path.join("/")).sort();
}

test("report.hwp 파싱 — 알려진 스트림 구성이 나온다", () => {
  const doc = parseCfb(templateFile);
  const paths = sortedPaths(doc);
  assert.ok(paths.includes("FileHeader"));
  assert.ok(paths.includes("BodyText/Section0"));
  assert.ok(paths.includes("PrvText"));
  assert.ok(paths.includes("PrvImage"));
  assert.ok(paths.includes("BinData/BIN0001.bmp"));
  assert.equal(getStream(doc, "FileHeader").length, 256);
});

test("CFB 라운드트립 — 재생성 후에도 모든 스트림이 바이트 동일", () => {
  const doc = parseCfb(templateFile);
  const rebuilt = parseCfb(buildCfb(doc));
  assert.deepEqual(sortedPaths(rebuilt), sortedPaths(doc));
  for (const stream of doc.streams) {
    assert.deepEqual(
      getStream(rebuilt, stream.path.join("/")),
      stream.data,
      stream.path.join("/")
    );
  }
  assert.deepEqual(
    rebuilt.storages.map((s) => s.path.join("/")).sort(),
    doc.storages.map((s) => s.path.join("/")).sort()
  );
  assert.deepEqual(rebuilt.rootClsid, doc.rootClsid);
});

test("두 번 재생성해도 결과가 결정적이다", () => {
  const doc = parseCfb(templateFile);
  assert.deepEqual(buildCfb(parseCfb(buildCfb(doc))), buildCfb(doc));
});

test("디렉터리 정렬 — 이름 길이 우선, 대소문자 무시", () => {
  assert.ok(compareDirNames("z", "aa") < 0);
  assert.ok(compareDirNames("DocInfo", "docinfo") === 0);
  assert.ok(compareDirNames("PrvText", "BodyText") < 0);
  // \x05 접두 이름은 같은 길이의 알파벳 이름보다 앞에 온다.
  assert.ok(compareDirNames("\x05aaaa", "baaaa") < 0);
});

test("4096 경계 스트림이 미니/일반으로 올바르게 나뉜다", () => {
  const doc: CfbDocument = {
    rootClsid: new Uint8Array(16),
    storages: [{ path: ["Dir"], clsid: new Uint8Array(16) }],
    streams: [
      { path: ["JustUnder"], data: new Uint8Array(4095).fill(1) },
      { path: ["Exact"], data: new Uint8Array(4096).fill(2) },
      { path: ["JustOver"], data: new Uint8Array(4097).fill(3) },
      { path: ["Dir", "Tiny"], data: new Uint8Array(10).fill(4) },
      { path: ["Empty"], data: new Uint8Array(0) },
    ],
  };
  const rebuilt = parseCfb(buildCfb(doc));
  for (const stream of doc.streams) {
    assert.deepEqual(
      getStream(rebuilt, stream.path.join("/")),
      stream.data,
      stream.path.join("/")
    );
  }
});

test("setStream/removeStream", () => {
  const doc = parseCfb(templateFile);
  removeStream(doc, "PrvImage");
  setStream(doc, "PrvText", new Uint8Array([1, 0]));
  const rebuilt = parseCfb(buildCfb(doc));
  assert.ok(!sortedPaths(rebuilt).includes("PrvImage"));
  assert.deepEqual(getStream(rebuilt, "PrvText"), new Uint8Array([1, 0]));
  // PrvImage(147KB)를 빼면 파일이 크게 줄어든다.
  assert.ok(buildCfb(doc).length < 40000);
});
