/**
 * VideoPlanet 핵심 경로 테스트
 * 인증, 프로젝트 CRUD, 피드백 시스템 테스트
 */

const API_URL = process.env.API_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 테스트 결과 저장
const testResults = {
    passed: 0,
    failed: 0,
    errors: [],
    timestamp: new Date().toISOString()
};

// 테스트 유틸리티 함수
async function makeRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();
        return { response, data };
    } catch (error) {
        console.error(`Request failed: ${url}`, error);
        return { error };
    }
}

function assert(condition, message) {
    if (condition) {
        testResults.passed++;
        console.log(`✅ ${message}`);
    } else {
        testResults.failed++;
        testResults.errors.push(message);
        console.error(`❌ ${message}`);
    }
}

// 1. 인증 테스트
async function testAuthentication() {
    console.log('\n🔐 인증 시스템 테스트 시작...\n');
    
    // 1.1 회원가입 테스트
    const signupData = {
        email: `test${Date.now()}@example.com`,
        nickname: `테스터${Date.now()}`,
        password: 'Test1234!@'
    };
    
    const { response: signupRes, data: signupResult } = await makeRequest(
        `${API_URL}/api/users/signup/`,
        {
            method: 'POST',
            body: JSON.stringify(signupData)
        }
    );
    
    assert(
        signupRes?.status === 200 || signupRes?.status === 201,
        `회원가입 성공 (${signupRes?.status})`
    );
    
    // 1.2 로그인 테스트
    const loginData = {
        email: signupData.email,
        password: signupData.password
    };
    
    const { response: loginRes, data: loginResult } = await makeRequest(
        `${API_URL}/api/users/login/`,
        {
            method: 'POST',
            body: JSON.stringify(loginData)
        }
    );
    
    assert(
        loginRes?.status === 200,
        `로그인 성공 (${loginRes?.status})`
    );
    
    const accessToken = loginResult?.access_token;
    assert(accessToken, '액세스 토큰 발급');
    
    return accessToken;
}

// 2. 프로젝트 CRUD 테스트
async function testProjectCRUD(accessToken) {
    console.log('\n📁 프로젝트 CRUD 테스트 시작...\n');
    
    const headers = {
        'Authorization': `Bearer ${accessToken}`
    };
    
    // 2.1 프로젝트 생성
    const projectData = {
        name: `테스트 프로젝트 ${Date.now()}`,
        manager: '테스트 매니저',
        consumer: '테스트 고객사',
        description: '테스트 프로젝트 설명'
    };
    
    const { response: createRes, data: createData } = await makeRequest(
        `${API_URL}/api/projects/`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(projectData)
        }
    );
    
    assert(
        createRes?.status === 200 || createRes?.status === 201,
        `프로젝트 생성 성공 (${createRes?.status})`
    );
    
    const projectId = createData?.id || createData?.project?.id;
    assert(projectId, '프로젝트 ID 반환');
    
    // 2.2 프로젝트 목록 조회
    const { response: listRes, data: listData } = await makeRequest(
        `${API_URL}/api/projects/`,
        { headers }
    );
    
    assert(
        listRes?.status === 200,
        `프로젝트 목록 조회 성공 (${listRes?.status})`
    );
    
    // 2.3 프로젝트 상세 조회
    if (projectId) {
        const { response: detailRes } = await makeRequest(
            `${API_URL}/api/projects/${projectId}/`,
            { headers }
        );
        
        assert(
            detailRes?.status === 200,
            `프로젝트 상세 조회 성공 (${detailRes?.status})`
        );
    }
    
    // 2.4 프로젝트 중복 생성 방지 테스트
    const { response: dupRes } = await makeRequest(
        `${API_URL}/api/projects/`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(projectData)
        }
    );
    
    assert(
        dupRes?.status === 409 || dupRes?.status === 400,
        `프로젝트 중복 생성 방지 작동 (${dupRes?.status})`
    );
    
    return projectId;
}

// 3. 피드백 시스템 테스트
async function testFeedbackSystem(accessToken, projectId) {
    console.log('\n💬 피드백 시스템 테스트 시작...\n');
    
    const headers = {
        'Authorization': `Bearer ${accessToken}`
    };
    
    // 3.1 피드백 생성
    const feedbackData = {
        title: '테스트 피드백',
        text: '피드백 내용입니다.',
        section: '00:01:30'
    };
    
    const { response: createRes, data: createData } = await makeRequest(
        `${API_URL}/api/projects/${projectId}/feedbacks/`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(feedbackData)
        }
    );
    
    assert(
        createRes?.status === 200 || createRes?.status === 201,
        `피드백 생성 성공 (${createRes?.status})`
    );
    
    // 3.2 피드백 목록 조회
    const { response: listRes } = await makeRequest(
        `${API_URL}/api/projects/${projectId}/feedbacks/`,
        { headers }
    );
    
    assert(
        listRes?.status === 200,
        `피드백 목록 조회 성공 (${listRes?.status})`
    );
}

