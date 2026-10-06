/**
 * 활동 항목 검색용 한글 매칭.
 *
 * 어르신 사용자가 휴대폰 키보드로 받침까지 정확히 치기 어려워서, 초성만 쳐도
 * 찾아지게 했다. 초성은 **낱말 첫머리부터** 맞아야 한다 — 중간까지 허용하면 "ㅇㄷ"
 * 하나에 "냉담교우돌봄" 같은 엉뚱한 항목이 줄줄이 걸린다.
 *   "ㅇㄷ" → "위령기도(연도)" 의 "연도", "ㅎㅈㅂㅁ" → 안 맞음, "ㄱㅇㅎㅈ" → "교우환자방문"
 * 글자로 친 검색어는 어디에 있든 맞는다. 공백·기호와 대소문자는 무시한다("wyd" → "WYD기도").
 */

const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
/** 초성 하나가 차지하는 음절 수(중성 21 × 종성 28). */
const SYLLABLES_PER_CHOSUNG = 588;

/** 비교용으로 다듬는다: NFC, 소문자, 글자·숫자 외 제거. */
function compact(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** "교우환자방문" → "ㄱㅇㅎㅈㅂㅁ". 한글 음절이 아닌 글자는 그대로 둔다. */
export function toChosung(text: string): string {
  let result = "";
  for (const char of text) {
    const code = char.codePointAt(0)!;
    result +=
      code >= HANGUL_START && code <= HANGUL_END
        ? CHOSUNG[Math.floor((code - HANGUL_START) / SYLLABLES_PER_CHOSUNG)]
        : char;
  }
  return result;
}

/** 검색어가 초성(ㄱ~ㅎ)만으로 되어 있는지. */
function isChosungOnly(text: string): boolean {
  return text.length > 0 && [...text].every((char) => CHOSUNG.includes(char));
}

/** "위령기도(연도)" → ["위령기도", "연도"]. 괄호·빗금·가운뎃점·쉼표·공백에서 끊는다. */
function words(text: string): string[] {
  return text
    .normalize("NFC")
    .split(/[\s/()·,.\-]+/)
    .map(compact)
    .filter(Boolean);
}

/** 빈 검색어는 모든 항목과 맞는다. */
export function matchesKoreanQuery(target: string, query: string): boolean {
  const q = compact(query);
  if (!q) return true;
  if (compact(target).includes(q)) return true;
  if (!isChosungOnly(q)) return false;
  // 낱말 하나에서 시작해 뒤 낱말로 이어져도 된다("ㄱㅇㅎㅈㅂㅁ" → "교우환자/외인환자방문" 의 앞부분).
  const parts = words(target);
  return parts.some((_, i) => toChosung(parts.slice(i).join("")).startsWith(q));
}

/** 초성 없이 글자로만 맞춘다. 묶음 이름처럼 넓게 걸리면 안 되는 곳에 쓴다. */
export function matchesTextQuery(target: string, query: string): boolean {
  const q = compact(query);
  return q === "" || compact(target).includes(q);
}
