// Service Worker for KTM Bakery - Android Notifications
const CACHE_NAME = 'ktm-bakery-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  console.log('🔧 KTM Bakery Service Worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('🔧 KTM Bakery Service Worker activated');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('push', function(event) {
  console.log('🔔 Push notification received in Service Worker');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'KTM Bakery', body: 'New order received!' };
  }
  
  const title = data.title || 'KTM Bakery';
  const body = data.body || 'New order received!';
  const icon = data.icon || 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png';
  const badge = data.badge || 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png';
  
  const options = {
    body: body,
    icon: icon,
    badge: badge,
    vibrate: [200, 100, 200, 100, 200],
    tag: 'ktm-order',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Order'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('message', function(event) {
  console.log('📱 Service Worker received message:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
