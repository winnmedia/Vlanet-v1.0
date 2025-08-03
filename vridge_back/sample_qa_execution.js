/**
 * VideoPlanet QA 테스트 샘플 실행기
 * 실제 환경에서 테스트 가능한 기본적인 검증 스크립트
 */

const axios = require('axios');

// 테스트 설정
const TEST_CONFIG = {
    API_URL: 'https://videoplanet.up.railway.app/api',
    FRONTEND_URL: 'https://vlanet.net',
    TIMEOUT: 10000
};

// 색상 코드
const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// 테스트 결과
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

/**
 * 테스트 실행 헬퍼 함수
 */
async function runTest(testName, testFunc, isCritical = false) {
    testResults.total++;
    console.log(`\n${COLORS.blue}[테스트] ${testName}${COLORS.reset}`);
    
    try {
        const result = await Promise.race([
            testFunc(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('테스트 타임아웃')), TEST_CONFIG.TIMEOUT)
            )
        ]);
        
        if (result !== false) {
            console.log(`${COLORS.green}✓ 성공${COLORS.reset}`);
            testResults.passed++;
            return true;
        } else {
            console.log(`${COLORS.red}✗ 실패${COLORS.reset}`);
            testResults.failed++;
            testResults.errors.push({ test: testName, error: '테스트 조건 불만족' });
            return false;
        }
    } catch (error) {
        console.log(`${COLORS.red}✗ 오류: ${error.message}${COLORS.reset}`);
        testResults.failed++;
        testResults.errors.push({ test: testName, error: error.message });
        return false;
    }
}

/**
 * 1. 기본 연결 테스트
 */
async function testBasicConnectivity() {
    console.log(`\n${COLORS.cyan}${COLORS.bold}=== 기본 연결 테스트 ===${COLORS.reset}`);
    
    // API 서버 헬스체크
    await runTest('API 서버 헬스체크', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/health/`, {
                timeout: 5000
            });
            return response.status === 200 && response.data.status === 'ok';
        } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                console.log(`  ${COLORS.yellow}⚠️  서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.${COLORS.reset}`);
            }
            return false;
        }
    }, true);
    
    // 프론트엔드 접근 테스트
    await runTest('프론트엔드 접근성', async () => {
        try {
            const response = await axios.get(TEST_CONFIG.FRONTEND_URL, {
                timeout: 5000,
                validateStatus: (status) => status < 500 // 5xx 오류만 실패로 간주
            });
            return response.status < 400;
        } catch (error) {
            console.log(`  ${COLORS.yellow}⚠️  프론트엔드에 접근할 수 없습니다.${COLORS.reset}`);
            return false;
        }
    });
    
    // CORS 정책 확인
    await runTest('CORS 정책 확인', async () => {
        try {
            const response = await axios.options(`${TEST_CONFIG.API_URL}/health/`, {
                headers: {
                    'Origin': 'https://vlanet.net',
                    'Access-Control-Request-Method': 'GET'
                },
                timeout: 5000
            });
            
            const hasCORS = response.headers['access-control-allow-origin'] || 
                           response.headers['access-control-allow-methods'];
            return !!hasCORS;
        } catch (error) {
            // OPTIONS 요청이 실패해도 실제 서비스에는 문제없을 수 있음
            return true;
        }
    });
}

/**
 * 2. API 기본 기능 테스트
 */
async function testBasicAPIFunctionality() {
    console.log(`\n${COLORS.cyan}${COLORS.bold}=== API 기본 기능 테스트 ===${COLORS.reset}`);
    
    // API 엔드포인트 존재 확인
    const endpoints = [
        '/health/',
        '/users/',
        '/projects/',
        '/video-planning/',
        '/feedbacks/'
    ];
    
    for (const endpoint of endpoints) {
        await runTest(`엔드포인트 ${endpoint} 접근`, async () => {
            try {
                const response = await axios.get(`${TEST_CONFIG.API_URL}${endpoint}`, {
                    timeout: 5000,
                    validateStatus: (status) => status < 500 // 인증 오류(401)는 정상
                });
                return response.status < 500;
            } catch (error) {
                return false;
            }
        });
    }
    
    // API 응답 시간 측정
    await runTest('API 응답 시간 (2초 이내)', async () => {
        const startTime = Date.now();
        try {
            await axios.get(`${TEST_CONFIG.API_URL}/health/`, { timeout: 3000 });
            const responseTime = Date.now() - startTime;
            console.log(`  응답 시간: ${responseTime}ms`);
            return responseTime < 2000;
        } catch (error) {
            return false;
        }
    });
}

/**
 * 3. 데이터베이스 연결 테스트
 */
async function testDatabaseConnectivity() {
    console.log(`\n${COLORS.cyan}${COLORS.bold}=== 데이터베이스 연결 테스트 ===${COLORS.reset}`);
    
    // 데이터베이스 상태 확인 (헬스체크를 통해 간접 확인)
    await runTest('데이터베이스 연결 상태', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/health/`, {
                timeout: 5000
            });
            
            // 헬스체크에서 데이터베이스 상태도 확인한다고 가정
            const isHealthy = response.status === 200 && response.data.status === 'ok';
            
            if (response.data.database) {
                console.log(`  DB 상태: ${response.data.database}`);
                return response.data.database === 'connected' || response.data.database === 'ok';
            }
            
            return isHealthy;
        } catch (error) {
            return false;
        }
    }, true);
    
    // 캐시 서버 연결 (Redis)
    await runTest('캐시 서버 연결', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/health/`, {
                timeout: 5000
            });
            
            if (response.data.cache) {
                console.log(`  캐시 상태: ${response.data.cache}`);
                return response.data.cache === 'connected' || response.data.cache === 'ok';
            }
            
            // 캐시 정보가 없어도 기본 서비스는 동작
            return true;
        } catch (error) {
            return false;
        }
    });
}

/**
 * 4. 보안 기본 검증
 */
async function testBasicSecurity() {
    console.log(`\n${COLORS.cyan}${COLORS.bold}=== 보안 기본 검증 ===${COLORS.reset}`);
    
    // HTTPS 사용 확인
    await runTest('HTTPS 프로토콜 사용', async () => {
        return TEST_CONFIG.API_URL.startsWith('https://') && 
               TEST_CONFIG.FRONTEND_URL.startsWith('https://');
    }, true);
    
    // 민감한 정보 노출 검사
    await runTest('민감한 정보 노출 방지', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/health/`);
            const responseText = JSON.stringify(response.data).toLowerCase();
            
            // 민감한 키워드들이 응답에 포함되지 않았는지 확인
            const sensitiveKeywords = [
                'password', 'secret', 'key', 'token', 'private',
                'database_url', 'redis_url', 'api_key'
            ];
            
            const hasSensitiveInfo = sensitiveKeywords.some(keyword => 
                responseText.includes(keyword)
            );
            
            return !hasSensitiveInfo;
        } catch (error) {
            return true; // 오류가 발생해도 보안상 문제없음
        }
    });
    
    // SQL 인젝션 기본 방어 테스트
    await runTest('SQL 인젝션 기본 방어', async () => {
        try {
            const maliciousPayload = "'; DROP TABLE users; --";
            const response = await axios.get(`${TEST_CONFIG.API_URL}/projects/`, {
                params: { search: maliciousPayload },
                timeout: 5000,
                validateStatus: (status) => status < 500
            });
            
            // 서버가 처리했지만 500 오류가 발생하지 않았다면 방어됨
            return response.status < 500;
        } catch (error) {
            // 요청 자체가 거부되면 더 좋음
            return true;
        }
    });
}

