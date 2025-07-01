import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import 'css/User/Auth.scss'
import PageTemplate from 'components/PageTemplate'
import { SignUp } from 'api/auth'
import AuthEmail from 'tasks/AuthEmail'

export default function Signup() {
  const navigate = useNavigate()
  const [valid_email, SetValidEmail] = useState(true) // 이메일 인증 임시 비활성화
  const [errorMessage, SetErrorMessage] = useState('')
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
  }

  function TimeoutMessage() {
    setTimeout(() => {
      SetErrorMessage('')
    }, 3000)
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
            <input
              type="text"
              name="nickname"
              value={nickname}
              onChange={onChange}
              placeholder="닉네임 입력 (최소 2자)"
              className="ty01 mt10"
              maxLength={10}
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
