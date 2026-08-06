import assert from "node:assert";
import test from "node:test";
import { generateId } from "./id.ts";

test("generateId (낮은 난이도)", async (t) => {
  await t.test("문자열을 반환해야 한다", () => {
    const id = generateId();
    assert.strictEqual(typeof id, "string");
    assert.ok(id.length > 0);
  });

  await t.test("연속으로 호출해도 서로 다른 값을 반환해야 한다", () => {
    const id1 = generateId();
    const id2 = generateId();
    assert.notStrictEqual(id1, id2);
  });
});
