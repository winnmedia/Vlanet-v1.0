import { useState, useEffect, useCallback, useRef } from 'react'
import cacheManager from '../utils/cacheManager';
import { getCacheConfigForUrl } from '../config/cacheConfig';

/**
 * React 캐싱 훅 - SWR(Stale While Revalidate) 패턴 구현
 * API 호출과 캐싱을 통합 관리하는 커스텀 훅
 */
export function useCache(url, options = {}) {
  const {
    fetcher = defaultFetcher,
    dependencies = [],
    enabled = true,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    refreshInterval = null,
    retryCount = 3,
    retryDelay = 1000,
    optimisticUpdate = false,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isValidating, setIsValidating] = useState(false);
  
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const revalidateTimeoutRef = useRef(null);
  
  const cacheKey = url ? cacheManager.generateCacheKey(url, { dependencies }) : null;

  /**
   * 데이터 페치 및 캐싱
   */
  const fetchData = useCallback(async (isRevalidation = false) => {
    if (!url || !enabled) return;

    // 진행 중인 요청 중단
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (!isRevalidation) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsValidating(true);
      }

      // 1. 캐시된 데이터 확인
      const cachedData = await cacheManager.getCachedData(url, { dependencies });
      
      if (cachedData && !isRevalidation) {
        setData(cachedData);
        setIsLoading(false);
        
        // 백그라운드에서 재검증
        setTimeout(() => fetchData(true), 0);
        return cachedData;
      }

      // 2. 네트워크에서 새 데이터 가져오기
      const response = await fetcher(url, { 
        signal: abortController.signal,
        ...options.fetchOptions 
      });

      // 요청이 중단된 경우
      if (abortController.signal.aborted) {
        return;
      }

      // 3. 데이터 캐싱
      await cacheManager.cacheApiResponse(url, response, { dependencies });
      
      // 4. 상태 업데이트
      setData(response);
      setError(null);
      
      if (onSuccess) {
        onSuccess(response);
      }

      console.log(`[useCache] Fetched and cached: ${url}`);
      return response;

    } catch (fetchError) {
      // 요청이 중단된 경우 무시
      if (abortController.signal.aborted) {
        return;
      }

      console.error(`[useCache] Fetch failed for ${url}:`, fetchError);
      
      // 캐시된 데이터가 있으면 사용, 없으면 에러 처리
      const cachedData = await cacheManager.getCachedData(url, { dependencies });
      
      if (cachedData) {
        setData(cachedData);
        console.log(`[useCache] Using cached data on error: ${url}`);
      } else {
        setError(fetchError);
        
        if (onError) {
          onError(fetchError);
        }

        // 재시도 로직
        if (retryCount > 0) {
          retryTimeoutRef.current = setTimeout(() => {
            fetchData(isRevalidation);
          }, retryDelay);
        }
      }
    } finally {
      setIsLoading(false);
      setIsValidating(false);
      abortControllerRef.current = null;
    }
  }, [url, enabled, dependencies.join(','), fetcher, onSuccess, onError]);

  /**
   * 데이터 뮤테이션 (옵티미스틱 업데이트 지원)
   */
  const mutate = useCallback(async (newData, shouldRevalidate = true) => {
    try {
      if (optimisticUpdate && newData) {
        // 옵티미스틱 업데이트: 즉시 UI 업데이트
        setData(newData);
        
        // 서버에 업데이트 요청
        if (shouldRevalidate) {
          await fetchData(true);
        }
      } else {
        // 일반 업데이트: 서버 응답 후 UI 업데이트
        if (shouldRevalidate) {
          await fetchData(true);
        } else if (newData) {
          setData(newData);
        }
      }
      
      // 관련 캐시 무효화
      if (url) {
        await cacheManager.invalidateCache(url);
      }
      
    } catch (error) {
      console.error('[useCache] Mutation failed:', error);
      setError(error);
    }
  }, [fetchData, optimisticUpdate, url]);

  /**
   * 캐시 무효화 및 재페치
   */
  const revalidate = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  /**
   * 페이지 포커스 시 재검증
   */
  useEffect(() => {
    if (!revalidateOnFocus || !url) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        revalidate();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [revalidate, revalidateOnFocus]);

  /**
   * 네트워크 재연결 시 재검증
   */
  useEffect(() => {
    if (!revalidateOnReconnect || !url) return;

    const handleOnline = () => {
      revalidate();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [revalidate, revalidateOnReconnect]);

  /**
   * 주기적 재검증
   */
  useEffect(() => {
    if (!refreshInterval || !url) return;

    const interval = setInterval(() => {
      revalidate();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [revalidate, refreshInterval]);

  /**
   * 초기 데이터 로딩
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      // 진행 중인 요청 중단
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // 타임아웃 정리
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (revalidateTimeoutRef.current) {
        clearTimeout(revalidateTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    revalidate
  };
}

/**
 * 무한 스크롤을 위한 캐싱 훅
 */
export function useInfiniteCache(getUrl, options = {}) {
  const {
    pageSize = 20,
    getNextPageParam = (lastPage, pages) => pages.length,
    ...restOptions
  } = options;

  const [pages, setPages] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const fetchNextPage = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage) return;

    setIsFetchingNextPage(true);

    try {
      const pageParam = getNextPageParam(pages[pages.length - 1], pages);
      const url = getUrl(pageParam);
      
      const response = await cacheManager.getCachedData(url) || 
                      await defaultFetcher(url);

      await cacheManager.cacheApiResponse(url, response);

      setPages(prev => [...prev, response]);
      setHasNextPage(response.length === pageSize);

    } catch (error) {
      console.error('[useInfiniteCache] Fetch next page failed:', error);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [pages, getUrl, getNextPageParam, pageSize, isFetchingNextPage, hasNextPage]);

  return {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  };
}

/**
 * 뮤테이션을 위한 캐싱 훅 
 */
export function useCacheMutation(mutationFn, options = {}) {
  const {
    onSuccess,
    onError,
    invalidatePatterns = [],
    optimisticUpdate = false
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (variables) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);

      // 성공 시 관련 캐시 무효화
      for (const pattern of invalidatePatterns) {
        await cacheManager.invalidateCache(pattern);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (mutationError) {
      console.error('[useCacheMutation] Mutation failed:', mutationError);
      setError(mutationError);

      if (onError) {
        onError(mutationError);
      }

      throw mutationError;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, invalidatePatterns, onSuccess, onError]);

  return {
    mutate,
    isLoading,
    error
  };
}

/**
 * 캐시 상태 모니터링 훅
 */
export function useCacheStatus() {
  const [cacheInfo, setCacheInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateCacheInfo = async () => {
      const info = await cacheManager.getCacheInfo();
      setCacheInfo(info);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // 초기 정보 로딩
    updateCacheInfo();

    // 정기적으로 캐시 정보 업데이트
    const interval = setInterval(updateCacheInfo, 30000); // 30초마다

    // 네트워크 상태 감지
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    cacheInfo,
    isOnline,
    clearCache: () => cacheManager.invalidateCache(''),
    getCacheStats: () => cacheManager.getCacheStats()
  };
}

/**
 * 기본 페처 함수
 */
async function defaultFetcher(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * API별 전용 훅들
 */

// 프로젝트 목록 조회
export function useProjects(options = {}) {
  return useCache('/api/projects/project_list/', {
    revalidateOnFocus: true,
    refreshInterval: 5 * 60 * 1000, // 5분마다 갱신
    ...options
  });
}

// 프로젝트 상세 조회
export function useProject(projectId, options = {}) {
  return useCache(
    projectId ? `/api/projects/detail/${projectId}/` : null,
    {
      dependencies: [projectId],
      ...options
    }
  );
}

// 피드백 목록 조회
export function useFeedbacks(projectId, options = {}) {
  return useCache(
    projectId ? `/api/projects/${projectId}/feedbacks/` : null,
    {
      dependencies: [projectId],
      revalidateOnFocus: true,
      refreshInterval: 2 * 60 * 1000, // 2분마다 갱신
      ...options
    }
  );
}

// 사용자 프로필 조회
export function useUserProfile(options = {}) {
  return useCache('/api/user/profile/', {
    revalidateOnFocus: false, // 프로필은 자주 변경되지 않음
    refreshInterval: 10 * 60 * 1000, // 10분마다 갱신
    ...options
  });
}

export default useCache;