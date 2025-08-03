/**
 * 사용자 여정 시나리오 기반 에러 분석 및 디버깅
 * VideoPlanet 전체 사용자 플로우 테스트
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 테스트 환경 설정
const BASE_URL = 'http://localhost:8000/api';
const FRONTEND_URL = 'http://localhost:3001';

// 테스트 사용자 정보
const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123!',
    username: `testuser_${Date.now()}`,
    phone: '010-1234-5678',
    organization: '테스트 회사'
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
    timeout: 30000
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
        }
        
        // 1-2. 회원가입
        logInfo('회원가입 진행');
        const signupResponse = await api.post('/users/signup/', {
            email: testUser.email,
            password: testUser.password,
            username: testUser.username,
            phone: testUser.phone,
            organization: testUser.organization
        });
        
        if (signupResponse.status === 201) {
            logSuccess('회원가입 성공');
            testUserId = signupResponse.data.user_id;
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
        const loginResponse = await api.post('/users/login/', {
            email: testUser.email,
            password: testUser.password
        });
        
        if (loginResponse.data.token) {
            authToken = loginResponse.data.token;
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            logSuccess('로그인 성공 - 토큰 발급됨');
        }
        
        // 2-2. 사용자 정보 조회
        logInfo('로그인한 사용자 정보 조회');
        const userInfoResponse = await api.get('/users/profile/');
        
        if (userInfoResponse.data.email === testUser.email) {
            logSuccess('사용자 정보 조회 성공');
        }
        
    } catch (error) {
        logError('로그인 플로우 오류', error);
    }
}

// 3. 프로젝트 생성 및 관리 플로우 테스트
async function testProjectFlow() {
    logStep('3. 프로젝트 생성 및 관리 플로우 테스트');
    
    try {
        // 3-1. 프로젝트 생성
        logInfo('새 프로젝트 생성');
        const projectResponse = await api.post('/projects/', {
            project_name: `테스트 프로젝트 ${Date.now()}`,
            client_company: '테스트 클라이언트',
            production_company: '테스트 프로덕션',
            project_description: '사용자 여정 테스트를 위한 프로젝트',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        
        if (projectResponse.data.id) {
            testProjectId = projectResponse.data.id;
            logSuccess(`프로젝트 생성 성공 (ID: ${testProjectId})`);
        }
        
        // 3-2. 프로젝트 목록 조회
        logInfo('프로젝트 목록 조회');
        const projectListResponse = await api.get('/projects/');
        
        if (Array.isArray(projectListResponse.data.results)) {
            logSuccess(`프로젝트 목록 조회 성공 (${projectListResponse.data.results.length}개)`);
        }
        
        // 3-3. 프로젝트 상세 조회
        logInfo('프로젝트 상세 정보 조회');
        const projectDetailResponse = await api.get(`/projects/${testProjectId}/`);
        
        if (projectDetailResponse.data.id === testProjectId) {
            logSuccess('프로젝트 상세 조회 성공');
        }
        
    } catch (error) {
        logError('프로젝트 플로우 오류', error);
    }
}

// 4. 영상 기획 작성 플로우 테스트
async function testPlanningFlow() {
    logStep('4. 영상 기획 작성 플로우 테스트');
    
    if (!testProjectId) {
        logWarning('프로젝트 ID가 없어 영상 기획 테스트를 건너뜁니다');
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
        
        // 4-2. AI 기획 분석 테스트
        logInfo('AI 기획 분석 요청');
        const aiAnalysisResponse = await api.post('/projects/analyze-planning/', {
            project_id: testProjectId,
            planning_text: '30초 영상으로 제품의 특징을 효과적으로 전달하고 싶습니다.'
        });
        
        if (aiAnalysisResponse.data.suggestions) {
            logSuccess('AI 기획 분석 성공');
        }
        
    } catch (error) {
        logError('영상 기획 플로우 오류', error);
    }
}

// 5. 피드백 시스템 플로우 테스트
async function testFeedbackFlow() {
    logStep('5. 피드백 시스템 플로우 테스트');
    
    if (!testProjectId) {
        logWarning('프로젝트 ID가 없어 피드백 테스트를 건너뜁니다');
        return;
    }
    
    try {
        // 5-1. 파일 업로드 테스트 (실제 파일 없이 시뮬레이션)
        logInfo('피드백용 파일 업로드 시뮬레이션');
        // 실제 환경에서는 FormData로 파일 업로드
        logWarning('파일 업로드는 실제 파일이 필요하여 건너뜁니다');
        
        // 5-2. 피드백 작성
        logInfo('피드백 작성');
        const feedbackResponse = await api.post(`/projects/${testProjectId}/feedback/`, {
            content: '테스트 피드백입니다. 영상의 전반적인 구성이 좋습니다.',
            timestamp: '00:00:30',
            feedback_type: 'general'
        });
        
        if (feedbackResponse.data.id) {
            logSuccess('피드백 작성 성공');
        }
        
        // 5-3. 피드백 목록 조회
        logInfo('피드백 목록 조회');
        const feedbackListResponse = await api.get(`/projects/${testProjectId}/feedback/`);
        
        if (Array.isArray(feedbackListResponse.data)) {
            logSuccess(`피드백 목록 조회 성공 (${feedbackListResponse.data.length}개)`);
        }
        
    } catch (error) {
        logError('피드백 시스템 플로우 오류', error);
    }
}

// 6. 워크플로우 관리 테스트
async function testWorkflowFlow() {
    logStep('6. 워크플로우 관리 테스트');
    
    if (!testProjectId) {
        logWarning('프로젝트 ID가 없어 워크플로우 테스트를 건너뜁니다');
        return;
    }
    
    try {
        // 6-1. 워크플로우 단계 조회
        logInfo('프로젝트 워크플로우 단계 조회');
        const workflowResponse = await api.get(`/projects/${testProjectId}/workflow/`);
        
        if (workflowResponse.data.stages) {
            logSuccess('워크플로우 단계 조회 성공');
        }
        
        // 6-2. 작업 생성
        logInfo('새 작업 생성');
        const taskResponse = await api.post(`/projects/${testProjectId}/tasks/`, {
            title: '스토리보드 작성',
            description: '영상 스토리보드 초안 작성',
            assignee: testUser.email,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high'
        });
        
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
    
    if (!testProjectId) {
        logWarning('프로젝트 ID가 없어 내보내기 테스트를 건너뜁니다');
        return;
    }
    
    try {
        // 7-1. PDF 내보내기
        logInfo('기획안 PDF 내보내기');
        const pdfResponse = await api.post(`/projects/${testProjectId}/export-pdf/`, {
            include_feedback: true,
            include_timeline: true
        });
        
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
                'Authorization': `Bearer ${authToken}`
            } : {};
            
            const response = await axios.get(`${FRONTEND_URL}${page.url}`, {
                headers,
                validateStatus: () => true // 모든 상태 코드 허용
            });
            
            if (response.status === 200) {
                logSuccess(`${page.name} 접근 가능`);
            } else if (response.status === 401 && page.auth) {
                logWarning(`${page.name} - 인증 필요 (정상)`);
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
        
        // 테스트 사용자 삭제 (API가 있다면)
        // await api.delete('/users/profile/');
        
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