const CACHE_NAME = 'videoplanet-v1.1.0'
const STATIC_CACHE = 'videoplanet-static-v1.1.0'
const DYNAMIC_CACHE = 'videoplanet-dynamic-v1.1.0'
const API_CACHE = 'videoplanet-api-v1.1.0'

// 캐시할 정적 자산들
const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
]

// API별 캐시 설정 (TTL 및 전략)
const API_CACHE_CONFIG = {
  '/api/projects/project_list/': { strategy: 'stale-while-revalidate', ttl: 300000 }, // 5분
  '/api/feedbacks/': { strategy: 'network-first', ttl: 60000 }, // 1분  
  '/api/user/': { strategy: 'stale-while-revalidate', ttl: 600000 }, // 10분
  '/api/projects/detail/': { strategy: 'stale-while-revalidate', ttl: 180000 }, // 3분
  '/api/video_planning/': { strategy: 'stale-while-revalidate', ttl: 300000 }, // 5분
}

// 캐시 전략별 패턴 정의
const CACHE_STRATEGIES = {
  // 즉시 캐시 (정적 자산) - 성능 최적화
  CACHE_FIRST: [
    /\/_next\/static\//,
    /\.(?:ico|png|jpg|jpeg|gif|webp|avif|svg|woff2|woff|ttf|eot)$/,
    /\/static\//,
  ],
  
  // 네트워크 우선 (실시간 데이터)
  NETWORK_FIRST: [
    /\/api\/projects\/create/,
    /\/api\/feedbacks\/.*\/messages/,
    /\/api\/auth\//,
    /\/api\/projects\/.*\/feedback\/upload/,
  ],
  
  // 최신성과 성능의 균형 (HTML, 스크립트)
  STALE_WHILE_REVALIDATE: [
    /\.(?:html|js|css)$/,
    /\/api\/projects\/project_list/,
    /\/api\/user\/profile/,
  ]
}

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // POST, PUT, DELETE 등은 캐시하지 않음
  if (request.method !== 'GET') {
    return
  }
  
  // Chrome extension이나 기타 non-HTTP 요청 무시
  if (!request.url.startsWith('http')) {
    return
  }
  
  // 브라우저 내비게이션 요청
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html') || caches.match('/')
      })
    )
    return
  }

  // 캐싱 전략 결정 및 적용
  const strategy = determineStrategy(request, url)
  
  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(request))
      break
    case 'network-first':
      event.respondWith(networkFirst(request))
      break
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(request))
      break
    case 'network-only':
      // 기본 네트워크 요청
      break
    default:
      event.respondWith(staleWhileRevalidate(request))
  }
})

// 캐싱 전략 결정 함수
function determineStrategy(request, url) {
  const pathname = url.pathname
  
  // 정적 자산은 Cache First
  if (CACHE_STRATEGIES.CACHE_FIRST.some(pattern => pattern.test(request.url))) {
    return 'cache-first'
  }
  
  // 실시간성이 중요한 API는 Network First
  if (CACHE_STRATEGIES.NETWORK_FIRST.some(pattern => pattern.test(pathname))) {
    return 'network-first'
  }
  
  // API 요청에 대한 개별 설정 확인
  if (pathname.startsWith('/api/')) {
    const config = Object.keys(API_CACHE_CONFIG).find(pattern => 
      pathname.includes(pattern.replace(/\/$/, ''))
    )
    
    if (config) {
      return API_CACHE_CONFIG[config].strategy
    }
    
    return 'network-first' // 기본 API 전략
  }
  
  // HTML, JS, CSS는 Stale While Revalidate
  if (CACHE_STRATEGIES.STALE_WHILE_REVALIDATE.some(pattern => pattern.test(request.url))) {
    return 'stale-while-revalidate'
  }
  
  return 'stale-while-revalidate'
}

