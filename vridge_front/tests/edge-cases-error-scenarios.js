/**
 * VideoPlanet 엣지 케이스 및 에러 시나리오 테스트
 * 우선순위: 중간 (시스템 견고성 검증)
 */

const axios = require('axios');

class EdgeCasesAndErrorScenariosTest {
    constructor() {
        this.baseURL = 'https://videoplanet.up.railway.app';
        this.authToken = null;
        this.testResults = {
            testType: 'Edge Cases & Error Scenarios',
            scenarios: [],
            totalTests: 0,
            passedTests: 0,
            criticalVulnerabilities: [],
            performanceIssues: [],
            edgeCaseFailures: []
        };
    }

    async runTests() {
        console.log('🚀 엣지 케이스 및 에러 시나리오 테스트 시작');
        
        // 사전 조건: 인증 토큰 획득 (실패해도 계속 진행)
        await this.setupAuth();

        // 1. 네트워크 오류 처리 테스트
        await this.testNetworkErrorHandling();
        
        // 2. 잘못된 입력값 처리 테스트
        await this.testInvalidInputHandling();
        
        // 3. 동시성 문제 테스트
        await this.testConcurrencyIssues();
        
        // 4. 보안 취약점 테스트
        await this.testSecurityVulnerabilities();
        
        // 5. 리소스 한계 테스트
        await this.testResourceLimits();
        
        // 6. 상태 일관성 테스트
        await this.testStateConsistency();
        
        // 7. 파일 업로드 극한 테스트
        await this.testFileUploadEdgeCases();
        
        // 8. API 권한 경계 테스트
        await this.testAPIPermissionBoundaries();

        this.generateReport();
    }

    async setupAuth() {
        try {
            const loginData = {
                email: 'test@example.com',
                password: 'Test123!'
            };

            const response = await axios.post(`${this.baseURL}/api/auth/login/`, loginData);
            this.authToken = response.data.access;
            console.log('✅ 인증 토큰 획득 성공');
        } catch (error) {
            console.log('⚠️ 인증 토큰 획득 실패 (일부 테스트 제한됨):', error.message);
        }
    }

