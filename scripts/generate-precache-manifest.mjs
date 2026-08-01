// Runs after `next build` (see package.json "postbuild"). Walks the static
// export output and writes the list of every generated file as a URL path,
// so the service worker (public/sw.js) can precache the whole site at
// install time instead of only the app shell. Regenerated on every build so
// it always matches the current content-hashed filenames.
//
// It also stamps a build-specific CACHE_NAME into out/sw.js — see stampCacheName.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT_DIR = join(process.cwd(), "out");
const SKIP_FILES = new Set([
  "sw.js",
  "precache-manifest.json",
  // Only ever fetched by link-preview crawlers, never by the app itself.
  "og-image.png",
]);

/** Nanum Gothic ships as ~276 unicode-range slices (2.9MB). Precaching them all
    would make every install pay for a font most people never switch on; the
    runtime cache-first handler still caches whichever slices actually get used. */
function isLazyFont(relPath) {
  return relPath.startsWith("_next/static/media/") && relPath.endsWith(".woff2");
}

function walk(dir, urls) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, urls);
      continue;
    }
    if (SKIP_FILES.has(entry)) continue;

    const relPath = relative(OUT_DIR, fullPath).split(sep).join("/");
    if (isLazyFont(relPath)) continue;

    if (entry === "index.html") {
      const dirPath = relPath.slice(0, -"index.html".length);
      urls.push("/" + dirPath);
    } else {
      urls.push("/" + relPath);
    }
  }
}

/**
 * Browsers decide a service worker is "new" by byte-diffing /sw.js. public/sw.js
 * is a hand-written static file, so without this every deploy ships identical
 * bytes: install/activate never re-run, the update prompt never appears, and the
 * stale-cache cleanup in activate is unreachable. Stamping the manifest's hash in
 * makes the bytes change exactly when the site's contents do.
 */
function stampCacheName(manifestJson) {
  const swPath = join(OUT_DIR, "sw.js");
  const source = readFileSync(swPath, "utf8");
  const buildId = createHash("sha256").update(manifestJson).digest("hex").slice(0, 12);
  const stamped = source.replace(
    /const CACHE_NAME = "[^"]*";/,
    `const CACHE_NAME = "legio-shell-${buildId}";`
  );
  if (stamped === source) {
    throw new Error(
      "[generate-precache-manifest] could not stamp CACHE_NAME in out/sw.js — " +
        "the declaration in public/sw.js must stay in the form: const CACHE_NAME = \"...\";"
    );
  }
  writeFileSync(swPath, stamped);
  return buildId;
}

const urls = [];
walk(OUT_DIR, urls);

const manifestJson = JSON.stringify(urls);
writeFileSync(join(OUT_DIR, "precache-manifest.json"), manifestJson);
const buildId = stampCacheName(manifestJson);
console.log(
  `[generate-precache-manifest] wrote ${urls.length} URLs to out/precache-manifest.json ` +
    `(cache: legio-shell-${buildId})`
);
