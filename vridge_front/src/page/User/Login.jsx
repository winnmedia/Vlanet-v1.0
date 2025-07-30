
import PageTemplate from '../../components/PageTemplate'
import dynamic from 'next/dynamic';
import { UnifiedButton } from '../../components/unified/UnifiedButton';
import { Button } from '../../components/unified/Button';
import { Input } from '../../components/unified/Input';

import queryString from 'query-string'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useLocation } from '../../util/nextNavigation'
import { useDispatch } from 'react-redux'
import { SignIn, GoogleLoginAPI, GetUserInfo } from '../../api/auth'
import { checkSession, refetchProject } from '../../util/util'
import { safeStorage } from '../../utils/mobile-utils'
import axios from 'axios'

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
    // 보안: 토큰을 로깅하지 않음
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
      } catch (userErr) {}
    }
    
    // Create controller for refetchProject
    const controller = new AbortController()
    
    try {
      // refetchProject를 기다린 후 navigate
      // await refetchProject(dispatch, navigate, { signal: controller.signal })
      
      if (uid && token) {
        // 초대 링크 처리 페이지
        // Navigating to EmailCheck with uid and token
        navigate(`/EmailCheck?uid=${uid}&token=${token}`)
      } else if (router.query?.returnUrl) {
        // 초대 수락을 위해 로그인한 경우
        // Navigating to return URL
        navigate(router.query.returnUrl)
      } else {
        // Navigating to CmsHome
        navigate('/cmshome', { replace: true })
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Still navigate even if project loading fails
        navigate('/cmshome', { replace: true })
      }
    }
  }

  const CommonErrorMessage = (err) => {
    if (err.response && err.response.data && err.response.data.message) {
      window.alert(err.response.data.message)
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
        SetLoginMessage('인증 메일이 재발송되었습니다. 이메일을 확인해주세요.')
        setTimeout(() => SetLoginMessage(''), 5000)
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

  function Login() {
    if (email.length > 0 && password.length > 0) {
      // Cancel any previous login request
      if (loginController && loginController.abort) {
        loginController.abort()
      }
      
      const controller = new AbortController()
      setLoginController(controller)
      
      // 보안: 비밀번호가 포함된 객체를 로깅하지 않음
      // 로그인 시도
      SignIn(inputs, { signal: controller.signal })
        .then((res) => {
          // 로그인 성공
          setLoginController(null)
          CommonLoginSuccess(res.data.vridge_session, res.data)
        })
        .catch((err) => {
          setLoginController(null)
          if (err.name === 'AbortError') {
            // Request was aborted, do nothing
            return
          }
          if (err.response && err.response.data) {
            // 이메일 미인증 에러 처리
            if (err.response.status === 403 && err.response.data.error_code === 'EMAIL_NOT_VERIFIED') {
              SetLoginMessage(
                <div>
                  <p style={{ margin: '0 0 10px 0' }}>{err.response.data.message}</p>
                  <Button onClick={() => resendVerificationEmail(err.response.data.email)} onKeyDown={(e) => e.key === 'Enter' && resendVerificationEmail(err.response.data.email)}
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
                  </Button>
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
          <UnifiedInput placeholder="이메일" value={email} onChange={OnChange} name="email" aria-label="이메일" />

          <UnifiedInput placeholder="비밀번호" value={password} onChange={OnChange} name="password" type="password" aria-label="비밀번호" />
          {login_message && <div className="error">{login_message}</div>}
          <div className="find_link tr" onClick={() => navigate('/resetpw')} onKeyDown={(e) => e.key === 'Enter' && navigate('/resetpw')}>
            비밀번호 찾기
          </div>
          <Button 
            onClick={Login} 
            onKeyDown={(e) => { if (e.key === 'Enter') Login() }}
            aria-label="로그인"
          >
            로그인
          </Button>
          <div className="mt20 signup_link">
            브이래닛이 처음이신가요?{' '}
            <span onClick={() => navigate('/signup')} onKeyDown={(e) => e.key === 'Enter' && navigate('/signup')}>간편 가입하기</span>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}
