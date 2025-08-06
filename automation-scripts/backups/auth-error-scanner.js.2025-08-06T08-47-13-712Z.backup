// 인증 관련 에러 패턴 스캐너
// 404 에러로 나타나지만 실제로는 401 인증 문제인 경우들을 찾아냅니다

const fs = require('fs');
const path = require('path');
const glob = require('glob');

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

// 검사할 패턴들
const errorPatterns = {
  // 1. 인증이 필요한 페이지인데 로그인 체크가 없는 경우
  missingAuthCheck: {
    pattern: /useEffect|componentDidMount/g,
    exclude: /checkSession|localStorage\.getItem\(['"]VGID['"]|isAuthenticated|token/,
    description: '페이지 로드 시 인증 체크가 없음',
    severity: 'high'
  },

  // 2. API 호출 시 에러 처리가 미흡한 경우
  inadequateErrorHandling: {
    pattern: /\.then\s*\([^)]*\)\s*\.catch/g,
    exclude: /401|403|인증|로그인|unauthorized/i,
    description: 'API 에러 처리에서 인증 실패 케이스 누락',
    severity: 'medium'
  },

  // 3. 인증 없이 보호된 라우트 접근
  unprotectedRoutes: {
    pattern: /<Route\s+path=["'][^"']*["']/g,
    exclude: /PrivateRoute|requireAuth|isAuthenticated|Login|login/,
    description: '인증 보호가 없는 라우트',
    severity: 'high'
  },

  // 4. FormData 전송 시 토큰 누락
  formDataWithoutAuth: {
    pattern: /new\s+FormData\(\)|formData\.append/g,
    followUp: /Authorization|Bearer|token/,
    maxDistance: 20, // 20줄 이내에 토큰 설정이 있어야 함
    description: 'FormData 전송 시 인증 토큰 설정 누락 가능성',
    severity: 'high'
  },

  // 5. axios/fetch 직접 사용 (인터셉터 우회)
  directHttpCalls: {
    pattern: /axios\.(get|post|put|delete|patch)\(|fetch\(/g,
    exclude: /axiosCredentials|axiosOpts|axios\(config\)/,
    description: 'axios 인터셉터를 우회하는 직접 호출',
    severity: 'medium'
  },

  // 6. 401/403 에러를 404로 잘못 표시하는 경우
  misleadingErrorMessages: {
    pattern: /404|not found|찾을 수 없/gi,
    context: /catch|error|err\.|\.status\s*===?\s*404/,
    description: '404 에러 메시지가 실제로는 인증 문제일 가능성',
    severity: 'low'
  },

  // 7. 로그인 상태 확인 없이 민감한 작업 수행
  sensitiveActionsWithoutAuth: {
    pattern: /upload|delete|create|update|수정|삭제|생성|업로드/gi,
    exclude: /if\s*\(\s*.*token|isAuthenticated|checkSession/,
    description: '민감한 작업 전 인증 확인 누락',
    severity: 'high'
  },

  // 8. 토큰 만료 처리 누락
  missingTokenExpiry: {
    pattern: /localStorage\.getItem\(['"]VGID['"]\)|token/g,
    exclude: /exp|expire|만료|decode|jwt/i,
    description: '토큰 만료 시간 확인 로직 누락',
    severity: 'medium'
  },

  // 9. 하드코딩된 URL (API base URL 설정 미사용)
  hardcodedUrls: {
    pattern: /["']https?:\/\/[^"']+\/api|localhost:\d+\/api/g,
    description: 'API URL이 하드코딩되어 있음',
    severity: 'low'
  },

  // 10. 페이지 새로고침 시 인증 상태 유실
  authStateLoss: {
    pattern: /window\.location\.reload|location\.reload/g,
    exclude: /localStorage|sessionStorage|cookie/,
    description: '페이지 새로고침 시 인증 상태 보존 미흡',
    severity: 'medium'
  }
};

// 파일 스캔 함수
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  Object.entries(errorPatterns).forEach(([key, pattern]) => {
    if (pattern.pattern.test(content)) {
      if (pattern.exclude && pattern.exclude.test(content)) {
        return; // 제외 패턴이 있으면 건너뛰기
      }

      if (pattern.followUp) {
        // followUp 패턴 검사
        const matches = content.match(pattern.pattern) || [];
        matches.forEach(match => {
          const matchIndex = content.indexOf(match);
          const nearbyContent = content.substring(
            Math.max(0, matchIndex - 500),
            Math.min(content.length, matchIndex + 500)
          );
          
          if (!pattern.followUp.test(nearbyContent)) {
            const lineNumber = content.substring(0, matchIndex).split('\n').length;
            issues.push({
              type: key,
              line: lineNumber,
              match: match.trim(),
              ...pattern
            });
          }
        });
      } else if (pattern.context) {
        // context 패턴 검사
        lines.forEach((line, index) => {
          if (pattern.pattern.test(line) && pattern.context.test(line)) {
            issues.push({
              type: key,
              line: index + 1,
              match: line.trim(),
              ...pattern
            });
          }
        });
      } else {
        // 일반 패턴 검사
        const matches = content.match(pattern.pattern) || [];
        matches.forEach(match => {
          const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
          issues.push({
            type: key,
            line: lineNumber,
            match: match.trim(),
            ...pattern
          });
        });
      }
    }
  });

  return issues;
}

// 특정 에러 타입별 개선 제안
const improvements = {
  missingAuthCheck: `
// 페이지 컴포넌트에 인증 체크 추가
useEffect(() => {
  const token = checkSession();
  if (!token) {
    navigate('/login');
  }
}, []);`,

  inadequateErrorHandling: `
.catch(error => {
  if (error.response?.status === 401) {
    toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
    navigate('/login');
  } else if (error.response?.status === 403) {
    toast.error('권한이 없습니다.');
  } else {
    handleApiError(error);
  }
});`,

  formDataWithoutAuth: `
const token = checkSession();
const config = {
  headers: {
    'Authorization': \`Bearer \${token}\`,
    // FormData는 Content-Type을 자동 설정
  }
};`,

  directHttpCalls: `
// axios 직접 호출 대신 래퍼 함수 사용
import { axiosCredentials } from 'util/util';

// 변경 전: axios.post(url, data)
// 변경 후: axiosCredentials('post', url, data)`,

  unprotectedRoutes: `
// 보호된 라우트 사용
<PrivateRoute path="/protected" element={<ProtectedPage />} />

// 또는 HOC 사용
const ProtectedPage = requireAuth(PageComponent);`
};

// 메인 실행 함수
async function main() {
  console.log(`${COLORS.BLUE}=== VideoPlanet 인증 관련 에러 패턴 검사 ===${COLORS.RESET}\n`);

  const srcDir = path.join(__dirname, '..');
  const pattern = path.join(srcDir, '**/*.{js,jsx,ts,tsx}');
  
  // 제외할 디렉토리
  const excludeDirs = ['node_modules', 'build', 'dist', '.next', 'tests'];
  
  const files = glob.sync(pattern, {
    ignore: excludeDirs.map(dir => `**/${dir}/**`)
  });

  console.log(`검사할 파일 수: ${files.length}\n`);

  const allIssues = [];
  const stats = {
    high: 0,
    medium: 0,
    low: 0
  };

  files.forEach(file => {
    const issues = scanFile(file);
    if (issues.length > 0) {
      allIssues.push({ file, issues });
      issues.forEach(issue => {
        stats[issue.severity]++;
      });
    }
  });

  // 결과 출력
  console.log(`${COLORS.YELLOW}=== 검사 결과 ===${COLORS.RESET}\n`);
  console.log(`총 ${allIssues.length}개 파일에서 문제 발견\n`);

  // 심각도별 통계
  console.log(`${COLORS.RED}🔴 높음: ${stats.high}개${COLORS.RESET}`);
  console.log(`${COLORS.YELLOW}🟡 중간: ${stats.medium}개${COLORS.RESET}`);
  console.log(`${COLORS.GREEN}🟢 낮음: ${stats.low}개${COLORS.RESET}\n`);

  // 심각도 높은 이슈부터 출력
  const severityOrder = ['high', 'medium', 'low'];
  const severityColors = {
    high: COLORS.RED,
    medium: COLORS.YELLOW,
    low: COLORS.GREEN
  };

  severityOrder.forEach(severity => {
    const issuesOfSeverity = allIssues.filter(({ issues }) => 
      issues.some(issue => issue.severity === severity)
    );

    if (issuesOfSeverity.length > 0) {
      console.log(`${severityColors[severity]}=== ${severity.toUpperCase()} 심각도 이슈 ===${COLORS.RESET}\n`);

      issuesOfSeverity.forEach(({ file, issues }) => {
        const relevantIssues = issues.filter(issue => issue.severity === severity);
        if (relevantIssues.length > 0) {
          console.log(`${COLORS.CYAN}파일: ${path.relative(srcDir, file)}${COLORS.RESET}`);
          
          relevantIssues.forEach(issue => {
            console.log(`  ${severityColors[severity]}[${issue.type}]${COLORS.RESET} Line ${issue.line}: ${issue.description}`);
            console.log(`  매치: ${issue.match}`);
            
            if (improvements[issue.type]) {
              console.log(`  ${COLORS.MAGENTA}💡 개선 제안:${COLORS.RESET}`);
              console.log(improvements[issue.type].split('\n').map(line => '    ' + line).join('\n'));
            }
            console.log();
          });
        }
      });
    }
  });

  // 요약 및 권장사항
  console.log(`${COLORS.BLUE}=== 권장 조치사항 ===${COLORS.RESET}\n`);
  console.log('1. 모든 보호된 페이지에 인증 체크 추가');
  console.log('2. API 에러 처리에서 401/403 명시적 처리');
  console.log('3. FormData 전송 시 항상 인증 토큰 포함');
  console.log('4. axios 직접 호출 대신 인터셉터가 있는 래퍼 사용');
  console.log('5. 에러 메시지를 정확하게 표시 (404 vs 401 구분)');

  // JSON 파일로 저장
  const reportPath = path.join(__dirname, 'auth-error-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    scanDate: new Date().toISOString(),
    totalFiles: files.length,
    filesWithIssues: allIssues.length,
    statistics: stats,
    issues: allIssues
  }, null, 2));

  console.log(`\n${COLORS.GREEN}✓ 상세 보고서 저장됨: ${reportPath}${COLORS.RESET}`);
}

// 실행
main().catch(console.error);