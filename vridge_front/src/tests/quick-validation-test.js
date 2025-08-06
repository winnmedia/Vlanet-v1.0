#!/usr/bin/env node
/**
 * VideoPlanet 빠른 검증 테스트
 * 주요 페이지와 컴포넌트의 렌더링 오류를 빠르게 확인
 */

const http = require('http');
const https = require('https');

const CONFIG = {
  frontend: 'http://localhost:3000',
  backend: 'http://localhost:8000',
  testUser: {
    email: 'ceo@winnmedia.co.kr',
    password: 'Qwerasdf!234'
  }
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 테스트 결과
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// HTTP 요청 헬퍼
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// 테스트 함수
async function test(name, fn) {
  results.total++;
  process.stdout.write(`  ${name}... `);
  
  try {
    const result = await fn();
    if (result) {
      results.passed++;
      console.log(`${colors.green}✓${colors.reset}`);
    } else {
      results.failed++;
      console.log(`${colors.red}✗${colors.reset}`);
    }
    return result;
  } catch (error) {
    results.failed++;
    results.errors.push({ test: name, error: error.message });
    console.log(`${colors.red}✗ (${error.message})${colors.reset}`);
    return false;
  }
}

// 메인 테스트
async function runTests() {
  console.log(`${colors.cyan}🚀 VideoPlanet 빠른 검증 테스트${colors.reset}`);
  console.log('================================\n');

  // 1. 백엔드 헬스체크
  console.log(`${colors.blue}1. 백엔드 API 테스트${colors.reset}`);
  
  await test('헬스체크 API', async () => {
    const res = await request(`${CONFIG.backend}/api/health/`);
    return res.status === 200;
  });

  await test('버전 정보 API', async () => {
    const res = await request(`${CONFIG.backend}/api/version/`);
    return res.status === 200;
  });

  // 2. 인증 테스트
  console.log(`\n${colors.blue}2. 인증 시스템 테스트${colors.reset}`);
  
  let accessToken = null;
  
  await test('로그인 API (개선된 엔드포인트)', async () => {
    const res = await request(`${CONFIG.backend}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: CONFIG.testUser.email,
        password: CONFIG.testUser.password
      })
    });
    
    if (res.status === 200) {
      const data = JSON.parse(res.data);
      accessToken = data.access_token;
      return !!accessToken;
    }
    return false;
  });

  await test('토큰 검증 API', async () => {
    if (!accessToken) return false;
    
    const res = await request(`${CONFIG.backend}/api/auth/verify/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: accessToken })
    });
    
    return res.status === 200;
  });

  await test('인증된 API 요청', async () => {
    if (!accessToken) return false;
    
    const res = await request(`${CONFIG.backend}/api/projects/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return res.status === 200;
  });

  // 3. 프론트엔드 페이지 테스트
  console.log(`\n${colors.blue}3. 프론트엔드 페이지 테스트${colors.reset}`);
  
  const pages = [
    { path: '/', name: '홈페이지' },
    { path: '/login', name: '로그인 페이지' },
    { path: '/cms/home', name: 'CMS 홈' },
    { path: '/cms/video-planning', name: '영상 기획' },
    { path: '/cms/feedback', name: '피드백' },
    { path: '/user/mypage', name: '마이페이지' }
  ];

  for (const page of pages) {
    await test(page.name, async () => {
      const res = await request(`${CONFIG.frontend}${page.path}`);
      
      // HTML 응답 확인
      if (res.status !== 200) return false;
      
      // React 오류 확인
      const hasError = res.data.includes('Error:') || 
                      res.data.includes('ReferenceError') ||
                      res.data.includes('TypeError') ||
                      res.data.includes('is not defined');
      
      return !hasError;
    });
  }

  // 4. 주요 컴포넌트 import 검증
  console.log(`\n${colors.blue}4. 컴포넌트 Import 검증${colors.reset}`);
  
  const fs = require('fs');
  const path = require('path');
  
  const componentsToCheck = [
    'ProjectDashboard.jsx',
    'ProjectForm.jsx',
    'ErrorBoundary.jsx',
    'LoadingSpinner.jsx',
    'Toast/Toast.jsx'
  ];

  for (const componentFile of componentsToCheck) {
    await test(`컴포넌트: ${componentFile}`, async () => {
      const filePath = path.join(__dirname, '..', '..', 'src', 'components', componentFile);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // import 문 체크
      const hasReactImport = content.includes('import React') || content.includes("from 'react'");
      
      // undefined 참조 가능성 체크
      const suspiciousPatterns = [
        /(\w+)Outlined(?!['"])/g,  // 아이콘 import 누락
        /use(\w+)(?!['"])/g,        // Hook import 누락
      ];
      
      let hasIssue = false;
      for (const pattern of suspiciousPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          // import 문에서 해당 항목이 있는지 확인
          for (const match of matches) {
            if (!content.includes(`import.*${match}`) && 
                !content.includes(`${match}.*from`)) {
              hasIssue = true;
              break;
            }
          }
        }
      }
      
      return hasReactImport && !hasIssue;
    });
  }

  // 5. 성능 체크
  console.log(`\n${colors.blue}5. 성능 체크${colors.reset}`);
  
  await test('API 응답 시간 (<1초)', async () => {
    const start = Date.now();
    await request(`${CONFIG.backend}/api/health/`);
    const duration = Date.now() - start;
    return duration < 1000;
  });

  await test('프론트엔드 로드 시간 (<3초)', async () => {
    const start = Date.now();
    await request(CONFIG.frontend);
    const duration = Date.now() - start;
    return duration < 3000;
  });

  // 결과 출력
  console.log('\n================================');
  console.log(`${colors.cyan}📊 테스트 결과${colors.reset}`);
  console.log('================================');
  console.log(`총 테스트: ${results.total}`);
  console.log(`${colors.green}✅ 통과: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ 실패: ${results.failed}${colors.reset}`);
  
  if (results.errors.length > 0) {
    console.log(`\n${colors.yellow}⚠️  오류 상세:${colors.reset}`);
    results.errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.test}: ${err.error}`);
    });
  }

  // 권장사항
  if (results.failed > 0) {
    console.log(`\n${colors.yellow}💡 권장사항:${colors.reset}`);
    console.log('  1. npm run dev로 개발 서버 실행 확인');
    console.log('  2. npm run build로 빌드 오류 확인');
    console.log('  3. 브라우저 콘솔에서 런타임 오류 확인');
    console.log('  4. import 누락 자동 수정: node auto-fix-imports.js');
  } else {
    console.log(`\n${colors.green}✨ 모든 테스트 통과! 배포 준비 완료${colors.reset}`);
  }

  // CI/CD용 종료 코드
  process.exit(results.failed > 0 ? 1 : 0);
}

// 실행
runTests().catch(console.error);