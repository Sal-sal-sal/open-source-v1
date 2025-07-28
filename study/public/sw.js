const CACHE_NAME = 'learntug-cache-v1';

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Basic fetch handler
self.addEventListener('fetch', (event) => {
  // Let the browser do the default thing for non-GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request).catch(() => {
      // If network fails, try to return cached response
      return caches.match(event.request);
    })
  );
}); 