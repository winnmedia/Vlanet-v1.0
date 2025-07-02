import './App.scss'
import 'Common.scss'
import AppRoute from './AppRoute'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { refetchProject, checkSession } from 'util/util'
import { useNavigate, useLocation } from 'react-router-dom'

import { GoogleOAuthProvider } from '@react-oauth/google'

export default function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const isProjectListLoaded = useRef(false)
  const { project_list } = useSelector((s) => s.ProjectStore || {})
  
  useEffect(() => {
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
    
    // 최초 로드 시 프로젝트 목록 로드
    const session = checkSession()
    
    if (session && pathname !== '/Login' && pathname !== '/') {
      console.log('[App] Checking if project list needs loading')
      // Redux store가 비어있거나 아직 로드하지 않은 경우
      if (!project_list && !isProjectListLoaded.current) {
        console.log('[App] Loading project list for the first time')
        isProjectListLoaded.current = true
        refetchProject(dispatch, navigate).then(() => {
          console.log('[App] Project list loaded successfully')
        }).catch(err => {
          console.error('[App] Failed to load project list:', err)
          isProjectListLoaded.current = false // 실패 시 다시 시도할 수 있도록
        })
      } else {
        console.log('[App] Project list already exists or loading attempted:', {
          hasProjectList: !!project_list,
          projectListLength: project_list?.length || 0,
          isLoaded: isProjectListLoaded.current
        })
      }
    } else {
      console.log('[App] Skipping project list load - not logged in or on login page')
    }
  }, []) // 의도적으로 의존성 배열을 비워둠 (최초 1회만 실행)
  
  return (
    <div className="App">
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <AppRoute />
      </GoogleOAuthProvider>
    </div>
  )
}
