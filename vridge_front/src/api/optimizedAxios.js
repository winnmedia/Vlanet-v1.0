import axiosInstance from '../config/axios';
import cacheManager from '../utils/cacheManager';
import { getCacheConfigForUrl } from '../config/cacheConfig';

/**
 * 캐싱 기능이 통합된 최적화된 Axios 인스턴스
 * 기존 API 호출을 점진적으로 이 인스턴스로 교체
 */

// 요청 인터셉터 - 캐싱 로직 추가
axiosInstance.interceptors.request.use(
  async (config) => {
    const { method, url } = config;
    
    // GET 요청에 대해서만 캐시 확인
    if (method === 'get' && url) {
      try {
        const fullUrl = `${config.baseURL}${url}`;
        const cacheConfig = getCacheConfigForUrl(fullUrl);
        
        // 캐시 우선 전략인 경우 캐시된 데이터 확인
        if (cacheConfig.strategy === 'cache-first' || cacheConfig.strategy === 'stale-while-revalidate') {
          const cachedData = await cacheManager.getCachedData(fullUrl);
          
          if (cachedData) {
            console.log(`[OptimizedAxios] Cache hit: ${url}`);
            
            // 캐시된 데이터로 응답 생성
            const cachedResponse = {
              data: cachedData,
              status: 200,
              statusText: 'OK (from cache)',
              headers: { 'x-cache': 'HIT' },
              config,
              cached: true
            };
            
            // Stale-while-revalidate의 경우 백그라운드에서 재검증
            if (cacheConfig.strategy === 'stale-while-revalidate') {
              setTimeout(async () => {
                try {
                  const freshResponse = await axiosInstance.request({
                    ...config,
                    headers: { ...config.headers, 'X-Cache-Bypass': 'true' }
                  });
                  
                  if (freshResponse.data) {
                    await cacheManager.cacheApiResponse(fullUrl, freshResponse.data);
                    console.log(`[OptimizedAxios] Background refresh completed: ${url}`);
                  }
                } catch (error) {
                  console.warn(`[OptimizedAxios] Background refresh failed: ${url}`, error);
                }
              }, 0);
            }
            
            // 캐시된 응답을 즉시 반환하기 위해 Promise 거부
            return Promise.reject({ 
              cachedResponse, 
              isCached: true 
            });
          }
        }
      } catch (error) {
        console.warn('[OptimizedAxios] Cache check failed:', error);
      }
    }
    
    // 캐시 바이패스 헤더 추가 (백그라운드 업데이트용)
    if (!config.headers['X-Cache-Bypass']) {
      config.headers['X-Cache'] = 'MISS';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 캐싱 및 에러 처리
axiosInstance.interceptors.response.use(
  async (response) => {
    const { config, data } = response;
    
    // 성공적인 응답을 캐시에 저장 (GET 요청만)
    if (config.method === 'get' && data && !config.headers['X-Cache-Bypass']) {
      try {
        const fullUrl = `${config.baseURL}${config.url}`;
        await cacheManager.cacheApiResponse(fullUrl, data);
        
        response.headers['x-cache'] = 'MISS';
        console.log(`[OptimizedAxios] Response cached: ${config.url}`);
      } catch (error) {
        console.warn('[OptimizedAxios] Failed to cache response:', error);
      }
    }
    
    return response;
  },
  async (error) => {
    // 캐시된 응답 처리
    if (error.isCached && error.cachedResponse) {
      return Promise.resolve(error.cachedResponse);
    }
    
    const { config, response } = error;
    
    // 네트워크 에러 시 캐시된 데이터 제공
    if (!response && config && config.method === 'get') {
      try {
        const fullUrl = `${config.baseURL}${config.url}`;
        const cachedData = await cacheManager.getCachedData(fullUrl);
        
        if (cachedData) {
          console.log(`[OptimizedAxios] Serving cached data on network error: ${config.url}`);
          
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (from cache on error)',
            headers: { 'x-cache': 'HIT-ERROR' },
            config,
            cached: true,
            fromError: true
          });
        }
      } catch (cacheError) {
        console.warn('[OptimizedAxios] Failed to get cached data on error:', cacheError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * 캐시를 고려한 최적화된 API 호출 함수들
 */

export const optimizedAxios = {
  ...axiosInstance,
  
  // GET 요청 최적화 (캐싱 우선)
  async get(url, config = {}) {
    const cacheConfig = getCacheConfigForUrl(url);
    
    return axiosInstance.get(url, {
      ...config,
      headers: {
        ...config.headers,
        'X-Cache-Strategy': cacheConfig.strategy,
      }
    });
  },
  
  // POST 요청 최적화 (캐시 무효화 포함)
  async post(url, data, config = {}) {
    const response = await axiosInstance.post(url, data, config);
    
    // POST 성공 시 관련 캐시 무효화
    if (response.status >= 200 && response.status < 300) {
      await this.invalidateRelatedCache(url, 'POST');
    }
    
    return response;
  },
  
  // PUT 요청 최적화
  async put(url, data, config = {}) {
    const response = await axiosInstance.put(url, data, config);
    
    if (response.status >= 200 && response.status < 300) {
      await this.invalidateRelatedCache(url, 'PUT');
    }
    
    return response;
  },
  
  // DELETE 요청 최적화
  async delete(url, config = {}) {
    const response = await axiosInstance.delete(url, config);
    
    if (response.status >= 200 && response.status < 300) {
      await this.invalidateRelatedCache(url, 'DELETE');
    }
    
    return response;
  },
  
  // 캐시 무효화 로직
  async invalidateRelatedCache(url, method) {
    try {
      // URL 패턴 기반 캐시 무효화
      if (url.includes('/projects/')) {
        if (method === 'POST' && url.includes('/create')) {
          await cacheManager.invalidateCache('/api/projects/project_list/');
        } else if (method === 'PUT' || method === 'DELETE') {
          await cacheManager.invalidateCache('/api/projects/');
        }
      }
      
      if (url.includes('/feedbacks/')) {
        await cacheManager.invalidateCache('/api/feedbacks/');
        if (url.includes('/messages')) {
          await cacheManager.invalidateCache('/api/feedbacks/messages/');
        }
      }
      
      if (url.includes('/user/')) {
        await cacheManager.invalidateCache('/api/user/');
      }
      
      console.log(`[OptimizedAxios] Cache invalidated for ${method} ${url}`);
    } catch (error) {
      console.warn('[OptimizedAxios] Cache invalidation failed:', error);
    }
  },
  
  // 예측적 캐싱
  async prefetch(urls) {
    if (!Array.isArray(urls)) {
      urls = [urls];
    }
    
    return cacheManager.prefetchData(urls);
  },
  
  // 캐시 상태 확인
  async getCacheStatus() {
    return cacheManager.getCacheInfo();
  },
  
  // 수동 캐시 무효화
  async clearCache(pattern) {
    return cacheManager.invalidateCache(pattern || '');
  }
};

/**
 * 기존 axiosCredentials 함수를 캐싱이 적용된 버전으로 래핑
 */
export async function axiosCredentialsWithCache(method, url, data = null, config = {}) {
  try {
    const axiosConfig = {
      method,
      url,
      data,
      ...config
    };
    
    // GET 요청인 경우 캐시 확인
    if (method.toLowerCase() === 'get') {
      const fullUrl = `${optimizedAxios.defaults.baseURL}${url}`;
      const cachedData = await cacheManager.getCachedData(fullUrl);
      
      if (cachedData) {
        console.log(`[AxiosCredentialsCache] Cache hit: ${url}`);
        return {
          data: cachedData,
          status: 200,
          cached: true
        };
      }
    }
    
    const response = await optimizedAxios.request(axiosConfig);
    
    // GET 요청 성공 시 캐시 저장
    if (method.toLowerCase() === 'get' && response.data) {
      const fullUrl = `${optimizedAxios.defaults.baseURL}${url}`;
      await cacheManager.cacheApiResponse(fullUrl, response.data);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[AxiosCredentialsCache] ${method} ${url} failed:`, error);
    
    // 네트워크 에러 시 캐시된 데이터 시도 (GET 요청만)
    if (method.toLowerCase() === 'get') {
      const fullUrl = `${optimizedAxios.defaults.baseURL}${url}`;
      const cachedData = await cacheManager.getCachedData(fullUrl);
      
      if (cachedData) {
        console.log(`[AxiosCredentialsCache] Using cached data on error: ${url}`);
        return {
          data: cachedData,
          status: 200,
          cached: true,
          fromError: true
        };
      }
    }
    
    throw error;
  }
}

/**
 * React Query / SWR 스타일의 데이터 페칭 유틸리티
 */
export class DataFetcher {
  constructor(baseURL) {
    this.baseURL = baseURL || optimizedAxios.defaults.baseURL;
    this.cache = new Map();
  }
  
  async fetch(key, fetcher, options = {}) {
    const {
      cacheTime = 5 * 60 * 1000, // 5분
      staleTime = 60 * 1000,     // 1분
      retry = 3,
      retryDelay = 1000
    } = options;
    
    // 캐시 확인
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < staleTime) {
      return cached.data;
    }
    
    // 백그라운드 리페치 시작
    if (cached && (now - cached.timestamp) < cacheTime) {
      this.refetch(key, fetcher, options);
      return cached.data;
    }
    
    // 새 데이터 페치
    try {
      const data = await this.fetchWithRetry(fetcher, retry, retryDelay);
      
      this.cache.set(key, {
        data,
        timestamp: now
      });
      
      return data;
    } catch (error) {
      // 에러 발생 시 오래된 캐시라도 반환
      if (cached) {
        console.warn(`[DataFetcher] Using stale data for ${key}:`, error);
        return cached.data;
      }
      
      throw error;
    }
  }
  
  async refetch(key, fetcher, options) {
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      console.log(`[DataFetcher] Background refetch completed: ${key}`);
    } catch (error) {
      console.warn(`[DataFetcher] Background refetch failed: ${key}`, error);
    }
  }
  
  async fetchWithRetry(fetcher, retries, delay) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fetcher();
      } catch (error) {
        if (i === retries) throw error;
        
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  invalidate(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

export const dataFetcher = new DataFetcher();

export default optimizedAxios;