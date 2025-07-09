// const VERSION = "1";
// const STATIC = `static-v${VERSION}`, DYNAMIC = `dynamic-v${VERSION}`;
// const ASSETS = [
//   "/",
//   "/index.html",
//   "/offline.html",
//   "/assets/pwa/pwa.js",
//   "/assets/images/icon.png",
//   "/assets/pwa/manifest.json",
// ];
// self.addEventListener("install", e => {
//   e.waitUntil(caches.open(STATIC).then(cache => cache.addAll(ASSETS)));
//   self.skipWaiting();
// });
// self.addEventListener("activate", e => {
//   e.waitUntil(
//     caches.keys().then(keys =>
//       Promise.all(keys.filter(k => ![STATIC, DYNAMIC].includes(k)).map(k => caches.delete(k)))
//     )
//   );
//   self.clients.claim();
// });
// self.addEventListener("fetch", e => {
//   e.respondWith(
//     caches.match(e.request).then(cached => 
//       cached || fetch(e.request).then(res => {
//         const cloned = res.clone();
//         caches.open(DYNAMIC).then(cache => cache.put(e.request, cloned));
//         return res;
//       }).catch(() =>
//         e.request.destination === "document" ? caches.match("/offline.html") : null
//       )
//     )
//   );
// });



importScripts("/assets/pwa/workbox-sw.js");
workbox.setConfig({ debug: false });
const VERSION = "1";
const STATIC_CACHE = `static-v${VERSION}`;
const DYNAMIC_CACHE = `dynamic-v${VERSION}`;
const FONT_CACHE = `font-cache-v${VERSION}`;
const API_CACHE = `api-cache-v${VERSION}`;
self.skipWaiting();
workbox.core.clientsClaim();
workbox.precaching.cleanupOutdatedCaches();
workbox.precaching.precacheAndRoute([
  { url: "/", revision: VERSION },
  { url: "/index.html", revision: VERSION },
  { url: "/offline.html", revision: VERSION },
  { url: "/assets/pwa/pwa.js", revision: VERSION },
  { url: "/assets/images/icon.png", revision: VERSION },
  { url: "/assets/pwa/manifest.json", revision: VERSION },
]);
workbox.routing.registerRoute(
  ({ request }) => request.mode === "navigate",
  new workbox.strategies.NetworkFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);
workbox.routing.registerRoute(
  ({ request }) => ["style", "script", "image"].includes(request.destination),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: DYNAMIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 24 * 60 * 60, // ۶۰ روز
        purgeOnQuotaError: true,
      }),
    ],
  })
);
workbox.routing.registerRoute(
  ({ url }) =>
    url.origin.startsWith("https://fonts.googleapis.com") ||
    url.origin.startsWith("https://fonts.gstatic.com"),
  new workbox.strategies.CacheFirst({
    cacheName: FONT_CACHE,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // ۱ سال
      }),
    ],
  })
);
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith("/api"),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: API_CACHE,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 10 * 60, // ۱۰ دقیقه
      }),
    ],
  })
);
workbox.routing.setDefaultHandler(
  new workbox.strategies.NetworkFirst({
    cacheName: DYNAMIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);
workbox.routing.setCatchHandler(async ({ event }) => {
  switch (event.request.destination) {
    case "document":
      return caches.match("/offline.html");
    case "image":
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect fill="#ccc" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#555">تصویر یافت نشد</text></svg>',
        {
          headers: { "Content-Type": "image/svg+xml" },
        }
      );
    default:
      return Response.error();
  }
});
