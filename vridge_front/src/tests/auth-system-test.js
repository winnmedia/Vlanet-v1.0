/**
 * VideoPlanet 인증 시스템 완전 테스트
 * 실행: node auth-system-test.js
 */

const axios = require('axios');

// 설정
const API_BASE = 'https://videoplanet.up.railway.app';
const LOCAL_API = 'http://localhost:8000';

// 현재 사용할 API
const API_URL = API_BASE;  // Railway 서버 사용

// 테스트 사용자 정보
const TEST_USER = {
    email: 'authtest@test.com',
    nickname: 'AuthTestUser',
    password: 'Test1234!@'
};

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// 유틸리티 함수
function log(message, color = '') {
    console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, colors.bright + colors.cyan);
    console.log('='.repeat(60));
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

// 테스트 함수들
let accessToken = null;
let refreshToken = null;

async function testEmailCheck() {
    logSection('1. 이메일 중복 확인 테스트');
    
    try {
        // 새 이메일 확인
        const response = await axios.post(`${API_URL}/api/auth/check-email/`, {
            email: TEST_USER.email
        });
        
        if (response.status === 200) {
            logSuccess('이메일 중복 확인 API 작동');
            logInfo(`메시지: ${response.data.message}`);
            return true;
        }
    } catch (error) {
        if (error.response?.status === 409) {
            logInfo('이메일이 이미 사용 중 (정상)');
            return true;
        }
        logError(`이메일 확인 실패: ${error.message}`);
        if (error.response?.data) {
            console.log('응답 데이터:', error.response.data);
        }
        return false;
    }
}

async function testNicknameCheck() {
    logSection('2. 닉네임 중복 확인 테스트');
    
    try {
        const response = await axios.post(`${API_URL}/api/auth/check-nickname/`, {
            nickname: TEST_USER.nickname
        });
        
        if (response.status === 200) {
            logSuccess('닉네임 중복 확인 API 작동');
            logInfo(`메시지: ${response.data.message}`);
            return true;
        }
    } catch (error) {
        if (error.response?.status === 409) {
            logInfo('닉네임이 이미 사용 중 (정상)');
            return true;
        }
        logError(`닉네임 확인 실패: ${error.message}`);
        return false;
    }
}

async function testSignUp() {
    logSection('3. 회원가입 테스트');
    
    try {
        // 고유한 이메일 생성
        const uniqueEmail = `test_${Date.now()}@test.com`;
        const response = await axios.post(`${API_URL}/api/auth/signup/`, {
            email: uniqueEmail,
            nickname: `User_${Date.now()}`,
            password: TEST_USER.password
        });
        
        if (response.status === 201) {
            logSuccess('회원가입 성공');
            logInfo(`새 사용자: ${uniqueEmail}`);
            if (response.data.email_sent) {
                logInfo('이메일 인증 발송됨');
            }
            return true;
        }
    } catch (error) {
        if (error.response?.status === 409) {
            logInfo('사용자가 이미 존재 (정상)');
            return true;
        }
        logError(`회원가입 실패: ${error.message}`);
        if (error.response?.data) {
            console.log('응답 데이터:', error.response.data);
        }
        return false;
    }
}

async function testLogin() {
    logSection('4. 로그인 테스트');
    
    // 먼저 테스트 계정으로 시도
    const testAccounts = [
        { email: 'test@test.com', password: 'Test1234!@' },
        { email: 'demo@test.com', password: 'Demo1234!@' },
        { email: TEST_USER.email, password: TEST_USER.password }
    ];
    
    for (const account of testAccounts) {
        try {
            logInfo(`로그인 시도: ${account.email}`);
            
            const response = await axios.post(`${API_URL}/api/auth/login/`, {
                email: account.email,
                password: account.password
            });
            
            if (response.status === 200 && response.data.access_token) {
                logSuccess(`로그인 성공: ${account.email}`);
                accessToken = response.data.access_token;
                refreshToken = response.data.refresh_token;
                
                // 토큰 정보 출력
                logInfo(`Access Token: ${accessToken.substring(0, 50)}...`);
                logInfo(`Refresh Token: ${refreshToken ? refreshToken.substring(0, 50) + '...' : 'N/A'}`);
                
                // 사용자 정보 출력
                if (response.data.user) {
                    logInfo(`사용자 ID: ${response.data.user.id}`);
                    logInfo(`사용자명: ${response.data.user.username}`);
                    logInfo(`닉네임: ${response.data.user.nickname}`);
                }
                
                return true;
            }
        } catch (error) {
            if (error.response?.status === 401) {
                logInfo(`인증 실패: ${account.email} (비밀번호 오류)`);
            } else if (error.response?.status === 404) {
                logInfo(`사용자 없음: ${account.email}`);
            } else {
                logError(`로그인 오류: ${error.message}`);
            }
        }
    }
    
    logError('모든 테스트 계정 로그인 실패');
    return false;
}

