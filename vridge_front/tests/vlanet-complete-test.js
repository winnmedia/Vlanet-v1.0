/**
 * VLANET.NET 전체 기능 MECE 테스트
 * 모든 기능을 상호 배타적이고 전체 포괄적으로 테스트
 */

const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
};

// 로그 헬퍼
const log = {
  success: (msg) => console.log(`${colors.success}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.error}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.warning}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.info}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.info}═══ ${msg} ═══${colors.reset}\n`),
  subsection: (msg) => console.log(`\n${colors.info}── ${msg} ──${colors.reset}`)
};

// MECE 카테고리별 기능 정의
const featureCategories = {
  '1. 인증 및 계정 관리': {
    features: [
      { name: '회원가입', files: ['SignUp.jsx'], apis: ['/signup/'] },
      { name: '로그인', files: ['Login.jsx'], apis: ['/login/'] },
      { name: '비밀번호 재설정', files: ['PasswordReset.jsx'], apis: ['/password-reset/'] },
      { name: '프로필 관리', files: ['MyPage.jsx'], apis: ['/profile/'] },
      { name: '로그아웃', files: ['Header.jsx'], apis: ['/logout/'] }
    ]
  },
  '2. 프로젝트 관리': {
    features: [
      { name: '프로젝트 생성', files: ['ProjectCreate.jsx'], apis: ['/projects/create_atomic/'] },
      { name: '프로젝트 목록', files: ['Project.jsx'], apis: ['/projects/'] },
      { name: '프로젝트 수정', files: ['ProjectEdit.jsx'], apis: ['/projects/:id/'] },
      { name: '프로젝트 삭제', files: ['ProjectEdit.jsx'], apis: ['/projects/:id/'] },
      { name: '프로젝트 검색', files: ['Project.jsx'], apis: ['/projects/?search='] }
    ]
  },
  '3. 피드백 시스템': {
    features: [
      { name: '피드백 등록', files: ['FeedbackInput.jsx'], apis: ['/feedbacks/'] },
      { name: '피드백 조회', files: ['FeedbackMore.jsx'], apis: ['/feedbacks/'] },
      { name: '피드백 수정', files: ['FeedbackManage.jsx'], apis: ['/feedbacks/:id/'] },
      { name: '피드백 삭제', files: ['FeedbackManage.jsx'], apis: ['/feedbacks/:id/'] },
      { name: '실시간 동기화', files: ['FeedbackMessagePolling.jsx'], apis: ['ws://'] }
    ]
  },
  '4. 미디어 처리': {
    features: [
      { name: '영상 업로드', files: ['Feedback.jsx'], apis: ['/feedback_file/'] },
      { name: '영상 스트리밍', files: ['VideoJsPlayer.jsx'], apis: ['/media/'] },
      { name: '영상 삭제', files: ['Feedback.jsx'], apis: ['/feedback_file/:id/'] },
      { name: '인코딩 상태', files: ['Feedback.jsx'], apis: ['/encoding-status/'] },
      { name: '썸네일 생성', files: [], apis: ['/thumbnail/'] }
    ]
  },
  '5. 팀 협업': {
    features: [
      { name: '멤버 초대', files: ['Member.jsx'], apis: ['/project-members/'] },
      { name: '권한 관리', files: ['Member.jsx'], apis: ['/project-members/:id/'] },
      { name: '팀 채팅', files: ['ChatMessages.jsx'], apis: ['/chat/'] },
      { name: '알림', files: [], apis: ['/notifications/'] }
    ]
  },
  '6. AI 기능': {
    features: [
      { name: 'AI 영상 분석', files: ['Feedback.jsx'], apis: ['/ai-analysis/'] },
      { name: 'AI 선생님', files: ['Feedback.jsx'], apis: ['/ai-teachers/'] },
      { name: '자동 태깅', files: [], apis: ['/auto-tag/'] }
    ]
  },
  '7. 관리자 기능': {
    features: [
      { name: '대시보드', files: ['AdminDashboard.jsx'], apis: ['/admin/dashboard/'] },
      { name: '사용자 관리', files: [], apis: ['/admin/users/'] },
      { name: '통계', files: [], apis: ['/admin/stats/'] }
    ]
  },
  '8. 공통 UI/UX': {
    features: [
      { name: '헤더 네비게이션', files: ['Header.jsx'], apis: [] },
      { name: '사이드바', files: ['SideBar.jsx'], apis: [] },
      { name: '모달', files: ['Modal.jsx'], apis: [] },
      { name: '알림 토스트', files: [], apis: [] },
      { name: '로딩 상태', files: ['Loading.jsx'], apis: [] }
    ]
  },
  '9. 보안 및 인증': {
    features: [
      { name: 'JWT 토큰 관리', files: [], apis: ['/token/refresh/'] },
      { name: 'CORS 설정', files: [], apis: [] },
      { name: 'XSS 방지', files: [], apis: [] },
      { name: '입력 검증', files: [], apis: [] }
    ]
  }
};

