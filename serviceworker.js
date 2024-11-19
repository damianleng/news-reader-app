const CACHE_NAME = "news-reader-v3.1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/pages/entertainment.html",
  "/pages/health.html",
  "/pages/my_news.html",
  "/pages/read.html",
  "/pages/science.html",
  "/pages/sports.html",
  "/pages/technology.html",
  "/css/materialize.min.css",
  "/js/materialize.min.js",
  "/js/ui.js",
  "/js/newsAPI.js",
];

// Install all cached files
self.addEventListener("install", (event) => {
  console.log("Sevice worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service worker: caching files");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate all cached files
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Deleting old Cache");
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Listen to fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async function () {
      if (event.request.method !== "GET") {
        return fetch(event.request);
      }

      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        console.error("Fetch failed, returning offline page:", error);
      }
    })()
  );
});
