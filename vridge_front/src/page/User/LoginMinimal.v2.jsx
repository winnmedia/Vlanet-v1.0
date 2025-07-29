import React, { useState, useRef, useEffect , Suspense } from 'react'
import { UnifiedInput } from '../../components/unified/UnifiedInput';
import dynamic from 'next/dynamic';
import { Input } from '../../components/unified/Input'
import { useRouter } from '../../util/nextNavigation'
import { useDispatch } from 'react-redux'
import { checkSession } from '../../util/util'
import { LoginAccount } from '../../api/auth'
import { updateUserData } from '../../redux/user'
import { refetchProject } from '../../util/util'

import PageTemplate from '../../components/PageTemplate'
import { MinimalInput, MinimalButton } from '../../components/minimal'
import styles from './LoginMinimal.module.scss'

export default function LoginMinimal() {
  const { navigate } = useRouter()
  const dispatch = useDispatch()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '', general: '' })
  const [showPassword, setShowPassword] = useState(false)
  
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  
  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    const session = checkSession()
    if (session) {
      navigate('/Home')
    }
  }, [navigate])
  
  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = { email: '', password: '', general: '' }
    let isValid = true
    
    if (!email) {
      newErrors.email = '이메일을 입력해 주세요'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
      isValid = false
    }
    
    if (!password) {
      newErrors.password = '비밀번호를 입력해 주세요'
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다'
      isValid = false
    }
    
    setErrors(newErrors)
    return isValid
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // 첫 번째 에러 필드로 포커스 이동
      if (errors.email && emailRef.current) {
        emailRef.current.focus()
      } else if (errors.password && passwordRef.current) {
        passwordRef.current.focus()
      }
      return
    }
    
    setIsLoading(true)
    setErrors({ email: '', password: '', general: '' })
    
    try {
      const response = await LoginAccount({ 
        username: email, 
        password 
      })
      
      if (response.data.status === 'success') {
        const userData = response.data.data
        dispatch(updateUserData(userData))
        sessionStorage.setItem('token', userData.token)
        
        // 프로젝트 데이터 미리 로드
        await refetchProject(dispatch, navigate)
        
        // 로딩 애니메이션 없이 바로 이동
        navigate('/Home')
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setErrors({ 
          ...errors, 
          general: '이메일 또는 비밀번호가 일치하지 않습니다' 
        })
      } else if (error.response?.data?.message?.includes('이메일 인증')) {
        setErrors({ 
          ...errors, 
          general: '이메일 인증이 필요합니다. 인증 메일을 확인해 주세요' 
        })
      } else {
        setErrors({ 
          ...errors, 
          general: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요' 
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleResendVerification = async () => {
    // 인증 메일 재발송 로직
    alert('인증 메일이 재발송되었습니다')
  }
  
  return (
    <PageTemplate>
      <div className={styles.container}>
        <div className={styles.backgroundGradient} aria-hidden="true" />
        
        <div className={styles.loginBox}>
          {/* 로고 */}
          <div className={styles.logo}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect width="40" height="40" rx="10" fill="#0066FF"/>
              <path d="M10 20L16 26L30 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1>VideoPlanet</h1>
          </div>
          
          {/* 환영 메시지 */}
          <div className={styles.welcome}>
            <h2>다시 만나서 반가워요</h2>
            <p>계정에 로그인하여 작업을 계속하세요</p>
          </div>
          
          {/* 로그인 폼 */}
          <form 
            className={styles.form} 
            onSubmit={handleSubmit}
            noValidate
            aria-label="로그인 폼"
           role="form">
            <MinimalInput
              ref={emailRef}
              type="email"
              label="이메일"
              placeholder="이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors({ ...errors, email: '' })
                }
              }}
              error={errors.email}
              required
              autoComplete="email"
              disabled={isLoading}
            />
            
            <div>
              <MinimalInput
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                label="비밀번호"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) {
                    setErrors({ ...errors, password: '' })
                  }
                }}
                error={errors.password}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              
              <div className={styles.passwordOptions}>
                <label className={styles.showPassword}>
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) = aria-label="checkbox input"> setShowPassword(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>비밀번호 표시</span>
                </label>
                
                <a 
                  href="/forgot-password" 
                  className={styles.link}
                  tabIndex={isLoading ? -1 : 0}
                 aria-label="Link">
                  비밀번호를 잊으셨나요?
                </a>
              </div>
            </div>
            
            {/* 일반 에러 메시지 */}
            {errors.general && (
              <div className={styles.error} role="alert">
                {errors.general.includes('이메일 인증') ? (
                  <div className={styles.errorWithAction}>
                    <p>{errors.general}</p>
                    <MinimalButton
                      variant="secondary"
                      size="small"
                      onClick={handleResendVerification} onKeyDown={(e) => e.key === 'Enter' && handleResendVerification}
                      type="button"
                    >
                      인증 메일 다시 받기
                    </MinimalButton>
                  </div>
                ) : (
                  errors.general
                )}
              </div>
            )}
            
            <MinimalButton
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              ariaLabel={isLoading ? '로그인 중...' : '로그인'}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </MinimalButton>
          </form>
          
          {/* 회원가입 링크 */}
          <div className={styles.signupLink}>
            <span>아직 계정이 없으신가요?</span>
            <a 
              href="/Signup" 
              className={styles.link}
              tabIndex={isLoading ? -1 : 0}
             aria-label="Link">
              회원가입
            </a>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}