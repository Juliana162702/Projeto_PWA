const CACHE_NAME = "pwa-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/navbar.js",
  "/manifest.json",
  "/icons/icon-32x32.png",
  "/icons/icon-48x48.png",
  "/icons/icon-64x64.png",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-144x144.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/offline.html"
];


self.addEventListener("install", (event) => {
  console.log("Service Worker instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache aberto, adicionando recursos...");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("Recursos adicionados ao cache.");
        self.skipWaiting(); 
      })
      .catch((error) => {
        console.error("Erro ao adicionar recursos ao cache:", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker ativando...");
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log("Deletando cache antigo:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker ativado e pronto para uso.");
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  console.log("Interceptando requisição:", event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log("Servindo do cache:", event.request.url);
          return cachedResponse;
        }

        console.log("Buscando da rede:", event.request.url);
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log("Armazenando no cache:", event.request.url);
                cache.put(event.request, responseClone);
              });

            return response;
          })
          .catch(() => {
            console.warn("Erro na requisição, servindo página offline.");
            return caches.match("/offline.html"); 
          });
      })
  );
});