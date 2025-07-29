import React, { useState, useEffect , Suspense } from 'react'
import dynamic from 'next/dynamic';;
import { UnifiedInput } from '../../components/unified/UnifiedInput';

import { useRouter } from '../../util/nextNavigation';
import { useDispatch } from 'react-redux';
import { SignIn } from '../../api/auth';
import { checkSession, refetchProject } from '../../util/util';
import { getMessage } from 'constants/messages';
import styles from './LoginMinimal.module.scss';
import { Input } from '../../components/unified/Input';
import { Button } from '../../components/unified/Button';

export default function LoginMinimal() {
  const dispatch = useDispatch();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 세션 체크
  useEffect(() => {
    if (checkSession()) {
      navigate('/CmsHome');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!email) {
      setError(getMessage('AUTH.LOGIN.EMPTY_EMAIL'));
      return;
    }

    if (!password) {
      setError(getMessage('AUTH.LOGIN.EMPTY_PASSWORD'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await SignIn({ email, password });

      // 토큰 저장
      localStorage.setItem('VGID', response.data.vridge_session);

      // 프로젝트 목록 로드
      await refetchProject(dispatch, navigate);

      // 홈으로 이동
      navigate('/CmsHome', { replace: true });
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error_code === 'EMAIL_NOT_VERIFIED') {
        setError(
          <div className={styles.errorWithAction}>
            <p>{getMessage('AUTH.LOGIN.EMAIL_NOT_VERIFIED')}</p>
            <p className={styles.errorDesc}>{getMessage('AUTH.LOGIN.EMAIL_NOT_VERIFIED_DESC')}</p>
            <UnifiedButton
              type="button"
              variant="secondary"
              size="sm"
              className={styles.resendButton}
              onClick={() = aria-label="Click"> handleResendEmail(err.response.data.email)} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> handleResendEmail(err.response.data.email)}>

              {getMessage('AUTH.LOGIN.RESEND_EMAIL')}
            </UnifiedButton>
          </div>
        );
      } else {
        setError(getMessage('AUTH.LOGIN.INVALID_CREDENTIALS'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async (userEmail) => {
    // 이메일 재발송 로직
    try {
      // API 호출
      setError(getMessage('AUTH.LOGIN.EMAIL_SENT'));
    } catch (err) {
      setError(getMessage('AUTH.LOGIN.EMAIL_SEND_FAILED'));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        {/* 로고 영역 */}
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="var(--black)" />
            <path d="M12 20L18 14V26L12 20Z" fill="var(--white)" />
            <path d="M22 14H28V26H22V14Z" fill="var(--white)" />
          </svg>
          <h1>VideoPlanet</h1>
        </div>
        
        {/* 환영 메시지 */}
        <div className={styles.welcome}>
          <h2>다시 만나서 반가워요</h2>
          <p>계속하려면 로그인하세요</p>
        </div>
        
        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className={styles.form} role="form">
          <div className={styles.inputGroup}>
            <Input
              type="email"
              value={email}
              onChange={(e) = aria-label="email input"> setEmail(e.target.value)}
              placeholder={getMessage('AUTH.LOGIN.EMAIL_PLACEHOLDER')}
              className={styles.input}
              autoComplete="email"
              autoFocus />

          </div>
          
          <div className={styles.inputGroup}>
            <Input
              type="password"
              value={password}
              onChange={(e) = aria-label="password input"> setPassword(e.target.value)}
              placeholder={getMessage('AUTH.LOGIN.PASSWORD_PLACEHOLDER')}
              className={styles.input}
              autoComplete="current-password" />

          </div>
          
          {/* 에러 메시지 */}
          {error &&
          <div className={styles.error} role="alert">
              {error}
            </div>
          }
          
          {/* 비밀번호 찾기 */}
          <div className={styles.forgotPassword}>
            <a href="/resetpw" className={styles.link} aria-label="Link">
              {getMessage('AUTH.LOGIN.FORGOT_PASSWORD')}
            </a>
          </div>
          
          {/* 로그인 버튼 */}
          <UnifiedButton
            type="submit"
            variant="primary"
            size="lg"
            className={styles.submitButton}
            disabled={isLoading}
            loading={isLoading}
            fullWidth aria-label="Click">

            {getMessage('AUTH.LOGIN.SUBMIT')}
          </UnifiedButton>
        </form>
        
        {/* 회원가입 링크 */}
        <div className={styles.signupLink}>
          <span>{getMessage('AUTH.LOGIN.NO_ACCOUNT')}</span>
          <a href="/signup" className={styles.link} aria-label="Link">
            {getMessage('AUTH.LOGIN.SIGN_UP')}
          </a>
        </div>
      </div>
      
      {/* 배경 그라데이션 */}
      <div className={styles.backgroundGradient} aria-hidden="true" />
    </div>);

}