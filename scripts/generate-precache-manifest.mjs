// Runs after `next build` (see package.json "postbuild"). Walks the static
// export output and writes the list of every generated file as a URL path,
// so the service worker (public/sw.js) can precache the whole site at
// install time instead of only the app shell. Regenerated on every build so
// it always matches the current content-hashed filenames.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT_DIR = join(process.cwd(), "out");
const SKIP_FILES = new Set(["sw.js", "precache-manifest.json"]);

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
    if (entry === "index.html") {
      const dirPath = relPath.slice(0, -"index.html".length);
      urls.push("/" + dirPath);
    } else {
      urls.push("/" + relPath);
    }
  }
}

const urls = [];
walk(OUT_DIR, urls);

writeFileSync(join(OUT_DIR, "precache-manifest.json"), JSON.stringify(urls));
console.log(`[generate-precache-manifest] wrote ${urls.length} URLs to out/precache-manifest.json`);
