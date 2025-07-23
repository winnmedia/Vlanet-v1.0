import { useRouter, useLocation } from '../util/nextNavigation'
import { useNavigationStore } from 'store/navigationStore'
import { useEffect } from 'react'

export function useNavigationFlow() {
  const { navigate } = useRouter()
  const router = useRouter()
  
  const {
    startFlow,
    updateFlowData,
    getNextPath,
    handle404Error,
    safeNavigate,
    safeGoBack,
    endFlow,
    navigationHistory
  } = useNavigationStore()
  
  // 현재 경로를 히스토리에 추가
  useEffect(() => {
    useNavigationStore.setState(state => ({
      navigationHistory: [...state.navigationHistory, router.pathname].slice(-10)
    }))
  }, [router.pathname])
  
  // 404 에러 처리 함수
  const handleNotFound = (error = null) => {
    console.error('[useNavigationFlow] 404 error:', error)
    const redirectPath = handle404Error(router.pathname)
    navigate(redirectPath, { replace: true })
  }
  
  // 플로우 네비게이션
  const navigateInFlow = (action = 'success', params = {}) => {
    const nextPath = getNextPath(action, params)
    
    if (nextPath) {
      safeNavigate(navigate, nextPath, params)
      return true
    }
    
    console.warn('[useNavigationFlow] No next path found')
    return false
  }
  
  // 안전한 네비게이션 (404 처리 포함)
  const navigateSafely = async (path, params = {}, checkExistence = false) => {
    try {
      if (checkExistence) {
        // API 호출로 존재 여부 확인 (선택적)
        // 예: await checkResourceExists(path, params)
      }
      
      return safeNavigate(navigate, path, params)
    } catch (error) {
      if (error.response?.status === 404) {
        handleNotFound(error)
        return false
      }
      throw error
    }
  }
  
  // 뒤로가기
  const goBack = (fallback = '/CmsHome') => {
    safeGoBack(navigate, fallback)
  }
  
  return {
    // 플로우 관리
    startFlow,
    updateFlowData,
    navigateInFlow,
    endFlow,
    
    // 안전한 네비게이션
    navigateSafely,
    handleNotFound,
    goBack,
    
    // 유틸리티
    navigationHistory,
    currentPath: router.pathname
  }
}

// HOC for components that need flow navigation
export function withNavigationFlow(Component) {
  return function NavigationFlowComponent(props) {
    const navigationFlow = useNavigationFlow()
    
    return <Component {...props} navigationFlow={navigationFlow} />
  }
}