// 4. 에러 핸들링 테스트
async function testErrorHandling() {
    console.log('\n⚠️ 에러 핸들링 테스트 시작...\n');
    
    // 4.1 인증 없이 API 접근
    const { response: unauthRes } = await makeRequest(
        `${API_URL}/api/projects/`
    );
    
    assert(
        unauthRes?.status === 401 || unauthRes?.status === 403,
        `인증 없이 접근 시 401/403 반환 (${unauthRes?.status})`
    );
    
    // 4.2 존재하지 않는 리소스 접근
    const { response: notFoundRes } = await makeRequest(
        `${API_URL}/api/projects/99999/`,
        {
            headers: {
                'Authorization': 'Bearer fake-token'
            }
        }
    );
    
    assert(
        notFoundRes?.status === 404 || notFoundRes?.status === 401,
        `존재하지 않는 리소스 접근 시 404/401 반환 (${notFoundRes?.status})`
    );
    
    // 4.3 잘못된 데이터 전송
    const { response: badDataRes } = await makeRequest(
        `${API_URL}/api/users/signup/`,
        {
            method: 'POST',
            body: JSON.stringify({ invalid: 'data' })
        }
    );
    
    assert(
        badDataRes?.status === 400,
        `잘못된 데이터 전송 시 400 반환 (${badDataRes?.status})`
    );
}

// 5. 성능 테스트
async function testPerformance(accessToken) {
    console.log('\n⚡ 성능 테스트 시작...\n');
    
    const headers = {
        'Authorization': `Bearer ${accessToken}`
    };
    
    // 5.1 프로젝트 목록 조회 응답 시간
    const startTime = Date.now();
    const { response } = await makeRequest(
        `${API_URL}/api/projects/`,
        { headers }
    );
    const responseTime = Date.now() - startTime;
    
    assert(
        responseTime < 3000,
        `프로젝트 목록 조회 응답 시간: ${responseTime}ms (3초 이내)`
    );
    
    // 5.2 여러 요청 동시 처리
    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(
            makeRequest(`${API_URL}/api/projects/`, { headers })
        );
    }
    
    const concurrentStart = Date.now();
    await Promise.all(promises);
    const concurrentTime = Date.now() - concurrentStart;
    
    assert(
        concurrentTime < 5000,
        `5개 동시 요청 처리 시간: ${concurrentTime}ms (5초 이내)`
    );
}

// 메인 테스트 실행 함수
async function runAllTests() {
    console.log('🚀 VideoPlanet 핵심 경로 테스트 시작');
    console.log(`API URL: ${API_URL}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
    console.log('=' * 50);
    
    try {
        // API 서버 연결 확인
        const { response: healthRes } = await makeRequest(`${API_URL}/api/health/`);
        if (!healthRes || healthRes.status !== 200) {
            console.log('⚠️ API 서버가 응답하지 않습니다. 건너뜁니다.');
        }
        
        // 테스트 실행
        const accessToken = await testAuthentication();
        
        if (accessToken) {
            const projectId = await testProjectCRUD(accessToken);
            if (projectId) {
                await testFeedbackSystem(accessToken, projectId);
            }
            await testPerformance(accessToken);
        }
        
        await testErrorHandling();
        
    } catch (error) {
        console.error('테스트 실행 중 오류:', error);
        testResults.errors.push(error.message);
    }
    
    // 결과 출력
    console.log('\n' + '=' * 50);
    console.log('📊 테스트 결과 요약');
    console.log('=' * 50);
    console.log(`✅ 성공: ${testResults.passed}개`);
    console.log(`❌ 실패: ${testResults.failed}개`);
    console.log(`⏱️ 실행 시간: ${new Date().toISOString()}`);
    
    if (testResults.errors.length > 0) {
        console.log('\n실패한 테스트:');
        testResults.errors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error}`);
        });
    }
    
    // 테스트 결과를 파일로 저장
    const fs = require('fs');
    const reportPath = `test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📝 테스트 리포트 저장: ${reportPath}`);
    
    // 종료 코드 설정
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// 테스트 실행
runAllTests().catch(console.error);