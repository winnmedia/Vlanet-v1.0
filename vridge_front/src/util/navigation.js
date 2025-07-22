/**
 * 네비게이션 헬퍼 유틸리티
 * 일관된 라우팅을 위한 중앙화된 URL 생성 함수
 */

export const navigation = {
  // 홈 및 인증
  home: () => '/',
  login: () => '/Login',
  signup: () => '/Signup',
  resetPassword: () => '/ResetPw',
  myPage: () => '/MyPage',
  emailCheck: () => '/EmailCheck',
  
  // 프로젝트 관련
  cmsHome: () => '/CmsHome',
  projectCreate: () => '/ProjectCreate',
  projectView: (id) => `/ProjectView/${id}`,
  projectEdit: (id) => `/ProjectEdit/${id}`,
  feedback: (id) => `/Feedback/${id}`,
  feedbackAll: () => '/FeedbackAll',
  
  // 영상 제작
  videoPlanning: () => '/VideoPlanning',
  calendar: () => '/Calendar',
  frameworkManagement: () => '/FrameworkManagement',
  
  // 관리자
  admin: () => '/AdminDashboard',
  adminRedirect: () => '/admin',
  emailMonitor: () => '/EmailMonitor',
  
  // 초대
  invitation: (token, uid = null) => {
    if (uid) {
      return `/invitation/${uid}/${token}`;
    }
    return `/invitation/${token}`;
  },
  invitationAccept: (token) => `/invitation/accept/${token}`,
  
  // 정책
  privacy: () => '/privacy',
  terms: () => '/terms',
  
  // 디버그
  mobileDebug: () => '/mobile-debug',
};

/**
 * 향후 마이그레이션을 위한 새로운 URL 구조
 * 점진적으로 이 구조로 이동 예정
 */
export const newNavigation = {
  // 홈 및 인증
  home: () => '/',
  login: () => '/login',
  signup: () => '/signup',
  resetPassword: () => '/reset-password',
  myPage: () => '/my-page',
  
  // 프로젝트 관련
  dashboard: () => '/dashboard',
  projects: () => '/projects',
  projectCreate: () => '/projects/new',
  projectView: (id) => `/projects/${id}`,
  projectEdit: (id) => `/projects/${id}/edit`,
  projectFeedback: (id) => `/projects/${id}/feedback`,
  
  // 영상 제작
  planning: () => '/planning',
  calendar: () => '/calendar',
  frameworks: () => '/frameworks',
  
  // 관리자
  admin: () => '/admin',
  adminUsers: () => '/admin/users',
  adminProjects: () => '/admin/projects',
  adminFeedbacks: () => '/admin/feedbacks',
  adminSystem: () => '/admin/system',
  adminEmails: () => '/admin/emails',
  
  // 초대
  invitation: (token) => `/invitations/${token}`,
  
  // 정책
  privacy: () => '/privacy',
  terms: () => '/terms',
};

/**
 * Breadcrumb 생성 헬퍼
 */
export const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ path: '/', label: '홈' }];
  
  const labelMap = {
    'CmsHome': '대시보드',
    'ProjectCreate': '새 프로젝트',
    'ProjectView': '프로젝트 상세',
    'ProjectEdit': '프로젝트 수정',
    'Feedback': '피드백',
    'VideoPlanning': '영상 기획',
    'Calendar': '일정',
    'AdminDashboard': '관리자',
    'MyPage': '마이페이지',
    'Login': '로그인',
    'Signup': '회원가입',
  };
  
  let currentPath = '';
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const label = labelMap[path] || path;
    breadcrumbs.push({ path: currentPath, label });
  });
  
  return breadcrumbs;
};

/**
 * 활성 메뉴 확인 헬퍼
 */
export const isActiveMenu = (currentPath, menuPath) => {
  if (menuPath === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(menuPath);
};

export default navigation;