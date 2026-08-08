/**
 * 겹치지 않는 짧은 문자열 하나를 만든다. 보고서·단원·활동 기록의 id 로 쓴다.
 *
 * 서버가 없으니 "자동 증가 번호"를 매겨 줄 곳도 없다. 그래서 브라우저가 주는
 * UUID 를 쓰고, 그마저 없는 옛 브라우저에서는 시각 + 난수로 대신한다.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
