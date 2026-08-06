import assert from "node:assert";
import test from "node:test";
import { computeSundayMassBasis } from "./monthlyReportUtils.ts";

test("computeSundayMassBasis (높은 난이도)", async (t) => {
  await t.test("일반적인 달의 주일 횟수를 올바르게 계산해야 한다 (예: 2026년 6월, 주회 수요일(3))", () => {
    // 2026년 5월의 마지막 수요일은 5월 27일.
    // 2026년 6월의 마지막 수요일은 6월 24일.
    // 구간: 5월 28일 ~ 6월 24일.
    // 이 구간 내의 주일(일요일): 5/31, 6/7, 6/14, 6/21 => 4번.
    const result = computeSundayMassBasis("2026-06", 3, 5); // 5명 기준
    assert.ok(result !== null);
    assert.strictEqual(result.sundayCount, 4);
    assert.strictEqual(result.total, 20); // 4 * 5 = 20

    const fromStr = result.from.toISOString().split("T")[0];
    const toStr = result.to.toISOString().split("T")[0];
    assert.strictEqual(fromStr, "2026-05-28");
    assert.strictEqual(toStr, "2026-06-24");
  });

  await t.test("연도가 바뀌는 경계(1월)에서도 정상 동작해야 한다 (예: 2024년 1월, 주회 화요일(2))", () => {
    // 2023년 12월 마지막 화요일: 12월 26일
    // 2024년 1월 마지막 화요일: 1월 30일
    // 구간: 2023-12-27 ~ 2024-01-30.
    // 이 구간 내의 주일: 12/31, 1/7, 1/14, 1/21, 1/28 => 5번.
    const result = computeSundayMassBasis("2024-01", 2, 10); // 10명 기준
    assert.ok(result !== null);
    assert.strictEqual(result.sundayCount, 5);
    assert.strictEqual(result.total, 50);
  });

  await t.test("윤년의 2월 말일이 포함된 경우도 정상 동작해야 한다 (예: 2024년 3월, 주회 목요일(4))", () => {
    // 2024년 2월은 29일까지 있음.
    // 2024년 2월 마지막 목요일: 2월 29일.
    // 2024년 3월 마지막 목요일: 3월 28일.
    // 구간: 3월 1일 ~ 3월 28일.
    // 주일: 3/3, 3/10, 3/17, 3/24 => 4번.
    const result = computeSundayMassBasis("2024-03", 4, 1);
    assert.ok(result !== null);
    assert.strictEqual(result.sundayCount, 4);
    assert.strictEqual(result.total, 4);
  });

  await t.test("유효하지 않은 입력값(형식 오류)일 경우 null을 반환해야 한다", () => {
    const result = computeSundayMassBasis("invalid-date", 3, 5);
    assert.strictEqual(result, null);
  });
});
