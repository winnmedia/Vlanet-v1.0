import { create } from 'zustand'

// 네비게이션 플로우 정의
const NAVIGATION_FLOWS = {
  // 프로젝트 초대 플로우
  invitation: {
    name: '프로젝트 초대',
    steps: [
      { 
        path: '/invitation/:token', 
        name: '초대 확인',
        nextPaths: {
          accept_loggedIn: '/Feedback/:projectId',
          accept_notLoggedIn: '/signup',
          decline: '/'
        }
      },
      { 
        path: '/signup', 
        name: '회원가입',
        nextPaths: {
          success: '/Feedback/:projectId',
          cancel: '/'
        }
      },
      { 
        path: '/Feedback/:projectId', 
        name: '피드백 페이지',
        nextPaths: {
          complete: '/ProjectView/:projectId',
          error: '/CmsHome'
        }
      }
    ],
    errorRedirect: '/CmsHome',
    fallback: '/'
  },
  
  // 프로젝트 생성 플로우
  projectCreate: {
    name: '프로젝트 생성',
    steps: [
      { 
        path: '/ProjectCreate', 
        name: '프로젝트 생성',
        nextPaths: {
          success: '/ProjectView/:projectId',
          cancel: '/CmsHome'
        }
      },
      { 
        path: '/ProjectView/:projectId', 
        name: '프로젝트 상세',
        nextPaths: {
          edit: '/ProjectEdit/:projectId',
          feedback: '/Feedback/:projectId',
          back: '/CmsHome'
        }
      }
    ],
    errorRedirect: '/CmsHome',
    fallback: '/CmsHome'
  },
  
  // 프로젝트 편집 플로우
  projectEdit: {
    name: '프로젝트 편집',
    steps: [
      { 
        path: '/ProjectEdit/:projectId', 
        name: '프로젝트 편집',
        nextPaths: {
          save: '/ProjectView/:projectId',
          cancel: '/ProjectView/:projectId'
        }
      }
    ],
    errorRedirect: '/CmsHome',
    fallback: '/ProjectView/:projectId'
  },
  
  // 피드백 플로우
  feedback: {
    name: '피드백',
    steps: [
      { 
        path: '/Feedback/:projectId', 
        name: '피드백 페이지',
        nextPaths: {
          back: '/ProjectView/:projectId',
          home: '/CmsHome'
        }
      }
    ],
    errorRedirect: '/CmsHome',
    fallback: '/CmsHome'
  }
}

// 404 에러 시 리다이렉트 맵
const ERROR_REDIRECTS = {
  '/Feedback/:projectId': '/CmsHome',
  '/ProjectView/:projectId': '/CmsHome',
  '/ProjectEdit/:projectId': '/CmsHome',
  '/invitation/:token': '/',
  '/invitation/:uid/:token': '/',
  default: '/'
}

export const useNavigationStore = create((set, get) => ({
  // 현재 플로우 정보
  currentFlow: null,
  currentStep: 0,
  flowData: {},
  
  // 네비게이션 히스토리
  navigationHistory: [],
  
  // 플로우 시작
  startFlow: (flowName, data = {}) => {
    const flow = NAVIGATION_FLOWS[flowName]
    if (!flow) {
      console.error(`Unknown flow: ${flowName}`)
      return false
    }
    
    set({
      currentFlow: flowName,
      currentStep: 0,
      flowData: data
    })
    
    console.log(`[Navigation] Starting flow: ${flowName}`, data)
    return true
  },
  
  // 플로우 데이터 업데이트
  updateFlowData: (data) => {
    set(state => ({
      flowData: { ...state.flowData, ...data }
    }))
  },
  
  // 다음 경로 가져오기
  getNextPath: (action = 'success', params = {}) => {
    const state = get()
    const flow = NAVIGATION_FLOWS[state.currentFlow]
    
    if (!flow) {
      console.warn('[Navigation] No active flow')
      return null
    }
    
    const currentStepConfig = flow.steps[state.currentStep]
    if (!currentStepConfig) {
      console.warn('[Navigation] Invalid step index')
      return flow.fallback
    }
    
    // 다음 경로 결정
    let nextPath = currentStepConfig.nextPaths?.[action] || flow.fallback
    
    // 파라미터 치환
    const allParams = { ...state.flowData, ...params }
    Object.keys(allParams).forEach(key => {
      nextPath = nextPath.replace(`:${key}`, allParams[key])
    })
    
    console.log(`[Navigation] Next path: ${nextPath}`)
    return nextPath
  },
  
  // 404 에러 처리
  handle404Error: (currentPath) => {
    console.error(`[Navigation] 404 error on: ${currentPath}`)
    
    // 에러 리다이렉트 맵에서 찾기
    for (const [pattern, redirect] of Object.entries(ERROR_REDIRECTS)) {
      if (pattern === 'default') continue
      
      // 패턴 매칭 (간단한 구현)
      const regex = new RegExp(pattern.replace(/:[^/]+/g, '[^/]+'))
      if (regex.test(currentPath)) {
        console.log(`[Navigation] Redirecting to: ${redirect}`)
        return redirect
      }
    }
    
    // 기본 리다이렉트
    console.log(`[Navigation] Using default redirect: ${ERROR_REDIRECTS.default}`)
    return ERROR_REDIRECTS.default
  },
  
  // 안전한 네비게이션
  safeNavigate: (navigate, targetPath, params = {}) => {
    const { navigationHistory } = get()
    
    // 파라미터 치환
    let finalPath = targetPath
    Object.keys(params).forEach(key => {
      finalPath = finalPath.replace(`:${key}`, params[key])
    })
    
    // 히스토리에 추가
    set(state => ({
      navigationHistory: [...state.navigationHistory, finalPath].slice(-10) // 최근 10개만 유지
    }))
    
    console.log(`[Navigation] Navigating to: ${finalPath}`)
    
    // 실제 네비게이션
    try {
      navigate(finalPath)
      return true
    } catch (error) {
      console.error('[Navigation] Navigation error:', error)
      return false
    }
  },
  
  // 이전 페이지로 안전하게 이동
  safeGoBack: (navigate, fallback = '/CmsHome') => {
    const { navigationHistory } = get()
    
    if (navigationHistory.length > 1) {
      const previousPath = navigationHistory[navigationHistory.length - 2]
      console.log(`[Navigation] Going back to: ${previousPath}`)
      navigate(previousPath)
    } else {
      console.log(`[Navigation] No history, using fallback: ${fallback}`)
      navigate(fallback)
    }
  },
  
  // 플로우 종료
  endFlow: () => {
    set({
      currentFlow: null,
      currentStep: 0,
      flowData: {}
    })
    console.log('[Navigation] Flow ended')
  },
  
  // 디버그 정보
  getDebugInfo: () => {
    const state = get()
    return {
      currentFlow: state.currentFlow,
      currentStep: state.currentStep,
      flowData: state.flowData,
      history: state.navigationHistory
    }
  }
}))

// 헬퍼 함수들
export const matchPath = (pattern, path) => {
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$')
  return regex.test(path)
}

export const extractParams = (pattern, path) => {
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$')
  const match = path.match(regex)
  
  if (!match) return {}
  
  const params = {}
  const paramNames = pattern.match(/:[^/]+/g) || []
  
  paramNames.forEach((param, index) => {
    const paramName = param.substring(1)
    params[paramName] = match[index + 1]
  })
  
  return params
}