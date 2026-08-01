import packageJson from "../../package.json";

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
