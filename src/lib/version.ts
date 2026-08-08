import packageJson from "../../package.json";

/**
 * 설정 화면 맨 아래에 보이는 앱 버전과 빌드 시각.
 *
 * 사용자가 "지금 어떤 버전을 쓰고 있는지"를 전화로 불러 줄 수 있어야 해서 만든
 * 값이다. 서버가 없으니 빌드할 때 값을 코드 안에 박아 넣는다(`next.config.ts`).
 */
export const APP_VERSION = packageJson.version;

/** ISO timestamp stamped at build time (see next.config.ts); "" in dev. */
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * "20260802120712" — the build stamp compacted to one readable token, so a
 * member reading the settings screen aloud can tell which build they are on.
 *
 * Shown in Korean time: the stamp is UTC (builds run on Vercel), and a fixed
 * offset keeps the prerendered HTML and the browser in agreement, which a
 * device-local conversion would not.
 */
export function formatBuildStamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Date(parsed.getTime() + KST_OFFSET_MS).toISOString().replace(/\D/g, "").slice(0, 14);
}
