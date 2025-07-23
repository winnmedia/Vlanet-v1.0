import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { user } = useSelector(state => state.ProjectStore);
  const isAuthenticated = user && user !== '';
  
  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }
  
  return children;
};

export default PrivateRoute;