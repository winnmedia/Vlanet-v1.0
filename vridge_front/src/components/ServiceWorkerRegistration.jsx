import { useEffect, useState } from 'react'
import { notification } from 'antd'
import cacheManager from '../utils/cacheManager'

const ServiceWorkerRegistration = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [cacheStatus, setCacheStatus] = useState('loading')

  useEffect(() => {
    // 개발 환경에서도 Service Worker 등록 (캐싱 테스트 목적)
    const shouldRegisterSW = 'serviceWorker' in navigator && 
      (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development')

    if (shouldRegisterSW) {
      window.addEventListener('load', registerServiceWorker)
    }

    // 네트워크 상태 감지
    const handleOnline = () => {
      setIsOnline(true)
      console.log('[SW] Network online - processing offline queue')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[SW] Network offline - enabling offline mode')
      
      // 오프라인 알림
      notification.info({
        message: '오프라인 모드',
        description: '인터넷 연결이 끊어졌습니다. 캐시된 데이터를 사용합니다.',
        duration: 3,
        placement: 'topRight'
      })
    }

    // 초기 네트워크 상태 설정
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // 항상 최신 SW 파일 확인
      })
      
      console.log('[SW] Registration successful:', registration.scope)
      setCacheStatus('active')
      
      // Service Worker 메시지 수신 설정
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
      
      // 업데이트 확인
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        console.log('[SW] Update found, installing new version')
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // 새 버전 알림 (개선된 UI)
                showUpdateNotification(() => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                })
              } else {
                console.log('[SW] Content is cached for offline use.')
                notification.success({
                  message: '캐시 준비 완료',
                  description: '오프라인에서도 앱을 사용할 수 있습니다.',
                  duration: 3,
                  placement: 'topRight'
                })
              }
            }
          })
        }
      })

      // Service Worker 제어권 변경 감지
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading page')
        window.location.reload()
      })
      
      // 주기적 업데이트 확인 (5분마다로 변경)
      setInterval(() => {
        registration.update()
      }, 5 * 60 * 1000)

      // 캐시 통계 초기 로딩
      updateCacheStats()
      
    } catch (error) {
      console.error('[SW] Registration failed:', error)
      setCacheStatus('error')
      
      // 등록 실패 알림
      notification.error({
        message: '캐싱 기능 오류',
        description: 'Service Worker 등록에 실패했습니다. 일부 오프라인 기능이 제한될 수 있습니다.',
        duration: 5,
        placement: 'topRight'
      })
    }
  }

  const handleServiceWorkerMessage = (event) => {
    const { type, data } = event.data || {}
    
    switch (type) {
      case 'NETWORK_ONLINE':
        setIsOnline(true)
        notification.success({
          message: '온라인 복구',
          description: '인터넷 연결이 복구되었습니다.',
          duration: 2,
          placement: 'topRight'
        })
        break
        
      case 'NETWORK_OFFLINE':
        setIsOnline(false)
        break
        
      case 'CACHE_UPDATED':
        updateCacheStats()
        break
        
      default:
        console.log('[SW] Unknown message type:', type)
    }
  }

  const showUpdateNotification = (onUpdate) => {
    const key = 'sw-update'
    
    notification.info({
      key,
      message: '새 버전 사용 가능',
      description: (
        <div>
          <p>VideoPlanet의 새로운 버전이 준비되었습니다.</p>
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => {
                notification.close(key)
                onUpdate()
              }}
              style={{
                background: '#1631F8',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              업데이트
            </button>
            <button
              onClick={() => notification.close(key)}
              style={{
                background: 'transparent',
                color: '#666',
                border: '1px solid #d9d9d9',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              나중에
            </button>
          </div>
        </div>
      ),
      duration: 0, // 수동으로 닫을 때까지 유지
      placement: 'topRight'
    })
  }

  const updateCacheStats = async () => {
    try {
      const stats = await cacheManager.getCacheInfo()
      console.log('[SW] Cache stats updated:', stats)
    } catch (error) {
      console.error('[SW] Failed to update cache stats:', error)
    }
  }

  // 개발 환경에서 캐시 관리 도구 표시
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const showCacheDevTools = () => {
        console.log('=== VideoPlanet Cache Dev Tools ===')
        console.log('cacheManager.getCacheInfo() - 캐시 정보 조회')
        console.log('cacheManager.invalidateCache(pattern) - 캐시 무효화')
        console.log('cacheManager.getCacheStats() - 캐시 통계')
        console.log('cacheManager.clearCache() - 전체 캐시 삭제')
        console.log('======================================')
        
        // 전역 객체에 캐시 매니저 노출 (개발용)
        window.cacheManager = cacheManager
      }
      
      setTimeout(showCacheDevTools, 2000)
    }
  }, [])

  return (
    <>
      {/* 개발 환경에서만 캐시 상태 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: isOnline ? '#52c41a' : '#f5222d',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 10000,
            opacity: 0.8
          }}
        >
          {isOnline ? '온라인' : '오프라인'} | SW: {cacheStatus}
        </div>
      )}
    </>
  )
}

export default ServiceWorkerRegistration