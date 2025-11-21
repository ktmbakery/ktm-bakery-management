// sw.js - Service Worker for KTM Bakery Background Notifications
const CACHE_NAME = 'ktm-bakery-v3.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/1046/1046784.png'
];

// Install event - cache important files
self.addEventListener('install', function(event) {
  console.log('🚀 KTM Bakery Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push notification event - BACKGROUND NOTIFICATIONS
self.addEventListener('push', function(event) {
  console.log('🔔 Push notification received in background');
  
  if (!event.data) {
    console.log('❌ No push data received');
    return;
  }
  
  let data = {};
  try {
    data = event.data.json();
    console.log('📨 Push data:', data);
  } catch (e) {
    console.log('❌ Error parsing push data:', e);
    data = {
      title: 'K.T.M Bakery',
      body: 'New bakery order received!',
      icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png'
    };
  }

  const options = {
    body: data.body || 'New order waiting in kitchen!',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'bakery-order',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: '👨‍🍳 View Order'
      },
      {
        action: 'complete',
        title: '✅ Mark Done'
      }
    ],
    data: {
      url: data.url || self.location.origin,
      orderId: data.orderId,
      timestamp: new Date().toISOString()
    }
  };

  console.log('📱 Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(data.title || '🎂 K.T.M Bakery', options)
    .then(() => {
      console.log('✅ Notification shown successfully');
    })
    .catch(error => {
      console.log('❌ Error showing notification:', error);
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('📱 Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    // View order - focus on orders tab
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(function(clientList) {
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('🔍 Focusing existing window');
            return client.focus();
          }
        }
        if (clients.openWindow) {
          console.log('🔄 Opening new window');
          return clients.openWindow(self.location.origin + '#orders');
        }
      })
    );
  } else if (event.action === 'complete') {
    // Mark complete - open and focus
    event.waitUntil(
      clients.openWindow(self.location.origin + '#orders')
    );
  } else {
    // Normal click
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(function(clientList) {
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(self.location.origin);
        }
      })
    );
  }
});

// Background sync for offline support
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync pending orders when online
  console.log('🔄 Syncing bakery data in background...');
  try {
    const cache = await caches.open(CACHE_NAME);
    console.log('✅ Background sync completed');
  } catch (error) {
    console.log('❌ Background sync failed:', error);
  }
}

// Handle messages from main app
self.addEventListener('message', function(event) {
  console.log('📨 Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'TEST_BACKGROUND_NOTIFICATION') {
    // Test notification from debug system
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
      vibrate: [200, 100, 200]
    });
  }
});

// Service worker activation
self.addEventListener('activate', function(event) {
  console.log('✅ KTM Bakery Service Worker activated');
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
});

console.log('🚀 KTM Bakery Service Worker loaded successfully');
