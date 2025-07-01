import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import 'css/User/Auth.scss'
import PageTemplate from 'components/PageTemplate'
import { SignUp, CheckNickname } from 'api/auth'
import AuthEmail from 'tasks/AuthEmail'

export default function Signup() {
  const navigate = useNavigate()
  const [valid_email, SetValidEmail] = useState(true) // 이메일 인증 임시 비활성화
  const [errorMessage, SetErrorMessage] = useState('')
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState(false)
  const [nicknameMessage, setNicknameMessage] = useState('')
  const initial = {
    email: '',
    auth_number: '',
    nickname: '',
    password: '',
    password1: '',
  }
  const [inputs, set_inputs] = useState(initial)
  const { email, auth_number, nickname, password, password1 } = inputs

  function onChange(e) {
    const { value, name } = e.target
    set_inputs({
      ...inputs,
      [name]: value,
    })
    
    // 닉네임이 변경되면 중복 확인 초기화
    if (name === 'nickname') {
      setNicknameChecked(false)
      setNicknameAvailable(false)
      setNicknameMessage('')
    }
  }

  function TimeoutMessage() {
    setTimeout(() => {
      SetErrorMessage('')
    }, 3000)
  }
  
  // 닉네임 중복 확인 함수
  function checkNicknameDuplicate() {
    if (nickname.length < 2) {
      setNicknameMessage('닉네임은 최소 2자 이상이어야 합니다.')
      setNicknameAvailable(false)
      return
    }
    
    CheckNickname(nickname)
      .then((res) => {
        // 성공 시 사용 가능
        setNicknameChecked(true)
        setNicknameAvailable(true)
        setNicknameMessage('사용 가능한 닉네임입니다.')
      })
      .catch((err) => {
        // 실패 시 중복
        setNicknameChecked(true)
        setNicknameAvailable(false)
        if (err.response && err.response.data) {
          setNicknameMessage(err.response.data.message || '이미 사용 중인 닉네임입니다.')
        } else {
          setNicknameMessage('이미 사용 중인 닉네임입니다.')
        }
      })
  }

  function handleSignUp() {
    // 이메일 검증
    if (!email) {
      SetErrorMessage('이메일을 입력해주세요.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      SetErrorMessage('올바른 이메일 형식이 아닙니다.');
      return;
    }
    
    // 닉네임 검증
    if (nickname.length < 2) {
      SetErrorMessage('닉네임은 최소 2자 이상 입력해주세요.');
      return;
    }
    
    // 닉네임 중복 확인 여부 검증
    if (!nicknameChecked || !nicknameAvailable) {
      SetErrorMessage('닉네임 중복 확인을 해주세요.');
      return;
    }
    
    // 비밀번호 검증
    if (password.length < 10) {
      SetErrorMessage('비밀번호는 최소 10자 이상 입력해주세요.');
      return;
    }
    
    if (password !== password1) {
      SetErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    // 회원가입 요청
    SignUp(inputs)
      .then((res) => {
        window.localStorage.setItem(
          'VGID',
          JSON.stringify(res.data.vridge_session),
        )
        navigate('/CmsHome', { replace: true })
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          SetErrorMessage(err.response.data.message)
        } else {
          SetErrorMessage('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
      })
  }

  return (
    <PageTemplate auth={true} noLogin={true}>
      <div className="Auth_Form">
        <div className="form_wrap">
          <div className="title">SIGN UP</div>
          {/* 이메일 인증 임시 비활성화 - 바로 가입 폼 표시 */}
          <>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="이메일 입력"
              className="ty01 mt50"
              maxLength={50}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginTop: '30px'
              }}
            />
            <div style={{ position: 'relative', marginTop: '10px' }}>
              <input
                type="text"
                name="nickname"
                value={nickname}
                onChange={onChange}
                placeholder="닉네임 입력 (최소 2자)"
                className="ty01"
                maxLength={10}
                style={{
                  width: '100%',
                  padding: '15px',
                  paddingRight: '110px',
                  fontSize: '16px',
                  border: `1px solid ${nicknameChecked ? (nicknameAvailable ? '#28a745' : '#dc3545') : '#e0e0e0'}`,
                  borderRadius: '8px'
                }}
              />
              <button
                type="button"
                onClick={checkNicknameDuplicate}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                중복 확인
              </button>
            </div>
            {nicknameMessage && (
              <div style={{ 
                marginTop: '5px', 
                fontSize: '14px', 
                color: nicknameAvailable ? '#28a745' : '#dc3545' 
              }}>
                {nicknameMessage}
              </div>
            )}
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="비밀번호 입력 (최소 10자)"
              className="ty01 mt10"
              maxLength={20}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginTop: '10px'
              }}
            />
            <input
              type="password"
              name="password1"
              value={password1}
              onChange={onChange}
              placeholder="비밀번호 확인"
              className="ty01 mt10"
              maxLength={20}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginTop: '10px'
              }}
            />
            {errorMessage && <div className="error" style={{ color: '#d93a3a', marginTop: '15px', fontSize: '14px' }}>{errorMessage}</div>}
            <button
              onClick={handleSignUp}
              className="submit mt30"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                fontWeight: '600',
                backgroundColor: '#0058da',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                marginTop: '30px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0047b8'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0058da'}
            >
              회원가입
            </button>
          </>
        </div>
      </div>
    </PageTemplate>
  )
}
