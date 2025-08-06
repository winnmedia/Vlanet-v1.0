import { useEffect } from 'react'

const PerformanceMonitor = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Core Web Vitals 측정
      const measureWebVitals = () => {
        // LCP (Largest Contentful Paint) 측정
        if ('getLCP' in window) {
          window.getLCP((lcp) => {
            console.log('[Performance] LCP:', lcp.value, 'ms')
            if (lcp.value > 2500) {
              console.warn('[Performance] LCP is poor (>2.5s)')
            }
          })
        }

        // FID (First Input Delay) 측정
        if ('getFID' in window) {
          window.getFID((fid) => {
            console.log('[Performance] FID:', fid.value, 'ms')
            if (fid.value > 100) {
              console.warn('[Performance] FID is poor (>100ms)')
            }
          })
        }

        // CLS (Cumulative Layout Shift) 측정
        if ('getCLS' in window) {
          window.getCLS((cls) => {
            console.log('[Performance] CLS:', cls.value)
            if (cls.value > 0.1) {
              console.warn('[Performance] CLS is poor (>0.1)')
            }
          })
        }

        // TTFB (Time to First Byte) 측정
        if ('getTTFB' in window) {
          window.getTTFB((ttfb) => {
            console.log('[Performance] TTFB:', ttfb.value, 'ms')
          })
        }

        // FCP (First Contentful Paint) 측정
        if ('getFCP' in window) {
          window.getFCP((fcp) => {
            console.log('[Performance] FCP:', fcp.value, 'ms')
          })
        }
      }

      // 페이지 로드 성능 측정
      const measureLoadPerformance = () => {
        const navigation = performance.getEntriesByType('navigation')[0]
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.connectEnd - navigation.secureConnectionStart,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            domComplete: navigation.domComplete - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart
          }

          console.log('[Performance] Load metrics:', metrics)

          // 성능 경고
          if (metrics.loadComplete > 3000) {
            console.warn('[Performance] Page load is slow (>3s)')
          }
        }
      }

      // 리소스 성능 측정
      const measureResourcePerformance = () => {
        const resources = performance.getEntriesByType('resource')
        const slowResources = resources.filter(resource => resource.duration > 1000)
        
        if (slowResources.length > 0) {
          console.warn('[Performance] Slow resources detected:', slowResources)
        }

        // 가장 큰 리소스 식별
        const largestResources = resources
          .filter(resource => resource.transferSize)
          .sort((a, b) => b.transferSize - a.transferSize)
          .slice(0, 5)

        console.log('[Performance] Largest resources:', largestResources)
      }

      // 메모리 사용량 측정 (Chrome)
      const measureMemoryUsage = () => {
        if ('memory' in performance) {
          const memory = performance.memory
          console.log('[Performance] Memory usage:', {
            used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
            total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
          })

          if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
            console.warn('[Performance] High memory usage detected')
          }
        }
      }

      // 측정 실행
      setTimeout(() => {
        measureLoadPerformance()
        measureResourcePerformance()
        measureMemoryUsage()
      }, 1000)

      // Web Vitals는 라이브러리 로드 후 실행
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js'
      script.onload = measureWebVitals
      document.head.appendChild(script)

      // 정기적인 메모리 모니터링
      const memoryInterval = setInterval(measureMemoryUsage, 30000)

      return () => {
        clearInterval(memoryInterval)
      }
    }
  }, [])

  // 개발 환경에서만 성능 정보 표시
  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          fontSize: '12px',
          borderRadius: '4px',
          zIndex: 10000,
          fontFamily: 'monospace'
        }}
      >
        Performance Monitor Active
      </div>
    )
  }

  return null
}

export default PerformanceMonitor