/* Spamtrace service worker — offline-first for a tool people need when
   they're standing in a parking lot with a bad text and one bar of signal. */
const CACHE = "spamtrace-v4";
const ASSETS = ["./","./index.html","./theme.js?v=4","./app.js?v=4","./ui.js?v=4","./brokers.js?v=4",
                "./manifest-sold.webmanifest","./manifest-eat.webmanifest",
                "./icon-sold-192.png","./icon-sold-512.png","./icon-eat-192.png","./icon-eat-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
