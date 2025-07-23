const axios = require('axios');

const API_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3002';

async function testNextJSApp() {
    console.log('🧪 Next.js 로컬 테스트 시작\n');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // 1. 프론트엔드 서버 상태 확인
    try {
        console.log('🌐 프론트엔드 서버 확인...');
        const response = await axios.get(FRONTEND_URL, {
            headers: { 'Accept': 'text/html' },
            validateStatus: () => true
        });
        
        if (response.status === 200) {
            console.log('✅ Next.js 서버가 포트 3002에서 실행 중입니다.');
            results.passed++;
        } else {
            console.log(`❌ Next.js 서버 응답 오류: ${response.status}`);
            results.failed++;
        }
    } catch (error) {
        console.log('❌ Next.js 서버에 연결할 수 없습니다.');
        console.log('   오류:', error.message);
        results.failed++;
    }

    // 2. 백엔드 API 상태 확인
    try {
        console.log('\n🔗 백엔드 API 확인...');
        const response = await axios.get(`${API_URL}/api/health/`);
        
        if (response.data.status === 'ok') {
            console.log('✅ Django 백엔드가 정상 작동 중입니다.');
            results.passed++;
        } else {
            console.log('❌ 백엔드 상태 이상');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ 백엔드 API에 연결할 수 없습니다.');
        console.log('   오류:', error.message);
        results.failed++;
    }

    // 3. 주요 페이지 접근 테스트
    const pages = [
        { path: '/login', name: '로그인' },
        { path: '/signup', name: '회원가입' },
        { path: '/project/create', name: '프로젝트 생성' }
    ];

    console.log('\n📄 페이지 접근 테스트...');
    for (const page of pages) {
        try {
            const response = await axios.get(`${FRONTEND_URL}${page.path}`, {
                headers: { 'Accept': 'text/html' },
                validateStatus: () => true
            });
            
            if (response.status === 200) {
                console.log(`✅ ${page.name} 페이지 접근 가능`);
                results.passed++;
            } else {
                console.log(`❌ ${page.name} 페이지 오류: ${response.status}`);
                results.failed++;
            }
        } catch (error) {
            console.log(`❌ ${page.name} 페이지 접근 실패:`, error.message);
            results.failed++;
        }
    }

    // 4. API 엔드포인트 테스트
    const endpoints = [
        { url: '/api/users/check-email/', method: 'POST', name: '이메일 중복 확인' },
        { url: '/api/users/signup/', method: 'POST', name: '회원가입' },
        { url: '/api/users/login/', method: 'POST', name: '로그인' }
    ];

    console.log('\n🔌 API 엔드포인트 확인...');
    for (const endpoint of endpoints) {
        try {
            const response = await axios({
                method: endpoint.method,
                url: `${API_URL}${endpoint.url}`,
                data: {},
                validateStatus: () => true
            });
            
            // 400번대 응답도 엔드포인트가 존재한다는 의미
            if (response.status < 500) {
                console.log(`✅ ${endpoint.name} 엔드포인트 활성`);
                results.passed++;
            } else {
                console.log(`❌ ${endpoint.name} 서버 오류: ${response.status}`);
                results.failed++;
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name} 접근 실패:`, error.message);
            results.failed++;
        }
    }

    // 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(50));
    console.log(`총 테스트: ${results.passed + results.failed}개`);
    console.log(`성공: ${results.passed}개`);
    console.log(`실패: ${results.failed}개`);
    console.log(`성공률: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    if (results.failed === 0) {
        console.log('\n✅ 모든 테스트를 통과했습니다!');
    } else {
        console.log('\n⚠️ 일부 테스트가 실패했습니다.');
    }
}

// 테스트 실행
testNextJSApp().catch(console.error);