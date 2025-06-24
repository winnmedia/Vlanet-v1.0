import React, { useState, useEffect, useMemo } from 'react'
import { SendAuthNumber, EmailAuth } from 'api/auth'
import { useLocation } from 'react-router-dom'

export default function AuthEmail({
  email,
  auth_number,
  SetValidEmail,
  inputs,
  set_inputs,
}) {
  const [errorMessage, SetErrorMessage] = useState('')
  const [send, set_send] = useState(false)
  const [btn_text, set_btn_text] = useState('인증')
  const pathname = useLocation().pathname

  const types = useMemo(() => {
    let path
    if (pathname.includes('/ResetPw')) {
      path = 'reset'
    } else {
      path = 'signup'
    }
    return path
  }, [])

  function TimeoutMessage() {
    setTimeout(() => {
      SetErrorMessage('')
    }, 3000)
  }

  function onChange(e) {
    const { value, name } = e.target
    set_inputs({
      ...inputs,
      [name]: value,
    })
  }

  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const countdown = setInterval(() => {
      if (seconds > 0) {
        setSeconds((current) => current - 1)
      }
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(countdown)
        } else {
          setMinutes((current) => current - 1)
          setSeconds(59)
        }
      }
    }, 1000)
    return () => {
      clearInterval(countdown)
    }
  }, [minutes, seconds])

  function AuthNumber() {
    return (
      email.length > 5 &&
      !send && (
        <button
          onClick={() => {
            if (email.length > 5) {
              set_send(true)
              setMinutes(3)
              setSeconds(0)
              SendAuthNumber(inputs, types)
                .then((res) => {
                  setTimeout(() => {
                    set_send(false)
                    set_btn_text('재 인증')
                  }, 3000)
                })
                .catch((err) => {
                  if (err.response && err.response.data) {
                    SetErrorMessage(err.response.data.message)
                    setMinutes(0)
                    setSeconds(0)
                    TimeoutMessage()
                  }
                })
            }
          }}
          className="cert"
        >
          {btn_text}
        </button>
      )
    )
  }

  function CheckBtn() {
    return (
      auth_number.length > 0 && (
        <button
          onClick={() => {
            EmailAuth(inputs, types)
              .then((res) => {
                SetValidEmail(true)
              })
              .catch((err) => {
                if (err.response && err.response.data) {
                  SetErrorMessage(err.response.data.message)
                  TimeoutMessage()
                }
                set_inputs({ ...inputs, auth_number: '' })
              })
          }}
          className="submit mt30"
        >
          확인
        </button>
      )
    )
  }
  return (
    <>
      <div className="pr mt50">
        <input
          type="text"
          name="email"
          value={email}
          onChange={onChange}
          placeholder="이메일 입력"
          className="ty01"
          maxLength={50}
        />
        <AuthNumber />
      </div>
      {(seconds > 0 || minutes > 0) && (
        <div className="pr mt10">
          <input
            type="text"
            name="auth_number"
            value={auth_number}
            onChange={onChange}
            placeholder="인증번호 입력"
            className="ty01"
          />
          <span className="timer">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>
      )}
      {errorMessage && <div className="error">{errorMessage}</div>}
      <CheckBtn />
    </>
  )
}

React.memo(AuthEmail)
