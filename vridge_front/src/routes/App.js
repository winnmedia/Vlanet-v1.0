import './App.scss'
import 'Common.scss'
import AppRoute from './AppRoute'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { refetchProject, checkSession } from 'util/util'
import { useNavigate, useLocation } from 'react-router-dom'

import { GoogleOAuthProvider } from '@react-oauth/google'

export default function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  
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
    
    // 최초 로드 시에만 프로젝트 데이터 로드
    const session = checkSession()
    if (session && pathname !== '/Login' && pathname !== '/') {
      console.log('[App] Loading project list on initial mount')
      refetchProject(dispatch, navigate)
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
