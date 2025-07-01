import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import 'css/User/Auth.scss'
import PageTemplate from 'components/PageTemplate'
import { SignUp, CheckNickname, SignUpRequest, SignUpVerify, SignUpComplete } from 'api/auth'

export default function Signup() {
  const navigate = useNavigate()
  const [errorMessage, SetErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState(false)
  const [nicknameMessage, setNicknameMessage] = useState('')
  const [emailChecked, setEmailChecked] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [authNumber, setAuthNumber] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [showAuthInput, setShowAuthInput] = useState(false)
  const [verifyingAuth, setVerifyingAuth] = useState(false)
  const [authCountdown, setAuthCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword1, setShowPassword1] = useState(false)
  
  const initial = {
    email: '',
    nickname: '',
    password: '',
    password1: '',
  }
  const [inputs, set_inputs] = useState(initial)
  const { email, nickname, password, password1 } = inputs

  // 비밀번호 강도 체크
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: '' };
    
    let strength = 0;
    if (password.length >= 10) strength++;
    if (password.length >= 14) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const levels = ['', '약함', '보통', '강함', '매우 강함'];
    const colors = ['', '#dc3545', '#ffc107', '#28a745', '#20c997'];
    
    return {
      level: Math.min(strength, 4),
      text: levels[Math.min(strength, 4)],
      color: colors[Math.min(strength, 4)]
    };
  }

  function onChange(e) {
    const { value, name } = e.target
    set_inputs({
      ...inputs,
      [name]: value,
    })
    
    // 이메일이 변경되면 인증 상태 초기화
    if (name === 'email') {
      setEmailChecked(false)
      setEmailAvailable(false)
      setEmailMessage('')
      setEmailVerified(false)
      setShowAuthInput(false)
      setAuthNumber('')
      setAuthToken('')
      setAuthCountdown(0)
    }
    
    // 닉네임이 변경되면 중복 확인 초기화
    if (name === 'nickname') {
      setNicknameChecked(false)
      setNicknameAvailable(false)
      setNicknameMessage('')
    }
    
    // 에러 메시지 초기화
    if (errorMessage) {
      SetErrorMessage('')
    }
  }

  function TimeoutMessage() {
    setTimeout(() => {
      SetErrorMessage('')
    }, 5000)
  }
  
  // 인증번호 카운트다운
  useEffect(() => {
    if (authCountdown > 0) {
      const timer = setTimeout(() => setAuthCountdown(authCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [authCountdown])
  
  // 이메일 인증 요청 함수
  function sendEmailAuth() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailMessage('올바른 이메일 형식이 아닙니다.');
      setEmailChecked(false)
      setEmailAvailable(false)
      return
    }
    
    setCheckingEmail(true)
    
    SignUpRequest(email)
      .then((res) => {
        if (res.data.status === 'email_sent') {
          setShowAuthInput(true)
          setAuthCountdown(180) // 3분 카운트다운
          setEmailMessage('인증번호가 이메일로 발송되었습니다.')
          setEmailAvailable(true)
        }
      })
      .catch((err) => {
        const status = err.response?.data?.status
        const message = err.response?.data?.message
        
        if (status === 'already_registered') {
          setEmailChecked(true)
          setEmailAvailable(false)
          setEmailMessage(message || '이미 가입된 이메일입니다.')
        } else if (status === 'rate_limited') {
          const remaining = err.response?.data?.remaining_seconds || 30
          setEmailMessage(`잠시 후 다시 시도해주세요. (${remaining}초)`)
          setAuthCountdown(remaining)
        } else {
          setEmailMessage(message || '이메일 인증 요청에 실패했습니다.')
        }
      })
      .finally(() => {
        setCheckingEmail(false)
      })
  }
  
  // 이메일 인증번호 확인 함수
  function verifyAuthNumber() {
    if (!authNumber || authNumber.length !== 6) {
      setEmailMessage('6자리 인증번호를 입력해주세요.')
      return
    }
    
    setVerifyingAuth(true)
    
    SignUpVerify({ email, auth_number: authNumber })
      .then((res) => {
        if (res.data.message === 'success') {
          setAuthToken(res.data.auth_token)
          setEmailVerified(true)
          setEmailChecked(true)
          setEmailMessage('이메일 인증이 완료되었습니다.')
          setShowAuthInput(false)
        }
      })
      .catch((err) => {
        const message = err.response?.data?.message || '인증번호가 올바르지 않습니다.'
        setEmailMessage(message)
      })
      .finally(() => {
        setVerifyingAuth(false)
      })
  }
  
  // 닉네임 중복 확인 함수
  function checkNicknameDuplicate() {
    if (nickname.length < 2) {
      setNicknameMessage('닉네임은 최소 2자 이상이어야 합니다.')
      setNicknameChecked(false)
      setNicknameAvailable(false)
      return
    }
    
    setCheckingNickname(true)
    
    CheckNickname(nickname)
      .then((res) => {
        setNicknameChecked(true)
        setNicknameAvailable(true)
        setNicknameMessage('사용 가능한 닉네임입니다.')
      })
      .catch((err) => {
        setNicknameChecked(true)
        setNicknameAvailable(false)
        if (err.response && err.response.status === 409) {
          setNicknameMessage('이미 사용 중인 닉네임입니다.')
        } else {
          setNicknameMessage('닉네임 확인 중 오류가 발생했습니다.')
        }
      })
      .finally(() => {
        setCheckingNickname(false)
      })
  }

  function handleSignUp(e) {
    e.preventDefault()
    
    // 이메일 검증
    if (!email) {
      SetErrorMessage('이메일을 입력해주세요.');
      TimeoutMessage();
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      SetErrorMessage('올바른 이메일 형식이 아닙니다.');
      TimeoutMessage();
      return;
    }
    
    // 이메일 인증 여부 검증
    if (!emailVerified) {
      SetErrorMessage('이메일 인증을 완료해주세요.');
      TimeoutMessage();
      return;
    }
    
    // 닉네임 검증
    if (!nickname) {
      SetErrorMessage('닉네임을 입력해주세요.');
      TimeoutMessage();
      return;
    }
    
    if (nickname.length < 2) {
      SetErrorMessage('닉네임은 최소 2자 이상 입력해주세요.');
      TimeoutMessage();
      return;
    }
    
    // 닉네임 중복 확인 여부 검증
    if (!nicknameChecked) {
      SetErrorMessage('닉네임 중복 확인을 해주세요.');
      TimeoutMessage();
      return;
    }
    
    if (!nicknameAvailable) {
      SetErrorMessage('사용할 수 없는 닉네임입니다.');
      TimeoutMessage();
      return;
    }
    
    // 비밀번호 검증
    if (!password) {
      SetErrorMessage('비밀번호를 입력해주세요.');
      TimeoutMessage();
      return;
    }
    
    if (password.length < 10) {
      SetErrorMessage('비밀번호는 최소 10자 이상 입력해주세요.');
      TimeoutMessage();
      return;
    }
    
    if (password !== password1) {
      SetErrorMessage('비밀번호가 일치하지 않습니다.');
      TimeoutMessage();
      return;
    }
    
    // 로딩 시작
    setIsLoading(true);
    
    // 새로운 이메일 인증 방식으로 회원가입
    SignUpComplete({
      email,
      auth_token: authToken,
      nickname,
      password
    })
      .then((res) => {
        // 토큰 저장
        const token = res.data.vridge_session;
        if (token) {
          window.localStorage.setItem('VGID', JSON.stringify(token));
          
          // 사용자 정보 저장
          const userInfo = {
            email: res.data.user,
            nickname: res.data.nickname
          };
          window.localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
        
        // 성공 메시지 표시
        setSuccessMessage('회원가입이 완료되었습니다!');
        
        // 잠시 후 홈으로 이동
        setTimeout(() => {
          navigate('/CmsHome', { replace: true });
        }, 1000);
      })
      .catch((err) => {
        if (err.response) {
          const status = err.response.status;
          const message = err.response.data?.message || '회원가입에 실패했습니다.';
          SetErrorMessage(message);
        } else if (err.request) {
          SetErrorMessage('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.');
        } else {
          SetErrorMessage('회원가입 중 오류가 발생했습니다.');
        }
        
        TimeoutMessage();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  const passwordStrength = getPasswordStrength();

  return (
    <PageTemplate auth={true} noLogin={true}>
      <div className="Auth_Form">
        <div className="form_wrap" style={{ width: '480px' }}>
          <div className="title" style={{ marginBottom: '40px' }}>회원가입</div>
          
          <form onSubmit={handleSignUp}>
            {/* 이메일 입력 섹션 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                이메일 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="example@email.com"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: `2px solid ${
                      emailVerified ? '#28a745' :
                      emailChecked ? (emailAvailable ? '#ffc107' : '#dc3545') : 
                      '#e9ecef'
                    }`,
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    backgroundColor: '#fff'
                  }}
                  onFocus={(e) => {
                    if (!emailChecked) {
                      e.target.style.borderColor = '#1631F8'
                    }
                  }}
                  onBlur={(e) => {
                    if (!emailChecked) {
                      e.target.style.borderColor = '#e9ecef'
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={sendEmailAuth}
                  disabled={!email || !email.includes('@') || checkingEmail || emailVerified || (authCountdown > 0 && authCountdown < 150)}
                  style={{
                    width: '110px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: 
                      emailVerified ? '#28a745' :
                      (!email || !email.includes('@')) ? '#e9ecef' : 
                      '#1631F8',
                    color: (!email || !email.includes('@')) ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 
                      (!email || !email.includes('@') || checkingEmail || emailVerified || (authCountdown > 0 && authCountdown < 150)) ? 
                      'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {emailVerified ? '인증 완료' :
                   checkingEmail ? '전송 중...' : 
                   authCountdown > 0 && authCountdown < 150 ? `재전송 (${authCountdown}초)` : 
                   '인증'}
                </button>
              </div>
              {emailMessage && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '13px', 
                  color: emailAvailable ? '#28a745' : '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {emailAvailable ? '✓' : '✗'} {emailMessage}
                </div>
              )}
              
              {/* 인증번호 입력 필드 */}
              {showAuthInput && !emailVerified && (
                <div style={{ 
                  marginTop: '12px',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    이메일로 발송된 6자리 인증번호를 입력해주세요.
                    {authCountdown > 0 && (
                      <span style={{ color: '#dc3545', marginLeft: '8px' }}>
                        ({Math.floor(authCountdown / 60)}분 {authCountdown % 60}초 남음)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={authNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        if (value.length <= 6) {
                          setAuthNumber(value)
                        }
                      }}
                      placeholder="인증번호 6자리"
                      maxLength={6}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        fontSize: '16px',
                        border: '2px solid #e9ecef',
                        borderRadius: '6px',
                        outline: 'none',
                        textAlign: 'center',
                        letterSpacing: '4px',
                        fontWeight: '600'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1631F8'}
                      onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                    />
                    <button
                      type="button"
                      onClick={verifyAuthNumber}
                      disabled={!authNumber || authNumber.length !== 6 || verifyingAuth}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: (!authNumber || authNumber.length !== 6) ? '#e9ecef' : '#1631F8',
                        color: (!authNumber || authNumber.length !== 6) ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (!authNumber || authNumber.length !== 6 || verifyingAuth) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {verifyingAuth ? '확인 중...' : '확인'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 닉네임 입력 섹션 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                닉네임 <span style={{ color: '#dc3545' }}>*</span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#6c757d', 
                  fontWeight: '400',
                  marginLeft: '8px'
                }}>
                  (2-10자)
                </span>
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  name="nickname"
                  value={nickname}
                  onChange={onChange}
                  placeholder="닉네임을 입력하세요"
                  maxLength={10}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: `2px solid ${nicknameChecked ? (nicknameAvailable ? '#28a745' : '#dc3545') : '#e9ecef'}`,
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    backgroundColor: '#fff'
                  }}
                  onFocus={(e) => {
                    if (!nicknameChecked) {
                      e.target.style.borderColor = '#1631F8'
                    }
                  }}
                  onBlur={(e) => {
                    if (!nicknameChecked) {
                      e.target.style.borderColor = '#e9ecef'
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={checkNicknameDuplicate}
                  disabled={!nickname || nickname.length < 2 || checkingNickname}
                  style={{
                    width: '110px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: (!nickname || nickname.length < 2) ? '#e9ecef' : '#1631F8',
                    color: (!nickname || nickname.length < 2) ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (!nickname || nickname.length < 2 || checkingNickname) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {checkingNickname ? '확인 중...' : '중복 확인'}
                </button>
              </div>
              {nicknameMessage && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '13px', 
                  color: nicknameAvailable ? '#28a745' : '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {nicknameAvailable ? '✓' : '✗'} {nicknameMessage}
                </div>
              )}
            </div>

            {/* 비밀번호 입력 섹션 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                비밀번호 <span style={{ color: '#dc3545' }}>*</span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#6c757d', 
                  fontWeight: '400',
                  marginLeft: '8px'
                }}>
                  (최소 10자)
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="비밀번호를 입력하세요"
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '12px 50px 12px 16px',
                    fontSize: '16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1631F8'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <div style={{ 
                      flex: 1, 
                      height: '4px', 
                      backgroundColor: '#e9ecef',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(passwordStrength.level / 4) * 100}%`,
                        height: '100%',
                        backgroundColor: passwordStrength.color,
                        transition: 'all 0.3s ease'
                      }} />
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      color: passwordStrength.color,
                      fontWeight: '600',
                      minWidth: '60px'
                    }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 비밀번호 확인 섹션 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                비밀번호 확인 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword1 ? 'text' : 'password'}
                  name="password1"
                  value={password1}
                  onChange={onChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '12px 50px 12px 16px',
                    fontSize: '16px',
                    border: `2px solid ${password1 && (password === password1 ? '#28a745' : '#dc3545')}`,
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    if (!password1 || password === password1) {
                      e.target.style.borderColor = '#1631F8'
                    }
                  }}
                  onBlur={(e) => {
                    if (!password1) {
                      e.target.style.borderColor = '#e9ecef'
                    } else if (password === password1) {
                      e.target.style.borderColor = '#28a745'
                    } else {
                      e.target.style.borderColor = '#dc3545'
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword1(!showPassword1)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {showPassword1 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>
              {password1 && password !== password1 && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '13px', 
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ✗ 비밀번호가 일치하지 않습니다.
                </div>
              )}
              {password1 && password === password1 && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '13px', 
                  color: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ✓ 비밀번호가 일치합니다.
                </div>
              )}
            </div>

            {/* 에러/성공 메시지 */}
            {errorMessage && (
              <div style={{ 
                padding: '12px 16px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #f5c6cb'
              }}>
                {errorMessage}
              </div>
            )}
            
            {successMessage && (
              <div style={{ 
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #c3e6cb'
              }}>
                {successMessage}
              </div>
            )}

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: isLoading ? '#6c757d' : '#1631F8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isLoading ? 'none' : '0 2px 4px rgba(22, 49, 248, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#0F23C9'
                  e.target.style.boxShadow = '0 4px 8px rgba(22, 49, 248, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#1631F8'
                  e.target.style.boxShadow = '0 2px 4px rgba(22, 49, 248, 0.2)'
                }
              }}
            >
              {isLoading ? '처리 중...' : '회원가입'}
            </button>

            {/* 로그인 링크 */}
            <div style={{ 
              marginTop: '24px', 
              textAlign: 'center',
              fontSize: '14px',
              color: '#6c757d'
            }}>
              이미 계정이 있으신가요?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#1631F8',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                로그인
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageTemplate>
  )
}