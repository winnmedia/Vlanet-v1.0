import { renderHook, act } from '@testing-library/react'
import {
  measureComponentPerformance,
  debounce,
  throttle,
  useIntersectionObserver,
  useLazyLoadImage,
  useIsMounted,
  useWebWorker
} from '../performance'

// Mock performance API
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn(() => [{ duration: 123.45 }])
}

global.performance = mockPerformance

describe('performance utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('measureComponentPerformance', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('measures performance in development mode', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const cleanup = measureComponentPerformance('TestComponent')
      
      expect(mockPerformance.mark).toHaveBeenCalledWith('TestComponent-start')
      
      cleanup()
      
      expect(mockPerformance.mark).toHaveBeenCalledWith('TestComponent-end')
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'TestComponent',
        'TestComponent-start',
        'TestComponent-end'
      )
      expect(consoleSpy).toHaveBeenCalledWith('⚡ TestComponent rendered in 123.45ms')
      
      consoleSpy.mockRestore()
    })

    it('does nothing in production mode', () => {
      process.env.NODE_ENV = 'production'
      
      const cleanup = measureComponentPerformance('TestComponent')
      
      expect(mockPerformance.mark).not.toHaveBeenCalled()
      
      cleanup()
      
      expect(mockPerformance.measure).not.toHaveBeenCalled()
    })
  })

  describe('debounce', () => {
    it('delays function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 1000)
      
      debouncedFn('arg1', 'arg2')
      expect(mockFn).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(500)
      expect(mockFn).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(500)
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('resets timer on subsequent calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 1000)
      
      debouncedFn('first')
      jest.advanceTimersByTime(500)
      
      debouncedFn('second')
      jest.advanceTimersByTime(500)
      
      expect(mockFn).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(500)
      expect(mockFn).toHaveBeenCalledWith('second')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('cancels pending execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 1000)
      
      debouncedFn('test')
      debouncedFn.cancel()
      
      jest.advanceTimersByTime(1000)
      expect(mockFn).not.toHaveBeenCalled()
    })

    it('flushes pending execution immediately', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 1000)
      
      debouncedFn('test')
      debouncedFn.flush()
      
      expect(mockFn).toHaveBeenCalledWith('test')
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      jest.advanceTimersByTime(1000)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('limits function execution frequency', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 1000)
      
      // First call executes immediately
      throttledFn('first')
      expect(mockFn).toHaveBeenCalledWith('first')
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      // Subsequent calls are throttled
      throttledFn('second')
      throttledFn('third')
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      // After throttle period, last call executes
      jest.advanceTimersByTime(1000)
      expect(mockFn).toHaveBeenCalledWith('third')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('cancels throttled execution', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 1000)
      
      throttledFn('first')
      throttledFn('second')
      throttledFn.cancel()
      
      jest.advanceTimersByTime(1000)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('useIntersectionObserver', () => {
    let mockObserve: jest.Mock
    let mockUnobserve: jest.Mock
    let mockDisconnect: jest.Mock
    let mockIntersectionObserver: jest.Mock

    beforeEach(() => {
      mockObserve = jest.fn()
      mockUnobserve = jest.fn()
      mockDisconnect = jest.fn()
      
      mockIntersectionObserver = jest.fn((callback, options) => ({
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
        trigger: (entries: any[]) => callback(entries)
      }))
      
      global.IntersectionObserver = mockIntersectionObserver as any
    })

    it('observes target element when enabled', () => {
      const onIntersect = jest.fn()
      const target = { current: document.createElement('div') }
      
      renderHook(() => useIntersectionObserver({
        target,
        onIntersect,
        threshold: 0.5,
        rootMargin: '10px'
      }))
      
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          root: null,
          rootMargin: '10px',
          threshold: 0.5
        }
      )
      expect(mockObserve).toHaveBeenCalledWith(target.current)
    })

    it('does not observe when disabled', () => {
      const onIntersect = jest.fn()
      const target = { current: document.createElement('div') }
      
      renderHook(() => useIntersectionObserver({
        target,
        onIntersect,
        enabled: false
      }))
      
      expect(mockIntersectionObserver).not.toHaveBeenCalled()
      expect(mockObserve).not.toHaveBeenCalled()
    })

    it('calls onIntersect when element intersects', () => {
      const onIntersect = jest.fn()
      const target = { current: document.createElement('div') }
      let triggerIntersection: (entries: any[]) => void
      
      mockIntersectionObserver.mockImplementation((callback) => {
        triggerIntersection = callback
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect
        }
      })
      
      renderHook(() => useIntersectionObserver({
        target,
        onIntersect
      }))
      
      // Simulate intersection
      act(() => {
        triggerIntersection([{ isIntersecting: true }])
      })
      
      expect(onIntersect).toHaveBeenCalled()
    })

    it('cleans up observer on unmount', () => {
      const onIntersect = jest.fn()
      const target = { current: document.createElement('div') }
      
      const { unmount } = renderHook(() => useIntersectionObserver({
        target,
        onIntersect
      }))
      
      unmount()
      
      expect(mockUnobserve).toHaveBeenCalledWith(target.current)
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('useLazyLoadImage', () => {
    it('returns placeholder initially', () => {
      const { result } = renderHook(() => 
        useLazyLoadImage('https://example.com/image.jpg', 'placeholder.jpg')
      )
      
      expect(result.current[0]).toBe('placeholder.jpg')
    })

    it('returns empty string when no placeholder', () => {
      const { result } = renderHook(() => 
        useLazyLoadImage('https://example.com/image.jpg')
      )
      
      expect(result.current[0]).toBe('')
    })

    it('provides ref setter function', () => {
      const { result } = renderHook(() => 
        useLazyLoadImage('https://example.com/image.jpg')
      )
      
      const element = document.createElement('img')
      act(() => {
        result.current[1](element)
      })
      
      // Ref setter should work without errors
      expect(result.current[1]).toBeInstanceOf(Function)
    })
  })

  describe('useIsMounted', () => {
    it('returns true when mounted', () => {
      const { result } = renderHook(() => useIsMounted())
      
      expect(result.current()).toBe(true)
    })

    it('returns false after unmount', () => {
      const { result, unmount } = renderHook(() => useIsMounted())
      
      const isMounted = result.current
      unmount()
      
      expect(isMounted()).toBe(false)
    })
  })

  describe('useWebWorker', () => {
    let mockWorker: any

    beforeEach(() => {
      mockWorker = {
        postMessage: jest.fn(),
        terminate: jest.fn(),
        onmessage: null,
        onerror: null
      }
      
      global.Worker = jest.fn(() => mockWorker) as any
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    })

    it('initializes with null result and no loading', () => {
      const workerFn = () => {
        // Worker function
      }
      
      const { result } = renderHook(() => useWebWorker(workerFn))
      
      expect(result.current.result).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('runs worker and updates result', () => {
      const workerFn = () => {
        // Worker function
      }
      
      const { result } = renderHook(() => useWebWorker(workerFn))
      
      act(() => {
        result.current.run({ input: 'test' })
      })
      
      expect(result.current.loading).toBe(true)
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ input: 'test' })
      
      // Simulate worker response
      act(() => {
        mockWorker.onmessage({ data: { output: 'result' } })
      })
      
      expect(result.current.result).toEqual({ output: 'result' })
      expect(result.current.loading).toBe(false)
      expect(mockWorker.terminate).toHaveBeenCalled()
    })

    it('handles worker errors', () => {
      const workerFn = () => {
        // Worker function
      }
      
      const { result } = renderHook(() => useWebWorker(workerFn))
      
      act(() => {
        result.current.run({})
      })
      
      // Simulate worker error
      act(() => {
        mockWorker.onerror({ message: 'Worker error' })
      })
      
      expect(result.current.error).toEqual(new Error('Worker error'))
      expect(result.current.loading).toBe(false)
      expect(mockWorker.terminate).toHaveBeenCalled()
    })

    it('terminates worker on unmount', () => {
      const workerFn = () => {
        // Worker function
      }
      
      const { result, unmount } = renderHook(() => useWebWorker(workerFn))
      
      act(() => {
        result.current.run({})
      })
      
      unmount()
      
      expect(mockWorker.terminate).toHaveBeenCalled()
    })
  })
})