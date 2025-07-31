/**
 * VideoPlanet 사용자 여정 테스트 #1: 회원가입 및 온보딩
 * 우선순위: 최고 (백엔드 복구 후 즉시 실행)
 */

const axios = require('axios');

class AuthenticationJourneyTest {
    constructor() {
        this.baseURL = 'https://videoplanet.up.railway.app';
        this.testResults = {
            journey: 'Authentication & Onboarding',
            scenarios: [],
            totalTests: 0,
            passedTests: 0,
            criticalIssues: []
        };
    }

    async runJourney() {
        console.log('🚀 Journey 1: 회원가입 및 온보딩 테스트 시작');
        
        // 시나리오 1: 새 사용자 회원가입
        await this.testNewUserSignup();
        
        // 시나리오 2: 이메일 중복 검증
        await this.testDuplicateEmailValidation();
        
        // 시나리오 3: 비밀번호 정책 검증
        await this.testPasswordPolicyValidation();
        
        // 시나리오 4: 로그인 및 토큰 발급
        await this.testLogin();
        
        // 시나리오 5: 토큰 검증 및 사용자 정보 조회
        await this.testTokenValidation();
        
        // 시나리오 6: 온보딩 정보 입력
        await this.testOnboardingProcess();
        
        this.generateReport();
    }

