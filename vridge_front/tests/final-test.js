/**
 * VideoPlanet 최종 기능 테스트
 * - 피드백 영상 업로드/재생 기능
 * - 프로젝트 중복 생성 방지
 */

const API_BASE = 'https://videoplanet.up.railway.app'; // /api 제거

class FinalTest {
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
    this.authData = null;
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

  // 1. API 서버 상태 확인
  async testAPIHealth() {
    console.log('\n🔍 === API 서버 상태 확인 ===');

    // 루트 엔드포인트 확인
    const healthResult = await this.makeRequest('GET', '/');
    const isHealthy = healthResult.ok && healthResult.data?.message === 'VRidge Backend API';
    
    this.logResult('API 서버 상태', isHealthy, {
      status: healthResult.status,
      message: healthResult.data?.message,
      version: healthResult.data?.version
    });

    // 개별 엔드포인트 상태 확인
    const endpoints = [
      { name: '사용자 이메일 체크', path: '/users/check_email', method: 'POST', data: { email: 'test@test.com' } },
      { name: '프로젝트 목록', path: '/projects/project_list', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      const result = await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
      
      // 401은 정상 (인증 필요), 200도 정상
      const isWorking = result.status === 401 || result.status === 200 || result.status === 400;
      
      this.logResult(`엔드포인트: ${endpoint.name}`, isWorking, {
        path: endpoint.path,
        status: result.status,
        message: result.data?.message
      });
    }
  }

  // 2. 사용자 생성 및 로그인
  async testUserAuthentication() {
    console.log('\n👤 === 사용자 인증 테스트 ===');

    const testUser = {
      email: `testuser_${this.testSession}@example.com`,
      nickname: `TestUser_${this.testSession}`,
      password: 'TestPassword123!'
    };

    // 회원가입
    const signupResult = await this.makeRequest('POST', '/users/signup', testUser);
    const signupSuccess = signupResult.ok;
    
    this.logResult('회원가입', signupSuccess, {
      status: signupResult.status,
      message: signupResult.data?.message,
      testUser: testUser.email
    });

    if (!signupSuccess) {
      console.log('⚠️  회원가입 실패 - 기존 사용자로 로그인 시도');
      
      // 기존 사용자로 로그인 시도
      const loginResult = await this.makeRequest('POST', '/users/signin', {
        email: 'test@test.com', // 알려진 테스트 계정
        password: 'testpassword'
      });

      if (loginResult.ok) {
        this.authData = {
          token: loginResult.data?.vridge_session,
          user: { email: 'test@test.com' }
        };
        
        this.logResult('기존 사용자 로그인', true, {
          status: loginResult.status,
          hasToken: !!this.authData.token
        });
      } else {
        this.logResult('기존 사용자 로그인', false, {
          status: loginResult.status,
          message: loginResult.data?.message
        });
      }
      return;
    }

    // 방금 가입한 사용자로 로그인
    const loginResult = await this.makeRequest('POST', '/users/signin', {
      email: testUser.email,
      password: testUser.password
    });

    const loginSuccess = loginResult.ok;
    this.logResult('로그인', loginSuccess, {
      status: loginResult.status,
      hasToken: !!loginResult.data?.vridge_session,
      message: loginResult.data?.message
    });

    if (loginSuccess) {
      this.authData = {
        token: loginResult.data?.vridge_session,
        user: testUser
      };
    }
  }

  // 3. 프로젝트 중복 생성 방지 테스트
  async testProjectDuplicationPrevention() {
    if (!this.authData) {
      console.log('\n⚠️  인증 정보 없음 - 프로젝트 테스트 스킵');
      return;
    }

    console.log('\n🛡️ === 프로젝트 중복 생성 방지 테스트 ===');

    const headers = {
      'Authorization': `Bearer ${this.authData.token}`,
      'Cookie': `vridge_session=${this.authData.token}`
    };

    const testProjectName = `TestProject_${this.testSession}`;

    const createProject = async (suffix = '') => {
      const formData = new FormData();
      
      const inputs = {
        name: testProjectName + suffix,
        manager: 'Test Manager',
        consumer: 'Test Consumer',
        description: '중복 생성 테스트용 프로젝트',
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
      message: firstResult.data?.message,
      projectName: testProjectName
    });

    if (!firstSuccess) {
      console.log('⚠️  첫 번째 프로젝트 생성 실패 - 중복 테스트 스킵');
      return;
    }

    // 짧은 대기 후 동일한 이름으로 재시도
    await this.sleep(500);

    const secondResult = await createProject();
    const isBlocked = !secondResult.ok && (
      secondResult.status === 400 || 
      secondResult.status === 409 ||
      (secondResult.data?.message && 
       (secondResult.data.message.includes('이미') || 
        secondResult.data.message.includes('중복') ||
        secondResult.data.message.includes('존재')))
    );

    this.logResult('중복 프로젝트 차단', isBlocked, {
      status: secondResult.status,
      message: secondResult.data?.message,
      wasBlocked: isBlocked,
      projectName: testProjectName
    });

    // 동시 요청 테스트
    console.log('동시 요청 테스트 시작...');
    const concurrentName = `Concurrent_${this.testSession}`;
    
    const [r1, r2, r3] = await Promise.all([
      createProject(`_${concurrentName}_1`),
      createProject(`_${concurrentName}_2`), 
      createProject(`_${concurrentName}_3`)
    ]);

    const successCount = [r1, r2, r3].filter(r => r.ok).length;
    
    this.logResult('동시 요청 처리', successCount === 3, {
      successCount,
      totalRequests: 3,
      results: [r1, r2, r3].map(r => ({ status: r.status, ok: r.ok }))
    });
  }

  // 4. 피드백 시스템 테스트
  async testFeedbackSystem() {
    if (!this.authData) {
      console.log('\n⚠️  인증 정보 없음 - 피드백 테스트 스킵');
      return;
    }

    console.log('\n🎬 === 피드백 시스템 테스트 ===');

    const headers = {
      'Authorization': `Bearer ${this.authData.token}`,
      'Cookie': `vridge_session=${this.authData.token}`
    };

    // 프로젝트 목록 조회
    const projectListResult = await this.makeRequest('GET', '/projects/project_list', null, headers);
    
    const hasProjects = projectListResult.ok && projectListResult.data?.result?.length > 0;
    this.logResult('인증된 프로젝트 목록 조회', hasProjects, {
      status: projectListResult.status,
      projectCount: projectListResult.data?.result?.length || 0,
      message: projectListResult.data?.message
    });

    if (!hasProjects) {
      console.log('⚠️  프로젝트가 없어 피드백 테스트 불가');
      return;
    }

    // 첫 번째 프로젝트의 피드백 조회
    const projects = projectListResult.data.result;
    const testProject = projects[0];
    
    const feedbackResult = await this.makeRequest('GET', `/feedbacks/${testProject.id}`, null, headers);

    const feedbackSuccess = feedbackResult.ok;
    this.logResult('피드백 데이터 조회', feedbackSuccess, {
      status: feedbackResult.status,
      projectId: testProject.id,
      projectName: testProject.name,
      hasFiles: !!feedbackResult.data?.result?.files,
      fileUrl: feedbackResult.data?.result?.files,
      message: feedbackResult.data?.message
    });

    // 파일 URL 검증 (있는 경우)
    if (feedbackResult.data?.result?.files) {
      const fileUrl = feedbackResult.data.result.files;
      
      // URL 형식 검증
      const isValidUrl = /^https?:\/\//.test(fileUrl);
      const isHttps = fileUrl.startsWith('https://');
      const hasCorrectDomain = fileUrl.includes('videoplanet.up.railway.app') || fileUrl.includes('localhost');
      const hasMediaPath = fileUrl.includes('/media/');
      
      const urlValid = isValidUrl && isHttps && hasCorrectDomain && hasMediaPath;
      
      this.logResult('파일 URL 형식 검증', urlValid, {
        fileUrl,
        isValidUrl,
        isHttps,
        hasCorrectDomain,
        hasMediaPath,
        urlStructure: fileUrl.match(/^(https?):\/\/([^\/]+)(\/.*)?$/)
      });

      // 실제 파일 접근성 테스트
      try {
        console.log(`[TEST] HEAD ${fileUrl}`);
        const fileResponse = await fetch(fileUrl, { method: 'HEAD' });
        const isAccessible = fileResponse.ok;
        
        this.logResult('파일 접근 가능성', isAccessible, {
          fileUrl,
          status: fileResponse.status,
          contentType: fileResponse.headers.get('content-type'),
          contentLength: fileResponse.headers.get('content-length'),
          acceptRanges: fileResponse.headers.get('accept-ranges')
        });
      } catch (error) {
        this.logResult('파일 접근 가능성', false, {
          fileUrl,
          error: error.message,
          errorType: error.name
        });
      }
    } else {
      this.logResult('파일 존재 여부', false, {
        message: '업로드된 피드백 파일이 없습니다.',
        projectId: testProject.id
      });
    }
  }

  // 5. 전체 사용자 플로우 테스트
  async testUserWorkflow() {
    if (!this.authData) {
      console.log('\n⚠️  인증 정보 없음 - 워크플로우 테스트 스킵');
      return;
    }

    console.log('\n🔄 === 사용자 워크플로우 테스트 ===');

    const headers = {
      'Authorization': `Bearer ${this.authData.token}`,
      'Cookie': `vridge_session=${this.authData.token}`
    };

    // 1. 프로젝트 생성 → 2. 프로젝트 목록 확인 → 3. 피드백 접근
    const workflowProjectName = `Workflow_${this.testSession}`;
    
    // 프로젝트 생성
    const formData = new FormData();
    formData.append('inputs', JSON.stringify({
      name: workflowProjectName,
      manager: 'Workflow Manager',
      consumer: 'Workflow Consumer',
      description: '전체 워크플로우 테스트',
      color: '#FF6B6B'
    }));
    formData.append('process', JSON.stringify({
      basic_plan: { start_date: '2025-01-01', end_date: '2025-01-05' }
    }));

    const createResult = await this.makeRequest('POST', '/projects/create', formData, headers);
    const projectCreated = createResult.ok;
    
    this.logResult('워크플로우: 프로젝트 생성', projectCreated, {
      status: createResult.status,
      message: createResult.data?.message,
      projectName: workflowProjectName
    });

    if (!projectCreated) return;

    // 잠시 대기 후 목록에서 확인
    await this.sleep(1000);
    
    const listResult = await this.makeRequest('GET', '/projects/project_list', null, headers);
    const foundInList = listResult.ok && 
      listResult.data?.result?.some(p => p.name === workflowProjectName);
    
    this.logResult('워크플로우: 목록에서 확인', foundInList, {
      status: listResult.status,
      foundProject: foundInList,
      totalProjects: listResult.data?.result?.length || 0
    });

    if (foundInList) {
      const createdProject = listResult.data.result.find(p => p.name === workflowProjectName);
      
      // 생성된 프로젝트의 피드백 접근
      const feedbackResult = await this.makeRequest('GET', `/feedbacks/${createdProject.id}`, null, headers);
      const feedbackAccessible = feedbackResult.ok;
      
      this.logResult('워크플로우: 피드백 접근', feedbackAccessible, {
        status: feedbackResult.status,
        projectId: createdProject.id,
        hasFeedbackStructure: !!feedbackResult.data?.result
      });
    }
  }

  // 메인 테스트 실행
  async runAllTests() {
    console.log(`🚀 VideoPlanet 최종 기능 테스트 시작`);
    console.log(`📅 테스트 세션: ${this.testSession}`);
    console.log(`🌐 API 베이스: ${API_BASE}\n`);

    const startTime = Date.now();

    try {
      await this.testAPIHealth();
      await this.testUserAuthentication(); 
      await this.testProjectDuplicationPrevention();
      await this.testFeedbackSystem();
      await this.testUserWorkflow();
    } catch (error) {
      console.error('테스트 실행 중 오류:', error);
      this.results.summary.errors.push(`전체 테스트 오류: ${error.message}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 최종 결과 출력
    console.log('\n' + '='.repeat(70));
    console.log('📊 VideoPlanet 최종 테스트 결과');
    console.log('='.repeat(70));
    console.log(`⏱️  총 실행 시간: ${duration}ms`);
    console.log(`📈 전체 테스트: ${this.results.summary.total}개`);
    console.log(`✅ 성공: ${this.results.summary.passed}개`);
    console.log(`❌ 실패: ${this.results.summary.failed}개`);
    console.log(`📊 성공률: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);

    // 카테고리별 결과
    const categories = {
      '🔍 API 상태': this.results.tests.filter(t => t.testName.includes('API') || t.testName.includes('엔드포인트')),
      '👤 사용자 인증': this.results.tests.filter(t => t.testName.includes('회원가입') || t.testName.includes('로그인')),
      '🛡️ 프로젝트 기능': this.results.tests.filter(t => t.testName.includes('프로젝트')),
      '🎬 피드백 시스템': this.results.tests.filter(t => t.testName.includes('피드백') || t.testName.includes('파일')),
      '🔄 워크플로우': this.results.tests.filter(t => t.testName.includes('워크플로우'))
    };

    Object.entries(categories).forEach(([category, tests]) => {
      if (tests.length > 0) {
        const passed = tests.filter(t => t.success).length;
        console.log(`\n${category}: ${passed}/${tests.length} 성공`);
        tests.forEach(test => {
          console.log(`   ${test.success ? '✅' : '❌'} ${test.testName}`);
        });
      }
    });

    if (this.results.summary.errors.length > 0) {
      console.log('\n❌ 주요 이슈들:');
      this.results.summary.errors.forEach(error => console.log(`   - ${error}`));
    }

    // 중요 발견사항
    const criticalIssues = this.results.tests.filter(test => 
      !test.success && (
        test.testName.includes('중복') || 
        test.testName.includes('파일 접근') ||
        test.testName.includes('API 서버')
      )
    );

    if (criticalIssues.length > 0) {
      console.log('\n🚨 중요 발견사항:');
      criticalIssues.forEach(issue => {
        console.log(`   🔍 ${issue.testName}:`);
        console.log(`      상태: ${issue.status || 'N/A'}`);
        console.log(`      메시지: ${issue.message || issue.error || '상세 정보 없음'}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    
    return this.results;
  }
}

// 테스트 실행
const tester = new FinalTest();
tester.runAllTests().then(results => {
  const successRate = (results.summary.passed / results.summary.total) * 100;
  
  console.log('\n🎯 최종 테스트 완료!');
  
  if (successRate >= 80) {
    console.log('🎉 시스템이 안정적으로 작동하고 있습니다!');
  } else if (successRate >= 60) {
    console.log('⚠️  일부 기능에 문제가 있지만 핵심 기능은 작동합니다.');
  } else {
    console.log('🔧 여러 기능에 문제가 발견되었습니다. 추가 수정이 필요합니다.');
  }
  
}).catch(error => {
  console.error('테스트 실행 실패:', error);
});