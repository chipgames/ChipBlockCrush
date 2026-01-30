const CACHE_NAME = "chipblockcrush-v1.0.7";
const PRECACHE_URLS =
  typeof ["/ChipBlockCrush/.nojekyll","/ChipBlockCrush/Ads.txt","/ChipBlockCrush/assets/AboutScreen-24113894.css","/ChipBlockCrush/assets/AboutScreen-5c55fa5d.js","/ChipBlockCrush/assets/en-b2856937.js","/ChipBlockCrush/assets/game-4bb5169d.css","/ChipBlockCrush/assets/game-88d4104f.js","/ChipBlockCrush/assets/GuideScreen-602191f2.css","/ChipBlockCrush/assets/GuideScreen-99e5b00f.js","/ChipBlockCrush/assets/HelpScreen-4fc70ded.js","/ChipBlockCrush/assets/HelpScreen-58da8a6b.css","/ChipBlockCrush/assets/index-7561e90e.css","/ChipBlockCrush/assets/index-d71cb926.js","/ChipBlockCrush/assets/ja-21955580.js","/ChipBlockCrush/assets/ko-1b6ee49c.js","/ChipBlockCrush/assets/PrivacyScreen-800c6874.js","/ChipBlockCrush/assets/PrivacyScreen-ac52f5c6.css","/ChipBlockCrush/assets/vendor-35c3d3c5.js","/ChipBlockCrush/assets/zh-2511d938.js","/ChipBlockCrush/ChipGames_favicon-16x16.png","/ChipBlockCrush/ChipGames_favicon-180x180.png","/ChipBlockCrush/ChipGames_favicon-192x192.png","/ChipBlockCrush/ChipGames_favicon-32x32.png","/ChipBlockCrush/ChipGames_favicon-512x512.png","/ChipBlockCrush/ChipGames_favicon.png","/ChipBlockCrush/ChipGames_Logo.png","/ChipBlockCrush/favicon.svg","/ChipBlockCrush/index.html","/ChipBlockCrush/manifest.json","/ChipBlockCrush/robots.txt","/ChipBlockCrush/sitemap.xml","/ChipBlockCrush/sw.js"] !== "undefined"
    ? ["/ChipBlockCrush/.nojekyll","/ChipBlockCrush/Ads.txt","/ChipBlockCrush/assets/AboutScreen-24113894.css","/ChipBlockCrush/assets/AboutScreen-5c55fa5d.js","/ChipBlockCrush/assets/en-b2856937.js","/ChipBlockCrush/assets/game-4bb5169d.css","/ChipBlockCrush/assets/game-88d4104f.js","/ChipBlockCrush/assets/GuideScreen-602191f2.css","/ChipBlockCrush/assets/GuideScreen-99e5b00f.js","/ChipBlockCrush/assets/HelpScreen-4fc70ded.js","/ChipBlockCrush/assets/HelpScreen-58da8a6b.css","/ChipBlockCrush/assets/index-7561e90e.css","/ChipBlockCrush/assets/index-d71cb926.js","/ChipBlockCrush/assets/ja-21955580.js","/ChipBlockCrush/assets/ko-1b6ee49c.js","/ChipBlockCrush/assets/PrivacyScreen-800c6874.js","/ChipBlockCrush/assets/PrivacyScreen-ac52f5c6.css","/ChipBlockCrush/assets/vendor-35c3d3c5.js","/ChipBlockCrush/assets/zh-2511d938.js","/ChipBlockCrush/ChipGames_favicon-16x16.png","/ChipBlockCrush/ChipGames_favicon-180x180.png","/ChipBlockCrush/ChipGames_favicon-192x192.png","/ChipBlockCrush/ChipGames_favicon-32x32.png","/ChipBlockCrush/ChipGames_favicon-512x512.png","/ChipBlockCrush/ChipGames_favicon.png","/ChipBlockCrush/ChipGames_Logo.png","/ChipBlockCrush/favicon.svg","/ChipBlockCrush/index.html","/ChipBlockCrush/manifest.json","/ChipBlockCrush/robots.txt","/ChipBlockCrush/sitemap.xml","/ChipBlockCrush/sw.js"]
    : [self.registration.scope];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        return cache.add(self.registration.scope);
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => {
        return Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

function isAssetRequest(url) {
  const path = new URL(url).pathname;
  return (
    path.includes("/assets/") ||
    /\.(js|css|png|webp|ico|svg|woff2?)$/i.test(path)
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = event.request.url;
  const scope = self.registration.scope;
  if (!url.startsWith(scope)) return;

  if (isAssetRequest(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, clone);
              } catch (_) {}
            });
          }
          return response;
        });
      }),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic")
          return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
            cache.put(event.request, clone);
          } catch (_) {}
        });
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate")
            return caches
              .match(scope)
              .then(
                (r) =>
                  r ||
                  new Response(null, { status: 504, statusText: "Offline" }),
              );
          return new Response(null, { status: 504, statusText: "Offline" });
        }),
      ),
  );
});