    async testNewUserSignup() {
        const scenario = {
            name: '새 사용자 회원가입',
            tests: [],
            criticalLevel: 'HIGH'
        };

        try {
            // 엣지 케이스: 유효한 이메일 형식
            const validEmails = [
                'test+tag@example.com',
                'user.name@domain.co.kr',
                'valid_email123@test-domain.com'
            ];

            for (const email of validEmails) {
                const testData = {
                    email: email,
                    password: 'SecurePass123!',
                    username: `testuser_${Date.now()}`,
                    first_name: '테스트',
                    last_name: '사용자'
                };

                const response = await axios.post(`${this.baseURL}/api/auth/signup/`, testData);
                
                scenario.tests.push({
                    name: `유효한 이메일 형식 테스트: ${email}`,
                    status: response.status === 201 ? 'PASS' : 'FAIL',
                    details: response.status === 201 ? '회원가입 성공' : `Status: ${response.status}`,
                    performance: response.time || 'N/A'
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '회원가입 API 기본 테스트',
                status: 'FAIL',
                details: `API 오류: ${error.message}`,
                severity: 'CRITICAL'
            });
            
            this.testResults.criticalIssues.push({
                issue: '회원가입 API 접근 불가',
                impact: '신규 사용자 등록 불가능',
                urgency: 'IMMEDIATE'
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testDuplicateEmailValidation() {
        const scenario = {
            name: '이메일 중복 검증',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        try {
            // 동일 이메일로 중복 가입 시도
            const duplicateData = {
                email: 'existing@example.com',
                password: 'AnotherPass123!',
                username: 'newuser'
            };

            // 첫 번째 가입
            await axios.post(`${this.baseURL}/api/auth/signup/`, duplicateData);
            
            // 중복 가입 시도
            const duplicateResponse = await axios.post(`${this.baseURL}/api/auth/signup/`, duplicateData);
            
            scenario.tests.push({
                name: '중복 이메일 차단',
                status: duplicateResponse.status === 400 ? 'PASS' : 'FAIL',
                details: duplicateResponse.status === 400 ? '중복 차단 정상' : '중복 가입 허용됨',
                severity: duplicateResponse.status === 400 ? 'NORMAL' : 'HIGH'
            });

        } catch (error) {
            if (error.response && error.response.status === 400) {
                scenario.tests.push({
                    name: '중복 이메일 차단',
                    status: 'PASS',
                    details: '중복 이메일 적절히 차단됨'
                });
            } else {
                scenario.tests.push({
                    name: '중복 이메일 처리',
                    status: 'FAIL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testPasswordPolicyValidation() {
        const scenario = {
            name: '비밀번호 정책 검증',
            tests: [],
            criticalLevel: 'HIGH'
        };

        const weakPasswords = [
            '123456',        // 너무 짧고 단순
            'password',      // 일반적인 단어
            'abcdefgh',      // 숫자/특수문자 없음
            'PASSWORD123',   // 소문자 없음
            'password123'    // 특수문자 없음
        ];

        for (const weakPassword of weakPasswords) {
            try {
                const testData = {
                    email: `weak_${Date.now()}@test.com`,
                    password: weakPassword,
                    username: `weaktest_${Date.now()}`
                };

                const response = await axios.post(`${this.baseURL}/api/auth/signup/`, testData);
                
                scenario.tests.push({
                    name: `약한 비밀번호 차단: ${weakPassword}`,
                    status: response.status === 400 ? 'PASS' : 'FAIL',
                    details: response.status === 400 ? '약한 비밀번호 차단됨' : '약한 비밀번호 허용됨',
                    severity: response.status === 400 ? 'NORMAL' : 'HIGH'
                });

            } catch (error) {
                if (error.response && error.response.status === 400) {
                    scenario.tests.push({
                        name: `약한 비밀번호 차단: ${weakPassword}`,
                        status: 'PASS',
                        details: '약한 비밀번호 적절히 차단됨'
                    });
                }
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testLogin() {
        const scenario = {
            name: '로그인 및 토큰 발급',
            tests: [],
            criticalLevel: 'CRITICAL'
        };

        try {
            // 정상 로그인 테스트
            const loginData = {
                email: 'test@example.com',
                password: 'Test123!'
            };

            const response = await axios.post(`${this.baseURL}/api/auth/login/`, loginData);
            
            if (response.status === 200 && response.data.access) {
                scenario.tests.push({
                    name: '정상 로그인',
                    status: 'PASS',
                    details: `토큰 발급 성공 (${response.data.access.length}자)`,
                    token: response.data.access
                });
                
                // 토큰을 클래스 변수에 저장
                this.authToken = response.data.access;
            } else {
                scenario.tests.push({
                    name: '정상 로그인',
                    status: 'FAIL',
                    details: '토큰 발급 실패'
                });
            }

            // 잘못된 비밀번호 테스트
            const wrongPasswordData = {
                email: 'test@example.com',
                password: 'WrongPassword123!'
            };

            try {
                await axios.post(`${this.baseURL}/api/auth/login/`, wrongPasswordData);
                scenario.tests.push({
                    name: '잘못된 비밀번호 차단',
                    status: 'FAIL',
                    details: '잘못된 비밀번호로 로그인 성공됨',
                    severity: 'HIGH'
                });
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    scenario.tests.push({
                        name: '잘못된 비밀번호 차단',
                        status: 'PASS',
                        details: '잘못된 비밀번호 적절히 차단됨'
                    });
                }
            }

        } catch (error) {
            scenario.tests.push({
                name: '로그인 API',
                status: 'FAIL',
                details: `로그인 API 오류: ${error.message}`,
                severity: 'CRITICAL'
            });
            
            this.testResults.criticalIssues.push({
                issue: '로그인 시스템 장애',
                impact: '모든 사용자 로그인 불가능',
                urgency: 'IMMEDIATE'
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testTokenValidation() {
        const scenario = {
            name: '토큰 검증 및 사용자 정보',
            tests: [],
            criticalLevel: 'CRITICAL'
        };

        if (!this.authToken) {
            scenario.tests.push({
                name: '토큰 검증',
                status: 'SKIP',
                details: '로그인 토큰이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        try {
            // 인증된 API 호출 테스트
            const response = await axios.get(`${this.baseURL}/api/users/me/`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.status === 200) {
                scenario.tests.push({
                    name: '토큰 기반 사용자 정보 조회',
                    status: 'PASS',
                    details: `사용자 정보 조회 성공: ${response.data.email || 'N/A'}`
                });
            }

            // 잘못된 토큰 테스트
            try {
                await axios.get(`${this.baseURL}/api/users/me/`, {
                    headers: {
                        'Authorization': 'Bearer invalid_token_here'
                    }
                });
                
                scenario.tests.push({
                    name: '잘못된 토큰 차단',
                    status: 'FAIL',
                    details: '잘못된 토큰으로 접근 허용됨',
                    severity: 'HIGH'
                });
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    scenario.tests.push({
                        name: '잘못된 토큰 차단',
                        status: 'PASS',
                        details: '잘못된 토큰 적절히 차단됨'
                    });
                }
            }

        } catch (error) {
            scenario.tests.push({
                name: '토큰 검증',
                status: 'FAIL',
                details: `토큰 검증 실패: ${error.message}`,
                severity: 'HIGH'
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testOnboardingProcess() {
        const scenario = {
            name: '온보딩 프로세스',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (!this.authToken) {
            scenario.tests.push({
                name: '온보딩 정보 입력',
                status: 'SKIP',
                details: '인증 토큰이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        try {
            // 프로필 업데이트 테스트
            const profileData = {
                first_name: '테스트',
                last_name: '사용자',
                company: '테스트 회사',
                role: '개발자'
            };

            const response = await axios.patch(`${this.baseURL}/api/users/profile/`, profileData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            scenario.tests.push({
                name: '프로필 정보 업데이트',
                status: response.status === 200 ? 'PASS' : 'FAIL',
                details: response.status === 200 ? '프로필 업데이트 성공' : `Status: ${response.status}`
            });

        } catch (error) {
            scenario.tests.push({
                name: '온보딩 프로세스',
                status: 'FAIL',
                details: `온보딩 오류: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    generateReport() {
        // 통계 계산
        this.testResults.scenarios.forEach(scenario => {
            scenario.tests.forEach(test => {
                this.testResults.totalTests++;
                if (test.status === 'PASS') {
                    this.testResults.passedTests++;
                }
            });
        });

        const successRate = ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1);

        console.log('\n=== Journey 1: 회원가입 및 온보딩 테스트 결과 ===');
        console.log(`총 테스트: ${this.testResults.totalTests}개`);
        console.log(`성공: ${this.testResults.passedTests}개`);
        console.log(`성공률: ${successRate}%`);
        
        if (this.testResults.criticalIssues.length > 0) {
            console.log('\n🚨 중요 문제점:');
            this.testResults.criticalIssues.forEach(issue => {
                console.log(`- ${issue.issue}: ${issue.impact}`);
            });
        }

        // 시나리오별 결과
        this.testResults.scenarios.forEach(scenario => {
            console.log(`\n📋 ${scenario.name}:`);
            scenario.tests.forEach(test => {
                const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏸️';
                console.log(`  ${icon} ${test.name}: ${test.details}`);
            });
        });

        return this.testResults;
    }
}

// 모듈로 export
module.exports = AuthenticationJourneyTest;

// 직접 실행 시
if (require.main === module) {
    const journey = new AuthenticationJourneyTest();
    journey.runJourney().then(() => {
        console.log('\n🎉 Journey 1 테스트 완료!');
    }).catch(error => {
        console.error('❌ Journey 1 테스트 실행 중 오류:', error.message);
    });
}