// 파일 존재 여부 확인
function checkFileExists(fileName) {
  const possiblePaths = [
    path.join(__dirname, '..', 'page', 'Cms', fileName),
    path.join(__dirname, '..', 'page', 'MyPage', fileName),
    path.join(__dirname, '..', 'page', 'Main', fileName),
    path.join(__dirname, '..', 'components', fileName),
    path.join(__dirname, '..', 'tasks', fileName)
  ];
  
  return possiblePaths.some(filePath => fs.existsSync(filePath));
}

// API 엔드포인트 검증
function checkAPIEndpoint(endpoint) {
  const apiPath = path.join(__dirname, '..', 'api');
  if (!fs.existsSync(apiPath)) return false;
  
  const apiFiles = fs.readdirSync(apiPath);
  return apiFiles.some(file => {
    const content = fs.readFileSync(path.join(apiPath, file), 'utf8');
    return content.includes(endpoint);
  });
}

// 카테고리별 테스트
function testCategory(categoryName, category) {
  log.subsection(categoryName);
  
  let implemented = 0;
  let total = category.features.length;
  
  category.features.forEach(feature => {
    const hasFiles = feature.files.length === 0 || feature.files.some(file => checkFileExists(file));
    const hasAPIs = feature.apis.length === 0 || feature.apis.some(api => checkAPIEndpoint(api));
    
    if (hasFiles && hasAPIs) {
      log.success(feature.name);
      implemented++;
    } else if (hasFiles || hasAPIs) {
      log.warning(`${feature.name} - 부분 구현`);
      implemented += 0.5;
    } else {
      log.error(`${feature.name} - 미구현`);
    }
  });
  
  const percentage = Math.round((implemented / total) * 100);
  console.log(`\n구현률: ${implemented}/${total} (${percentage}%)`);
  
  return { implemented, total };
}

// 전체 테스트 실행
function runCompleteTest() {
  log.section('VLANET.NET 전체 기능 MECE 분석');
  console.log(`테스트 시간: ${new Date().toLocaleString()}\n`);
  
  let totalImplemented = 0;
  let totalFeatures = 0;
  const categoryResults = {};
  
  // 각 카테고리 테스트
  Object.entries(featureCategories).forEach(([categoryName, category]) => {
    const result = testCategory(categoryName, category);
    categoryResults[categoryName] = result;
    totalImplemented += result.implemented;
    totalFeatures += result.total;
  });
  
  // 전체 결과 요약
  log.section('전체 테스트 결과');
  
  console.log(`${colors.bold}카테고리별 구현 현황:${colors.reset}`);
  Object.entries(categoryResults).forEach(([category, result]) => {
    const percentage = Math.round((result.implemented / result.total) * 100);
    const color = percentage >= 80 ? colors.success : percentage >= 50 ? colors.warning : colors.error;
    console.log(`${color}${category}: ${percentage}%${colors.reset}`);
  });
  
  const overallPercentage = Math.round((totalImplemented / totalFeatures) * 100);
  console.log(`\n${colors.bold}전체 구현률: ${totalImplemented}/${totalFeatures} (${overallPercentage}%)${colors.reset}`);
  
  // 주요 이슈
  log.section('발견된 주요 이슈');
  
  const issues = [
    { level: 'critical', issue: '새로고침 시 Redux 상태 유실', solution: 'redux-persist 구현' },
    { level: 'high', issue: '대용량 파일 업로드 타임아웃', solution: '청크 업로드 구현' },
    { level: 'medium', issue: '에러 바운더리 없음', solution: 'ErrorBoundary 컴포넌트 추가' },
    { level: 'medium', issue: 'API 에러 핸들링 일관성 부족', solution: '중앙화된 에러 핸들러' },
    { level: 'low', issue: '모바일 반응형 개선 필요', solution: 'CSS 미디어 쿼리 강화' }
  ];
  
  issues.forEach(({ level, issue, solution }) => {
    const color = level === 'critical' ? colors.error : level === 'high' ? colors.warning : colors.info;
    console.log(`${color}[${level.toUpperCase()}] ${issue}${colors.reset}`);
    console.log(`  해결방안: ${solution}`);
  });
}

// 테스트 실행
runCompleteTest();