import { getCacheConfigForUrl, getEnvironmentConfig, invalidateCacheByEvent } from '../config/cacheConfig';

/**
 * VideoPlanet 캐시 관리 유틸리티
 * 브라우저 캐시, Service Worker, 메모리 캐시를 통합 관리
 */
class CacheManager {
  constructor() {
    this.config = getEnvironmentConfig();
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      errors: 0
    };
    
    // 메모리 캐시 크기 제한
    this.maxMemoryCacheSize = 100;
    
    this.init();
  }

  async init() {
    try {
      // Service Worker 등록 확인
      if ('serviceWorker' in navigator) {
        await this.registerServiceWorker();
      }
      
      // 브라우저 스토리지 초기화
      this.initStorage();
      
      // 주기적 정리 작업 시작
      this.startPeriodicCleanup();
      
      console.log('[CacheManager] Initialized successfully');
    } catch (error) {
      console.error('[CacheManager] Initialization failed:', error);
    }
  }

  /**
   * Service Worker 등록 및 통신 설정
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[CacheManager] Service Worker registered:', registration.scope);
      
      // Service Worker 메시지 수신 설정
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      
      // 새 Service Worker 감지 시 사용자에게 알림
      registration.addEventListener('updatefound', () => {
        console.log('[CacheManager] New Service Worker version available');
        this.notifyNewVersionAvailable();
      });
      
      return registration;
    } catch (error) {
      console.error('[CacheManager] Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Service Worker 메시지 처리
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data || {};
    
    switch (type) {
      case 'CACHE_INFO':
        this.updateCacheStats(data);
        break;
      case 'NETWORK_ONLINE':
        this.handleNetworkOnline();
        break;
      case 'NETWORK_OFFLINE':
        this.handleNetworkOffline();
        break;
      default:
        console.log('[CacheManager] Unknown SW message:', event.data);
    }
  }

  /**
   * 브라우저 스토리지 초기화
   */
  initStorage() {
    try {
      // localStorage 사용 가능 여부 확인
      if (typeof Storage !== 'undefined') {
        this.localStorageAvailable = true;
      }
      
      // IndexedDB 사용 가능 여부 확인
      if (typeof indexedDB !== 'undefined') {
        this.initIndexedDB();
      }
    } catch (error) {
      console.error('[CacheManager] Storage initialization failed:', error);
    }
  }

  /**
   * IndexedDB 초기화 (대용량 데이터 저장용)
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.BROWSER_CACHE.STORAGE.indexedDB.NAME, 
                                   this.config.BROWSER_CACHE.STORAGE.indexedDB.VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve(this.indexedDB);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const stores = this.config.BROWSER_CACHE.STORAGE.indexedDB.STORES;
        
        // 캐시 스토어 생성
        if (!db.objectStoreNames.contains(stores.CACHE)) {
          const cacheStore = db.createObjectStore(stores.CACHE, { keyPath: 'url' });
          cacheStore.createIndex('timestamp', 'timestamp');
          cacheStore.createIndex('ttl', 'ttl');
        }
        
        // 오프라인 큐 스토어 생성
        if (!db.objectStoreNames.contains(stores.OFFLINE_QUEUE)) {
          const offlineStore = db.createObjectStore(stores.OFFLINE_QUEUE, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          offlineStore.createIndex('timestamp', 'timestamp');
        }
        
        // 대용량 데이터 스토어 생성
        if (!db.objectStoreNames.contains(stores.LARGE_DATA)) {
          db.createObjectStore(stores.LARGE_DATA, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * API 응답 캐시 (메모리 + Service Worker)
   */
  async cacheApiResponse(url, data, options = {}) {
    try {
      const config = getCacheConfigForUrl(url);
      const cacheKey = this.generateCacheKey(url, options);
      
      // 메모리 캐시에 저장
      if (config.priority === 'high' || config.priority === 'critical') {
        this.setMemoryCache(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: config.ttl,
          url
        });
      }
      
      // Service Worker 캐시는 자동으로 처리됨
      console.log(`[CacheManager] Cached API response: ${url}`);
      
    } catch (error) {
      console.error('[CacheManager] Failed to cache API response:', error);
      this.cacheStats.errors++;
    }
  }

  /**
   * 캐시된 데이터 조회
   */
  async getCachedData(url, options = {}) {
    try {
      const cacheKey = this.generateCacheKey(url, options);
      
      // 1. 메모리 캐시 우선 확인
      const memoryCached = this.getMemoryCache(cacheKey);
      if (memoryCached && this.isValidCache(memoryCached)) {
        this.cacheStats.hits++;
        console.log(`[CacheManager] Memory cache hit: ${url}`);
        return memoryCached.data;
      }
      
      // 2. IndexedDB 확인 (대용량 데이터)
      if (this.indexedDB) {
        const indexedCached = await this.getIndexedDBCache(cacheKey);
        if (indexedCached && this.isValidCache(indexedCached)) {
          this.cacheStats.hits++;
          console.log(`[CacheManager] IndexedDB cache hit: ${url}`);
          return indexedCached.data;
        }
      }
      
      // 3. Service Worker 캐시는 fetch 이벤트에서 자동 처리
      this.cacheStats.misses++;
      return null;
      
    } catch (error) {
      console.error('[CacheManager] Failed to get cached data:', error);
      this.cacheStats.errors++;
      return null;
    }
  }

  /**
   * 캐시 무효화
   */
  async invalidateCache(pattern) {
    try {
      // 메모리 캐시 무효화
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.url && value.url.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }
      
      // Service Worker에 무효화 요청
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_INVALIDATE',
          pattern
        });
      }
      
      // IndexedDB 무효화
      if (this.indexedDB) {
        await this.invalidateIndexedDBCache(pattern);
      }
      
      this.cacheStats.invalidations++;
      console.log(`[CacheManager] Invalidated cache for pattern: ${pattern}`);
      
    } catch (error) {
      console.error('[CacheManager] Cache invalidation failed:', error);
      this.cacheStats.errors++;
    }
  }

  /**
   * 이벤트 기반 캐시 무효화
   */
  invalidateCacheByEvent(eventName) {
    const patterns = invalidateCacheByEvent(eventName);
    patterns.forEach(pattern => this.invalidateCache(pattern));
    
    console.log(`[CacheManager] Invalidated cache for event: ${eventName}`, patterns);
  }

  /**
   * 예측적 캐싱 (사용자 행동 패턴 기반)
   */
  async prefetchData(urls) {
    if (!this.config.PERFORMANCE.PREDICTIVE_CACHING.ENABLED) {
      return;
    }
    
    try {
      const prefetchPromises = urls.map(async (url) => {
        try {
          const response = await fetch(url, {
            credentials: 'include',
            headers: { 'X-Prefetch': 'true' }
          });
          
          if (response.ok) {
            const data = await response.json();
            await this.cacheApiResponse(url, data);
            console.log(`[CacheManager] Prefetched: ${url}`);
          }
        } catch (error) {
          console.warn(`[CacheManager] Prefetch failed for ${url}:`, error);
        }
      });
      
      await Promise.allSettled(prefetchPromises);
    } catch (error) {
      console.error('[CacheManager] Prefetch operation failed:', error);
    }
  }

  /**
   * 오프라인 큐 관리
   */
  async addToOfflineQueue(request) {
    if (!this.indexedDB) return;
    
    try {
      const transaction = this.indexedDB.transaction(['offline_queue'], 'readwrite');
      const store = transaction.objectStore('offline_queue');
      
      await store.add({
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: request.body,
        timestamp: Date.now()
      });
      
      console.log('[CacheManager] Added to offline queue:', request.url);
    } catch (error) {
      console.error('[CacheManager] Failed to add to offline queue:', error);
    }
  }

  /**
   * 오프라인 큐 처리 (온라인 복구 시)
   */
  async processOfflineQueue() {
    if (!this.indexedDB) return;
    
    try {
      const transaction = this.indexedDB.transaction(['offline_queue'], 'readwrite');
      const store = transaction.objectStore('offline_queue');
      const requests = await store.getAll();
      
      for (const request of requests) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body
          });
          
          if (response.ok) {
            await store.delete(request.id);
            console.log('[CacheManager] Processed offline request:', request.url);
          }
        } catch (error) {
          console.warn('[CacheManager] Failed to process offline request:', error);
        }
      }
    } catch (error) {
      console.error('[CacheManager] Offline queue processing failed:', error);
    }
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats() {
    return {
      ...this.cacheStats,
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.maxMemoryCacheSize
      },
      config: {
        version: this.config.VERSION,
        environment: this.config.IS_DEVELOPMENT ? 'development' : 'production'
      }
    };
  }

  /**
   * 캐시 정보 조회 (Service Worker 포함)
   */
  async getCacheInfo() {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        resolve(this.getCacheStats());
        return;
      }
      
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_INFO') {
          resolve({
            ...this.getCacheStats(),
            serviceWorker: event.data.data
          });
        }
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_CACHE_INFO'
      }, [channel.port2]);
      
      // 타임아웃 처리
      setTimeout(() => resolve(this.getCacheStats()), 1000);
    });
  }

  /**
   * 유틸리티 메서드들
   */
  
  generateCacheKey(url, options = {}) {
    const urlObj = new URL(url, window.location.origin);
    const searchParams = new URLSearchParams(urlObj.search);
    
    // 옵션 기반 키 생성
    if (options.userId) searchParams.set('userId', options.userId);
    if (options.timestamp) searchParams.set('t', options.timestamp);
    
    return `${urlObj.pathname}?${searchParams.toString()}`;
  }

  setMemoryCache(key, value) {
    // LRU 방식으로 메모리 캐시 관리
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, value);
  }

  getMemoryCache(key) {
    return this.memoryCache.get(key);
  }

  isValidCache(cacheItem) {
    if (!cacheItem || !cacheItem.timestamp || !cacheItem.ttl) {
      return false;
    }
    
    const age = Date.now() - cacheItem.timestamp;
    return age < cacheItem.ttl;
  }

  async getIndexedDBCache(key) {
    if (!this.indexedDB) return null;
    
    try {
      const transaction = this.indexedDB.transaction(['cache_store'], 'readonly');
      const store = transaction.objectStore('cache_store');
      return await store.get(key);
    } catch (error) {
      console.error('[CacheManager] IndexedDB get failed:', error);
      return null;
    }
  }

  async invalidateIndexedDBCache(pattern) {
    if (!this.indexedDB) return;
    
    try {
      const transaction = this.indexedDB.transaction(['cache_store'], 'readwrite');
      const store = transaction.objectStore('cache_store');
      const cursor = await store.openCursor();
      
      cursor.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.url && cursor.value.url.includes(pattern)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('[CacheManager] IndexedDB invalidation failed:', error);
    }
  }

  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, this.config.GLOBAL.CLEANUP_INTERVAL);
  }

  cleanupExpiredCache() {
    // 메모리 캐시 정리
    for (const [key, value] of this.memoryCache.entries()) {
      if (!this.isValidCache(value)) {
        this.memoryCache.delete(key);
      }
    }
    
    console.log('[CacheManager] Cleanup completed');
  }

  handleNetworkOnline() {
    console.log('[CacheManager] Network online - processing offline queue');
    this.processOfflineQueue();
  }

  handleNetworkOffline() {
    console.log('[CacheManager] Network offline - enabling offline mode');
  }

  updateCacheStats(swCacheInfo) {
    console.log('[CacheManager] Service Worker cache info updated:', swCacheInfo);
  }

  notifyNewVersionAvailable() {
    // 새 버전 알림 (실제 구현에서는 사용자 알림 표시)
    console.log('[CacheManager] New app version available');
  }
}

// 싱글톤 인스턴스 생성
const cacheManager = new CacheManager();

export default cacheManager;
export { CacheManager };