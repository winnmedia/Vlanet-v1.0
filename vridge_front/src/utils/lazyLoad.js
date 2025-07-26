import React, { lazy } from 'react'
import { CardSkeleton } from '../components/minimal'

// 로딩 컴포넌트
export const LoadingFallback = () => (
  <div style={{ padding: '20px' }}>
    <CardSkeleton />
  </div>
)

// 에러 폴백 컴포넌트
export const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div style={{ 
    padding: '20px', 
    textAlign: 'center',
    background: '#FFF3F3',
    border: '1px solid #FFDDDD',
    borderRadius: '8px'
  }}>
    <h3 style={{ color: '#FF3B30', marginBottom: '8px' }}>문제가 발생했습니다</h3>
    <p style={{ color: '#666', marginBottom: '16px' }}>
      {error?.message || '알 수 없는 오류가 발생했습니다'}
    </p>
    <button 
      onClick={resetErrorBoundary}
      style={{
        padding: '8px 16px',
        background: '#FF3B30',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      다시 시도
    </button>
  </div>
)

// 지연 로딩 래퍼
export const lazyLoadComponent = (importFunc, fallback = <LoadingFallback />) => {
  const LazyComponent = lazy(importFunc)
  
  return (props) => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

// 페이지별 지연 로딩 설정
export const LazyPages = {
  // CMS 페이지
  CmsHome: lazyLoadComponent(() => import('../page/Cms/CmsHomeMinimal.v2')),
  VideoPlanning: lazyLoadComponent(() => import('../page/Cms/VideoPlanningMinimal')),
  VideoList: lazyLoadComponent(() => import('../page/Cms/VideoList')),
  Feedback: lazyLoadComponent(() => import('../page/Cms/Feedback')),
  Project: lazyLoadComponent(() => import('../page/Cms/Project')),
  
  // User 페이지
  Login: lazyLoadComponent(() => import('../page/User/LoginMinimal.v2')),
  Signup: lazyLoadComponent(() => import('../page/User/Signup')),
  MyPage: lazyLoadComponent(() => import('../page/MyPage/MyPage')),
  
  // Admin 페이지
  AdminDashboard: lazyLoadComponent(() => import('../page/Admin/Dashboard'))
}

// 프리로드 함수
export const preloadComponent = (componentName) => {
  switch (componentName) {
    case 'CmsHome':
      import('../page/Cms/CmsHomeMinimal.v2')
      break
    case 'VideoPlanning':
      import('../page/Cms/VideoPlanningMinimal')
      break
    case 'Login':
      import('../page/User/LoginMinimal.v2')
      break
    // 필요한 다른 컴포넌트들 추가
  }
}

// 라우트 전환 시 다음 페이지 프리로드
export const preloadNextRoute = (currentRoute) => {
  // 일반적인 사용자 플로우에 따른 프리로드
  switch (currentRoute) {
    case '/Login':
      preloadComponent('CmsHome')
      break
    case '/Home':
      preloadComponent('VideoPlanning')
      preloadComponent('Project')
      break
    case '/Project/:id':
      preloadComponent('VideoList')
      preloadComponent('Feedback')
      break
  }
}