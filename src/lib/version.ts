import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;

/** ISO timestamp stamped at build time (see next.config.ts); "" in dev. */
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";