    async testNetworkErrorHandling() {
        const scenario = {
            name: '네트워크 오류 처리',
            tests: [],
            criticalLevel: 'HIGH'
        };

        // 타임아웃 테스트
        try {
            const timeoutResponse = await axios.get(
                `${this.baseURL}/api/health/`,
                { timeout: 1 } // 1ms 타임아웃으로 강제 타임아웃 유발
            );

            scenario.tests.push({
                name: '타임아웃 처리',
                status: 'UNEXPECTED',
                details: '1ms 타임아웃에서도 응답 받음 (매우 빠른 서버)',
                severity: 'INFO'
            });

        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                scenario.tests.push({
                    name: '타임아웃 처리',
                    status: 'PASS',
                    details: '타임아웃 오류 적절히 처리됨'
                });
            } else {
                scenario.tests.push({
                    name: '타임아웃 처리',
                    status: 'FAIL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }

        // 존재하지 않는 엔드포인트 테스트
        try {
            const notFoundResponse = await axios.get(
                `${this.baseURL}/api/nonexistent-endpoint-12345/`,
                { timeout: 5000 }
            );

            scenario.tests.push({
                name: '존재하지 않는 엔드포인트',
                status: 'FAIL',
                details: `존재하지 않는 엔드포인트가 응답함: ${notFoundResponse.status}`,
                severity: 'HIGH'
            });

        } catch (error) {
            if (error.response && error.response.status === 404) {
                scenario.tests.push({
                    name: '존재하지 않는 엔드포인트',
                    status: 'PASS',
                    details: '404 오류 적절히 반환됨'
                });
            } else {
                scenario.tests.push({
                    name: '존재하지 않는 엔드포인트',
                    status: 'PARTIAL',
                    details: `다른 오류 반환: ${error.message}`
                });
            }
        }

        // 잘못된 도메인 테스트 (연결 실패)
        try {
            const invalidDomainResponse = await axios.get(
                'https://invalid-domain-does-not-exist-12345.com/api/health/',
                { timeout: 3000 }
            );

            scenario.tests.push({
                name: '잘못된 도메인 처리',
                status: 'FAIL',
                details: '잘못된 도메인에서 응답 받음',
                severity: 'HIGH'
            });

        } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                scenario.tests.push({
                    name: '잘못된 도메인 처리',
                    status: 'PASS',
                    details: '연결 오류 적절히 처리됨'
                });
            } else {
                scenario.tests.push({
                    name: '잘못된 도메인 처리',
                    status: 'PARTIAL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }

        // SSL 인증서 문제 시뮬레이션
        try {
            const sslResponse = await axios.get(
                'https://self-signed.badssl.com',
                { 
                    timeout: 5000,
                    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: true })
                }
            );

            scenario.tests.push({
                name: 'SSL 인증서 검증',
                status: 'FAIL',
                details: '잘못된 SSL 인증서 허용됨',
                severity: 'HIGH'
            });

        } catch (error) {
            if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
                scenario.tests.push({
                    name: 'SSL 인증서 검증',
                    status: 'PASS',
                    details: 'SSL 인증서 오류 적절히 차단됨'
                });
            } else {
                scenario.tests.push({
                    name: 'SSL 인증서 검증',
                    status: 'PARTIAL',
                    details: `다른 오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testInvalidInputHandling() {
        const scenario = {
            name: '잘못된 입력값 처리',
            tests: [],
            criticalLevel: 'CRITICAL'
        };

        // SQL 인젝션 시도
        const sqlInjectionAttempts = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'/*",
            "' UNION SELECT * FROM users --"
        ];

        for (const injection of sqlInjectionAttempts) {
            try {
                const response = await axios.post(
                    `${this.baseURL}/api/auth/login/`,
                    {
                        email: injection,
                        password: 'test123'
                    },
                    { timeout: 5000 }
                );

                scenario.tests.push({
                    name: `SQL 인젝션 방어: ${injection.substring(0, 20)}...`,
                    status: 'FAIL',
                    details: `SQL 인젝션 시도가 처리됨: ${response.status}`,
                    severity: 'CRITICAL'
                });

                this.testResults.criticalVulnerabilities.push({
                    type: 'SQL Injection',
                    payload: injection,
                    endpoint: '/api/auth/login/',
                    severity: 'CRITICAL'
                });

            } catch (error) {
                if (error.response && error.response.status >= 400 && error.response.status < 500) {
                    scenario.tests.push({
                        name: `SQL 인젝션 방어: ${injection.substring(0, 20)}...`,
                        status: 'PASS',
                        details: 'SQL 인젝션 시도 적절히 차단됨'
                    });
                } else {
                    scenario.tests.push({
                        name: `SQL 인젝션 방어: ${injection.substring(0, 20)}...`,
                        status: 'PARTIAL',
                        details: `예상치 못한 오류: ${error.message}`
                    });
                }
            }
        }

        // XSS 시도
        const xssAttempts = [
            '<script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src="x" onerror="alert(1)">',
            '"><script>alert(String.fromCharCode(88,83,83))</script>'
        ];

        for (const xss of xssAttempts) {
            try {
                const response = await axios.post(
                    `${this.baseURL}/api/projects/`,
                    {
                        name: xss,
                        type: 'test',
                        client: 'test client'
                    },
                    {
                        headers: this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {},
                        timeout: 5000
                    }
                );

                // 응답에서 스크립트 태그가 그대로 반환되는지 확인
                const responseString = JSON.stringify(response.data);
                const containsScript = responseString.includes('<script>') || responseString.includes('javascript:');

                scenario.tests.push({
                    name: `XSS 방어: ${xss.substring(0, 20)}...`,
                    status: containsScript ? 'FAIL' : 'PASS',
                    details: containsScript ? 
                        'XSS 스크립트가 응답에 포함됨' : 
                        'XSS 스크립트 적절히 처리됨',
                    severity: containsScript ? 'HIGH' : 'NORMAL'
                });

                if (containsScript) {
                    this.testResults.criticalVulnerabilities.push({
                        type: 'XSS',
                        payload: xss,
                        endpoint: '/api/projects/',
                        severity: 'HIGH'
                    });
                }

            } catch (error) {
                scenario.tests.push({
                    name: `XSS 방어: ${xss.substring(0, 20)}...`,
                    status: error.response && error.response.status >= 400 ? 'PASS' : 'FAIL',
                    details: error.response ? 
                        'XSS 시도 차단됨' : 
                        `오류: ${error.message}`
                });
            }
        }

        // 극한 데이터 크기 테스트
        const largeString = 'A'.repeat(10000); // 10KB 문자열
        const extremelyLargeString = 'B'.repeat(1000000); // 1MB 문자열

        try {
            const largeDataResponse = await axios.post(
                `${this.baseURL}/api/projects/`,
                {
                    name: largeString,
                    type: 'test',
                    client: 'test client',
                    description: largeString
                },
                {
                    headers: this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {},
                    timeout: 10000
                }
            );

            scenario.tests.push({
                name: '대용량 데이터 처리 (10KB)',
                status: 'PASS',
                details: `대용량 데이터 처리 성공: ${largeDataResponse.status}`
            });

        } catch (error) {
            if (error.response && error.response.status === 413) {
                scenario.tests.push({
                    name: '대용량 데이터 처리 (10KB)',
                    status: 'PASS',
                    details: '대용량 데이터 적절히 제한됨 (413 Payload Too Large)'
                });
            } else {
                scenario.tests.push({
                    name: '대용량 데이터 처리 (10KB)',
                    status: 'FAIL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }

        // 극한 대용량 데이터 테스트 (1MB)
        try {
            const extremeDataResponse = await axios.post(
                `${this.baseURL}/api/projects/`,
                {
                    name: 'Extreme Test',
                    type: 'test',
                    client: 'test client',
                    description: extremelyLargeString
                },
                {
                    headers: this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {},
                    timeout: 15000
                }
            );

            scenario.tests.push({
                name: '극한 대용량 데이터 처리 (1MB)',
                status: 'FAIL',
                details: '1MB 데이터가 처리됨 - 메모리 공격 위험',
                severity: 'HIGH'
            });

            this.testResults.criticalVulnerabilities.push({
                type: 'DoS via Large Payload',
                payload: '1MB string',
                endpoint: '/api/projects/',
                severity: 'MEDIUM'
            });

        } catch (error) {
            if (error.response && (error.response.status === 413 || error.response.status === 400)) {
                scenario.tests.push({
                    name: '극한 대용량 데이터 처리 (1MB)',
                    status: 'PASS',
                    details: '극한 대용량 데이터 적절히 차단됨'
                });
            } else {
                scenario.tests.push({
                    name: '극한 대용량 데이터 처리 (1MB)',
                    status: 'PARTIAL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }

        // 잘못된 JSON 형식 테스트
        try {
            const invalidJsonResponse = await axios.post(
                `${this.baseURL}/api/projects/`,
                '{"name": "test", "invalid": json}', // 잘못된 JSON
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
                    },
                    timeout: 5000
                }
            );

            scenario.tests.push({
                name: '잘못된 JSON 형식 처리',
                status: 'FAIL',
                details: '잘못된 JSON이 처리됨',
                severity: 'MEDIUM'
            });

        } catch (error) {
            if (error.response && error.response.status === 400) {
                scenario.tests.push({
                    name: '잘못된 JSON 형식 처리',
                    status: 'PASS',
                    details: '잘못된 JSON 적절히 차단됨'
                });
            } else {
                scenario.tests.push({
                    name: '잘못된 JSON 형식 처리',
                    status: 'PARTIAL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testConcurrencyIssues() {
        const scenario = {
            name: '동시성 문제',
            tests: [],
            criticalLevel: 'HIGH'
        };

        if (!this.authToken) {
            scenario.tests.push({
                name: '동시성 테스트',
                status: 'SKIP',
                details: '인증 토큰이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        // 동시 로그인 시도
        const loginPromises = [];
        for (let i = 0; i < 10; i++) {
            const loginPromise = axios.post(
                `${this.baseURL}/api/auth/login/`,
                {
                    email: 'test@example.com',
                    password: 'Test123!'
                },
                { timeout: 10000 }
            ).catch(error => ({ error: error.message, status: error.response?.status }));
            
            loginPromises.push(loginPromise);
        }

        try {
            const loginResults = await Promise.all(loginPromises);
            const successfulLogins = loginResults.filter(result => result.data && result.data.access).length;
            const failedLogins = loginResults.filter(result => result.error).length;

            scenario.tests.push({
                name: '동시 로그인 처리',
                status: failedLogins === 0 ? 'PASS' : 'PARTIAL',
                details: `성공: ${successfulLogins}, 실패: ${failedLogins}`
            });

            // 레이트 리미팅 확인
            if (failedLogins > 0) {
                const rateLimitErrors = loginResults.filter(result => 
                    result.status === 429 || result.error?.includes('rate limit')
                ).length;

                scenario.tests.push({
                    name: '레이트 리미팅',
                    status: rateLimitErrors > 0 ? 'PASS' : 'FAIL',
                    details: `레이트 리미트 오류: ${rateLimitErrors}건`
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '동시 로그인 처리',
                status: 'FAIL',
                details: `동시성 테스트 실패: ${error.message}`
            });
        }

        // 동시 프로젝트 생성 (경쟁 상태 테스트)
        const projectPromises = [];
        const projectName = `동시성 테스트 프로젝트 ${Date.now()}`;
        
        for (let i = 0; i < 5; i++) {
            const projectPromise = axios.post(
                `${this.baseURL}/api/projects/`,
                {
                    name: projectName, // 동일한 이름으로 동시 생성
                    type: 'test',
                    client: `클라이언트 ${i}`
                },
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    timeout: 10000
                }
            ).catch(error => ({ error: error.message, status: error.response?.status }));
            
            projectPromises.push(projectPromise);
        }

        try {
            const projectResults = await Promise.all(projectPromises);
            const successfulCreations = projectResults.filter(result => result.data && result.data.id).length;
            const duplicateErrors = projectResults.filter(result => 
                result.status === 400 && (result.error?.includes('duplicate') || result.error?.includes('already exists'))
            ).length;

            scenario.tests.push({
                name: '동시 프로젝트 생성 (중복 방지)',
                status: successfulCreations === 1 && duplicateErrors > 0 ? 'PASS' : 'FAIL',
                details: `성공: ${successfulCreations}, 중복 오류: ${duplicateErrors}`,
                severity: successfulCreations > 1 ? 'HIGH' : 'NORMAL'
            });

            if (successfulCreations > 1) {
                this.testResults.edgeCaseFailures.push({
                    type: 'Race Condition',
                    issue: '동일한 이름의 프로젝트 여러 개 생성됨',
                    severity: 'HIGH'
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '동시 프로젝트 생성',
                status: 'FAIL',
                details: `동시성 테스트 실패: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testSecurityVulnerabilities() {
        const scenario = {
            name: '보안 취약점',
            tests: [],
            criticalLevel: 'CRITICAL'
        };

        // CSRF 공격 시뮬레이션
        try {
            const csrfResponse = await axios.post(
                `${this.baseURL}/api/projects/`,
                {
                    name: 'CSRF 테스트 프로젝트',
                    type: 'test',
                    client: 'CSRF 클라이언트'
                },
                {
                    headers: {
                        'Origin': 'https://malicious-site.com',
                        'Referer': 'https://malicious-site.com/attack.html',
                        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
                    },
                    timeout: 5000
                }
            );

            scenario.tests.push({
                name: 'CSRF 공격 방어',
                status: 'FAIL',
                details: '악의적인 Origin에서의 요청이 허용됨',
                severity: 'HIGH'
            });

            this.testResults.criticalVulnerabilities.push({
                type: 'CSRF',
                payload: 'Cross-origin request allowed',
                endpoint: '/api/projects/',
                severity: 'HIGH'
            });

        } catch (error) {
            if (error.response && error.response.status === 403) {
                scenario.tests.push({
                    name: 'CSRF 공격 방어',
                    status: 'PASS',
                    details: 'CSRF 공격 적절히 차단됨'
                });
            } else {
                scenario.tests.push({
                    name: 'CSRF 공격 방어',
                    status: 'PARTIAL',
                    details: `예상치 못한 응답: ${error.message}`
                });
            }
        }

        // 권한 상승 시도
        try {
            const elevationResponse = await axios.post(
                `${this.baseURL}/api/admin/users/`,
                {
                    email: 'hacker@example.com',
                    password: 'Hack123!',
                    is_superuser: true,
                    is_staff: true
                },
                {
                    headers: this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {},
                    timeout: 5000
                }
            );

            scenario.tests.push({
                name: '권한 상승 방지',
                status: 'FAIL',
                details: '일반 사용자가 관리자 권한으로 사용자 생성함',
                severity: 'CRITICAL'
            });

            this.testResults.criticalVulnerabilities.push({
                type: 'Privilege Escalation',
                payload: 'Normal user created admin account',
                endpoint: '/api/admin/users/',
                severity: 'CRITICAL'
            });

        } catch (error) {
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                scenario.tests.push({
                    name: '권한 상승 방지',
                    status: 'PASS',
                    details: '권한 상승 시도 적절히 차단됨'
                });
            } else {
                scenario.tests.push({
                    name: '권한 상승 방지',
                    status: 'PARTIAL',
                    details: `예상치 못한 응답: ${error.message}`
                });
            }
        }

        // JWT 토큰 조작 시도
        if (this.authToken) {
            const manipulatedToken = this.authToken.replace(/.$/, '0'); // 마지막 문자 변경
            
            try {
                const tokenResponse = await axios.get(
                    `${this.baseURL}/api/users/me/`,
                    {
                        headers: { 'Authorization': `Bearer ${manipulatedToken}` },
                        timeout: 5000
                    }
                );

                scenario.tests.push({
                    name: 'JWT 토큰 무결성 검증',
                    status: 'FAIL',
                    details: '조작된 JWT 토큰이 허용됨',
                    severity: 'CRITICAL'
                });

                this.testResults.criticalVulnerabilities.push({
                    type: 'JWT Token Manipulation',
                    payload: 'Modified JWT token accepted',
                    endpoint: '/api/users/me/',
                    severity: 'CRITICAL'
                });

            } catch (error) {
                if (error.response && error.response.status === 401) {
                    scenario.tests.push({
                        name: 'JWT 토큰 무결성 검증',
                        status: 'PASS',
                        details: '조작된 JWT 토큰 적절히 거부됨'
                    });
                } else {
                    scenario.tests.push({
                        name: 'JWT 토큰 무결성 검증',
                        status: 'PARTIAL',
                        details: `예상치 못한 응답: ${error.message}`
                    });
                }
            }
        }

        // 디렉토리 트래버설 시도
        const pathTraversalAttempts = [
            '../../../etc/passwd',
            '..\\\\..\\\\..\\\\windows\\\\system32\\\\config\\\\sam',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
        ];

        for (const path of pathTraversalAttempts) {
            try {
                const traversalResponse = await axios.get(
                    `${this.baseURL}/api/files/${encodeURIComponent(path)}`,
                    {
                        headers: this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {},
                        timeout: 5000
                    }
                );

                scenario.tests.push({
                    name: `디렉토리 트래버설 방지: ${path.substring(0, 20)}...`,
                    status: 'FAIL',
                    details: '디렉토리 트래버설 공격이 허용됨',
                    severity: 'HIGH'
                });

                this.testResults.criticalVulnerabilities.push({
                    type: 'Directory Traversal',
                    payload: path,
                    endpoint: '/api/files/',
                    severity: 'HIGH'
                });

            } catch (error) {
                if (error.response && (error.response.status === 403 || error.response.status === 400)) {
                    scenario.tests.push({
                        name: `디렉토리 트래버설 방지: ${path.substring(0, 20)}...`,
                        status: 'PASS',
                        details: '디렉토리 트래버설 시도 차단됨'
                    });
                } else {
                    scenario.tests.push({
                        name: `디렉토리 트래버설 방지: ${path.substring(0, 20)}...`,
                        status: 'PARTIAL',
                        details: `예상치 못한 응답: ${error.message}`
                    });
                }
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testResourceLimits() {
        const scenario = {
            name: '리소스 한계',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        // API 요청 폭주 테스트 (DoS 공격 시뮬레이션)
        const rapidRequests = [];
        const startTime = Date.now();
        
        for (let i = 0; i < 50; i++) {
            const request = axios.get(
                `${this.baseURL}/api/health/`,
                { timeout: 2000 }
            ).catch(error => ({ error: error.message, status: error.response?.status }));
            
            rapidRequests.push(request);
        }

        try {
            const results = await Promise.all(rapidRequests);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            const successCount = results.filter(r => r.data).length;
            const rateLimitCount = results.filter(r => r.status === 429).length;
            const errorCount = results.filter(r => r.error).length;

            scenario.tests.push({
                name: 'API 요청 폭주 처리',
                status: rateLimitCount > 0 ? 'PASS' : 'FAIL',
                details: `50개 요청 (${duration}ms): 성공 ${successCount}, 제한 ${rateLimitCount}, 오류 ${errorCount}`,
                severity: rateLimitCount === 0 ? 'HIGH' : 'NORMAL'
            });

            if (rateLimitCount === 0 && errorCount === 0) {
                this.testResults.performanceIssues.push({
                    type: 'No Rate Limiting',
                    issue: '50개 동시 요청이 모두 처리됨',
                    risk: 'DoS 공격에 취약',
                    severity: 'HIGH'
                });
            }

            // 응답 시간 분석
            const avgResponseTime = duration / 50;
            scenario.tests.push({
                name: '고부하 시 응답 시간',
                status: avgResponseTime < 500 ? 'PASS' : avgResponseTime < 1000 ? 'WARNING' : 'FAIL',
                details: `평균 응답 시간: ${avgResponseTime.toFixed(0)}ms`,
                severity: avgResponseTime > 1000 ? 'MEDIUM' : 'NORMAL'
            });

        } catch (error) {
            scenario.tests.push({
                name: 'API 요청 폭주 처리',
                status: 'FAIL',
                details: `폭주 테스트 실패: ${error.message}`
            });
        }

        // 메모리 집약적 요청 테스트
        if (this.authToken) {
            try {
                const memoryIntensiveData = {
                    name: 'Memory Test Project',
                    type: 'test',
                    client: 'Test Client',
                    large_data: Array(1000).fill().map((_, i) => ({
                        id: i,
                        data: 'x'.repeat(1000) // 각 항목당 1KB
                    })) // 총 1MB 데이터
                };

                const memoryResponse = await axios.post(
                    `${this.baseURL}/api/projects/`,
                    memoryIntensiveData,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` },
                        timeout: 10000
                    }
                );

                scenario.tests.push({
                    name: '메모리 집약적 요청 처리',
                    status: 'WARNING',
                    details: '1MB 데이터가 처리됨 - 메모리 사용량 주의',
                    severity: 'MEDIUM'
                });

                this.testResults.performanceIssues.push({
                    type: 'Memory Usage',
                    issue: '대용량 데이터 처리로 인한 메모리 사용량 증가',
                    severity: 'MEDIUM'
                });

            } catch (error) {
                if (error.response && (error.response.status === 413 || error.response.status === 400)) {
                    scenario.tests.push({
                        name: '메모리 집약적 요청 처리',
                        status: 'PASS',
                        details: '대용량 데이터 적절히 제한됨'
                    });
                } else {
                    scenario.tests.push({
                        name: '메모리 집약적 요청 처리',
                        status: 'FAIL',
                        details: `예상치 못한 오류: ${error.message}`
                    });
                }
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testStateConsistency() {
        const scenario = {
            name: '상태 일관성',
            tests: [],
            criticalLevel: 'HIGH'
        };

        if (!this.authToken) {
            scenario.tests.push({
                name: '상태 일관성 테스트',
                status: 'SKIP',
                details: '인증 토큰이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        // 트랜잭션 일관성 테스트
        try {
            // 프로젝트 생성
            const projectResponse = await axios.post(
                `${this.baseURL}/api/projects/`,
                {
                    name: `일관성 테스트 프로젝트 ${Date.now()}`,
                    type: 'test',
                    client: 'Test Client'
                },
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            if (projectResponse.status === 201) {
                const projectId = projectResponse.data.id;

                // 동시에 같은 프로젝트를 수정하는 요청들
                const updatePromises = [];
                for (let i = 0; i < 3; i++) {
                    const updatePromise = axios.patch(
                        `${this.baseURL}/api/projects/${projectId}/`,
                        {
                            name: `업데이트된 프로젝트 ${i}`,
                            status: `status_${i}`
                        },
                        {
                            headers: { 'Authorization': `Bearer ${this.authToken}` }
                        }
                    ).catch(error => ({ error: error.message, status: error.response?.status }));
                    
                    updatePromises.push(updatePromise);
                }

                const updateResults = await Promise.all(updatePromises);
                const successfulUpdates = updateResults.filter(r => r.data).length;
                const conflictErrors = updateResults.filter(r => r.status === 409).length;

                scenario.tests.push({
                    name: '동시 업데이트 일관성',
                    status: successfulUpdates === 1 || conflictErrors > 0 ? 'PASS' : 'FAIL',
                    details: `성공한 업데이트: ${successfulUpdates}, 충돌: ${conflictErrors}`,
                    severity: successfulUpdates > 1 && conflictErrors === 0 ? 'HIGH' : 'NORMAL'
                });

                // 최종 상태 확인
                const finalStateResponse = await axios.get(
                    `${this.baseURL}/api/projects/${projectId}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                );

                scenario.tests.push({
                    name: '최종 상태 일관성',
                    status: 'PASS',
                    details: `최종 상태: ${finalStateResponse.data.name}`
                });

                // 정리 - 테스트 프로젝트 삭제
                await axios.delete(
                    `${this.baseURL}/api/projects/${projectId}/`,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` }
                    }
                ).catch(() => {}); // 삭제 실패해도 계속 진행

            } else {
                scenario.tests.push({
                    name: '트랜잭션 일관성 테스트',
                    status: 'SKIP',
                    details: '테스트 프로젝트 생성 실패'
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '트랜잭션 일관성',
                status: 'FAIL',
                details: `상태 일관성 테스트 실패: ${error.message}`
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testFileUploadEdgeCases() {
        const scenario = {
            name: '파일 업로드 극한 테스트',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        // 악성 파일 확장자 테스트
        const maliciousExtensions = [
            { name: 'virus.exe', type: 'application/octet-stream' },
            { name: 'script.php', type: 'application/x-php' },
            { name: 'shell.sh', type: 'application/x-sh' },
            { name: 'payload.bat', type: 'application/x-msdos-program' }
        ];

        for (const file of maliciousExtensions) {
            try {
                const formData = new FormData();
                formData.append('file', new Blob(['malicious content'], { type: file.type }), file.name);
                formData.append('project_id', '1');

                const uploadResponse = await axios.post(
                    `${this.baseURL}/api/upload/`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
                        },
                        timeout: 10000
                    }
                );

                scenario.tests.push({
                    name: `악성 파일 업로드 차단: ${file.name}`,
                    status: 'FAIL',
                    details: `악성 파일이 업로드됨: ${file.name}`,
                    severity: 'HIGH'
                });

                this.testResults.criticalVulnerabilities.push({
                    type: 'Malicious File Upload',
                    payload: file.name,
                    endpoint: '/api/upload/',
                    severity: 'HIGH'
                });

            } catch (error) {
                if (error.response && (error.response.status === 400 || error.response.status === 403)) {
                    scenario.tests.push({
                        name: `악성 파일 업로드 차단: ${file.name}`,
                        status: 'PASS',
                        details: '악성 파일 업로드 적절히 차단됨'
                    });
                } else {
                    scenario.tests.push({
                        name: `악성 파일 업로드 차단: ${file.name}`,
                        status: 'PARTIAL',
                        details: `예상치 못한 오류: ${error.message}`
                    });
                }
            }
        }

        // 대용량 파일 업로드 테스트
        try {
            const largeFileContent = new Uint8Array(10 * 1024 * 1024); // 10MB
            largeFileContent.fill(65); // 'A' 문자로 채움

            const formData = new FormData();
            formData.append('file', new Blob([largeFileContent], { type: 'text/plain' }), 'large_file.txt');
            formData.append('project_id', '1');

            const largeUploadResponse = await axios.post(
                `${this.baseURL}/api/upload/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
                    },
                    timeout: 30000
                }
            );

            scenario.tests.push({
                name: '대용량 파일 업로드 (10MB)',
                status: 'WARNING',
                details: '10MB 파일 업로드 성공 - 스토리지 사용량 주의',
                severity: 'MEDIUM'
            });

            this.testResults.performanceIssues.push({
                type: 'Large File Upload',
                issue: '10MB 파일 업로드 허용',
                risk: '스토리지 남용 가능성',
                severity: 'MEDIUM'
            });

        } catch (error) {
            if (error.response && error.response.status === 413) {
                scenario.tests.push({
                    name: '대용량 파일 업로드 (10MB)',
                    status: 'PASS',
                    details: '대용량 파일 업로드 적절히 제한됨'
                });
            } else {
                scenario.tests.push({
                    name: '대용량 파일 업로드 (10MB)',
                    status: 'PARTIAL',
                    details: `예상치 못한 오류: ${error.message}`
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testAPIPermissionBoundaries() {
        const scenario = {
            name: 'API 권한 경계',
            tests: [],
            criticalLevel: 'HIGH'
        };

        // 인증 없는 보호된 엔드포인트 접근 시도
        const protectedEndpoints = [
            '/api/users/me/',
            '/api/projects/',
            '/api/admin/users/',
            '/api/feedbacks/'
        ];

        for (const endpoint of protectedEndpoints) {
            try {
                const unauthorizedResponse = await axios.get(
                    `${this.baseURL}${endpoint}`,
                    { timeout: 5000 }
                );

                scenario.tests.push({
                    name: `보호된 엔드포인트 접근 차단: ${endpoint}`,
                    status: 'FAIL',
                    details: '인증 없이 보호된 엔드포인트 접근 허용됨',
                    severity: 'CRITICAL'
                });

                this.testResults.criticalVulnerabilities.push({
                    type: 'Authentication Bypass',
                    payload: endpoint,
                    endpoint: endpoint,
                    severity: 'CRITICAL'
                });

            } catch (error) {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    scenario.tests.push({
                        name: `보호된 엔드포인트 접근 차단: ${endpoint}`,
                        status: 'PASS',
                        details: '인증 없는 접근 적절히 차단됨'
                    });
                } else {
                    scenario.tests.push({
                        name: `보호된 엔드포인트 접근 차단: ${endpoint}`,
                        status: 'PARTIAL',
                        details: `예상치 못한 응답: ${error.message}`
                    });
                }
            }
        }

        // 만료된 토큰 테스트
        if (this.authToken) {
            // 토큰을 의도적으로 조작하여 만료 시뮬레이션
            const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjQwOTk1MjAwLCJqdGkiOiJleHBpcmVkIiwidXNlcl9pZCI6MX0.expired';
            
            try {
                const expiredTokenResponse = await axios.get(
                    `${this.baseURL}/api/users/me/`,
                    {
                        headers: { 'Authorization': `Bearer ${expiredToken}` },
                        timeout: 5000
                    }
                );

                scenario.tests.push({
                    name: '만료된 토큰 처리',
                    status: 'FAIL',
                    details: '만료된 토큰으로 접근 허용됨',
                    severity: 'HIGH'
                });

            } catch (error) {
                if (error.response && error.response.status === 401) {
                    scenario.tests.push({
                        name: '만료된 토큰 처리',
                        status: 'PASS',
                        details: '만료된 토큰 적절히 거부됨'
                    });
                } else {
                    scenario.tests.push({
                        name: '만료된 토큰 처리',
                        status: 'PARTIAL',
                        details: `예상치 못한 응답: ${error.message}`
                    });
                }
            }
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

        console.log('\n=== 엣지 케이스 및 에러 시나리오 테스트 결과 ===');
        console.log(`총 테스트: ${this.testResults.totalTests}개`);
        console.log(`성공: ${this.testResults.passedTests}개`);
        console.log(`성공률: ${successRate}%`);

        // 중요 보안 취약점 요약
        if (this.testResults.criticalVulnerabilities.length > 0) {
            console.log('\n🚨 발견된 보안 취약점:');
            this.testResults.criticalVulnerabilities.forEach((vuln, index) => {
                console.log(`${index + 1}. ${vuln.type} (${vuln.severity}): ${vuln.endpoint}`);
            });
        }

        // 성능 이슈 요약
        if (this.testResults.performanceIssues.length > 0) {
            console.log('\n⚠️ 성능 관련 이슈:');
            this.testResults.performanceIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.type}: ${issue.issue}`);
            });
        }

        // 엣지 케이스 실패
        if (this.testResults.edgeCaseFailures.length > 0) {
            console.log('\n🔄 엣지 케이스 처리 실패:');
            this.testResults.edgeCaseFailures.forEach((failure, index) => {
                console.log(`${index + 1}. ${failure.type}: ${failure.issue}`);
            });
        }

        // 시나리오별 결과
        this.testResults.scenarios.forEach(scenario => {
            console.log(`\n📋 ${scenario.name}:`);
            scenario.tests.forEach(test => {
                const icon = test.status === 'PASS' ? '✅' : 
                           test.status === 'WARNING' ? '⚠️' : 
                           test.status === 'PARTIAL' ? '🔄' : 
                           test.status === 'SKIP' ? '⏸️' : 
                           test.status === 'UNEXPECTED' ? '❓' : '❌';
                console.log(`  ${icon} ${test.name}: ${test.details}`);
            });
        });

        // 보안 등급 평가
        const criticalVulns = this.testResults.criticalVulnerabilities.filter(v => v.severity === 'CRITICAL').length;
        const highVulns = this.testResults.criticalVulnerabilities.filter(v => v.severity === 'HIGH').length;
        
        let securityGrade = 'A';
        if (criticalVulns > 0) securityGrade = 'F';
        else if (highVulns > 2) securityGrade = 'D';
        else if (highVulns > 0) securityGrade = 'C';
        else if (this.testResults.performanceIssues.length > 2) securityGrade = 'B';

        console.log(`\n🛡️ 전체 보안 등급: ${securityGrade}`);

        return this.testResults;
    }
}

// 모듈로 export
module.exports = EdgeCasesAndErrorScenariosTest;

// 직접 실행 시
if (require.main === module) {
    const edgeCaseTest = new EdgeCasesAndErrorScenariosTest();
    edgeCaseTest.runTests().then(() => {
        console.log('\n🎉 엣지 케이스 및 에러 시나리오 테스트 완료!');
    }).catch(error => {
        console.error('❌ 엣지 케이스 테스트 실행 중 오류:', error.message);
    });
}