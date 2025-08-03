
import PageTemplate from 'components/PageTemplate'
import queryString from 'query-string'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useLocation } from '../../util/nextNavigation'
import { useDispatch } from 'react-redux'
import { SignIn, GoogleLoginAPI, GetUserInfo } from 'api/auth'
import { checkSession, refetchProject } from 'util/util'
import { safeStorage } from 'utils/mobile-utils'
import axios from 'axios'
import { showSuccess, showError, showInfo } from '../../components/Toast'

export default function Login() {
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const router = useRouter()
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
  const [resendingEmail, setResendingEmail] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
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
      typeof window !== 'undefined' && window.localStorage.setItem('VGID', jwt)
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
      typeof window !== 'undefined' && window.localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      // 사용자 정보 API 호출
      try {
        const userRes = await GetUserInfo();
        if (userRes.data) {
          const userInfo = {
            email: userRes.data.email || userRes.data.username,
            nickname: userRes.data.nickname
          };
          typeof window !== 'undefined' && window.localStorage.setItem('userInfo', JSON.stringify(userInfo));
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
      } else if (router.query?.returnUrl) {
        // 초대 수락을 위해 로그인한 경우
        console.log('Navigating to return URL:', router.query.returnUrl)
        navigate(router.query.returnUrl)
      } else {
        console.log('Navigating to CmsHome')
        navigate('/cmshome', { replace: true })
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load projects after login:', err)
        // Still navigate even if project loading fails
        navigate('/cmshome', { replace: true })
      }
    }
  }

  const CommonErrorMessage = (err) => {
    if (err.response && err.response.data && err.response.data.message) {
      showError(err.response.data.message)
    }
  }

  // 이메일 인증 메일 재발송 함수
  const resendVerificationEmail = async (email) => {
    if (resendingEmail) return
    
    setResendingEmail(true)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/resend-verification-email/`,
        { email }
      )
      
      if (response.data.success) {
        showSuccess('인증 메일이 재발송되었습니다. 이메일을 확인해주세요.')
        SetLoginMessage('')
      }
    } catch (err) {
      if (err.response?.data?.message) {
        SetLoginMessage(err.response.data.message)
      } else {
        SetLoginMessage('인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setResendingEmail(false)
    }
  }

  const handleLogin = () => {
    if (email.length > 0 && password.length > 0) {
      // 이미 로그인 중이면 중복 실행 방지
      if (isLoggingIn) {
        console.log('로그인이 이미 진행 중입니다.')
        return
      }
      
      // Cancel any previous login request
      if (loginController && loginController.abort) {
        loginController.abort()
      }
      
      const controller = new AbortController()
      setLoginController(controller)
      setIsLoggingIn(true)
      
      console.log('로그인 시도:', inputs)
      SignIn(inputs, { signal: controller.signal })
        .then((res) => {
          console.log('로그인 성공:', res)
          setLoginController(null)
          setIsLoggingIn(false)
          showSuccess('로그인에 성공했습니다!')
          CommonLoginSuccess(res.data.vridge_session, res.data)
        })
        .catch((err) => {
          setLoginController(null)
          setIsLoggingIn(false)
          if (err.name === 'AbortError') {
            // Request was aborted, do nothing
            return
          }
          console.error('Login error:', err)
          console.error('Error response:', err.response)
          
          if (err.response && err.response.data) {
            // 이메일 미인증 에러 처리
            if (err.response.status === 403 && err.response.data.error_code === 'EMAIL_NOT_VERIFIED') {
              SetLoginMessage(
                <div>
                  <p style={{ margin: '0 0 10px 0' }}>{err.response.data.message}</p>
                  <button 
                    onClick={() => resendVerificationEmail(err.response.data.email)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1631F8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    인증 메일 재발송
                  </button>
                </div>
              )
            } else if (err.response.data.message) {
              SetLoginMessage(err.response.data.message)
            } else {
              SetLoginMessage('이메일 또는 비밀번호가 일치하지 않습니다.')
            }
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
          {router.query?.message && (
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
                🎬 {router.query.message}
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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLogin()
              }
            }}
          />

          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            className="ty01 mt10"
            value={password}
            onChange={OnChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLogin()
              }
            }}
          />
          {login_message && <div className="error">{login_message}</div>}
          <div className="find_link tr" onClick={() => navigate('/resetpw')}>
            비밀번호 찾기
          </div>
          <button 
            className="submit mt20" 
            onClick={handleLogin} 
            type="button"
            disabled={isLoggingIn || !email || !password}
            style={{
              opacity: isLoggingIn || !email || !password ? 0.7 : 1,
              cursor: isLoggingIn || !email || !password ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoggingIn ? '로그인 중...' : '로그인'}
          </button>
          <div className="mt20 signup_link">
            브이래닛이 처음이신가요?{' '}
            <span onClick={() => navigate('/signup')}>간편 가입하기</span>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}
