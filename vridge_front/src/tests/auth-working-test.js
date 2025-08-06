/**
 * VideoPlanet 인증 시스템 작동 테스트
 * 기존 작동하는 URL 사용
 */

const axios = require('axios');

const API_URL = 'https://videoplanet.up.railway.app';

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

async function testAuth() {
    console.log('\n=== VideoPlanet 인증 시스템 테스트 ===\n');
    
    // 1. 회원가입 테스트
    console.log('1. 회원가입 테스트');
    const timestamp = Date.now();
    const testUser = {
        email: `test_${timestamp}@example.com`,
        nickname: `User_${timestamp}`,
        password: 'Test1234!@#'
    };
    
    try {
        const signupRes = await axios.post(`${API_URL}/users/signup/`, testUser);
        console.log(`${colors.green}✅ 회원가입 성공${colors.reset}`);
        console.log(`   - 이메일: ${testUser.email}`);
        console.log(`   - 닉네임: ${testUser.nickname}`);
        if (signupRes.data.email_sent) {
            console.log(`   - 이메일 인증 발송됨`);
        }
    } catch (error) {
        if (error.response?.status === 409) {
            console.log(`${colors.yellow}⚠️  사용자가 이미 존재${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ 회원가입 실패: ${error.response?.data?.message || error.message}${colors.reset}`);
        }
    }
    
    // 2. 로그인 테스트
    console.log('\n2. 로그인 테스트');
    
    // 테스트 계정들
    const testAccounts = [
        { email: 'test@example.com', password: 'Test1234!@#', name: '기본 테스트' },
        { email: testUser.email, password: testUser.password, name: '방금 생성' }
    ];
    
    let accessToken = null;
    let refreshToken = null;
    
    for (const account of testAccounts) {
        console.log(`   ${account.name} 계정으로 시도...`);
        try {
            const loginRes = await axios.post(`${API_URL}/users/login/`, {
                email: account.email,
                password: account.password
            });
            
            if (loginRes.data.access_token || loginRes.data.vridge_session) {
                accessToken = loginRes.data.access_token || loginRes.data.vridge_session;
                refreshToken = loginRes.data.refresh_token;
                console.log(`${colors.green}   ✅ 로그인 성공${colors.reset}`);
                console.log(`      - Access Token: ${accessToken.substring(0, 30)}...`);
                if (loginRes.data.user) {
                    console.log(`      - 사용자: ${loginRes.data.user.nickname || loginRes.data.user.username}`);
                }
                break;
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`${colors.yellow}   ⚠️  인증 실패 (비밀번호 틀림)${colors.reset}`);
            } else if (error.response?.status === 404) {
                console.log(`${colors.yellow}   ⚠️  사용자 없음${colors.reset}`);
            } else {
                console.log(`${colors.red}   ❌ 오류: ${error.response?.data?.message || error.message}${colors.reset}`);
            }
        }
    }
    
    // 3. 인증된 요청 테스트
    if (accessToken) {
        console.log('\n3. 인증된 API 요청 테스트');
        
        try {
            const meRes = await axios.get(`${API_URL}/users/me/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            console.log(`${colors.green}✅ 사용자 정보 조회 성공${colors.reset}`);
            console.log(`   - ID: ${meRes.data.id}`);
            console.log(`   - Username: ${meRes.data.username}`);
            console.log(`   - Nickname: ${meRes.data.nickname}`);
        } catch (error) {
            console.log(`${colors.red}❌ 인증된 요청 실패: ${error.response?.status}${colors.reset}`);
        }
        
        // 4. 프로젝트 목록 조회
        console.log('\n4. 프로젝트 목록 조회 테스트');
        try {
            const projectsRes = await axios.get(`${API_URL}/api/projects/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            console.log(`${colors.green}✅ 프로젝트 목록 조회 성공${colors.reset}`);
            console.log(`   - 프로젝트 수: ${projectsRes.data.length || 0}`);
        } catch (error) {
            console.log(`${colors.red}❌ 프로젝트 조회 실패: ${error.response?.status}${colors.reset}`);
        }
        
        // 5. 토큰 갱신 테스트
        if (refreshToken) {
            console.log('\n5. 토큰 갱신 테스트');
            try {
                const refreshRes = await axios.post(`${API_URL}/users/refresh/`, {
                    refresh: refreshToken
                });
                if (refreshRes.data.access) {
                    console.log(`${colors.green}✅ 토큰 갱신 성공${colors.reset}`);
                    console.log(`   - 새 토큰: ${refreshRes.data.access.substring(0, 30)}...`);
                }
            } catch (error) {
                console.log(`${colors.yellow}⚠️  토큰 갱신 실패 (정상일 수 있음)${colors.reset}`);
            }
        }
    }
    
    // 6. 이메일/닉네임 중복 확인
    console.log('\n6. 중복 확인 테스트');
    
    try {
        await axios.post(`${API_URL}/users/check-email/`, {
            email: 'test@example.com'
        });
        console.log(`${colors.green}✅ 이메일 중복 확인 API 작동${colors.reset}`);
    } catch (error) {
        if (error.response?.status === 409) {
            console.log(`${colors.green}✅ 이메일 중복 확인 작동 (이메일 사용 중)${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ 이메일 확인 실패${colors.reset}`);
        }
    }
    
    try {
        await axios.post(`${API_URL}/users/check-nickname/`, {
            nickname: 'TestUser'
        });
        console.log(`${colors.green}✅ 닉네임 중복 확인 API 작동${colors.reset}`);
    } catch (error) {
        if (error.response?.status === 409) {
            console.log(`${colors.green}✅ 닉네임 중복 확인 작동 (닉네임 사용 중)${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ 닉네임 확인 실패${colors.reset}`);
        }
    }
    
    console.log('\n=== 테스트 완료 ===\n');
}

testAuth().catch(console.error);