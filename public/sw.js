const CACHE_NAME = "chipblockcrush-v__BUILD_VERSION__";
const PRECACHE_URLS =
  typeof __PRECACHE_URLS__ !== "undefined"
    ? __PRECACHE_URLS__
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