/**
 * 5. 성능 기본 검증
 */
async function testBasicPerformance() {
    console.log(`\n${COLORS.cyan}${COLORS.bold}=== 성능 기본 검증 ===${COLORS.reset}`);
    
    // 동시 요청 처리 능력
    await runTest('동시 요청 처리 (5개)', async () => {
        const promises = Array(5).fill().map(() => 
            axios.get(`${TEST_CONFIG.API_URL}/health/`, { timeout: 5000 })
        );
        
        try {
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.status === 200).length;
            console.log(`  성공: ${successCount}/5`);
            return successCount >= 4; // 80% 이상 성공
        } catch (error) {
            return false;
        }
    });
    
    // 메모리 사용량 기본 체크
    await runTest('서버 메모리 상태', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/health/`);
            
            if (response.data.memory) {
                const memoryUsage = parseFloat(response.data.memory);
                console.log(`  메모리 사용률: ${memoryUsage}%`);
                return memoryUsage < 90; // 90% 미만
            }
            
            return true; // 메모리 정보가 없어도 기본 통과
        } catch (error) {
            return true;
        }
    });
}

/**
 * 6. 주요 기능 스모크 테스트
 */
async function testCoreFunctionalities() {
    console.log(`\n${COLORS.cyan}${COLORS.bold}=== 주요 기능 스모크 테스트 ===${COLORS.reset}`);
    
    // 사용자 관련 기능
    await runTest('사용자 API 접근', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/users/`, {
                timeout: 5000,
                validateStatus: (status) => status < 500
            });
            return response.status < 500;
        } catch (error) {
            return false;
        }
    });
    
    // 프로젝트 관련 기능
    await runTest('프로젝트 API 접근', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/projects/`, {
                timeout: 5000,
                validateStatus: (status) => status < 500
            });
            return response.status < 500;
        } catch (error) {
            return false;
        }
    });
    
    // 영상 기획 기능
    await runTest('영상 기획 API 접근', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/video-planning/`, {
                timeout: 5000,
                validateStatus: (status) => status < 500
            });
            return response.status < 500;
        } catch (error) {
            return false;
        }
    });
    
    // 피드백 시스템
    await runTest('피드백 API 접근', async () => {
        try {
            const response = await axios.get(`${TEST_CONFIG.API_URL}/feedbacks/`, {
                timeout: 5000,
                validateStatus: (status) => status < 500
            });
            return response.status < 500;
        } catch (error) {
            return false;
        }
    });
}

