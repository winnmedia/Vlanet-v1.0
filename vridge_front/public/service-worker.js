// Service Worker for cache management
const CACHE_NAME = 'vlanet-cache-v2';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

// 캐시할 리소스 타입
const cacheableResources = [
  '/static/js/',
  '/static/css/',
  '/static/media/',
  '/images/',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - optimized caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests
  if (event.request.url.includes('/api/')) return;

  // Check if resource should be cached
  const shouldCache = cacheableResources.some(resource => 
    event.request.url.includes(resource)
  );

  if (shouldCache) {
    // Cache first strategy for static assets
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
        })
    );
  } else {
    // Network first strategy for other resources
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          return response;
        })
        .catch(() => {
          // Network failed, try to get from cache
          return caches.match(event.request);
        })
    );
  }
});

// Handle chunk loading errors
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});