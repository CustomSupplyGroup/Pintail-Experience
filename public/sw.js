// The Pintail Experience — app-shell service worker.
// Dependency-free and static (served from /public), so it's fully compatible
// with Next 16 / Turbopack builds. Precaches the shell for installability +
// offline, and stale-while-revalidates already-viewed images.

const CACHE = "pintail-shell-v1";
const SHELL = ["/home", "/schedule", "/devotionals", "/photos", "/more"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Cache each shell route independently so one failure can't abort install.
      await Promise.allSettled(SHELL.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.status === 200) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Images (Supabase storage/render + local /img) — stale-while-revalidate.
  if (
    /supabase\.(co|in)\/storage\//.test(url.href) ||
    url.pathname.startsWith("/img/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // App-shell navigations — network-first, fall back to the cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(request)) || (await cache.match("/home"));
      }),
    );
  }
});
