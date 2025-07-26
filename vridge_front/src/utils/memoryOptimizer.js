// 메모리 최적화 유틸리티
import { useEffect, useRef } from 'react'

// 메모리 누수 감지
export const detectMemoryLeaks = () => {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  const memorySnapshots = []
  const interval = 5000 // 5초마다 체크
  
  const checkMemory = () => {
    if (performance.memory) {
      const snapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      }
      
      memorySnapshots.push(snapshot)
      
      // 최근 10개 스냅샷만 유지
      if (memorySnapshots.length > 10) {
        memorySnapshots.shift()
      }
      
      // 메모리 증가 추세 분석
      if (memorySnapshots.length >= 5) {
        const recentGrowth = memorySnapshots.slice(-5)
        const growthRate = (recentGrowth[4].usedJSHeapSize - recentGrowth[0].usedJSHeapSize) / recentGrowth[0].usedJSHeapSize
        
        if (growthRate > 0.2) { // 20% 이상 증가
          console.warn('⚠️ 메모리 누수 가능성 감지:', {
            growthRate: `${(growthRate * 100).toFixed(1)}%`,
            currentUsage: `${(snapshot.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
          })
        }
      }
    }
  }
  
  const intervalId = setInterval(checkMemory, interval)
  
  return () => clearInterval(intervalId)
}

// 이벤트 리스너 자동 정리 훅
export const useAutoCleanup = (element, event, handler, deps = []) => {
  useEffect(() => {
    const targetElement = element?.current || element
    
    if (targetElement) {
      targetElement.addEventListener(event, handler)
      
      return () => {
        targetElement.removeEventListener(event, handler)
      }
    }
  }, [element, event, handler, ...deps])
}

// 타이머 자동 정리 훅
export const useCleanupTimer = () => {
  const timersRef = useRef(new Set())
  
  const setTimeout = (callback, delay) => {
    const timerId = window.setTimeout(() => {
      callback()
      timersRef.current.delete(timerId)
    }, delay)
    
    timersRef.current.add(timerId)
    return timerId
  }
  
  const setInterval = (callback, delay) => {
    const intervalId = window.setInterval(callback, delay)
    timersRef.current.add(intervalId)
    return intervalId
  }
  
  const clearTimer = (timerId) => {
    window.clearTimeout(timerId)
    window.clearInterval(timerId)
    timersRef.current.delete(timerId)
  }
  
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 모든 타이머 정리
      timersRef.current.forEach(timerId => {
        window.clearTimeout(timerId)
        window.clearInterval(timerId)
      })
      timersRef.current.clear()
    }
  }, [])
  
  return { setTimeout, setInterval, clearTimer }
}

// 대용량 데이터 캐시 관리
export class DataCache {
  constructor(maxSize = 50 * 1024 * 1024) { // 50MB
    this.cache = new Map()
    this.maxSize = maxSize
    this.currentSize = 0
  }
  
  set(key, value) {
    const size = this.estimateSize(value)
    
    // 캐시 크기 초과 시 LRU 방식으로 제거
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value
      this.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      size,
      lastAccessed: Date.now()
    })
    
    this.currentSize += size
  }
  
  get(key) {
    const item = this.cache.get(key)
    if (item) {
      item.lastAccessed = Date.now()
      return item.value
    }
    return null
  }
  
  delete(key) {
    const item = this.cache.get(key)
    if (item) {
      this.currentSize -= item.size
      this.cache.delete(key)
    }
  }
  
  clear() {
    this.cache.clear()
    this.currentSize = 0
  }
  
  estimateSize(obj) {
    // 간단한 크기 추정 (실제로는 더 정교한 계산 필요)
    return JSON.stringify(obj).length * 2 // UTF-16
  }
  
  getStats() {
    return {
      entries: this.cache.size,
      currentSize: `${(this.currentSize / 1024 / 1024).toFixed(2)}MB`,
      maxSize: `${(this.maxSize / 1024 / 1024).toFixed(2)}MB`,
      usage: `${((this.currentSize / this.maxSize) * 100).toFixed(1)}%`
    }
  }
}

// 이미지 메모리 최적화
export const optimizeImageMemory = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const img = entry.target
      
      if (!entry.isIntersecting) {
        // 뷰포트 밖의 이미지는 낮은 해상도로 교체
        const lowResSrc = img.dataset.lowres
        if (lowResSrc && img.src !== lowResSrc) {
          img.dataset.highres = img.src
          img.src = lowResSrc
        }
      } else {
        // 뷰포트 내의 이미지는 고해상도로 복원
        const highResSrc = img.dataset.highres
        if (highResSrc && img.src !== highResSrc) {
          img.src = highResSrc
        }
      }
    })
  }, {
    rootMargin: '50px'
  })
  
  // 모든 이미지에 옵저버 적용
  document.querySelectorAll('img[data-optimize]').forEach(img => {
    observer.observe(img)
  })
  
  return observer
}

// WeakMap을 사용한 메모리 친화적 캐시
export const createWeakCache = () => {
  const cache = new WeakMap()
  
  return {
    set: (key, value) => {
      if (typeof key === 'object' && key !== null) {
        cache.set(key, value)
      }
    },
    
    get: (key) => {
      return cache.get(key)
    },
    
    has: (key) => {
      return cache.has(key)
    },
    
    delete: (key) => {
      return cache.delete(key)
    }
  }
}

// 컴포넌트 언마운트 시 정리 작업
export const useCleanupOnUnmount = (cleanupFn) => {
  const cleanupRef = useRef(cleanupFn)
  cleanupRef.current = cleanupFn
  
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])
}

// 메모리 사용량 모니터링 훅
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState(null)
  
  useEffect(() => {
    if (!performance.memory) {
      return
    }
    
    const updateMemoryInfo = () => {
      setMemoryInfo({
        used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
        usage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)
      })
    }
    
    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return memoryInfo
}

export default {
  detectMemoryLeaks,
  useAutoCleanup,
  useCleanupTimer,
  DataCache,
  optimizeImageMemory,
  createWeakCache,
  useCleanupOnUnmount,
  useMemoryMonitor
}