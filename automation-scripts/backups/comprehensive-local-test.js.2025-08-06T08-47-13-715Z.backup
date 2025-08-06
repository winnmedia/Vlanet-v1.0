/**
 * VideoPlanet 로컬 환경 포괄적 시스템 테스트
 * Q, the Gatekeeper of Truth - 모든 기능을 철저히 검증
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 로컬 환경 설정
const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

// 테스트 결과 저장소
const testResults = {
    startTime: new Date(),
    tests: {
        passed: [],
        failed: [],
        warnings: [],
        critical: []
    },
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        critical: 0
    }
};

// 색상 출력 헬퍼
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 로그 함수들
function logHeader(title) {
    console.log(`\n${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
}

function logSection(title) {
    console.log(`\n${colors.bright}${colors.cyan}🔍 ${title}${colors.reset}`);
}

function logTest(name, result, details = '', severity = 'normal') {
    const timestamp = new Date().toLocaleTimeString();
    testResults.summary.total++;
    
    if (result) {
        console.log(`${colors.green}✅ [${timestamp}] ${name}${colors.reset}`);
        if (details) console.log(`   ${colors.cyan}📝 ${details}${colors.reset}`);
        testResults.tests.passed.push({ name, details, timestamp });
        testResults.summary.passed++;
    } else {
        const prefix = severity === 'critical' ? '🚨' : '❌';
        const color = severity === 'critical' ? colors.red + colors.bright : colors.red;
        
        console.log(`${color}${prefix} [${timestamp}] ${name}${colors.reset}`);
        if (details) console.log(`   ${colors.red}❗ ${details}${colors.reset}`);
        
        if (severity === 'critical') {
            testResults.tests.critical.push({ name, details, timestamp });
            testResults.summary.critical++;
        } else {
            testResults.tests.failed.push({ name, details, timestamp });
            testResults.summary.failed++;
        }
    }
}

function logWarning(name, details = '') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors.yellow}⚠️  [${timestamp}] ${name}${colors.reset}`);
    if (details) console.log(`   ${colors.yellow}💡 ${details}${colors.reset}`);
    testResults.tests.warnings.push({ name, details, timestamp });
    testResults.summary.warnings++;
}

// API 클라이언트
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 테스트 데이터
let testUser = {
    email: `qa_test_${Date.now()}@example.com`,
    password: 'QATest123!@#',
    nickname: `QA_Tester_${Date.now().toString().slice(-6)}`
};

let authToken = null;
let testProjectId = null;
let testUserId = null;

// === 1. 서버 상태 및 기본 연결성 테스트 ===
async function testServerConnectivity() {
    logSection('서버 연결성 및 상태 검증');
    
    try {
        // 백엔드 헬스체크
        const healthResponse = await api.get('/api/health/');
        logTest('백엔드 헬스체크', healthResponse.status === 200, 
               `응답 시간: ${healthResponse.headers['x-response-time'] || 'N/A'}ms`);
        
        // 프론트엔드 연결 확인
        const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
        logTest('프론트엔드 서버 연결', frontendResponse.status === 200,
               `React 앱 로드됨`);
        
        // API 버전 및 환경 정보
        try {
            const versionResponse = await api.get('/api/version/');
            logTest('API 버전 정보', true, 
                   `버전: ${versionResponse.data.version || 'N/A'}`);
        } catch (error) {
            logWarning('API 버전 엔드포인트 미구현', 'API 버전 정보를 가져올 수 없음');
        }
        
    } catch (error) {
        logTest('서버 연결', false, 
               `연결 실패: ${error.message}`, 'critical');
        throw new Error('서버 연결 실패로 테스트 중단');
    }
}

// === 2. 인증 시스템 MECE 테스트 ===
async function testAuthenticationSystem() {
    logSection('인증 시스템 완전성 검증 (MECE)');
    
    // 2.1 회원가입 플로우
    try {
        // 이메일 중복 체크
        const emailCheckResponse = await api.post('/users/check-email/', {
            email: testUser.email
        });
        logTest('이메일 중복 체크 API', emailCheckResponse.status === 200,
               `이메일 사용 가능: ${emailCheckResponse.data.available}`);
        
        // 실제 회원가입
        const signupResponse = await api.post('/users/signup/', {
            email: testUser.email,
            password: testUser.password,
            nickname: testUser.nickname
        });
        logTest('회원가입 처리', signupResponse.status === 201,
               `사용자 생성됨: ${signupResponse.data.user || signupResponse.data.email}`);
        
        testUserId = signupResponse.data.user || signupResponse.data.email;
        
    } catch (error) {
        logTest('회원가입 플로우', false, 
               `오류: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    
    // 2.2 로그인 플로우
    try {
        const loginResponse = await api.post('/users/login/', {
            email: testUser.email,
            password: testUser.password
        });
        
        logTest('로그인 처리', loginResponse.status === 200,
               `토큰 길이: ${loginResponse.data.token?.length || 0} 문자`);
        
        // 토큰 추출 및 설정
        authToken = loginResponse.data.token || 
                   loginResponse.data.access ||
                   loginResponse.data.vridge_session;
        
        if (authToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            logTest('JWT 토큰 설정', true, `토큰 형식: Bearer ${authToken.substring(0, 20)}...`);
        } else {
            logTest('JWT 토큰 획득', false, '응답에 토큰이 없음', 'critical');
        }
        
    } catch (error) {
        logTest('로그인 플로우', false, 
               `오류: ${error.response?.status} - ${error.response?.data?.message || error.message}`, 'critical');
    }
    
    // 2.3 토큰 검증
    if (authToken) {
        try {
            const meResponse = await api.get('/users/me/');
            logTest('토큰 검증 (사용자 정보 조회)', meResponse.status === 200,
                   `인증된 사용자: ${meResponse.data.email || meResponse.data.nickname}`);
        } catch (error) {
            logTest('토큰 검증', false,
                   `인증 실패: ${error.response?.status} - ${error.message}`);
        }
    }
    
    // 2.4 잘못된 자격증명 테스트
    try {
        await api.post('/users/login/', {
            email: testUser.email,
            password: 'wrong_password'
        });
        logTest('잘못된 비밀번호 차단', false, '잘못된 자격증명이 허용됨', 'critical');
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 400) {
            logTest('잘못된 비밀번호 차단', true, '올바르게 인증 실패 처리됨');
        } else {
            logTest('잘못된 비밀번호 처리', false, `예상치 못한 응답: ${error.response?.status}`);
        }
    }
}

// === 3. 프로젝트 관리 시스템 테스트 ===
async function testProjectManagement() {
    logSection('프로젝트 관리 시스템 검증');
    
    if (!authToken) {
        logWarning('프로젝트 테스트 건너뜀', '인증 토큰이 없음');
        return;
    }
    
    // 3.1 프로젝트 목록 조회
    try {
        const projectListResponse = await api.get('/api/projects/');
        logTest('프로젝트 목록 조회', projectListResponse.status === 200,
               `현재 프로젝트 수: ${projectListResponse.data.results?.length || projectListResponse.data.length || 0}개`);
    } catch (error) {
        logTest('프로젝트 목록 조회', false,
               `오류: ${error.response?.status} - ${error.message}`);
    }
    
    // 3.2 프로젝트 생성
    const projectData = {
        name: `QA 테스트 프로젝트 ${Date.now()}`,
        manager: 'QA 테스터',
        consumer: '테스트 클라이언트',
        description: 'Q, the Gatekeeper의 시스템 검증용 프로젝트',
        color: '#1631F8',
        process: [
            {
                key: 'basic_plan',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                key: 'story_board',
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ]
    };
    
    try {
        const createResponse = await api.post('/api/projects/create/', projectData);
        testProjectId = createResponse.data.project_id || createResponse.data.id;
        
        logTest('프로젝트 생성', createResponse.status === 200 && testProjectId,
               `생성된 프로젝트 ID: ${testProjectId}`);
        
    } catch (error) {
        logTest('프로젝트 생성', false,
               `오류: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    
    // 3.3 생성된 프로젝트 조회
    if (testProjectId) {
        try {
            const projectDetailResponse = await api.get(`/api/projects/detail/${testProjectId}/`);
            logTest('프로젝트 상세 조회', projectDetailResponse.status === 200,
                   `프로젝트명: ${projectDetailResponse.data.name || 'N/A'}`);
        } catch (error) {
            logTest('프로젝트 상세 조회', false,
                   `오류: ${error.response?.status} - ${error.message}`);
        }
    }
    
    // 3.4 프로젝트 중복 생성 방지 테스트
    try {
        await api.post('/api/projects/create/', {
            ...projectData,
            name: projectData.name // 동일한 이름으로 재생성 시도
        });
        logTest('프로젝트 중복 생성 방지', false, '중복 프로젝트가 생성됨', 'critical');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('프로젝트 중복 생성 방지', true, '올바르게 중복 생성 차단됨');
        } else {
            logTest('프로젝트 중복 생성 처리', false, `예상치 못한 응답: ${error.response?.status}`);
        }
    }
}

// === 4. 영상 기획 시스템 테스트 ===
async function testVideoPlanningSystem() {
    logSection('영상 기획 시스템 검증');
    
    if (!testProjectId) {
        logWarning('영상 기획 테스트 건너뜀', '테스트 프로젝트가 없음');
        return;
    }
    
    // 4.1 영상 기획 페이지 접근성
    try {
        const planningPageResponse = await axios.get(`${FRONTEND_URL}/videoplanning`, { timeout: 5000 });
        logTest('영상 기획 페이지 접근', planningPageResponse.status === 200,
               '페이지가 정상적으로 로드됨');
    } catch (error) {
        logTest('영상 기획 페이지 접근', false,
               `페이지 로드 실패: ${error.message}`);
    }
    
    // 4.2 AI 기획 마법사 API 테스트 (만약 구현되어 있다면)
    try {
        const aiPlanningResponse = await api.post('/api/video-planning/ai-wizard/', {
            project_id: testProjectId,
            type: 'youtube',
            description: 'QA 테스트용 영상 기획'
        });
        logTest('AI 기획 마법사', aiPlanningResponse.status === 200,
               'AI 기획 제안이 생성됨');
    } catch (error) {
        if (error.response?.status === 404) {
            logWarning('AI 기획 마법사 미구현', 'API 엔드포인트가 존재하지 않음');
        } else {
            logTest('AI 기획 마법사', false,
                   `오류: ${error.response?.status} - ${error.message}`);
        }
    }
    
    // 4.3 기획안 저장 테스트
    const planningData = {
        project_id: testProjectId,
        structure: {
            title: 'QA 테스트 영상',
            duration: '5분',
            genre: '테스트'
        },
        scenes: [
            {
                title: '오프닝',
                duration: '30초',
                description: 'QA 테스트 시나리오'
            }
        ]
    };
    
    try {
        const savePlanningResponse = await api.post('/api/video-planning/save/', planningData);
        logTest('기획안 저장', savePlanningResponse.status === 200,
               '기획안이 성공적으로 저장됨');
    } catch (error) {
        if (error.response?.status === 404) {
            logWarning('기획안 저장 미구현', 'API 엔드포인트가 존재하지 않음');
        } else {
            logTest('기획안 저장', false,
                   `오류: ${error.response?.status} - ${error.message}`);
        }
    }
}

// === 5. 피드백 시스템 테스트 ===
async function testFeedbackSystem() {
    logSection('피드백 시스템 검증');
    
    if (!testProjectId) {
        logWarning('피드백 시스템 테스트 건너뜀', '테스트 프로젝트가 없음');
        return;
    }
    
    // 5.1 피드백 페이지 접근성
    try {
        const feedbackPageResponse = await axios.get(`${FRONTEND_URL}/feedback/${testProjectId}`, { timeout: 5000 });
        logTest('피드백 페이지 접근', feedbackPageResponse.status === 200,
               '피드백 페이지가 정상적으로 로드됨');
    } catch (error) {
        logTest('피드백 페이지 접근', false,
               `페이지 로드 실패: ${error.message}`);
    }
    
    // 5.2 피드백 목록 조회
    try {
        const feedbackListResponse = await api.get(`/api/feedbacks/${testProjectId}/`);
        logTest('피드백 목록 조회', feedbackListResponse.status === 200,
               `현재 피드백 수: ${feedbackListResponse.data.length || 0}개`);
    } catch (error) {
        logTest('피드백 목록 조회', false,
               `오류: ${error.response?.status} - ${error.message}`);
    }
    
    // 5.3 피드백 작성 (파일 업로드 포함)
    try {
        const formData = new FormData();
        
        // 더미 비디오 파일 생성
        const testVideoPath = path.join(__dirname, 'qa-test-video.mp4');
        if (!fs.existsSync(testVideoPath)) {
            fs.writeFileSync(testVideoPath, 'QA 테스트용 더미 비디오 데이터');
        }
        
        formData.append('video', fs.createReadStream(testVideoPath));
        formData.append('feedback_data', JSON.stringify({
            content: 'QA 자동화 테스트 피드백',
            timestamp: '00:30',
            type: 'general'
        }));
        
        const feedbackCreateResponse = await api.post(`/api/feedbacks/${testProjectId}/`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        logTest('피드백 작성', feedbackCreateResponse.status === 201,
               '비디오 업로드와 피드백이 성공적으로 처리됨');
        
    } catch (error) {
        logTest('피드백 작성', false,
               `오류: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
}

// === 6. 마이페이지 기능 테스트 ===
async function testMyPageFeatures() {
    logSection('마이페이지 기능 검증');
    
    if (!authToken) {
        logWarning('마이페이지 테스트 건너뜀', '인증 토큰이 없음');
        return;
    }
    
    // 6.1 마이페이지 접근성
    try {
        const myPageResponse = await axios.get(`${FRONTEND_URL}/mypage`, { timeout: 5000 });
        logTest('마이페이지 접근', myPageResponse.status === 200,
               '마이페이지가 정상적으로 로드됨');
    } catch (error) {
        logTest('마이페이지 접근', false,
               `페이지 로드 실패: ${error.message}`);
    }
    
    // 6.2 프로필 정보 조회
    try {
        const profileResponse = await api.get('/users/profile/');
        logTest('프로필 정보 조회', profileResponse.status === 200,
               `프로필 로드됨: ${profileResponse.data.nickname || profileResponse.data.email}`);
    } catch (error) {
        if (error.response?.status === 404) {
            // /users/me/ 엔드포인트 시도
            try {
                const meResponse = await api.get('/users/me/');
                logTest('프로필 정보 조회 (/users/me/)', meResponse.status === 200,
                       `사용자 정보: ${meResponse.data.nickname || meResponse.data.email}`);
            } catch (meError) {
                logTest('프로필 정보 조회', false,
                       `두 엔드포인트 모두 실패: ${meError.response?.status}`);
            }
        } else {
            logTest('프로필 정보 조회', false,
                   `오류: ${error.response?.status} - ${error.message}`);
        }
    }
    
    // 6.3 프로필 업데이트
    try {
        const updateData = {
            nickname: `Updated_QA_${Date.now().toString().slice(-4)}`,
            bio: 'Q, the Gatekeeper of Truth에 의해 업데이트됨'
        };
        
        const updateResponse = await api.patch('/users/profile/update/', updateData);
        logTest('프로필 업데이트', updateResponse.status === 200,
               `닉네임 변경: ${updateData.nickname}`);
        
    } catch (error) {
        if (error.response?.status === 404) {
            logWarning('프로필 업데이트 미구현', 'API 엔드포인트가 존재하지 않음');
        } else {
            logTest('프로필 업데이트', false,
                   `오류: ${error.response?.status} - ${error.message}`);
        }
    }
}

// === 7. 보안 취약점 스캔 ===
async function testSecurityVulnerabilities() {
    logSection('보안 취약점 검사');
    
    // 7.1 SQL 인젝션 테스트
    try {
        await api.post('/users/login/', {
            email: "' OR '1'='1' --",
            password: "anything"
        });
        logTest('SQL 인젝션 방어', false, 'SQL 인젝션 공격이 성공함', 'critical');
    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 401) {
            logTest('SQL 인젝션 방어', true, '악성 입력이 올바르게 차단됨');
        } else {
            logTest('SQL 인젝션 방어', false, `예상치 못한 응답: ${error.response?.status}`);
        }
    }
    
    // 7.2 XSS 공격 테스트
    const xssPayload = '<script>alert("XSS")</script>';
    try {
        await api.post('/users/signup/', {
            email: 'xss@test.com',
            password: 'test123',
            nickname: xssPayload
        });
        logWarning('XSS 입력 처리', 'XSS 페이로드가 포함된 요청이 처리됨 - 응답 확인 필요');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('XSS 공격 방어', true, '악성 스크립트가 차단됨');
        } else {
            logTest('XSS 공격 방어', false, `처리 실패: ${error.response?.status}`);
        }
    }
    
    // 7.3 인증 우회 시도
    const originalToken = api.defaults.headers.common['Authorization'];
    api.defaults.headers.common['Authorization'] = 'Bearer fake_token';
    
    try {
        await api.get('/users/me/');
        logTest('인증 우회 방어', false, '가짜 토큰으로 인증됨', 'critical');
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('인증 우회 방어', true, '가짜 토큰이 올바르게 거부됨');
        } else {
            logTest('인증 우회 방어', false, `예상치 못한 응답: ${error.response?.status}`);
        }
    }
    
    // 원래 토큰 복원
    api.defaults.headers.common['Authorization'] = originalToken;
}

// === 8. 성능 및 부하 테스트 ===
async function testPerformanceAndLoad() {
    logSection('성능 및 부하 테스트');
    
    // 8.1 API 응답 시간 측정
    const performanceTests = [
        { name: '헬스체크', endpoint: '/api/health/' },
        { name: '프로젝트 목록', endpoint: '/api/projects/' },
        { name: '사용자 정보', endpoint: '/users/me/' }
    ];
    
    for (const test of performanceTests) {
        try {
            const startTime = Date.now();
            await api.get(test.endpoint);
            const responseTime = Date.now() - startTime;
            
            const isGood = responseTime < 1000; // 1초 이내
            logTest(`${test.name} 응답 시간`, isGood,
                   `${responseTime}ms ${isGood ? '(양호)' : '(느림)'}`);
            
        } catch (error) {
            logTest(`${test.name} 성능 테스트`, false,
                   `오류로 인해 측정 불가: ${error.message}`);
        }
    }
    
    // 8.2 동시 요청 처리 테스트
    try {
        const concurrentRequests = Array(5).fill().map(() => api.get('/api/health/'));
        const startTime = Date.now();
        const results = await Promise.allSettled(concurrentRequests);
        const totalTime = Date.now() - startTime;
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        logTest('동시 요청 처리', successCount === 5,
               `5개 요청 중 ${successCount}개 성공, 총 ${totalTime}ms`);
        
    } catch (error) {
        logTest('동시 요청 처리', false,
               `동시 요청 테스트 실패: ${error.message}`);
    }
}

// === 9. 에러 처리 및 엣지 케이스 테스트 ===
async function testErrorHandlingAndEdgeCases() {
    logSection('에러 처리 및 엣지 케이스 검증');
    
    // 9.1 존재하지 않는 엔드포인트
    try {
        await api.get('/api/nonexistent-endpoint/');
        logTest('404 에러 처리', false, '존재하지 않는 엔드포인트가 응답함', 'critical');
    } catch (error) {
        if (error.response?.status === 404) {
            logTest('404 에러 처리', true, '올바른 404 응답');
        } else {
            logTest('404 에러 처리', false, `예상치 못한 응답: ${error.response?.status}`);
        }
    }
    
    // 9.2 잘못된 JSON 데이터
    try {
        await api.post('/users/login/', '{"invalid": json}', {
            headers: { 'Content-Type': 'application/json' }
        });
        logTest('잘못된 JSON 처리', false, '잘못된 JSON이 처리됨');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('잘못된 JSON 처리', true, '잘못된 JSON이 올바르게 거부됨');
        } else {
            logTest('잘못된 JSON 처리', false, `예상치 못한 응답: ${error.response?.status}`);
        }
    }
    
    // 9.3 매우 긴 입력값
    const longString = 'A'.repeat(10000);
    try {
        await api.post('/users/signup/', {
            email: 'long@test.com',
            password: 'test123',
            nickname: longString
        });
        logWarning('긴 입력값 처리', '매우 긴 닉네임이 허용됨 - 검토 필요');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('긴 입력값 검증', true, '적절한 길이 제한이 적용됨');
        } else {
            logTest('긴 입력값 처리', false, `처리 실패: ${error.response?.status}`);
        }
    }
}

// === 10. 정리 작업 ===
async function cleanup() {
    logSection('테스트 정리 작업');
    
    // 테스트 프로젝트 삭제
    if (testProjectId && authToken) {
        try {
            await api.delete(`/api/projects/${testProjectId}/`);
            logTest('테스트 프로젝트 정리', true, `프로젝트 ID ${testProjectId} 삭제됨`);
        } catch (error) {
            logWarning('테스트 프로젝트 정리 실패', '수동으로 정리가 필요할 수 있음');
        }
    }
    
    // 임시 파일 정리
    const tempFiles = ['qa-test-video.mp4'];
    tempFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logTest(`임시 파일 정리 (${file})`, true, '파일 삭제됨');
        }
    });
}

// === 최종 보고서 생성 ===
function generateFinalReport() {
    logHeader('📊 QA 테스트 최종 보고서');
    
    const endTime = new Date();
    const duration = Math.round((endTime - testResults.startTime) / 1000);
    
    console.log(`\n${colors.bright}테스트 실행 정보:${colors.reset}`);
    console.log(`시작 시간: ${testResults.startTime.toLocaleString('ko-KR')}`);
    console.log(`종료 시간: ${endTime.toLocaleString('ko-KR')}`);
    console.log(`총 소요 시간: ${duration}초`);
    console.log(`테스트 환경: 로컬 (백엔드: ${API_BASE_URL}, 프론트엔드: ${FRONTEND_URL})`);
    
    console.log(`\n${colors.bright}테스트 결과 요약:${colors.reset}`);
    console.log(`${colors.green}✅ 성공: ${testResults.summary.passed}개${colors.reset}`);
    console.log(`${colors.red}❌ 실패: ${testResults.summary.failed}개${colors.reset}`);
    console.log(`${colors.yellow}⚠️  경고: ${testResults.summary.warnings}개${colors.reset}`);
    console.log(`${colors.red}${colors.bright}🚨 치명적: ${testResults.summary.critical}개${colors.reset}`);
    console.log(`📊 총 테스트: ${testResults.summary.total}개`);
    
    const successRate = testResults.summary.total > 0 
        ? Math.round((testResults.summary.passed / testResults.summary.total) * 100)
        : 0;
    
    console.log(`\n${colors.bright}성공률: ${successRate}%${colors.reset}`);
    
    // 치명적 문제가 있는 경우 강조
    if (testResults.summary.critical > 0) {
        console.log(`\n${colors.red}${colors.bright}🚨 치명적 문제 발견! 즉시 수정 필요:${colors.reset}`);
        testResults.tests.critical.forEach(test => {
            console.log(`   ${colors.red}• ${test.name}: ${test.details}${colors.reset}`);
        });
    }
    
    // 경고사항
    if (testResults.summary.warnings > 0) {
        console.log(`\n${colors.yellow}⚠️  주의사항:${colors.reset}`);
        testResults.tests.warnings.forEach(test => {
            console.log(`   ${colors.yellow}• ${test.name}: ${test.details}${colors.reset}`);
        });
    }
    
    // 실패한 테스트
    if (testResults.summary.failed > 0) {
        console.log(`\n${colors.red}❌ 실패한 테스트:${colors.reset}`);
        testResults.tests.failed.forEach(test => {
            console.log(`   ${colors.red}• ${test.name}: ${test.details}${colors.reset}`);
        });
    }
    
    // 성공한 테스트 (간략하게)
    if (testResults.summary.passed > 0) {
        console.log(`\n${colors.green}✅ 성공한 주요 기능:${colors.reset}`);
        testResults.tests.passed.slice(0, 10).forEach(test => {
            console.log(`   ${colors.green}• ${test.name}${colors.reset}`);
        });
        if (testResults.tests.passed.length > 10) {
            console.log(`   ${colors.cyan}... 외 ${testResults.tests.passed.length - 10}개${colors.reset}`);
        }
    }
    
    // Q의 최종 판정
    console.log(`\n${colors.bright}${colors.magenta}Q, the Gatekeeper of Truth 최종 판정:${colors.reset}`);
    if (testResults.summary.critical > 0) {
        console.log(`${colors.red}${colors.bright}🚫 REJECTED: 치명적 보안 또는 기능 결함이 발견되었습니다. 프로덕션 배포 불가.${colors.reset}`);
    } else if (successRate >= 90) {
        console.log(`${colors.green}${colors.bright}✅ APPROVED: 시스템이 안정적이며 프로덕션 배포 가능합니다.${colors.reset}`);
    } else if (successRate >= 75) {
        console.log(`${colors.yellow}${colors.bright}⚠️  CONDITIONAL: 일부 개선 후 배포 가능합니다.${colors.reset}`);
    } else {
        console.log(`${colors.red}${colors.bright}❌ FAILED: 광범위한 수정이 필요합니다.${colors.reset}`);
    }
    
    // 상세 리포트 파일 저장
    const reportPath = path.join(__dirname, `qa-comprehensive-report-${Date.now()}.json`);
    const detailedReport = {
        meta: {
            testSuite: 'VideoPlanet Comprehensive QA Test',
            tester: 'Q, the Gatekeeper of Truth',
            startTime: testResults.startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: `${duration}초`,
            environment: {
                backend: API_BASE_URL,
                frontend: FRONTEND_URL
            }
        },
        summary: testResults.summary,
        successRate: `${successRate}%`,
        tests: testResults.tests,
        verdict: testResults.summary.critical > 0 ? 'REJECTED' :
                successRate >= 90 ? 'APPROVED' :
                successRate >= 75 ? 'CONDITIONAL' : 'FAILED'
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    console.log(`\n${colors.cyan}📄 상세 리포트 저장됨: ${reportPath}${colors.reset}`);
}

// === 메인 테스트 실행 함수 ===
async function runComprehensiveTest() {
    logHeader('🔍 VideoPlanet 포괄적 시스템 검증 시작');
    console.log(`${colors.bright}Executed by: Q, the Gatekeeper of Truth${colors.reset}`);
    console.log(`${colors.bright}Mission: 모든 코드는 증명될 때까지 유죄${colors.reset}`);
    
    try {
        await testServerConnectivity();
        await testAuthenticationSystem();
        await testProjectManagement();
        await testVideoPlanningSystem();
        await testFeedbackSystem();
        await testMyPageFeatures();
        await testSecurityVulnerabilities();
        await testPerformanceAndLoad();
        await testErrorHandlingAndEdgeCases();
        await cleanup();
        
    } catch (error) {
        console.error(`\n${colors.red}${colors.bright}💥 테스트 실행 중 치명적 오류 발생:${colors.reset}`);
        console.error(`${colors.red}${error.message}${colors.reset}`);
        testResults.summary.critical++;
    } finally {
        generateFinalReport();
    }
}

// 테스트 실행
if (require.main === module) {
    runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest };