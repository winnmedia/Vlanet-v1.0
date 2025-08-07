import React, { useEffect } from 'react'
import { useRouter } from '../util/nextNavigation';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { user } = useSelector(state => state.ProjectStore);
  const { navigate } = useRouter();
  const isAuthenticated = user && user !== '';
  
  useEffect(() => {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // 인증되지 않은 경우 아무것도 렌더링하지 않음
  if (!isAuthenticated) {
    return null;
  }
  
  return children;
};

export default PrivateRoute;
