/**
 * 사용자 여정 시나리오 기반 에러 분석 및 디버깅 (수정판)
 * VideoPlanet 전체 사용자 플로우 테스트
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 테스트 환경 설정
const BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3001';

// 테스트 사용자 정보 (백엔드 API에 맞게 수정)
const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123!',
    nickname: `testuser_${Date.now().toString().slice(-6)}` // 닉네임으로 변경
};

// 테스트 결과 저장
const testResults = {
    passed: [],
    failed: [],
    warnings: []
};

// 컬러 출력 헬퍼
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 로그 함수들
function logStep(step) {
    console.log(`\n${colors.blue}[단계] ${step}${colors.reset}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✓ ${message}${colors.reset}`);
    testResults.passed.push(message);
}

function logError(message, error) {
    console.log(`${colors.red}✗ ${message}${colors.reset}`);
    if (error) {
        console.log(`  ${colors.yellow}에러: ${error.message || error}${colors.reset}`);
        if (error.response?.data) {
            console.log(`  ${colors.yellow}응답: ${JSON.stringify(error.response.data)}${colors.reset}`);
        }
    }
    testResults.failed.push({ message, error: error?.message || error });
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
    testResults.warnings.push(message);
}

function logInfo(message) {
    console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

// axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 토큰 저장 변수
let authToken = null;
let testUserId = null;
let testProjectId = null;

// 1. 회원가입 플로우 테스트
async function testSignupFlow() {
    logStep('1. 회원가입 플로우 테스트');
    
    try {
        // 1-1. 이메일 중복 체크
        logInfo('이메일 중복 체크 테스트');
        const emailCheckResponse = await api.post('/users/check-email/', {
            email: testUser.email
        });
        
        if (emailCheckResponse.data.available) {
            logSuccess('이메일 사용 가능 확인');
        } else {
            logWarning('이메일이 이미 사용 중');
            // 새로운 이메일로 재시도
            testUser.email = `test_${Date.now()}_retry@example.com`;
        }
        
        // 1-2. 회원가입 (올바른 필드 사용)
        logInfo('회원가입 진행');
        const signupData = {
            email: testUser.email,
            password: testUser.password,
            nickname: testUser.nickname
        };
        
        console.log(`  ${colors.cyan}회원가입 데이터: ${JSON.stringify(signupData)}${colors.reset}`);
        
        const signupResponse = await api.post('/users/signup/', signupData);
        
        if (signupResponse.status === 201) {
            logSuccess('회원가입 성공');
            if (signupResponse.data.user) {
                testUserId = signupResponse.data.user;
                logInfo(`생성된 사용자: ${testUserId}`);
            }
        }
        
    } catch (error) {
        logError('회원가입 실패', error);
    }
}

// 2. 로그인 플로우 테스트
async function testLoginFlow() {
    logStep('2. 로그인 플로우 테스트');
    
    try {
        // 2-1. 로그인
        logInfo('로그인 시도');
        const loginData = {
            email: testUser.email,
            password: testUser.password
        };
        
        console.log(`  ${colors.cyan}로그인 데이터: ${JSON.stringify(loginData)}${colors.reset}`);
        
        const loginResponse = await api.post('/users/login/', loginData);
        
        if (loginResponse.data.token || loginResponse.data.access) {
            authToken = loginResponse.data.token || loginResponse.data.access;
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            logSuccess('로그인 성공 - 토큰 발급됨');
            
            // 사용자 정보 저장
            if (loginResponse.data.user) {
                testUserId = loginResponse.data.user.id || loginResponse.data.user.user_id;
                logInfo(`로그인한 사용자 ID: ${testUserId}`);
            }
        }
        
        // 2-2. 토큰 검증
        logInfo('인증 토큰 검증');
        const verifyResponse = await api.get('/users/profile/');
        
        if (verifyResponse.data) {
            logSuccess('토큰 검증 성공 - 사용자 정보 조회 가능');
        }
        
    } catch (error) {
        logError('로그인 플로우 오류', error);
    }
}

// 3. 프로젝트 생성 및 관리 플로우 테스트
async function testProjectFlow() {
    logStep('3. 프로젝트 생성 및 관리 플로우 테스트');
    
    if (!authToken) {
        logWarning('인증 토큰이 없어 프로젝트 테스트를 건너뜁니다');
        return;
    }
    
    try {
        // 3-1. 프로젝트 생성
        logInfo('새 프로젝트 생성');
        const projectData = {
            project_name: `테스트 프로젝트 ${Date.now()}`,
            client_company: '테스트 클라이언트',
            production_company: '테스트 프로덕션',
            project_description: '사용자 여정 테스트를 위한 프로젝트',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        
        console.log(`  ${colors.cyan}프로젝트 데이터: ${JSON.stringify(projectData)}${colors.reset}`);
        
        const projectResponse = await api.post('/projects/', projectData);
        
        if (projectResponse.data.id) {
            testProjectId = projectResponse.data.id;
            logSuccess(`프로젝트 생성 성공 (ID: ${testProjectId})`);
        }
        
        // 3-2. 프로젝트 목록 조회
        logInfo('프로젝트 목록 조회');
        const projectListResponse = await api.get('/projects/');
        
        if (Array.isArray(projectListResponse.data) || Array.isArray(projectListResponse.data.results)) {
            const projects = projectListResponse.data.results || projectListResponse.data;
            logSuccess(`프로젝트 목록 조회 성공 (${projects.length}개)`);
        }
        
        // 3-3. 프로젝트 상세 조회
        if (testProjectId) {
            logInfo('프로젝트 상세 정보 조회');
            const projectDetailResponse = await api.get(`/projects/${testProjectId}/`);
            
            if (projectDetailResponse.data.id === testProjectId) {
                logSuccess('프로젝트 상세 조회 성공');
            }
        }
        
    } catch (error) {
        logError('프로젝트 플로우 오류', error);
    }
}

// 4. 영상 기획 작성 플로우 테스트
async function testPlanningFlow() {
    logStep('4. 영상 기획 작성 플로우 테스트');
    
    if (!testProjectId || !authToken) {
        logWarning('프로젝트 ID 또는 인증 토큰이 없어 영상 기획 테스트를 건너뜁니다');
        return;
    }
    
    try {
        // 4-1. 기획안 생성
        logInfo('새 기획안 생성');
        const planningData = {
            project_id: testProjectId,
            title: '테스트 영상 기획',
            objective: '사용자 여정 테스트',
            target_audience: '일반 사용자',
            key_message: '테스트 메시지',
            video_length: '3분',
            video_style: '다큐멘터리',
            reference_links: ['https://example.com'],
            budget: '1000만원',
            timeline: '2주',
            planning_data: {
                sections: [
                    {
                        title: '인트로',
                        duration: '30초',
                        description: '프로젝트 소개'
                    }
                ]
            }
        };
        
        const planningResponse = await api.post('/projects/video-planning/', planningData);
        
        if (planningResponse.data.id) {
            logSuccess('영상 기획안 생성 성공');
        }
        
        // 4-2. 30초 영상 기획 테스트
        logInfo('30초 영상 기획 생성');
        const shortPlanningResponse = await api.post('/video-planning/30s-planning/', {
            project_id: testProjectId,
            product_name: '테스트 제품',
            target_audience: '20-30대',
            key_features: ['특징1', '특징2', '특징3'],
            tone_manner: 'professional'
        });
        
        if (shortPlanningResponse.data) {
            logSuccess('30초 영상 기획 생성 성공');
        }
        
    } catch (error) {
        logError('영상 기획 플로우 오류', error);
    }
}

// 5. 피드백 시스템 플로우 테스트
async function testFeedbackFlow() {
    logStep('5. 피드백 시스템 플로우 테스트');
    
    if (!testProjectId || !authToken) {
        logWarning('프로젝트 ID 또는 인증 토큰이 없어 피드백 테스트를 건너뜁니다');
        return;
    }
    
    try {
        // 5-1. 피드백 작성
        logInfo('텍스트 피드백 작성');
        const feedbackData = {
            content: '테스트 피드백입니다. 영상의 전반적인 구성이 좋습니다.',
            timestamp: '00:00:30',
            feedback_type: 'general'
        };
        
        const feedbackResponse = await api.post(`/projects/${testProjectId}/feedback/`, feedbackData);
        
        if (feedbackResponse.data.id) {
            logSuccess('피드백 작성 성공');
        }
        
        // 5-2. 피드백 목록 조회
        logInfo('피드백 목록 조회');
        const feedbackListResponse = await api.get(`/projects/${testProjectId}/feedback/`);
        
        if (Array.isArray(feedbackListResponse.data)) {
            logSuccess(`피드백 목록 조회 성공 (${feedbackListResponse.data.length}개)`);
        }
        
        // 5-3. 피드백 파일 업로드 엔드포인트 확인
        logInfo('피드백 파일 업로드 엔드포인트 확인');
        logWarning('실제 파일 업로드는 파일이 필요하여 건너뜁니다');
        
    } catch (error) {
        logError('피드백 시스템 플로우 오류', error);
    }
}

// 6. 워크플로우 관리 테스트
async function testWorkflowFlow() {
    logStep('6. 워크플로우 관리 테스트');
    
    if (!testProjectId || !authToken) {
        logWarning('프로젝트 ID 또는 인증 토큰이 없어 워크플로우 테스트를 건너뜁니다');
        return;
    }
    
    try {
        // 6-1. 워크플로우 단계 조회
        logInfo('프로젝트 워크플로우 단계 조회');
        const workflowResponse = await api.get(`/projects/${testProjectId}/workflow/`);
        
        if (workflowResponse.data) {
            logSuccess('워크플로우 단계 조회 성공');
        }
        
        // 6-2. 작업 생성
        logInfo('새 작업 생성');
        const taskData = {
            title: '스토리보드 작성',
            description: '영상 스토리보드 초안 작성',
            stage: 'planning',
            assignee_email: testUser.email,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high'
        };
        
        const taskResponse = await api.post(`/projects/${testProjectId}/tasks/`, taskData);
        
        if (taskResponse.data.id) {
            logSuccess('작업 생성 성공');
        }
        
    } catch (error) {
        logError('워크플로우 관리 오류', error);
    }
}

// 7. 내보내기 기능 테스트
async function testExportFlow() {
    logStep('7. 내보내기 기능 테스트');
    
    if (!testProjectId || !authToken) {
        logWarning('프로젝트 ID 또는 인증 토큰이 없어 내보내기 테스트를 건너뜁니다');
        return;
    }
    
    try {
        // 7-1. PDF 내보내기
        logInfo('기획안 PDF 내보내기');
        const pdfData = {
            project_id: testProjectId,
            include_feedback: true,
            include_timeline: true,
            format: 'landscape' // 가로형 보고서
        };
        
        const pdfResponse = await api.post(`/projects/${testProjectId}/export-pdf/`, pdfData);
        
        if (pdfResponse.data.pdf_url || pdfResponse.data.status === 'processing') {
            logSuccess('PDF 내보내기 요청 성공');
        }
        
    } catch (error) {
        logError('내보내기 기능 오류', error);
    }
}

// 8. 프론트엔드 페이지 접근성 테스트
async function testFrontendAccessibility() {
    logStep('8. 프론트엔드 페이지 접근성 테스트');
    
    // 먼저 프론트엔드 서버가 실행 중인지 확인
    let frontendPort = 3001;
    try {
        await axios.get(`http://localhost:${frontendPort}`, { timeout: 1000 });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            // 3001이 안되면 3000 시도
            frontendPort = 3000;
            try {
                await axios.get(`http://localhost:${frontendPort}`, { timeout: 1000 });
            } catch (e) {
                logError('프론트엔드 서버가 실행되지 않고 있습니다', 'npm run dev 실행 필요');
                return;
            }
        }
    }
    
    const pages = [
        { url: '/', name: '홈페이지' },
        { url: '/login', name: '로그인 페이지' },
        { url: '/signup', name: '회원가입 페이지' },
        { url: '/cmshome', name: 'CMS 홈', auth: true },
        { url: '/project/create', name: '프로젝트 생성', auth: true },
        { url: '/videoplanning', name: '영상 기획', auth: true },
        { url: '/mypage', name: '마이페이지', auth: true }
    ];
    
    for (const page of pages) {
        try {
            const headers = page.auth && authToken ? {
                'Authorization': `Bearer ${authToken}`,
                'Cookie': authToken ? `token=${authToken}` : ''
            } : {};
            
            const response = await axios.get(`http://localhost:${frontendPort}${page.url}`, {
                headers,
                validateStatus: () => true,
                timeout: 5000
            });
            
            if (response.status === 200) {
                logSuccess(`${page.name} 접근 가능`);
            } else if (response.status === 401 && page.auth) {
                logWarning(`${page.name} - 인증 필요 (정상)`);
            } else if (response.status === 302 || response.status === 307) {
                logInfo(`${page.name} - 리다이렉션 (${response.status})`);
            } else {
                logError(`${page.name} 접근 오류`, `상태 코드: ${response.status}`);
            }
        } catch (error) {
            logError(`${page.name} 접근 실패`, error);
        }
    }
}

// 9. 정리 작업
async function cleanup() {
    logStep('9. 테스트 정리 작업');
    
    try {
        // 생성된 프로젝트 삭제
        if (testProjectId && authToken) {
            await api.delete(`/projects/${testProjectId}/`);
            logSuccess('테스트 프로젝트 삭제 완료');
        }
        
    } catch (error) {
        logWarning('정리 작업 중 오류 발생', error);
    }
}

// 테스트 결과 요약
function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.magenta}테스트 결과 요약${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log(`\n${colors.green}✓ 성공: ${testResults.passed.length}개${colors.reset}`);
    testResults.passed.forEach(test => {
        console.log(`  - ${test}`);
    });
    
    if (testResults.warnings.length > 0) {
        console.log(`\n${colors.yellow}⚠ 경고: ${testResults.warnings.length}개${colors.reset}`);
        testResults.warnings.forEach(warning => {
            console.log(`  - ${warning}`);
        });
    }
    
    if (testResults.failed.length > 0) {
        console.log(`\n${colors.red}✗ 실패: ${testResults.failed.length}개${colors.reset}`);
        testResults.failed.forEach(failure => {
            console.log(`  - ${failure.message}`);
            if (failure.error) {
                console.log(`    └─ ${failure.error}`);
            }
        });
    }
    
    // 전체 성공률
    const total = testResults.passed.length + testResults.failed.length;
    const successRate = total > 0 ? (testResults.passed.length / total * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.cyan}전체 성공률: ${successRate}%${colors.reset}`);
    console.log('='.repeat(60));
    
    // 권장 사항
    if (testResults.failed.length > 0) {
        console.log(`\n${colors.yellow}[권장 개선 사항]${colors.reset}`);
        console.log('1. 백엔드 API 문서화 강화');
        console.log('2. 프론트엔드 개발 서버 자동 시작 스크립트 추가');
        console.log('3. 통합 테스트 자동화 CI/CD 파이프라인 구축');
        console.log('4. 에러 핸들링 및 로깅 개선');
    }
    
    // 결과를 파일로 저장
    const resultFile = path.join(__dirname, `test-results-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
    console.log(`\n결과가 ${resultFile}에 저장되었습니다.`);
}

// 메인 테스트 실행 함수
async function runAllTests() {
    console.log(`${colors.magenta}========================================${colors.reset}`);
    console.log(`${colors.magenta}VideoPlanet 사용자 여정 통합 테스트${colors.reset}`);
    console.log(`${colors.magenta}========================================${colors.reset}`);
    console.log(`시작 시간: ${new Date().toLocaleString('ko-KR')}`);
    
    try {
        // 순차적으로 모든 테스트 실행
        await testSignupFlow();
        await testLoginFlow();
        await testProjectFlow();
        await testPlanningFlow();
        await testFeedbackFlow();
        await testWorkflowFlow();
        await testExportFlow();
        await testFrontendAccessibility();
        await cleanup();
        
    } catch (error) {
        console.error(`\n${colors.red}치명적 오류 발생:${colors.reset}`, error);
    } finally {
        printSummary();
    }
}

// 테스트 실행
runAllTests().catch(console.error);