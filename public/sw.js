const CACHE_NAME = 'autismconnect-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/resources',
  '/history',
  '/analytics',
  '/wellness',
  '/login',
  '/join',
  '/manifest.json',
];

const MAX_CACHE_SIZE = 100;
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request)
          .catch(() => caches.match(OFFLINE_URL))
          .catch(() => caches.match('/'))
      );
      return;
    }

    if (
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker' ||
      request.destination === 'image'
    ) {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, clone).then(() => trimCache(CACHE_NAME, MAX_CACHE_SIZE));
                });
              }
              return response;
            })
            .catch(() => {
              if (request.destination === 'image') {
                return new Response(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect fill="#E5E7EB" width="24" height="24"/></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
            });
        })
      );
      return;
    }
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (url.origin === location.origin || url.protocol === 'https:')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone).then(() => trimCache(CACHE_NAME, MAX_CACHE_SIZE));
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || data.message,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };
  event.waitUntil(self.registration.showNotification(data.title || 'AutismConnect', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-activities') {
    event.waitUntil(syncActivities());
  }
});

async function syncActivities() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const pendingRequests = keys.filter((req) => req.url.includes('/api/'));
    await Promise.all(pendingRequests.map((req) => fetch(req).catch(() => {})));
  } catch (err) {
    console.warn('Background sync failed:', err);
  }
}

function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        const deleteCount = keys.length - maxItems;
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    });
  });
}
