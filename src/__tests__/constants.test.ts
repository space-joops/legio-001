import { describe, it, expect } from "vitest";
import {
  PRAYER_ITEMS,
  EMPTY_COUNTS,
  ROSARY_SET_SIZE,
  DATA_SCHEMA_VERSION,
  SCOPED_EXPORT_VERSION,
} from "../lib/constants";

describe("상수 정의 (constants.ts)", () => {
  it("PRAYER_ITEMS는 5개의 기도 항목을 정의해야 한다", () => {
    expect(PRAYER_ITEMS.length).toBe(5);

    // 주요 키들이 모두 포함되어 있는지 확인
    const keys = PRAYER_ITEMS.map((item) => item.key);
    expect(keys).toContain("weekdayMass");
    expect(keys).toContain("priestPrayer");
    expect(keys).toContain("chainPrayer");
    expect(keys).toContain("rosaryDecades");
    expect(keys).toContain("aspirations");
  });

  it("묵주기도(rosaryDecades)는 setSize를 가져야 한다", () => {
    const rosary = PRAYER_ITEMS.find((item) => item.key === "rosaryDecades");
    expect(rosary).toBeDefined();
    expect(rosary?.setSize).toBe(ROSARY_SET_SIZE);
    expect(rosary?.unitLabel).toBe("단");
  });

  it("EMPTY_COUNTS는 모든 기도 항목을 0으로 초기화해야 한다", () => {
    expect(EMPTY_COUNTS).toEqual({
      weekdayMass: 0,
      priestPrayer: 0,
      chainPrayer: 0,
      rosaryDecades: 0,
      aspirations: 0,
    });
  });

  it("스키마 버전 불변식: 범위 파일 버전은 전체 백업 버전보다 높아야 한다", () => {
    expect(SCOPED_EXPORT_VERSION).toBeGreaterThan(DATA_SCHEMA_VERSION);
  });
});
