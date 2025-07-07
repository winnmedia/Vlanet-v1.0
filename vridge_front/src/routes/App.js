import './App.scss'
import 'Common.scss'
import AppRoute from './AppRoute'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { refetchProject, checkSession } from 'util/util'
import { useNavigate, useLocation } from 'react-router-dom'
import { updateBaseURL } from 'config/axios'
import { setupMobileConfig } from 'config/mobile-config'
import { enhanceMobileExperience } from 'utils/mobile-utils'

import { GoogleOAuthProvider } from '@react-oauth/google'

export default function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const isProjectListLoaded = useRef(false)
  const { project_list } = useSelector((s) => s.ProjectStore || {})
  
  // 프론트엔드 확인용 콘솔
  console.log('[VideoPlanet Frontend] App loaded at:', new Date().toISOString())
  
  useEffect(() => {
    // 모바일 환경 설정
    setupMobileConfig()
    
    // 모바일 최적화 (기존 기능에 영향 없음)
    enhanceMobileExperience()
    
    // 프로덕션 환경에서 API URL 강제 설정
    const isProduction = window.location.hostname === 'vlanet.net' || 
                         window.location.hostname === 'www.vlanet.net' ||
                         window.location.hostname.includes('vercel.app')
    
    if (isProduction) {
      updateBaseURL('https://videoplanet.up.railway.app')
      console.log('[App] Production environment detected, API URL set to:', 'https://videoplanet.up.railway.app')
    }
    
    // 프로덕션 도메인이 설정되어 있고, 현재 도메인이 다른 경우 리다이렉트
    const productionDomain = process.env.REACT_APP_PRODUCTION_DOMAIN
    if (productionDomain && 
        window.location.hostname !== productionDomain && 
        window.location.hostname !== `www.${productionDomain}` &&
        window.location.hostname !== 'localhost') {
      console.log(`[App] Redirecting to ${productionDomain}`)
      window.location.replace(`https://${productionDomain}` + window.location.pathname + window.location.search)
      return
    }
    
    // 프로젝트 목록 로드
    const session = checkSession()
    
    // 로그인 페이지나 랜딩 페이지가 아니고, 세션이 있는 경우
    if (session && pathname !== '/Login' && pathname !== '/' && pathname !== '/Signup') {
      console.log('[App] Checking if project list needs loading')
      // Redux store가 비어있거나 아직 로드하지 않은 경우
      if (!project_list || project_list.length === 0) {
        console.log('[App] Loading project list')
        refetchProject(dispatch, navigate).then(() => {
          console.log('[App] Project list loaded successfully')
        }).catch(err => {
          console.error('[App] Failed to load project list:', err)
          // 에러가 발생해도 페이지는 표시
        })
      } else {
        console.log('[App] Project list already exists:', {
          projectListLength: project_list?.length || 0,
          projectIds: project_list.map(p => p.id).slice(0, 10)
        })
        
        // 페이지 이동 시마다 프로젝트 목록 갱신 (필요한 경우)
        if (pathname.includes('/Feedback/') || pathname.includes('/ProjectView/')) {
          console.log('[App] Refreshing project list for detail page')
          refetchProject(dispatch, navigate).catch(err => {
            console.error('[App] Background refresh failed:', err)
          })
        }
      }
    } else {
      console.log('[App] Skipping project list load - not logged in or on auth page')
    }
  }, [pathname, dispatch, navigate]) // 경로 변경 시 프로젝트 목록 확인
  
  return (
    <div className="App">
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <AppRoute />
      </GoogleOAuthProvider>
    </div>
  )
}