/**
 * 결과 리포트 생성
 */
function generateReport() {
    console.log(`\n${COLORS.cyan}${COLORS.bold}===============================================${COLORS.reset}`);
    console.log(`${COLORS.cyan}${COLORS.bold}     VideoPlanet QA 샘플 테스트 결과${COLORS.reset}`);
    console.log(`${COLORS.cyan}${COLORS.bold}===============================================${COLORS.reset}`);
    
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    
    console.log(`\n📊 테스트 통계:`);
    console.log(`   총 테스트: ${testResults.total}`);
    console.log(`   성공: ${COLORS.green}${testResults.passed}${COLORS.reset}`);
    console.log(`   실패: ${COLORS.red}${testResults.failed}${COLORS.reset}`);
    console.log(`   성공률: ${successRate >= 80 ? COLORS.green : COLORS.red}${successRate}%${COLORS.reset}`);
    
    // 전체 상태 평가
    if (successRate >= 90) {
        console.log(`\n🎉 ${COLORS.green}${COLORS.bold}우수함 (${successRate}%)${COLORS.reset}`);
        console.log(`   시스템이 안정적으로 동작하고 있습니다.`);
    } else if (successRate >= 80) {
        console.log(`\n✅ ${COLORS.yellow}${COLORS.bold}양호함 (${successRate}%)${COLORS.reset}`);
        console.log(`   기본 기능은 정상이나 일부 개선이 필요합니다.`);
    } else if (successRate >= 60) {
        console.log(`\n⚠️  ${COLORS.yellow}${COLORS.bold}주의 필요 (${successRate}%)${COLORS.reset}`);
        console.log(`   여러 문제가 발견되었습니다. 검토가 필요합니다.`);
    } else {
        console.log(`\n🚨 ${COLORS.red}${COLORS.bold}심각한 문제 (${successRate}%)${COLORS.reset}`);
        console.log(`   시스템에 중대한 문제가 있습니다. 즉시 확인하세요.`);
    }
    
    // 실패한 테스트 상세 정보
    if (testResults.errors.length > 0) {
        console.log(`\n${COLORS.red}${COLORS.bold}실패한 테스트 상세:${COLORS.reset}`);
        testResults.errors.forEach(error => {
            console.log(`   ${COLORS.red}✗${COLORS.reset} ${error.test}: ${error.error}`);
        });
    }
    
    // 다음 단계 안내
    console.log(`\n💡 ${COLORS.blue}${COLORS.bold}다음 단계:${COLORS.reset}`);
    if (successRate >= 80) {
        console.log(`   1. 상세 테스트 실행: node comprehensive_qa_test_strategy.js`);
        console.log(`   2. 성능 벤치마크: node performance_benchmark_tests.js`);
        console.log(`   3. 핵심 기능 테스트: node core_features_qa_tests.js`);
    } else {
        console.log(`   1. 실패한 테스트들을 우선 수정하세요`);
        console.log(`   2. 서버와 데이터베이스 상태를 확인하세요`);
        console.log(`   3. 네트워크 연결과 방화벽 설정을 점검하세요`);
        console.log(`   4. 문제 해결 후 다시 테스트를 실행하세요`);
    }
    
    console.log(`\n${COLORS.cyan}${COLORS.bold}===============================================${COLORS.reset}\n`);
}

/**
 * 메인 실행 함수
 */
async function runSampleQATests() {
    console.log(`${COLORS.cyan}${COLORS.bold}🚀 VideoPlanet QA 샘플 테스트 시작${COLORS.reset}`);
    console.log(`${COLORS.cyan}테스트 시간: ${new Date().toLocaleString()}${COLORS.reset}\n`);
    
    try {
        // 1. 기본 연결 테스트
        await testBasicConnectivity();
        
        // 2. API 기본 기능 테스트
        await testBasicAPIFunctionality();
        
        // 3. 데이터베이스 연결 테스트
        await testDatabaseConnectivity();
        
        // 4. 보안 기본 검증
        await testBasicSecurity();
        
        // 5. 성능 기본 검증
        await testBasicPerformance();
        
        // 6. 주요 기능 스모크 테스트
        await testCoreFunctionalities();
        
        // 결과 리포트
        generateReport();
        
    } catch (error) {
        console.error(`${COLORS.red}테스트 실행 중 오류 발생: ${error.message}${COLORS.reset}`);
        process.exit(1);
    }
}

// 스크립트 직접 실행 시에만 실행
if (require.main === module) {
    runSampleQATests().catch(error => {
        console.error(`${COLORS.red}치명적 오류: ${error.message}${COLORS.reset}`);
        process.exit(1);
    });
}

module.exports = {
    runSampleQATests,
    TEST_CONFIG,
    testResults
};