// Cache First 전략
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('[SW] Cache first failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network First 전략 (TTL 지원)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE)
      
      // API 응답 TTL 설정
      const pathname = new URL(request.url).pathname
      const config = Object.keys(API_CACHE_CONFIG).find(pattern => 
        pathname.includes(pattern.replace(/\/$/, ''))
      )
      
      if (config) {
        const response = networkResponse.clone()
        const headers = new Headers(response.headers)
        headers.set('sw-cached-at', Date.now().toString())
        headers.set('sw-ttl', API_CACHE_CONFIG[config].ttl.toString())
        
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        })
        
        cache.put(request, modifiedResponse)
      } else {
        cache.put(request, networkResponse.clone())
      }
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network first fallback to cache for:', request.url)
    
    const cache = await caches.open(API_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // TTL 확인
      const cachedAt = cachedResponse.headers.get('sw-cached-at')
      const ttl = cachedResponse.headers.get('sw-ttl')
      
      if (cachedAt && ttl) {
        const age = Date.now() - parseInt(cachedAt)
        if (age > parseInt(ttl)) {
          console.log('[SW] Cached response expired for:', request.url)
          return new Response('Cached data expired', { status: 503 })
        }
      }
      
      console.log('[SW] Serving cached response for:', request.url)
      return cachedResponse
    }
    
    return new Response('Network error', { status: 503 })
  }
}

// Stale While Revalidate 전략
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => cachedResponse)
  
  return cachedResponse || networkPromise
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('[SW] Background sync triggered')
  // API 데이터 동기화 로직
}

// 푸시 알림 처리
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      }
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// 메시지 이벤트 처리 (캐시 무효화 및 관리)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_INVALIDATE') {
    const { pattern } = event.data
    invalidateCache(pattern)
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches()
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    getCacheInfo().then(info => {
      event.ports[0].postMessage({ type: 'CACHE_INFO', data: info })
    })
  }
})

// 캐시 무효화
async function invalidateCache(pattern) {
  const cacheNames = [API_CACHE, DYNAMIC_CACHE]
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      
      for (const request of keys) {
        if (request.url.includes(pattern)) {
          await cache.delete(request)
          console.log('[SW] Invalidated cache for:', request.url)
        }
      }
    } catch (error) {
      console.error('[SW] Cache invalidation error:', error)
    }
  }
}

// 모든 캐시 삭제
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName.startsWith('videoplanet-')) {
          return caches.delete(cacheName)
        }
      })
    )
    console.log('[SW] All caches cleared')
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error)
  }
}

// 캐시 정보 조회
async function getCacheInfo() {
  try {
    const cacheNames = await caches.keys()
    const info = {}
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('videoplanet-')) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        info[cacheName] = {
          count: keys.length,
          urls: keys.map(key => key.url).slice(0, 10) // 처음 10개만
        }
      }
    }
    
    return info
  } catch (error) {
    console.error('[SW] Failed to get cache info:', error)
    return {}
  }
}

// 캐시 크기 관리
async function manageCacheSize(cacheName, maxItems = 50) {
  try {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    
    if (keys.length > maxItems) {
      // 오래된 항목부터 삭제 (LRU 방식)
      const itemsToDelete = keys.slice(0, keys.length - maxItems)
      await Promise.all(itemsToDelete.map(key => cache.delete(key)))
      console.log(`[SW] Cleaned ${itemsToDelete.length} items from ${cacheName}`)
    }
  } catch (error) {
    console.error(`[SW] Failed to manage cache size for ${cacheName}:`, error)
  }
}

// 주기적 캐시 정리 (10분마다)
setInterval(() => {
  manageCacheSize(DYNAMIC_CACHE, 50)
  manageCacheSize(API_CACHE, 100)
  manageCacheSize(STATIC_CACHE, 200)
}, 10 * 60 * 1000)

// 네트워크 상태 감지
self.addEventListener('online', () => {
  console.log('[SW] Network is online')
  // 온라인이 되면 중요한 데이터를 다시 가져오기
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NETWORK_ONLINE' })
    })
  })
})

self.addEventListener('offline', () => {
  console.log('[SW] Network is offline')
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NETWORK_OFFLINE' })
    })
  })
})