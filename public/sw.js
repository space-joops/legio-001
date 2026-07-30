const CACHE_NAME = "legio-shell-v2";
const FALLBACK_PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

async function precacheAll(cache, urls) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(url, response);
      } catch {
        // Skip URLs that fail to fetch instead of aborting the whole install.
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // The full-site manifest is generated at build time (scripts/generate-precache-manifest.mjs)
      // so the app works fully offline right after install, not just the app shell. Fall back to
      // the minimal list if it's missing (e.g. local dev, which has no postbuild step).
      try {
        const res = await fetch("/precache-manifest.json", { cache: "reload" });
        const urls = res.ok ? await res.json() : FALLBACK_PRECACHE_URLS;
        await precacheAll(cache, urls);
      } catch {
        await precacheAll(cache, FALLBACK_PRECACHE_URLS);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: try the network first so content stays fresh, but since the whole
  // site is precached, fall back to the exact cached route when offline (and only
  // fall back further to the shell if that specific route was never cached).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          caches
            .match(request)
            .then((res) => res || caches.match("/"))
            .then((res) => res || Response.error())
      )
    );
    return;
  }

  // Static assets: cache-first, populating the cache from the network the
  // first time each asset is requested.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
