/**
 * 인증 시스템 빠른 테스트
 * 실행: node auth-quick-test.js
 */

const axios = require('axios');

// API 서버 선택
const API_URL = 'https://videoplanet.up.railway.app';

async function quickTest() {
    console.log('🔍 VideoPlanet 인증 시스템 빠른 테스트');
    console.log('='.repeat(50));
    console.log(`API 서버: ${API_URL}`);
    console.log('');
    
    // 1. 기존 URL 테스트
    console.log('1️⃣ 기존 URL 테스트 (/users/login/)');
    try {
        const res1 = await axios.post(`${API_URL}/users/login/`, {
            email: 'test@test.com',
            password: 'wrong'
        });
        console.log('   ✅ 엔드포인트 응답');
    } catch (error) {
        if (error.response) {
            console.log(`   ✅ 엔드포인트 응답 (${error.response.status})`);
        } else {
            console.log(`   ❌ 엔드포인트 없음`);
        }
    }
    
    // 2. 새 URL 테스트
    console.log('\n2️⃣ 새 URL 테스트 (/api/auth/login/)');
    try {
        const res2 = await axios.post(`${API_URL}/api/auth/login/`, {
            email: 'test@test.com',
            password: 'wrong'
        });
        console.log('   ✅ 엔드포인트 응답');
    } catch (error) {
        if (error.response) {
            console.log(`   ✅ 엔드포인트 응답 (${error.response.status})`);
        } else {
            console.log(`   ❌ 엔드포인트 없음`);
        }
    }
    
    // 3. 회원가입 엔드포인트 확인
    console.log('\n3️⃣ 회원가입 엔드포인트 확인');
    const signupEndpoints = [
        '/users/signup/',
        '/api/auth/signup/',
        '/api/users/signup/'
    ];
    
    for (const endpoint of signupEndpoints) {
        try {
            const res = await axios.post(`${API_URL}${endpoint}`, {});
            console.log(`   ✅ ${endpoint} - 응답`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ ${endpoint} - 응답 (${error.response.status})`);
            } else {
                console.log(`   ❌ ${endpoint} - 없음`);
            }
        }
    }
    
    // 4. 인증 관련 엔드포인트 확인
    console.log('\n4️⃣ 인증 관련 엔드포인트 확인');
    const authEndpoints = [
        { path: '/users/me/', method: 'get' },
        { path: '/api/auth/me/', method: 'get' },
        { path: '/users/refresh/', method: 'post' },
        { path: '/api/auth/refresh/', method: 'post' }
    ];
    
    for (const endpoint of authEndpoints) {
        try {
            const config = {
                method: endpoint.method,
                url: `${API_URL}${endpoint.path}`,
                data: endpoint.method === 'post' ? {} : undefined
            };
            const res = await axios(config);
            console.log(`   ✅ ${endpoint.path} - 응답`);
        } catch (error) {
            if (error.response) {
                console.log(`   ✅ ${endpoint.path} - 응답 (${error.response.status})`);
            } else {
                console.log(`   ❌ ${endpoint.path} - 없음`);
            }
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('테스트 완료!');
}

quickTest().catch(console.error);