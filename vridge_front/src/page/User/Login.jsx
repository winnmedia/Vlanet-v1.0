import 'css/User/Auth.scss'
import PageTemplate from 'components/PageTemplate'
import queryString from 'query-string'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { SignIn, GoogleLoginAPI, GetUserInfo } from 'api/auth'
import { checkSession, refetchProject } from 'util/util'
import { safeStorage } from 'utils/mobile-utils'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const initial_input = {
    email: '',
    password: '',
  }
  const [inputs, set_inputs] = useState(initial_input)
  const { email, password } = inputs
  const [login_message, SetLoginMessage] = useState('')
  const [param] = useSearchParams()
  const { uid, token } = queryString.parse(param.toString())
  const [loginController, setLoginController] = useState(null)
  
  // Cleanup effect for any pending API requests
  useEffect(() => {
    return () => {
      if (loginController && loginController.abort) {
        loginController.abort()
      }
    }
  }, [])

  const OnChange = (e) => {
    const { value, name } = e.target
    set_inputs({
      ...inputs,
      [name]: value,
    })
  }

  useEffect(() => {
    const session = checkSession()
    if (session) {
      if (uid && token) {
        navigate(`/EmailCheck?uid=${uid}&token=${token}`)
      } else {
        navigate('/CmsHome')
      }
    }
  }, [])

  // Social login code removed

  const CommonLoginSuccess = async (jwt, userData = null) => {
    console.log('Login success, saving token:', jwt)
    // 모바일 환경을 고려한 안전한 토큰 저장
    try {
      window.localStorage.setItem('VGID', jwt)
    } catch (e) {
      // localStorage 접근 실패 시 safeStorage 사용
      safeStorage.setItem('VGID', jwt)
    }
    
    // 사용자 정보 저장 (로그인 응답에서 제공되면 사용, 그렇지 않으면 API 호출)
    if (userData) {
      const userInfo = {
        email: userData.user || userData.email,
        nickname: userData.nickname
      };
      window.localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      // 사용자 정보 API 호출
      try {
        const userRes = await GetUserInfo();
        if (userRes.data) {
          const userInfo = {
            email: userRes.data.email || userRes.data.username,
            nickname: userRes.data.nickname
          };
          window.localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
      } catch (userErr) {
        console.error('Failed to fetch user info:', userErr);
      }
    }
    
    // Create controller for refetchProject
    const controller = new AbortController()
    
    try {
      // refetchProject를 기다린 후 navigate
      console.log('[Login] Loading project list after successful login')
      await refetchProject(dispatch, navigate, { signal: controller.signal })
      
      if (uid && token) {
        // 초대 링크 처리 페이지
        console.log('Navigating to EmailCheck with uid and token')
        navigate(`/EmailCheck?uid=${uid}&token=${token}`)
      } else if (location.state?.returnUrl) {
        // 초대 수락을 위해 로그인한 경우
        console.log('Navigating to return URL:', location.state.returnUrl)
        navigate(location.state.returnUrl)
      } else {
        console.log('Navigating to CmsHome')
        navigate('/CmsHome', { replace: true })
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load projects after login:', err)
        // Still navigate even if project loading fails
        navigate('/CmsHome', { replace: true })
      }
    }
  }

  const CommonErrorMessage = (err) => {
    if (err.response && err.response.data && err.response.data.message) {
      window.alert(err.response.data.message)
    }
  }

  function Login() {
    if (email.length > 0 && password.length > 0) {
      // Cancel any previous login request
      if (loginController && loginController.abort) {
        loginController.abort()
      }
      
      const controller = new AbortController()
      setLoginController(controller)
      
      SignIn(inputs, { signal: controller.signal })
        .then((res) => {
          setLoginController(null)
          CommonLoginSuccess(res.data.vridge_session, res.data)
        })
        .catch((err) => {
          setLoginController(null)
          if (err.name === 'AbortError') {
            // Request was aborted, do nothing
            return
          }
          console.error('Login error:', err)
          console.error('Error response:', err.response)
          if (err.response && err.response.data && err.response.data.message) {
            SetLoginMessage(err.response.data.message)
          } else {
            SetLoginMessage('이메일 또는 비밀번호가 일치하지 않습니다.')
          }
        })
    } else {
      if (email.length === 0) SetLoginMessage('아이디를 입력해주세요.')
      else SetLoginMessage('비밀번호를 입력해주세요.')
    }
  }

  return (
    <PageTemplate auth={true} noLogin={true}>
      <div className="Auth_Form">
        <div className="form_wrap">
          <div className="title">로그인</div>
          
          {/* 초대 메시지 표시 */}
          {location.state?.message && (
            <div style={{
              background: 'linear-gradient(135deg, #E8EBFF 0%, #D1D8FF 100%)',
              border: '1px solid #1631F8',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '24px',
              marginBottom: '-20px',
              textAlign: 'center'
            }}>
              <p style={{
                margin: 0,
                color: '#1631F8',
                fontWeight: '600',
                fontSize: '15px'
              }}>
                🎬 {location.state.message}
              </p>
            </div>
          )}
          <input
            type="text"
            name="email"
            placeholder="이메일"
            className="ty01 mt50"
            value={email}
            onChange={OnChange}
          />

          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            className="ty01 mt10"
            value={password}
            onChange={OnChange}
          />
          {login_message && <div className="error">{login_message}</div>}
          <div className="find_link tr" onClick={() => navigate('/ResetPw')}>
            비밀번호 찾기
          </div>
          <button className="submit mt20" onClick={Login}>
            로그인
          </button>
          <div className="mt20 signup_link">
            브이래닛이 처음이신가요?{' '}
            <span onClick={() => navigate('/Signup')}>간편 가입하기</span>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}
