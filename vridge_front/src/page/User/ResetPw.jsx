import { useState } from 'react'
import dynamic from 'next/dynamic';;
import { useRouter } from '../../util/nextNavigation';
import PageTemplate from '../../components/PageTemplate';
;
import { ResetPassword } from '../../api/auth';
import { UnifiedButton } from "../../components/unified/Button";
export default function ResetPw() {
  const {
    navigate
  } = useRouter();
  const [valid_email, SetValidEmail] = useState(false);
  const [errorMessage, SetErrorMessage] = useState('');
  const initial = {
    email: '',
    auth_number: '',
    password: '',
    password1: ''
  };
  const [inputs, set_inputs] = useState(initial);
  const {
    email,
    auth_number,
    password,
    password1
  } = inputs;
  function onChange(e) {
    const {
      value,
      name
    } = e.target;
    set_inputs({
      ...inputs,
      [name]: value
    });
  }
  function TimeoutMessage() {
    setTimeout(() => {
      SetErrorMessage('');
    }, 3000);
  }
  function ResetBtn() {
    return password.length > 9 && password1.length > 9 && <UnifiedButton onClick={() = aria-label="Click"> {
      if (password === password1) {
        ResetPassword(inputs).then(res => {
          window.alert('비밀번호를 변경했습니다.');
          navigate('/login');
        } onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> {
      if (password === password1) {
        ResetPassword(inputs).then(res => {
          window.alert('비밀번호를 변경했습니다.');
          navigate('/login');
        }).catch(err => {
          if (err.response && err.response.data) {
            SetErrorMessage(err.response.data.message);
            TimeoutMessage();
          }
        });
      } else {
        SetErrorMessage('비밀번호가 일치하지 않습니다.');
        TimeoutMessage();
      }
    }} variant="primary">
          확인
        </UnifiedButton>;
  }
  return <PageTemplate auth={true} noLogin={true}>
      <div className="Auth_Form">
        <div className="form_wrap">
          <div className="title">비밀번호 찾기</div>
          {!valid_email ? <AuthEmail email={email} auth_number={auth_number} SetValidEmail={SetValidEmail} inputs={inputs} set_inputs={set_inputs} /> : <>
              <UnifiedInput placeholder="비밀번호 입력 (최소 10자)" value={password} onChange={onChange} name="password" / aria-label="비밀번호 입력 (최소 10자)">
              <UnifiedInput placeholder="새로운 비밀번호 확인" value={password1} onChange={onChange} name="password1" / aria-label="새로운 비밀번호 확인">
              {errorMessage && <div className="error">{errorMessage}</div>}
              <ResetBtn />
            </>}
        </div>
      </div>
    </PageTemplate>;
}
import { Input } from '../../components/unified/Input'
const AuthEmail = dynamic(() => import('../../tasks/AuthEmail'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;