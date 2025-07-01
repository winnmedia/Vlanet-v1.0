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

  function SignUpBtn() {
    return (
      email.length > 0 &&
      nickname.length > 1 &&
      password.length > 9 &&
      password1.length > 9 && (
        <button
          onClick={() => {
            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              SetErrorMessage('올바른 이메일 형식이 아닙니다.');
              return;
            }
            
            if (password === password1) {
              SignUp(inputs)
                .then((res) => {
                  // console.log(res.data.user)
                  // console.log(res.data.message)
                  window.localStorage.setItem(
                    'VGID',
                    JSON.stringify(res.data.vridge_session),
                  )
                  navigate('/CmsHome', { replace: true })
                })
                .catch((err) => {
                  if (err.response && err.response.data) {
                    SetErrorMessage(err.response.data.message)
                    // TimeoutMessage()
                  }
                })
            } else {
              SetErrorMessage('비밀번호가 일치하지 않습니다.')
              // TimeoutMessage()
            }
          }}
          className="submit mt30"
        >
          Sign Up
        </button>
      )
    )
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
            />
            <input
              type="text"
              name="nickname"
              value={nickname}
              onChange={onChange}
              placeholder="닉네임 입력 (최소 2자)"
              className="ty01 mt10"
              maxLength={10}
            />
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="비밀번호 입력 (최소 10자)"
              className="ty01 mt10"
              maxLength={20}
            />
            <input
              type="password"
              name="password1"
              value={password1}
              onChange={onChange}
              placeholder="비밀번호 확인"
              className="ty01 mt10"
              maxLength={20}
            />
            {errorMessage && <div className="error">{errorMessage}</div>}
            <SignUpBtn />
          </>
        </div>
      </div>
    </PageTemplate>
  )
}
