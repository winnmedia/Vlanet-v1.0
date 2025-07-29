import React, { useState, useEffect, useMemo } from 'react';
import { SendAuthNumber, EmailAuth } from '../api/auth';
import { useRouter } from '../util/nextNavigation';
import { Button } from '../components/unified/Button';
import { Input } from '../components/unified/Input';

export default function AuthEmail({
  email,
  auth_number,
  SetValidEmail,
  inputs,
  set_inputs
}) {
  const [errorMessage, SetErrorMessage] = useState('');
  const [successMessage, SetSuccessMessage] = useState('');
  const [send, set_send] = useState(false);
  const [btn_text, set_btn_text] = useState('인증번호 발송');
  const [isLoading, setIsLoading] = useState(false);
  const { pathname } = useRouter();

  const types = useMemo(() => {
    let path;
    if (pathname.includes('/ResetPw')) {
      path = 'reset';
    } else {
      path = 'signup';
    }
    return path;
  }, []);

  function TimeoutMessage() {
    setTimeout(() => {
      SetErrorMessage('');
      SetSuccessMessage('');
    }, 3000);
  }

  // 이메일 유효성 검사
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function onChange(e) {
    const { value, name } = e.target;
    set_inputs({
      ...inputs,
      [name]: value
    });
  }

  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const countdown = setInterval(() => {
      if (seconds > 0) {
        setSeconds((current) => current - 1);
      }
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(countdown);
        } else {
          setMinutes((current) => current - 1);
          setSeconds(59);
        }
      }
    }, 1000);
    return () => {
      clearInterval(countdown);
    };
  }, [minutes, seconds]);

  function AuthNumber() {
    const isEmailValid = validateEmail(email);
    const canSend = isEmailValid && !isLoading && minutes === 0 && seconds === 0;

    return (
      <UnifiedButton
        variant="secondary"
        size="md"
        onClick={() = aria-label="Click"> {
          if (!isEmailValid) {
            SetErrorMessage('올바른 이메일 주소를 입력해주세요.');
            TimeoutMessage();
            return;
          } onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> {
          if (!isEmailValid) {
            SetErrorMessage('올바른 이메일 주소를 입력해주세요.');
            TimeoutMessage();
            return;
          }

          setIsLoading(true);
          SetErrorMessage('');
          SetSuccessMessage('');

          SendAuthNumber(inputs, types).
          then((res) => {

            setIsLoading(false);
            setMinutes(3);
            setSeconds(0);
            set_btn_text('재발송');
            SetSuccessMessage('인증번호가 이메일로 발송되었습니다.');
            TimeoutMessage();
          }).
          catch((err) => {
            
            setIsLoading(false);
            if (err.response && err.response.data) {
              SetErrorMessage(err.response.data.message);
            } else {
              SetErrorMessage('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
            TimeoutMessage();
          });
        }}
        className="cert"
        disabled={!canSend}
        loading={isLoading}>

        {isLoading ? '발송 중...' : btn_text}
      </UnifiedButton>);

  }

  function CheckBtn() {
    const canVerify = auth_number.length === 6 && (minutes > 0 || seconds > 0);

    return (
      canVerify &&
      <UnifiedButton
        variant="primary"
        size="lg"
        onClick={() = aria-label="Click"> {
          if (auth_number.length !== 6) {
            SetErrorMessage('인증번호는 6자리입니다.');
            TimeoutMessage();
            return;
          } onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> {
          if (auth_number.length !== 6) {
            SetErrorMessage('인증번호는 6자리입니다.');
            TimeoutMessage();
            return;
          }

          setIsLoading(true);
          EmailAuth(inputs, types).
          then((res) => {
            setIsLoading(false);
            SetSuccessMessage('이메일 인증이 완료되었습니다!');
            SetValidEmail(true);
            setMinutes(0);
            setSeconds(0);
          }).
          catch((err) => {
            setIsLoading(false);
            if (err.response && err.response.data) {
              SetErrorMessage(err.response.data.message);
            } else {
              SetErrorMessage('인증번호가 일치하지 않습니다.');
            }
            TimeoutMessage();
            set_inputs({ ...inputs, auth_number: '' });
          });
        }}
        className="submit mt30"
        disabled={isLoading}
        loading={isLoading}>

          {isLoading ? '확인 중...' : '인증 확인'}
        </UnifiedButton>);

  }
  return (
    <>
      <div className="pr mt50">
        <UnifiedInput placeholder="이메일 입력" value={email} onChange={onChange} name="email"  / aria-label="이메일 입력">
        <AuthNumber />
      </div>
      {(seconds > 0 || minutes > 0) &&
      <div className="pr mt10">
          <UnifiedInput placeholder="인증번호 입력" value={auth_number} onChange={onChange} name="auth_number"  / aria-label="인증번호 입력">
          <span className="timer">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>
      }
      {errorMessage && <div className="error">{errorMessage}</div>}
      {successMessage && <div className="success" style={{ color: '#4CAF50', marginTop: '10px', fontSize: '14px' }}>{successMessage}</div>}
      <CheckBtn />
    </>);

}

React.memo(AuthEmail);