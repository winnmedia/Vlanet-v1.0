// 우선순위가 높은 인증 관련 수정 사항 추출
const fs = require('fs');
const path = require('path');

// 색상 코드
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m'
};

// auth-error-report.json 읽기
const reportPath = path.join(__dirname, 'auth-error-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// 우선순위가 높은 파일들 (사용자가 자주 사용하는 기능)
const priorityFiles = [
  'Feedback.jsx',           // 영상 업로드 문제
  'ProjectCreate.jsx',      // 프로젝트 생성
  'ProjectDetail.jsx',      // 프로젝트 상세
  'ProfileEdit.jsx',        // 프로필 수정
  'DocumentUpload.jsx',     // 문서 업로드
  'VideoPlanning.jsx',      // 영상 기획
  'FeedbackInput.jsx',      // 피드백 입력
  'OpinionInput.jsx',       // 의견 입력
];

// 우선순위 이슈 추출
const priorityIssues = report.issues.filter(({ file }) => 
  priorityFiles.some(priority => file.includes(priority))
);

console.log(`${COLORS.RED}=== 즉시 수정이 필요한 인증 문제 ===${COLORS.RESET}\n`);
console.log(`총 ${priorityIssues.length}개 핵심 파일에서 문제 발견\n`);

// 파일별로 그룹화
const issuesByType = {
  formDataWithoutAuth: [],
  missingAuthCheck: [],
  directHttpCalls: [],
  inadequateErrorHandling: []
};

priorityIssues.forEach(({ file, issues }) => {
  issues.forEach(issue => {
    if (issuesByType[issue.type]) {
      issuesByType[issue.type].push({ file, ...issue });
    }
  });
});

// 1. FormData 업로드 문제 (영상 업로드와 같은 유형)
console.log(`${COLORS.RED}1. 파일 업로드 시 인증 토큰 누락 (영상 업로드와 동일한 문제)${COLORS.RESET}\n`);
if (issuesByType.formDataWithoutAuth.length > 0) {
  issuesByType.formDataWithoutAuth.forEach(issue => {
    console.log(`  📁 ${path.basename(issue.file)}`);
    console.log(`     Line ${issue.line}: FormData 전송 시 토큰 설정 필요`);
    console.log(`     ${COLORS.YELLOW}수정 방법:${COLORS.RESET}`);
    console.log(`     const token = checkSession();`);
    console.log(`     const config = { headers: { 'Authorization': \`Bearer \${token}\` } };`);
    console.log();
  });
}

// 2. 페이지 인증 체크 누락
console.log(`${COLORS.RED}2. 페이지 로드 시 로그인 체크 누락${COLORS.RESET}\n`);
const authCheckMissing = priorityIssues.filter(({ issues }) => 
  issues.some(i => i.type === 'missingAuthCheck')
);

if (authCheckMissing.length > 0) {
  authCheckMissing.forEach(({ file }) => {
    console.log(`  📄 ${path.basename(file)}`);
    console.log(`     ${COLORS.YELLOW}추가 필요:${COLORS.RESET}`);
    console.log(`     useEffect(() => {`);
    console.log(`       if (!checkSession()) navigate('/login');`);
    console.log(`     }, []);`);
    console.log();
  });
}

// 3. 직접 HTTP 호출
console.log(`${COLORS.RED}3. axios 직접 호출 (토큰 자동 추가 안됨)${COLORS.RESET}\n`);
const directCalls = priorityIssues.filter(({ issues }) => 
  issues.some(i => i.type === 'directHttpCalls')
);

if (directCalls.length > 0) {
  directCalls.forEach(({ file, issues }) => {
    const directIssues = issues.filter(i => i.type === 'directHttpCalls');
    console.log(`  🔗 ${path.basename(file)}`);
    directIssues.forEach(issue => {
      console.log(`     Line ${issue.line}: ${issue.match}`);
      console.log(`     ${COLORS.YELLOW}변경:${COLORS.RESET} axiosCredentials() 사용`);
    });
    console.log();
  });
}

// 4. 구체적인 수정 예시
console.log(`${COLORS.BLUE}=== 구체적인 수정 예시 ===${COLORS.RESET}\n`);

console.log(`${COLORS.CYAN}1. Feedback.jsx - 영상 업로드 수정${COLORS.RESET}`);
console.log(`\`\`\`javascript
// 현재 (문제)
FeedbackFile(formData, project_id, onUploadProgress)
  .catch(err => {
    window.alert('파일 업로드 중 오류가 발생했습니다.');
  });

// 수정 후
FeedbackFile(formData, project_id, onUploadProgress)
  .catch(err => {
    if (err.response?.status === 401) {
      toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
      navigate('/login');
    } else if (err.response?.status === 413) {
      toast.error('파일 크기가 너무 큽니다. 600MB 이하만 가능합니다.');
    } else {
      toast.error('업로드 중 오류가 발생했습니다.');
    }
  });
\`\`\`\n`);

console.log(`${COLORS.CYAN}2. ProjectCreate.jsx - 프로젝트 생성 시 인증${COLORS.RESET}`);
console.log(`\`\`\`javascript
// 컴포넌트 상단에 추가
useEffect(() => {
  const token = checkSession();
  if (!token) {
    toast.error('로그인이 필요한 서비스입니다.');
    navigate('/login');
  }
}, []);
\`\`\`\n`);

console.log(`${COLORS.CYAN}3. 모든 API 호출 수정${COLORS.RESET}`);
console.log(`\`\`\`javascript
// 변경 전
axios.post('/api/endpoint', data)

// 변경 후
import { axiosCredentials } from 'util/util';
axiosCredentials('post', '/api/endpoint', data)
\`\`\`\n`);

// 요약
console.log(`${COLORS.GREEN}=== 수정 우선순위 ===${COLORS.RESET}\n`);
console.log('1. 🔴 Feedback.jsx - 영상 업로드 인증 처리');
console.log('2. 🔴 ProjectCreate.jsx - 프로젝트 생성 인증 체크');
console.log('3. 🔴 모든 FormData 업로드에 토큰 추가');
console.log('4. 🟡 페이지 컴포넌트에 useEffect 인증 체크 추가');
console.log('5. 🟡 axios 직접 호출을 axiosCredentials로 변경');
console.log('6. 🟢 에러 메시지를 정확하게 표시 (401 vs 404 구분)');

// 추가 권장사항
console.log(`\n${COLORS.MAGENTA}💡 추가 권장사항${COLORS.RESET}\n`);
console.log('- PrivateRoute 컴포넌트 생성하여 라우트 레벨에서 보호');
console.log('- 중앙화된 에러 핸들러 사용 (handleApiError)');
console.log('- 토큰 만료 시간 체크 및 자동 갱신');
console.log('- 로그인 상태 전역 관리 (Redux/Context)');

console.log(`\n${COLORS.GREEN}✅ 이러한 수정을 통해 "404 에러"로 나타나는 인증 문제들이 해결됩니다.${COLORS.RESET}`);