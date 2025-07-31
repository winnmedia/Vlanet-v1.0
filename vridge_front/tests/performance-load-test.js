/**
 * VideoPlanet 성능 및 부하 테스트
 * 우선순위: 중간 (시스템 확장성 검증)
 */

const axios = require('axios');

class PerformanceAndLoadTest {
    constructor() {
        this.baseURL = 'https://videoplanet.up.railway.app';
        this.authToken = null;
        this.testResults = {
            testType: 'Performance & Load Testing',
            scenarios: [],
            totalTests: 0,
            passedTests: 0,
            performanceMetrics: {
                responseTimeStats: {},
                throughputStats: {},
                concurrencyResults: {},
                resourceUsage: {}
            },
            performanceIssues: [],
            recommendations: []
        };
    }

    async runTests() {
        console.log('🚀 성능 및 부하 테스트 시작');
        
        // 사전 조건: 인증 토큰 획득
        await this.setupAuth();

        // 1. 페이지 로딩 시간 테스트
        await this.testPageLoadTimes();
        
        // 2. API 응답 시간 테스트
        await this.testAPIResponseTimes();
        
        // 3. 동시 사용자 부하 테스트
        await this.testConcurrentUsers();
        
        // 4. 데이터베이스 쿼리 성능 테스트
        await this.testDatabasePerformance();
        
        // 5. 메모리 사용량 테스트
        await this.testMemoryUsage();
        
        // 6. 대용량 데이터 처리 테스트
        await this.testLargeDataHandling();
        
        // 7. 캐싱 효율성 테스트
        await this.testCachingEfficiency();
        
        // 8. 스트레스 테스트 (극한 부하)
        await this.testSystemUnderStress();

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

    async testPageLoadTimes() {
        const scenario = {
            name: '페이지 로딩 시간',
            tests: [],
            criticalLevel: 'HIGH'
        };

        const pages = [
            { path: '/', name: '홈페이지' },
            { path: '/login', name: '로그인 페이지' },
            { path: '/signup', name: '회원가입 페이지' },
            { path: '/projects', name: '프로젝트 목록' },
            { path: '/mypage', name: '마이페이지' }
        ];

        for (const page of pages) {
            const loadTimes = [];
            
            // 각 페이지를 5번 로드하여 평균 시간 측정
            for (let i = 0; i < 5; i++) {
                try {
                    const startTime = Date.now();
                    
                    const response = await axios.get(
                        `https://vlanet.net${page.path}`,
                        { 
                            timeout: 10000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        }
                    );
                    
                    const loadTime = Date.now() - startTime;
                    loadTimes.push(loadTime);
                    
                    // 짧은 대기 시간
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                } catch (error) {
                    // 로드 실패 시 높은 값으로 기록
                    loadTimes.push(10000);
                }
            }

            const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
            const minLoadTime = Math.min(...loadTimes);
            const maxLoadTime = Math.max(...loadTimes);

            let status = 'PASS';
            let severity = 'NORMAL';
            
            if (avgLoadTime > 3000) {
                status = 'FAIL';
                severity = 'HIGH';
                this.testResults.performanceIssues.push({
                    type: 'Slow Page Load',
                    page: page.name,
                    avgTime: avgLoadTime,
                    severity: 'HIGH'
                });
            } else if (avgLoadTime > 1500) {
                status = 'WARNING';
                severity = 'MEDIUM';
            }

            scenario.tests.push({
                name: `${page.name} 로딩 시간`,
                status: status,
                details: `평균: ${avgLoadTime.toFixed(0)}ms (${minLoadTime}-${maxLoadTime}ms)`,
                severity: severity,
                metrics: {
                    average: avgLoadTime,
                    minimum: minLoadTime,
                    maximum: maxLoadTime
                }
            });

            this.testResults.performanceMetrics.responseTimeStats[page.name] = {
                average: avgLoadTime,
                minimum: minLoadTime,
                maximum: maxLoadTime
            };
        }

        this.testResults.scenarios.push(scenario);
    }

    async testAPIResponseTimes() {
        const scenario = {
            name: 'API 응답 시간',
            tests: [],
            criticalLevel: 'HIGH'
        };

        const apiEndpoints = [
            { url: '/api/health/', name: '헬스체크', method: 'GET', auth: false },
            { url: '/api/auth/login/', name: '로그인', method: 'POST', auth: false, data: { email: 'test@example.com', password: 'Test123!' } },
            { url: '/api/projects/', name: '프로젝트 목록', method: 'GET', auth: true },
            { url: '/api/users/me/', name: '사용자 정보', method: 'GET', auth: true },
            { url: '/api/feedbacks/', name: '피드백 목록', method: 'GET', auth: true }
        ];

        for (const endpoint of apiEndpoints) {
            if (endpoint.auth && !this.authToken) {
                scenario.tests.push({
                    name: `${endpoint.name} API 응답시간`,
                    status: 'SKIP',
                    details: '인증 토큰이 없어 건너뜀'
                });
                continue;
            }

            const responseTimes = [];
            
            // 각 API를 10번 호출하여 성능 측정
            for (let i = 0; i < 10; i++) {
                try {
                    const startTime = Date.now();
                    
                    const config = {
                        method: endpoint.method,
                        url: `${this.baseURL}${endpoint.url}`,
                        timeout: 10000,
                        headers: endpoint.auth ? { 'Authorization': `Bearer ${this.authToken}` } : {}
                    };
                    
                    if (endpoint.data) {
                        config.data = endpoint.data;
                    }
                    
                    const response = await axios(config);
                    const responseTime = Date.now() - startTime;
                    responseTimes.push(responseTime);
                    
                    // API 호출 간 짧은 대기
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    // API 호출 실패 시 높은 값으로 기록
                    responseTimes.push(5000);
                }
            }

            const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
            const minResponseTime = Math.min(...responseTimes);
            const maxResponseTime = Math.max(...responseTimes);
            const p95ResponseTime = this.calculatePercentile(responseTimes, 95);

            let status = 'PASS';
            let severity = 'NORMAL';
            
            if (avgResponseTime > 2000) {
                status = 'FAIL';
                severity = 'HIGH';
                this.testResults.performanceIssues.push({
                    type: 'Slow API Response',
                    endpoint: endpoint.name,
                    avgTime: avgResponseTime,
                    severity: 'HIGH'
                });
            } else if (avgResponseTime > 1000) {
                status = 'WARNING';
                severity = 'MEDIUM';
            }

            scenario.tests.push({
                name: `${endpoint.name} API 응답시간`,
                status: status,
                details: `평균: ${avgResponseTime.toFixed(0)}ms, P95: ${p95ResponseTime.toFixed(0)}ms`,
                severity: severity,
                metrics: {
                    average: avgResponseTime,
                    minimum: minResponseTime,
                    maximum: maxResponseTime,
                    p95: p95ResponseTime
                }
            });

            this.testResults.performanceMetrics.responseTimeStats[endpoint.name] = {
                average: avgResponseTime,
                minimum: minResponseTime,
                maximum: maxResponseTime,
                p95: p95ResponseTime
            };
        }

        this.testResults.scenarios.push(scenario);
    }

    async testConcurrentUsers() {
        const scenario = {
            name: '동시 사용자 부하',
            tests: [],
            criticalLevel: 'HIGH'
        };

        const concurrencyLevels = [5, 10, 20, 50];

        for (const concurrency of concurrencyLevels) {
            try {
                const startTime = Date.now();
                const promises = [];
                
                // 동시 요청 생성
                for (let i = 0; i < concurrency; i++) {
                    const promise = axios.get(
                        `${this.baseURL}/api/health/`,
                        { timeout: 15000 }
                    ).then(response => ({
                        success: true,
                        responseTime: Date.now() - startTime,
                        status: response.status
                    })).catch(error => ({
                        success: false,
                        error: error.message,
                        status: error.response?.status
                    }));
                    
                    promises.push(promise);
                }

                // 모든 요청 완료 대기
                const results = await Promise.all(promises);
                const endTime = Date.now();
                const totalTime = endTime - startTime;
                
                const successCount = results.filter(r => r.success).length;
                const failureCount = results.filter(r => !r.success).length;
                const successRate = (successCount / concurrency) * 100;
                const throughput = (successCount / totalTime) * 1000; // requests per second

                let status = 'PASS';
                let severity = 'NORMAL';
                
                if (successRate < 90) {
                    status = 'FAIL';
                    severity = 'HIGH';
                    this.testResults.performanceIssues.push({
                        type: 'High Failure Rate Under Load',
                        concurrency: concurrency,
                        successRate: successRate,
                        severity: 'HIGH'
                    });
                } else if (successRate < 95) {
                    status = 'WARNING';
                    severity = 'MEDIUM';
                }

                scenario.tests.push({
                    name: `동시 사용자 ${concurrency}명`,
                    status: status,
                    details: `성공률: ${successRate.toFixed(1)}% (${successCount}/${concurrency}), 처리량: ${throughput.toFixed(1)} req/s`,
                    severity: severity,
                    metrics: {
                        concurrency: concurrency,
                        successRate: successRate,
                        throughput: throughput,
                        totalTime: totalTime
                    }
                });

                this.testResults.performanceMetrics.concurrencyResults[concurrency] = {
                    successRate: successRate,
                    throughput: throughput,
                    totalTime: totalTime,
                    successCount: successCount,
                    failureCount: failureCount
                };

                // 다음 테스트 전 대기 시간
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                scenario.tests.push({
                    name: `동시 사용자 ${concurrency}명`,
                    status: 'FAIL',
                    details: `동시성 테스트 실패: ${error.message}`,
                    severity: 'HIGH'
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testDatabasePerformance() {
        const scenario = {
            name: '데이터베이스 쿼리 성능',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (!this.authToken) {
            scenario.tests.push({
                name: '데이터베이스 성능 테스트',
                status: 'SKIP',
                details: '인증 토큰이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        const dbOperations = [
            { 
                name: '단순 조회', 
                operation: () => axios.get(`${this.baseURL}/api/users/me/`, { 
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    timeout: 10000
                })
            },
            { 
                name: '목록 조회 (페이지네이션)', 
                operation: () => axios.get(`${this.baseURL}/api/projects/?page=1&limit=20`, { 
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    timeout: 10000
                })
            },
            { 
                name: '검색 쿼리', 
                operation: () => axios.get(`${this.baseURL}/api/projects/?search=test`, { 
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    timeout: 10000
                })
            },
            { 
                name: '복합 필터링', 
                operation: () => axios.get(`${this.baseURL}/api/projects/?type=marketing&status=active`, { 
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    timeout: 10000
                })
            }
        ];

        for (const dbOp of dbOperations) {
            const queryTimes = [];
            
            // 각 쿼리를 5번 실행하여 성능 측정
            for (let i = 0; i < 5; i++) {
                try {
                    const startTime = Date.now();
                    await dbOp.operation();
                    const queryTime = Date.now() - startTime;
                    queryTimes.push(queryTime);
                    
                    // 쿼리 간 대기
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                } catch (error) {
                    queryTimes.push(3000); // 실패 시 높은 값
                }
            }

            const avgQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
            const maxQueryTime = Math.max(...queryTimes);

            let status = 'PASS';
            let severity = 'NORMAL';
            
            if (avgQueryTime > 1500) {
                status = 'FAIL';
                severity = 'HIGH';
                this.testResults.performanceIssues.push({
                    type: 'Slow Database Query',
                    operation: dbOp.name,
                    avgTime: avgQueryTime,
                    severity: 'HIGH'
                });
            } else if (avgQueryTime > 800) {
                status = 'WARNING';
                severity = 'MEDIUM';
            }

            scenario.tests.push({
                name: `DB 쿼리: ${dbOp.name}`,
                status: status,
                details: `평균: ${avgQueryTime.toFixed(0)}ms, 최대: ${maxQueryTime.toFixed(0)}ms`,
                severity: severity,
                metrics: {
                    average: avgQueryTime,
                    maximum: maxQueryTime
                }
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    async testMemoryUsage() {
        const scenario = {
            name: '메모리 사용량',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (!this.authToken) {
            scenario.tests.push({
                name: '메모리 사용량 테스트',
                status: 'SKIP',
                details: '인증 토큰이 없어 건너뜀'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        // 메모리 집약적 작업 테스트
        const memoryIntensiveOperations = [
            {
                name: '대용량 프로젝트 목록 조회',
                operation: () => axios.get(`${this.baseURL}/api/projects/?limit=100`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    timeout: 15000
                })
            },
            {
                name: '복합 데이터 조회',
                operation: () => axios.get(`${this.baseURL}/api/projects/?include=feedbacks,users`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    timeout: 15000
                })
            }
        ];

        for (const memOp of memoryIntensiveOperations) {
            try {
                const startTime = Date.now();
                const response = await memOp.operation();
                const responseTime = Date.now() - startTime;
                
                // 응답 크기 추정 (대략적)
                const responseSize = JSON.stringify(response.data).length;
                const responseSizeKB = (responseSize / 1024).toFixed(1);

                let status = 'PASS';
                let severity = 'NORMAL';
                
                if (responseTime > 3000 || responseSize > 1024 * 1024) { // 1MB 이상
                    status = 'WARNING';
                    severity = 'MEDIUM';
                    this.testResults.performanceIssues.push({
                        type: 'High Memory Usage',
                        operation: memOp.name,
                        responseSize: responseSizeKB,
                        responseTime: responseTime,
                        severity: 'MEDIUM'
                    });
                }

                scenario.tests.push({
                    name: memOp.name,
                    status: status,
                    details: `응답 시간: ${responseTime}ms, 크기: ${responseSizeKB}KB`,
                    severity: severity,
                    metrics: {
                        responseTime: responseTime,
                        responseSize: responseSize
                    }
                });

                this.testResults.performanceMetrics.resourceUsage[memOp.name] = {
                    responseTime: responseTime,
                    responseSize: responseSize
                };

            } catch (error) {
                scenario.tests.push({
                    name: memOp.name,
                    status: 'FAIL',
                    details: `메모리 테스트 실패: ${error.message}`,
                    severity: 'HIGH'
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testLargeDataHandling() {
        const scenario = {
            name: '대용량 데이터 처리',
            tests: [],
            criticalLevel: 'MEDIUM'
        };

        if (!this.authToken) {
            scenario.tests.push({
                name: '대용량 데이터 처리 테스트',
                status: 'SKIP',
                details: '인증 토큰이 없어 건너뜜'
            });
            this.testResults.scenarios.push(scenario);
            return;
        }

        // 대용량 데이터 생성 및 전송 테스트
        const largeDataSizes = [
            { size: 100, name: '100KB 데이터' },
            { size: 500, name: '500KB 데이터' },
            { size: 1000, name: '1MB 데이터' }
        ];

        for (const dataSize of largeDataSizes) {
            try {
                // 대용량 텍스트 데이터 생성
                const largeText = 'A'.repeat(dataSize.size * 1024); // KB to bytes
                
                const largeProjectData = {
                    name: `대용량 테스트 프로젝트 ${Date.now()}`,
                    type: 'test',
                    client: 'Test Client',
                    description: largeText
                };

                const startTime = Date.now();
                const response = await axios.post(
                    `${this.baseURL}/api/projects/`,
                    largeProjectData,
                    {
                        headers: { 'Authorization': `Bearer ${this.authToken}` },
                        timeout: 30000
                    }
                );
                const processingTime = Date.now() - startTime;

                let status = 'PASS';
                let severity = 'NORMAL';
                
                if (processingTime > 10000) { // 10초 이상
                    status = 'FAIL';
                    severity = 'HIGH';
                    this.testResults.performanceIssues.push({
                        type: 'Slow Large Data Processing',
                        dataSize: dataSize.name,
                        processingTime: processingTime,
                        severity: 'HIGH'
                    });
                } else if (processingTime > 5000) { // 5초 이상
                    status = 'WARNING';
                    severity = 'MEDIUM';
                }

                scenario.tests.push({
                    name: `${dataSize.name} 처리`,
                    status: status,
                    details: `처리 시간: ${processingTime}ms`,
                    severity: severity,
                    metrics: {
                        dataSize: dataSize.size,
                        processingTime: processingTime
                    }
                });

                // 생성된 테스트 프로젝트 정리
                if (response.status === 201) {
                    await axios.delete(
                        `${this.baseURL}/api/projects/${response.data.id}/`,
                        {
                            headers: { 'Authorization': `Bearer ${this.authToken}` }
                        }
                    ).catch(() => {}); // 실패해도 계속 진행
                }

            } catch (error) {
                if (error.response && (error.response.status === 413 || error.response.status === 400)) {
                    scenario.tests.push({
                        name: `${dataSize.name} 처리`,
                        status: 'PASS',
                        details: '대용량 데이터 적절히 제한됨',
                        severity: 'NORMAL'
                    });
                } else {
                    scenario.tests.push({
                        name: `${dataSize.name} 처리`,
                        status: 'FAIL',
                        details: `대용량 데이터 처리 실패: ${error.message}`,
                        severity: 'HIGH'
                    });
                }
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testCachingEfficiency() {
        const scenario = {
            name: '캐싱 효율성',
            tests: [],
            criticalLevel: 'LOW'
        };

        // 동일한 요청을 여러 번 보내서 캐싱 효과 측정
        const cachedEndpoints = [
            { url: '/api/health/', name: '헬스체크' },
            { url: '/api/projects/', name: '프로젝트 목록', auth: true }
        ];

        for (const endpoint of cachedEndpoints) {
            if (endpoint.auth && !this.authToken) continue;

            const responseTimes = [];
            
            // 같은 요청을 5번 연속 실행
            for (let i = 0; i < 5; i++) {
                try {
                    const startTime = Date.now();
                    await axios.get(`${this.baseURL}${endpoint.url}`, {
                        headers: endpoint.auth ? { 'Authorization': `Bearer ${this.authToken}` } : {},
                        timeout: 10000
                    });
                    const responseTime = Date.now() - startTime;
                    responseTimes.push(responseTime);
                    
                    // 캐싱 확인을 위한 짧은 대기
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    responseTimes.push(2000); // 실패 시 높은 값
                }
            }

            const firstRequestTime = responseTimes[0];
            const subsequentRequestsAvg = responseTimes.slice(1).reduce((sum, time) => sum + time, 0) / (responseTimes.length - 1);
            const improvementPercent = ((firstRequestTime - subsequentRequestsAvg) / firstRequestTime) * 100;

            let status = 'PASS';
            let cachingEffective = improvementPercent > 20; // 20% 이상 개선되면 캐싱 효과 있음
            
            if (!cachingEffective && firstRequestTime > 500) {
                status = 'WARNING';
            }

            scenario.tests.push({
                name: `${endpoint.name} 캐싱 효율성`,
                status: status,
                details: `첫 요청: ${firstRequestTime}ms, 후속 평균: ${subsequentRequestsAvg.toFixed(0)}ms (${improvementPercent.toFixed(1)}% 개선)`,
                severity: 'NORMAL',
                metrics: {
                    firstRequest: firstRequestTime,
                    subsequentAverage: subsequentRequestsAvg,
                    improvement: improvementPercent
                }
            });

            if (cachingEffective) {
                this.testResults.recommendations.push({
                    type: 'Caching',
                    message: `${endpoint.name} 엔드포인트에서 효과적인 캐싱 확인됨`,
                    impact: 'POSITIVE'
                });
            }
        }

        this.testResults.scenarios.push(scenario);
    }

    async testSystemUnderStress() {
        const scenario = {
            name: '스트레스 테스트 (극한 부하)',
            tests: [],
            criticalLevel: 'HIGH'
        };

        console.log('⚠️ 스트레스 테스트 시작 - 시스템에 극한 부하를 가합니다...');

        // 극한 동시 요청 테스트 (100개 동시 요청)
        try {
            const stressStartTime = Date.now();
            const stressPromises = [];
            const stressLevel = 100;
            
            for (let i = 0; i < stressLevel; i++) {
                const promise = axios.get(
                    `${this.baseURL}/api/health/`,
                    { timeout: 30000 }
                ).then(response => ({
                    success: true,
                    responseTime: Date.now() - stressStartTime,
                    status: response.status
                })).catch(error => ({
                    success: false,
                    error: error.code || error.message,
                    status: error.response?.status
                }));
                
                stressPromises.push(promise);
            }

            const stressResults = await Promise.all(stressPromises);
            const stressEndTime = Date.now();
            const stressTotalTime = stressEndTime - stressStartTime;
            
            const stressSuccessCount = stressResults.filter(r => r.success).length;
            const stressFailureCount = stressResults.filter(r => !r.success).length;
            const stressSuccessRate = (stressSuccessCount / stressLevel) * 100;
            
            // 오류 유형 분석
            const errorTypes = {};
            stressResults.filter(r => !r.success).forEach(result => {
                const errorType = result.error || 'Unknown';
                errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
            });

            let status = 'PASS';
            let severity = 'NORMAL';
            
            if (stressSuccessRate < 70) {
                status = 'FAIL';
                severity = 'CRITICAL';
                this.testResults.performanceIssues.push({
                    type: 'System Breakdown Under Stress',
                    successRate: stressSuccessRate,
                    totalRequests: stressLevel,
                    severity: 'CRITICAL'
                });
            } else if (stressSuccessRate < 85) {
                status = 'WARNING';
                severity = 'HIGH';
            }

            scenario.tests.push({
                name: `극한 부하 테스트 (${stressLevel}개 동시 요청)`,
                status: status,
                details: `성공률: ${stressSuccessRate.toFixed(1)}% (${stressSuccessCount}/${stressLevel}), 총 시간: ${stressTotalTime}ms`,
                severity: severity,
                metrics: {
                    stressLevel: stressLevel,
                    successRate: stressSuccessRate,
                    totalTime: stressTotalTime,
                    errorTypes: errorTypes
                }
            });

            // 시스템 복구 시간 테스트
            console.log('시스템 복구 시간 측정 중...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
            
            const recoveryStartTime = Date.now();
            try {
                await axios.get(`${this.baseURL}/api/health/`, { timeout: 10000 });
                const recoveryTime = Date.now() - recoveryStartTime;
                
                scenario.tests.push({
                    name: '시스템 복구 시간',
                    status: recoveryTime < 2000 ? 'PASS' : 'WARNING',
                    details: `복구 시간: ${recoveryTime}ms`,
                    severity: recoveryTime < 2000 ? 'NORMAL' : 'MEDIUM'
                });
            } catch (error) {
                scenario.tests.push({
                    name: '시스템 복구 시간',
                    status: 'FAIL',
                    details: '시스템이 복구되지 않음',
                    severity: 'CRITICAL'
                });
            }

        } catch (error) {
            scenario.tests.push({
                name: '극한 부하 테스트',
                status: 'FAIL',
                details: `스트레스 테스트 실패: ${error.message}`,
                severity: 'CRITICAL'
            });
        }

        this.testResults.scenarios.push(scenario);
    }

    calculatePercentile(values, percentile) {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        
        if (upper >= sorted.length) return sorted[sorted.length - 1];
        
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
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

        console.log('\n=== 성능 및 부하 테스트 결과 ===');
        console.log(`총 테스트: ${this.testResults.totalTests}개`);
        console.log(`성공: ${this.testResults.passedTests}개`);
        console.log(`성공률: ${successRate}%`);

        // 성능 메트릭 요약
        console.log('\n📊 성능 메트릭 요약:');
        
        // 응답 시간 요약
        const responseTimeStats = this.testResults.performanceMetrics.responseTimeStats;
        if (Object.keys(responseTimeStats).length > 0) {
            console.log('응답 시간:');
            Object.entries(responseTimeStats).forEach(([name, stats]) => {
                console.log(`  - ${name}: 평균 ${stats.average?.toFixed(0) || 'N/A'}ms`);
            });
        }

        // 동시성 결과 요약
        const concurrencyResults = this.testResults.performanceMetrics.concurrencyResults;
        if (Object.keys(concurrencyResults).length > 0) {
            console.log('동시성 성능:');
            Object.entries(concurrencyResults).forEach(([level, results]) => {
                console.log(`  - ${level}명 동시: ${results.successRate?.toFixed(1) || 'N/A'}% 성공, ${results.throughput?.toFixed(1) || 'N/A'} req/s`);
            });
        }

        // 성능 이슈 요약
        if (this.testResults.performanceIssues.length > 0) {
            console.log('\n⚠️ 발견된 성능 이슈:');
            this.testResults.performanceIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.type} (${issue.severity})`);
                if (issue.avgTime) console.log(`   평균 시간: ${issue.avgTime.toFixed(0)}ms`);
                if (issue.successRate) console.log(`   성공률: ${issue.successRate.toFixed(1)}%`);
            });
        }

        // 개선 권장사항
        if (this.testResults.recommendations.length > 0) {
            console.log('\n💡 권장사항:');
            this.testResults.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.message}`);
            });
        }

        // 전체 성능 등급 평가
        const criticalIssues = this.testResults.performanceIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
        const mediumIssues = this.testResults.performanceIssues.filter(i => i.severity === 'MEDIUM').length;
        
        let performanceGrade = 'A';
        if (criticalIssues > 0) {
            performanceGrade = criticalIssues > 2 ? 'F' : 'D';
        } else if (mediumIssues > 3) {
            performanceGrade = 'C';
        } else if (mediumIssues > 1 || successRate < 90) {
            performanceGrade = 'B';
        }

        console.log(`\n🎯 전체 성능 등급: ${performanceGrade}`);

        // 시나리오별 결과
        this.testResults.scenarios.forEach(scenario => {
            console.log(`\n📋 ${scenario.name}:`);
            scenario.tests.forEach(test => {
                const icon = test.status === 'PASS' ? '✅' : 
                           test.status === 'WARNING' ? '⚠️' : 
                           test.status === 'SKIP' ? '⏸️' : '❌';
                console.log(`  ${icon} ${test.name}: ${test.details}`);
            });
        });

        return this.testResults;
    }
}

// 모듈로 export
module.exports = PerformanceAndLoadTest;

// 직접 실행 시
if (require.main === module) {
    const performanceTest = new PerformanceAndLoadTest();
    performanceTest.runTests().then(() => {
        console.log('\n🎉 성능 및 부하 테스트 완료!');
    }).catch(error => {
        console.error('❌ 성능 테스트 실행 중 오류:', error.message);
    });
}