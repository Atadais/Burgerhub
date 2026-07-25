const CACHE_NAME = 'amur-burgers-v3';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/admin.html',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Пропускаем кэш для admin.html и index.html с параметром ?t=
  const url = new URL(event.request.url);
  if (url.pathname.includes('admin.html') || url.search.includes('t=')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Новый заказ!';
  const options = {
    body: data.body || 'Поступил новый заказ',
    icon: 'https://placehold.co/192x192/2D4A2E/FFFFFF?text=AB&font=playfair',
    badge: 'https://placehold.co/192x192/2D4A2E/FFFFFF?text=AB&font=playfair',
    vibrate: [200, 100, 200],
    tag: 'new-order',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/admin.html'
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data.url || '/admin.html';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url + '?t=' + Date.now());
      }
    })
  );
});
