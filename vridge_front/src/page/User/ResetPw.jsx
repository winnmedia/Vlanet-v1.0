import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageTemplate from 'components/PageTemplate'
import 'css/User/Auth.scss'
import AuthEmail from 'tasks/AuthEmail'
import { ResetPassword } from 'api/auth'

export default function ResetPw() {
  const navigate = useNavigate()
  const [valid_email, SetValidEmail] = useState(false)
  const [errorMessage, SetErrorMessage] = useState('')
  const initial = {
    email: '',
    auth_number: '',
    password: '',
    password1: '',
  }
  const [inputs, set_inputs] = useState(initial)
  const { email, auth_number, password, password1 } = inputs

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

  function ResetBtn() {
    return (
      password.length > 9 &&
      password1.length > 9 && (
        <button
          onClick={() => {
            if (password === password1) {
              ResetPassword(inputs)
                .then((res) => {
                  window.alert('비밀번호를 변경했습니다.')
                  navigate('/login')
                })
                .catch((err) => {
                  if (err.response && err.response.data) {
                    SetErrorMessage(err.response.data.message)
                    TimeoutMessage()
                  }
                })
            } else {
              SetErrorMessage('비밀번호가 일치하지 않습니다.')
              TimeoutMessage()
            }
          }}
          className="submit mt30"
        >
          확인
        </button>
      )
    )
  }

  return (
    <PageTemplate auth={true} noLogin={true}>
      <div className="Auth_Form">
        <div className="form_wrap">
          <div className="title">비밀번호 찾기</div>
          {!valid_email ? (
            <AuthEmail
              email={email}
              auth_number={auth_number}
              SetValidEmail={SetValidEmail}
              inputs={inputs}
              set_inputs={set_inputs}
            />
          ) : (
            <>
              <input
                type="password"
                name="password"
                onChange={onChange}
                value={password}
                placeholder="비밀번호 입력 (최소 10자)"
                className="ty01 mt10"
                maxLength={20}
              />
              <input
                type="password"
                name="password1"
                onChange={onChange}
                value={password1}
                placeholder="새로운 비밀번호 확인"
                className="ty01 mt10"
                maxLength={20}
              />
              {errorMessage && <div className="error">{errorMessage}</div>}
              <ResetBtn />
            </>
          )}
        </div>
      </div>
    </PageTemplate>
  )
}
