/**
 * 프로덕션 환경 테스트 (기존 엔드포인트 사용)
 */

const API_BASE = 'https://videoplanet.up.railway.app/api';

class ProductionTest {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };
    this.testSession = `test_${Date.now()}`;
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': data instanceof FormData ? undefined : 'application/json',
        ...headers
      }
    };

    if (data) {
      if (data instanceof FormData) {
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    console.log(`[TEST] ${method} ${url}`);
    
    try {
      const response = await fetch(url, config);
      const responseData = await response.text();
      
      let jsonData;
      try {
        jsonData = JSON.parse(responseData);
      } catch {
        jsonData = { raw: responseData };
      }

      return {
        status: response.status,
        ok: response.ok,
        data: jsonData,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      console.error(`[TEST ERROR] ${method} ${url}:`, error);
      return {
        status: 0,
        ok: false,
        error: error.message,
        data: null
      };
    }
  }

  logResult(testName, success, details = {}) {
    const result = {
      testName,
      success,
      timestamp: new Date().toISOString(),
      ...details
    };

    console.log(`[${success ? '✅ PASS' : '❌ FAIL'}] ${testName}`, details);
    
    this.results.tests.push(result);
    this.results.summary.total++;
    if (success) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
      this.results.summary.errors.push(testName);
    }

    return result;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 1. 기본 API 연결 테스트
  async testBasicConnectivity() {
    console.log('\n🔍 === 기본 연결 테스트 ===');

    // 프로젝트 목록 조회 (인증 필요)
    const projectListResult = await this.makeRequest('GET', '/projects/project_list');
    
    // 401은 정상 (인증이 필요하다는 의미)
    const isConnected = projectListResult.status === 401 || projectListResult.ok;
    this.logResult('API 서버 연결', isConnected, {
      status: projectListResult.status,
      expected: '401 (인증 필요) 또는 200',
      message: projectListResult.data?.message || 'OK'
    });

    // 이메일 중복 체크 (인증 불필요)
    const emailCheckResult = await this.makeRequest('POST', '/users/check_email', {
      email: `test_${this.testSession}@example.com`
    });

    const emailCheckSuccess = emailCheckResult.ok;
    this.logResult('이메일 체크 API', emailCheckSuccess, {
      status: emailCheckResult.status,
      response: emailCheckResult.data
    });
  }

  // 2. 사용자 생성 및 인증 테스트
  async testUserCreationAndAuth() {
    console.log('\n👤 === 사용자 생성 및 인증 테스트 ===');

    const testUser = {
      email: `testuser_${this.testSession}@example.com`,
      nickname: `TestUser_${this.testSession}`,
      password: 'TestPassword123!'
    };

    // 회원가입 테스트
    const signupResult = await this.makeRequest('POST', '/users/signup', testUser);
    
    const signupSuccess = signupResult.ok;
    this.logResult('회원가입', signupSuccess, {
      status: signupResult.status,
      response: signupResult.data,
      testUser: testUser.email
    });

    if (!signupSuccess) {
      console.log('⚠️  회원가입 실패로 인증 테스트 스킵');
      return null;
    }

    // 로그인 테스트 (회원가입이 성공한 경우)
    const loginResult = await this.makeRequest('POST', '/users/signin', {
      email: testUser.email,
      password: testUser.password
    });

    const loginSuccess = loginResult.ok;
    this.logResult('로그인', loginSuccess, {
      status: loginResult.status,
      hasToken: !!loginResult.data?.vridge_session,
      response: loginResult.data
    });

    return loginSuccess ? {
      token: loginResult.data?.vridge_session,
      user: testUser
    } : null;
  }

  // 3. 프로젝트 중복 생성 테스트 (기존 엔드포인트)
  async testProjectCreationWithAuth(authData) {
    if (!authData) {
      console.log('\n⚠️  인증 정보 없음 - 프로젝트 테스트 스킵');
      return;
    }

    console.log('\n🛡️ === 프로젝트 생성 테스트 ===');

    const headers = {
      'Authorization': `Bearer ${authData.token}`,
      'Cookie': `vridge_session=${authData.token}`
    };

    const testProjectName = `TestProject_${this.testSession}`;

    // FormData로 프로젝트 생성 (기존 방식)
    const createProject = async (suffix = '') => {
      const formData = new FormData();
      
      const inputs = {
        name: testProjectName + suffix,
        manager: 'Test Manager',
        consumer: 'Test Consumer',
        description: '테스트용 프로젝트',
        color: '#1631F8'
      };

      const process = {
        basic_plan: { start_date: '2025-01-01', end_date: '2025-01-05' },
        story_board: { start_date: '2025-01-06', end_date: '2025-01-10' }
      };

      formData.append('inputs', JSON.stringify(inputs));
      formData.append('process', JSON.stringify(process));

      return await this.makeRequest('POST', '/projects/create', formData, headers);
    };

    // 첫 번째 프로젝트 생성
    const firstResult = await createProject();
    const firstSuccess = firstResult.ok;
    
    this.logResult('첫 번째 프로젝트 생성', firstSuccess, {
      status: firstResult.status,
      response: firstResult.data,
      projectName: testProjectName
    });

    // 잠깐 대기 후 동일한 이름으로 재시도
    await this.sleep(1000);

    const secondResult = await createProject();
    const isBlocked = !secondResult.ok && (
      secondResult.status === 400 || 
      secondResult.status === 409 ||
      (secondResult.data?.message && secondResult.data.message.includes('이미'))
    );

    this.logResult('중복 프로젝트 차단', isBlocked, {
      status: secondResult.status,
      response: secondResult.data,
      wasBlocked: isBlocked
    });

    // 다른 이름으로는 생성되는지 확인
    const differentResult = await createProject('_different');
    const differentSuccess = differentResult.ok;

    this.logResult('다른 이름 프로젝트 생성', differentSuccess, {
      status: differentResult.status,
      response: differentResult.data,
      projectName: testProjectName + '_different'
    });
  }

  // 4. 피드백 시스템 테스트
  async testFeedbackSystem(authData) {
    if (!authData) {
      console.log('\n⚠️  인증 정보 없음 - 피드백 테스트 스킵');
      return;
    }

    console.log('\n🎬 === 피드백 시스템 테스트 ===');

    const headers = {
      'Authorization': `Bearer ${authData.token}`,
      'Cookie': `vridge_session=${authData.token}`
    };

    // 프로젝트 목록 조회
    const projectListResult = await this.makeRequest('GET', '/projects/project_list', null, headers);
    
    const hasProjects = projectListResult.ok && projectListResult.data?.result?.length > 0;
    this.logResult('인증된 프로젝트 목록 조회', hasProjects, {
      status: projectListResult.status,
      projectCount: projectListResult.data?.result?.length || 0
    });

    if (!hasProjects) {
      console.log('⚠️  프로젝트가 없어 피드백 테스트 불가');
      return;
    }

    // 첫 번째 프로젝트의 피드백 조회
    const firstProject = projectListResult.data.result[0];
    const feedbackResult = await this.makeRequest('GET', `/feedbacks/${firstProject.id}`, null, headers);

    const feedbackSuccess = feedbackResult.ok;
    this.logResult('피드백 데이터 조회', feedbackSuccess, {
      status: feedbackResult.status,
      projectId: firstProject.id,
      hasFiles: !!feedbackResult.data?.result?.files,
      fileUrl: feedbackResult.data?.result?.files
    });

    // 파일 URL이 있다면 검증
    if (feedbackResult.data?.result?.files) {
      const fileUrl = feedbackResult.data.result.files;
      const isHttps = fileUrl.startsWith('https://');
      const hasCorrectDomain = fileUrl.includes('videoplanet.up.railway.app');
      
      this.logResult('파일 URL 형식 검증', isHttps && hasCorrectDomain, {
        fileUrl,
        isHttps,
        hasCorrectDomain,
        urlStructure: fileUrl.match(/^(https?):\/\/([^\/]+)(\/.*)?$/)
      });

      // 실제 파일 접근성 테스트 (HEAD 요청)
      try {
        const fileCheckResult = await fetch(fileUrl, { method: 'HEAD' });
        const isAccessible = fileCheckResult.ok;
        
        this.logResult('파일 접근 가능성', isAccessible, {
          fileUrl,
          status: fileCheckResult.status,
          contentType: fileCheckResult.headers.get('content-type'),
          contentLength: fileCheckResult.headers.get('content-length')
        });
      } catch (error) {
        this.logResult('파일 접근 가능성', false, {
          fileUrl,
          error: error.message
        });
      }
    }
  }

  // 메인 테스트 실행
  async runAllTests() {
    console.log(`🚀 VideoPlanet 프로덕션 환경 테스트 시작`);
    console.log(`📅 테스트 세션: ${this.testSession}`);
    console.log(`🌐 API 베이스: ${API_BASE}\n`);

    const startTime = Date.now();

    try {
      await this.testBasicConnectivity();
      const authData = await this.testUserCreationAndAuth();
      await this.testProjectCreationWithAuth(authData);
      await this.testFeedbackSystem(authData);
    } catch (error) {
      console.error('테스트 실행 중 오류:', error);
      this.results.summary.errors.push(`전체 테스트 오류: ${error.message}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 최종 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 테스트 결과');
    console.log('='.repeat(60));
    console.log(`⏱️  총 실행 시간: ${duration}ms`);
    console.log(`📈 전체 테스트: ${this.results.summary.total}개`);
    console.log(`✅ 성공: ${this.results.summary.passed}개`);
    console.log(`❌ 실패: ${this.results.summary.failed}개`);
    console.log(`📊 성공률: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);

    if (this.results.summary.errors.length > 0) {
      console.log('\n❌ 실패한 테스트들:');
      this.results.summary.errors.forEach(error => console.log(`   - ${error}`));
    }

    // 상세 결과
    console.log('\n📋 상세 테스트 결과:');
    this.results.tests.forEach(test => {
      console.log(`   ${test.success ? '✅' : '❌'} ${test.testName}`);
    });

    console.log('\n' + '='.repeat(60));
    
    return this.results;
  }
}

// 테스트 실행
const tester = new ProductionTest();
tester.runAllTests().then(results => {
  console.log('\n🎯 테스트 완료!');
  
  // 중요한 이슈들 요약
  const criticalIssues = results.tests.filter(test => 
    !test.success && (
      test.testName.includes('프로젝트') || 
      test.testName.includes('파일') ||
      test.testName.includes('연결')
    )
  );
  
  if (criticalIssues.length > 0) {
    console.log('\n⚠️  주요 이슈들:');
    criticalIssues.forEach(issue => {
      console.log(`   🔍 ${issue.testName}: ${issue.response?.message || issue.error || '상세 정보 없음'}`);
    });
  }
  
}).catch(error => {
  console.error('테스트 실행 실패:', error);
});