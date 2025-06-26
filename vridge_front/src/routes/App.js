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
    // 최초 로드 시에만 프로젝트 데이터 로드
    const session = checkSession()
    if (session && pathname !== '/Login' && pathname !== '/') {
      refetchProject(dispatch, navigate)
    }
  }, [])
  
  return (
    <div className="App">
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <AppRoute />
      </GoogleOAuthProvider>
    </div>
  )
}
