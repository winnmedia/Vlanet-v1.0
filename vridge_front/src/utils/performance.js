import { useEffect, useState, useCallback, useRef } from 'react'
// import 제거 - JavaScript 변환

// 성능 측정 유틸리티
export const measureComponentPerformance = (componentName) => {
  if (process.env.NODE_ENV === 'development') {
    const startMark = `${componentName}-start`
    const endMark = `${componentName}-end`
    
    performance.mark(startMark)
    
    return () => {
      performance.mark(endMark)
      performance.measure(componentName, startMark, endMark)
      
      const measures = performance.getEntriesByName(componentName)
      const measure = measures[measures.length - 1] as PerformanceMeasure
      
      if (measure) {
        console.log(`⚡ ${componentName} rendered in ${measure.duration.toFixed(2)}ms`)
      }
      
      // 클린업
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
      performance.clearMeasures(componentName)
    }
  }
  
  return () => {} // 프로덕션에서는 아무것도 하지 않음
}

// 디바운스 유틸리티
export function debounce(func, wait) {
  let timeout = null
  let lastArgs = null
  
  const debounced = (...args) => {
    lastArgs = args
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs)
      }
      timeout = null
      lastArgs = null
    }, wait)
  }
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
      lastArgs = null
    }
  }
  
  debounced.flush = () => {
    if (timeout && lastArgs) {
      clearTimeout(timeout)
      func(...lastArgs)
      timeout = null
      lastArgs = null
    }
  }
  
  return debounced
}

// 쓰로틀 유틸리티
export function throttle(func, limit) {
  let inThrottle = false
  let lastArgs = null
  let lastResult
  
  const throttled = (...args) => {
    lastArgs = args
    
    if (!inThrottle) {
      lastResult = func(...args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
        if (lastArgs) {
          throttled(...lastArgs)
          lastArgs = null
        }
      }, limit)
    }
    
    return lastResult
  }
  
  throttled.cancel = () => {
    inThrottle = false
    lastArgs = null
  }
  
  return throttled
}

// 무한 스크롤을 위한 Intersection Observer 훅
export const useIntersectionObserver = ({
  target,
  onIntersect,
  threshold = 0.1,
  rootMargin = '0px',
  enabled = true,
  root = null
}) => {
  const onIntersectRef = useRef(onIntersect)
  onIntersectRef.current = onIntersect
  
  useEffect(() => {
    if (!enabled || !target?.current) {
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onIntersectRef.current()
          }
        })
      },
      {
        root,
        rootMargin,
        threshold,
      }
    )

    const element = target.current
    observer.observe(element)

    return () => {
      observer.unobserve(element)
      observer.disconnect()
    }
  }, [target, enabled, threshold, rootMargin, root])
}

// 이미지 레이지 로딩 훅
export const useLazyLoadImage = (src, placeholder) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [imageRef, setImageRef] = useState(null)

  const onIntersect = useCallback(() => {
    if (src) {
      const img = new Image()
      img.src = src
      img.onload = () => {
        setImageSrc(src)
      }
    }
  }, [src])

  useIntersectionObserver({
    target: { current: imageRef },
    onIntersect,
    threshold: 0.01,
    rootMargin: '100px',
  })

  return [imageSrc, setImageRef]
}

// 메모리 누수 방지를 위한 언마운트 체크 훅
export const useIsMounted = () => {
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return useCallback(() => isMounted.current, [])
}

// 비용이 큰 계산을 위한 웹 워커 훅
// interface 제거 - JavaScript 변환

export const useWebWorker = (workerFunction) => {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const workerRef = useRef(null)

  const run = useCallback((data) => {
    setLoading(true)
    setError(null)

    const workerCode = `(${workerFunction.toString()})()`
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob))
    
    workerRef.current = worker

    worker.onmessage = (e) => {
      setResult(e.data)
      setLoading(false)
      worker.terminate()
    }

    worker.onerror = (e) => {
      setError(new Error(e.message))
      setLoading(false)
      worker.terminate()
    }

    worker.postMessage(data)
  }, [workerFunction])

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  return { result, error, loading, run }
}