import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { checkSession } from '../util/util';
import LoadingAnimation from './LoadingAnimation';
import { useRouter } from 'next/router';

export default function PageLoadingWrapper({ children, requireAuth = true }) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const { user } = useSelector((s) => s.ProjectStore);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!requireAuth) {
        setIsChecking(false);
        return;
      }

      const session = checkSession();

      if (!session) {

        router.push('/Login');
        return;
      }

      setHasSession(true);

      // user 데이터가 로드될 때까지 대기 (최대 3초)
      const timeout = setTimeout(() => {

        setIsChecking(false);
      }, 3000);

      if (user) {
        clearTimeout(timeout);
        setIsChecking(false);
      }

      return () => clearTimeout(timeout);
    };

    checkAuthStatus();
  }, [user, requireAuth, router]);

  if (requireAuth && isChecking) {
    return <LoadingAnimation message="페이지를 불러오는 중..." />;
  }

  if (requireAuth && !hasSession) {
    return null; // 로그인 페이지로 리다이렉트 중
  }

  return <>{children}</>;
}