import { describe, it, expect } from "vitest";
import { matchesKoreanQuery, matchesTextQuery, toChosung } from "../lib/koreanSearch";

describe("koreanSearch", () => {
  it("초성을 뽑는다", () => {
    expect(toChosung("교우환자방문")).toBe("ㄱㅇㅎㅈㅂㅁ");
    expect(toChosung("WYD기도")).toBe("WYDㄱㄷ");
  });

  it("부분 문자열·공백·대소문자를 무시하고 찾는다", () => {
    expect(matchesKoreanQuery("위령기도(연도)", "연도")).toBe(true);
    expect(matchesKoreanQuery("소공동체참석/권유 · 참석", "소공동체 참석")).toBe(true);
    expect(matchesKoreanQuery("WYD기도", "wyd")).toBe(true);
    expect(matchesKoreanQuery("새가족찾기", "냉담")).toBe(false);
  });

  it("초성은 낱말 첫머리부터 맞춘다", () => {
    expect(matchesKoreanQuery("위령기도(연도)", "ㅇㄷ")).toBe(true);
    expect(matchesKoreanQuery("교우환자방문", "ㄱㅇㅎㅈ")).toBe(true);
    expect(matchesKoreanQuery("입관/출관 · 출관", "ㅊㄱ")).toBe(true);
    // 낱말 중간에서 시작하는 초성은 걸리지 않는다.
    expect(matchesKoreanQuery("교우환자방문", "ㅎㅈㅂㅁ")).toBe(false);
    expect(matchesKoreanQuery("냉담교우돌봄", "ㅇㄷ")).toBe(false);
  });

  it("묶음 이름용 글자 검색은 초성을 쓰지 않는다", () => {
    expect(matchesTextQuery("교우돌봄", "ㅇㄷ")).toBe(false);
    expect(matchesTextQuery("교우돌봄", "교우")).toBe(true);
  });

  it("NFD 로 들어온 검색어도 맞춘다", () => {
    expect(matchesKoreanQuery("성체조배", "성체".normalize("NFD"))).toBe(true);
  });

  it("빈 검색어는 모두와 맞는다", () => {
    expect(matchesKoreanQuery("아무거나", "  ")).toBe(true);
  });
});
