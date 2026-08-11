import { describe, it, expect } from "vitest";
import { formatTallies } from "../lib/activityReport";
import type { ActivityTally } from "../lib/activityReport";

describe("formatTallies (중간 난이도)", () => {
  it("count가 0인 항목은 제외하고 문자열을 만들어야 한다", () => {
    const input: ActivityTally[] = [
      { label: "장례미사", count: 2 },
      { label: "교우상가방문", count: 0 },
      { label: "기타", count: 3 },
    ];
    const result = formatTallies(input);
    expect(result).toBe("장례미사(2), 기타(3)");
  });

  it("모든 count가 0이면 빈 문자열을 반환해야 한다", () => {
    const input: ActivityTally[] = [
      { label: "장례미사", count: 0 },
      { label: "교우상가방문", count: 0 },
    ];
    const result = formatTallies(input);
    expect(result).toBe("");
  });

  it("입력 배열이 비어있으면 빈 문자열을 반환해야 한다", () => {
    const result = formatTallies([]);
    expect(result).toBe("");
  });
});