async function testAuthenticatedRequest() {
    logSection('5. 인증된 API 요청 테스트');
    
    if (!accessToken) {
        logError('Access Token이 없습니다');
        return false;
    }
    
    try {
        const response = await axios.get(`${API_URL}/api/auth/me/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.status === 200) {
            logSuccess('인증된 요청 성공');
            logInfo(`사용자 정보 조회 성공`);
            console.log('사용자 정보:', response.data);
            return true;
        }
    } catch (error) {
        logError(`인증된 요청 실패: ${error.message}`);
        if (error.response?.status === 401) {
            logInfo('토큰이 유효하지 않음');
        }
        return false;
    }
}

async function testTokenRefresh() {
    logSection('6. 토큰 갱신 테스트');
    
    if (!refreshToken) {
        logInfo('Refresh Token이 없어 테스트 건너뜀');
        return true;
    }
    
    try {
        const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
            refresh: refreshToken
        });
        
        if (response.status === 200 && response.data.access) {
            logSuccess('토큰 갱신 성공');
            const newAccessToken = response.data.access;
            logInfo(`새 Access Token: ${newAccessToken.substring(0, 50)}...`);
            accessToken = newAccessToken;
            return true;
        }
    } catch (error) {
        logError(`토큰 갱신 실패: ${error.message}`);
        return false;
    }
}

async function testProjectAccess() {
    logSection('7. 프로젝트 API 접근 테스트');
    
    if (!accessToken) {
        logError('Access Token이 없습니다');
        return false;
    }
    
    try {
        const response = await axios.get(`${API_URL}/api/projects/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.status === 200) {
            logSuccess('프로젝트 목록 조회 성공');
            logInfo(`프로젝트 수: ${response.data.length || 0}`);
            return true;
        }
    } catch (error) {
        if (error.response?.status === 401) {
            logError('인증 실패 - 토큰 문제');
        } else {
            logError(`프로젝트 접근 실패: ${error.message}`);
        }
        return false;
    }
}

// 메인 테스트 실행
async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    log('VideoPlanet 인증 시스템 완전 테스트', colors.bright + colors.yellow);
    console.log('='.repeat(60));
    logInfo(`API 서버: ${API_URL}`);
    logInfo(`테스트 시작: ${new Date().toLocaleString()}`);
    
    const tests = [
        { name: '이메일 중복 확인', fn: testEmailCheck },
        { name: '닉네임 중복 확인', fn: testNicknameCheck },
        { name: '회원가입', fn: testSignUp },
        { name: '로그인', fn: testLogin },
        { name: '인증된 요청', fn: testAuthenticatedRequest },
        { name: '토큰 갱신', fn: testTokenRefresh },
        { name: '프로젝트 접근', fn: testProjectAccess }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, success: result });
        } catch (error) {
            logError(`테스트 실행 중 오류: ${error.message}`);
            results.push({ name: test.name, success: false });
        }
    }
    
    // 결과 요약
    logSection('테스트 결과 요약');
    
    let passCount = 0;
    let failCount = 0;
    
    for (const result of results) {
        if (result.success) {
            logSuccess(`${result.name}: PASS`);
            passCount++;
        } else {
            logError(`${result.name}: FAIL`);
            failCount++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    if (failCount === 0) {
        log(`✨ 모든 테스트 통과! (${passCount}/${tests.length})`, colors.bright + colors.green);
    } else {
        log(`⚠️  일부 테스트 실패 (통과: ${passCount}, 실패: ${failCount})`, colors.bright + colors.yellow);
    }
    console.log('='.repeat(60));
}

// 실행
runAllTests().catch(error => {
    logError(`치명적 오류: ${error.message}`);
    process.exit(1);
});