const https = require('https');
const API_BASE_URL = 'https://videoplanet.up.railway.app';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve) => {
        const url = new URL(API_BASE_URL + endpoint);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body) {
            const bodyString = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(bodyString);
        }

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsedData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { error: 'Failed to parse response', raw: data } });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ status: 'error', error: error.message });
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function testProjectDuplicatePrevention() {
    console.log('=== 프로젝트 중복 생성 방지 테스트 시작 ===\n');

    console.log('1. 테스트 계정으로 로그인');
    const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
    };
    
    const loginResult = await makeRequest('/api/users/signin/', 'POST', loginData);
    
    if (loginResult.status !== 200) {
        console.error('로그인 실패:', loginResult);
        return;
    }
    console.log('✓ 로그인 성공\n');

    const projectName = `중복테스트_${Date.now()}`;
    
    console.log('2. 첫 번째 프로젝트 생성 시도');
    const projectData = {
        name: projectName,
        manager: '테스트 매니저',
        consumer: '테스트 고객사',
        description: '중복 방지 테스트용 프로젝트'
    };
    
    const firstResult = await makeRequest('/api/projects/atomic/create/', 'POST', projectData);
    console.log('첫 번째 생성 결과:', {
        status: firstResult.status,
        message: firstResult.data.message || firstResult.data.error
    });
    
    if (firstResult.status === 201) {
        console.log('✓ 첫 번째 프로젝트 생성 성공');
        console.log(`  - 프로젝트 ID: ${firstResult.data.project_id}`);
        console.log(`  - 프로젝트 이름: ${firstResult.data.project_name}\n`);
    } else {
        console.error('✗ 첫 번째 프로젝트 생성 실패:', firstResult.data);
        return;
    }

    console.log('3. 동일한 이름으로 두 번째 프로젝트 생성 시도');
    const secondResult = await makeRequest('/api/projects/atomic/create/', 'POST', projectData);
    console.log('두 번째 생성 결과:', {
        status: secondResult.status,
        message: secondResult.data.message || secondResult.data.error,
        code: secondResult.data.code
    });
    
    if (secondResult.status === 409 && secondResult.data.code === 'DUPLICATE_PROJECT_NAME') {
        console.log('✓ 중복 방지 성공! 예상대로 409 에러 반환');
        console.log(`  - 에러 메시지: ${secondResult.data.error}`);
        console.log(`  - 기존 프로젝트 ID: ${secondResult.data.existing_project_id}\n`);
    } else {
        console.error('✗ 중복 방지 실패! 두 번째 프로젝트가 생성되었거나 다른 에러 발생:', secondResult.data);
    }

    console.log('4. 멱등성 키를 사용한 중복 요청 테스트');
    const idempotencyKey = `test-key-${Date.now()}`;
    const projectData2 = {
        name: `멱등성테스트_${Date.now()}`,
        manager: '테스트 매니저',
        consumer: '테스트 고객사'
    };
    
    const headers = { 'X-Idempotency-Key': idempotencyKey };
    
    console.log('  4-1. 멱등성 키를 포함한 첫 번째 요청');
    const idempResult1 = await makeRequest('/api/projects/atomic/create/', 'POST', projectData2, headers);
    console.log('  첫 번째 요청 결과:', {
        status: idempResult1.status,
        projectId: idempResult1.data.project_id
    });
    
    await sleep(100);
    
    console.log('  4-2. 동일한 멱등성 키로 두 번째 요청 (1분 내)');
    const idempResult2 = await makeRequest('/api/projects/atomic/create/', 'POST', projectData2, headers);
    console.log('  두 번째 요청 결과:', {
        status: idempResult2.status,
        projectId: idempResult2.data.project_id
    });
    
    if (idempResult1.data.project_id === idempResult2.data.project_id) {
        console.log('✓ 멱등성 처리 성공! 동일한 프로젝트 ID 반환\n');
    } else {
        console.log('✗ 멱등성 처리가 예상대로 작동하지 않음\n');
    }

    console.log('5. 다른 이름으로 프로젝트 생성 테스트');
    const projectData3 = {
        name: `다른프로젝트_${Date.now()}`,
        manager: '테스트 매니저',
        consumer: '테스트 고객사'
    };
    
    const thirdResult = await makeRequest('/api/projects/atomic/create/', 'POST', projectData3);
    if (thirdResult.status === 201) {
        console.log('✓ 다른 이름의 프로젝트는 정상적으로 생성됨');
        console.log(`  - 프로젝트 ID: ${thirdResult.data.project_id}`);
        console.log(`  - 프로젝트 이름: ${thirdResult.data.project_name}\n`);
    } else {
        console.error('✗ 다른 이름의 프로젝트 생성 실패:', thirdResult.data);
    }

    console.log('6. 빠른 연속 요청 테스트 (Race Condition)');
    const raceName = `레이스테스트_${Date.now()}`;
    const raceData = {
        name: raceName,
        manager: '테스트 매니저',
        consumer: '테스트 고객사'
    };
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(makeRequest('/api/projects/atomic/create/', 'POST', raceData));
    }
    
    const raceResults = await Promise.all(promises);
    const successCount = raceResults.filter(r => r.status === 201).length;
    const duplicateCount = raceResults.filter(r => r.status === 409).length;
    
    console.log(`  - 성공: ${successCount}개, 중복 오류: ${duplicateCount}개`);
    
    if (successCount === 1 && duplicateCount === 4) {
        console.log('✓ Race condition 처리 성공! 하나만 생성되고 나머지는 중복 오류\n');
    } else {
        console.log(`✗ Race condition 처리 문제 가능성 있음 (성공: ${successCount}, 중복: ${duplicateCount})\n`);
    }

    console.log('=== 테스트 완료 ===');
}

testProjectDuplicatePrevention().catch(console.error);