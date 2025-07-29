import dynamic from 'next/dynamic'
import UnifiedModal from '../../components/unified/UnifiedModal';;
import React from 'react';

// 로딩 컴포넌트
const LoadingComponent = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    fontSize: '1rem',
    color: '#666'
  }}>
    <div style={{
      textAlign: 'center'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #1631F8',
        borderRadius: '50%',
        margin: '0 auto 16px',
        animation: 'spin 1s linear infinite'
      }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      로딩 중...
    </div>
  </div>
);

// 동적 임포트 헬퍼
export const lazyLoad = (importFunc, options = {}) => {
  return dynamic(importFunc, {
    loading: () => <LoadingComponent />,
    ssr: true,
    ...options
  });
};

// 주요 페이지 컴포넌트 lazy loading
export const LazyPages = {
  // CMS 페이지들
  CmsHome: lazyLoad(() => import('../../page/Cms/CmsHome')),
  CmsHomeMinimal: lazyLoad(() => import('../../page/Cms/CmsHomeMinimal')),
  Feedback: lazyLoad(() => import('../../page/Cms/Feedback')),
  FeedbackAll: lazyLoad(() => import('../../page/Cms/FeedbackAll')),
  VideoPlanning: lazyLoad(() => import('../../page/Cms/VideoPlanning')),
  VideoPlanningMinimal: lazyLoad(() => import('../../page/Cms/VideoPlanningMinimal')),
  Calendar: lazyLoad(() => import('../../page/Cms/Calendar')),
  ProjectCreate: lazyLoad(() => import('../../page/Cms/ProjectCreate')),
  ProjectEdit: lazyLoad(() => import('../../page/Cms/ProjectEdit')),
  ProjectView: lazyLoad(() => import('../../page/Cms/ProjectView')),
  
  // User 페이지들
  Login: lazyLoad(() => import('../../page/User/Login')),
  LoginMinimal: lazyLoad(() => import('../../page/User/LoginMinimal')),
  Signup: lazyLoad(() => import('../../page/User/Signup')),
  SignupWithEmail: lazyLoad(() => import('../../page/User/SignupWithEmail')),
  MyPage: lazyLoad(() => import('../../page/User/MyPage')),
  EmailCheck: lazyLoad(() => import('../../page/User/EmailCheck')),
  
  // Admin 페이지들
  AdminDashboard: lazyLoad(() => import('../../page/Admin/AdminDashboard')),
  EmailMonitor: lazyLoad(() => import('../../page/Admin/EmailMonitor'))
};

// 무거운 컴포넌트들 lazy loading
export const LazyComponents = {
  VideoPlayer: lazyLoad(() => import('../../components/VideoPlayer')),
  FeedbackPlayer: lazyLoad(() => import('../../components/FeedbackPlayer')),
  ProjectDashboard: lazyLoad(() => import('../../components/ProjectDashboard')),
  CalendarEnhanced: lazyLoad(() => import('../../components/CalendarEnhanced')),
  ImageCropper: lazyLoad(() => import('../../components/ImageCropper')),
  ExportModal: lazyLoad(() => import('../../components/ExportModal'))
};