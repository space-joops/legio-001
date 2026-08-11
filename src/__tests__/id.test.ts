import { describe, it, expect } from "vitest";
import { generateId } from "../lib/id";

describe("generateId (낮은 난이도)", () => {
  it("문자열을 반환해야 한다", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("연속으로 호출해도 서로 다른 값을 반환해야 한다", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
