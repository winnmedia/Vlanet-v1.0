/**
 * 고질적 문제 해결 검증 테스트
 * 1. 피드백 영상 업로드/재생 기능
 * 2. 프로젝트 중복 생성 방지
 */

const API_BASE = 'https://videoplanet.up.railway.app/api';

class CriticalFixesTest {
  constructor() {
    this.results = {
      projectDuplication: [],
      feedbackVideo: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };
    this.testSession = `test_${Date.now()}`;
  }

  // 테스트 헬퍼 함수들
  async makeRequest(method, endpoint, data = null, headers = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
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

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logResult(testName, success, details = {}) {
    const result = {
      testName,
      success,
      timestamp: new Date().toISOString(),
      ...details
    };

    console.log(`[${success ? '✅ PASS' : '❌ FAIL'}] ${testName}`, details);
    
    this.results.summary.total++;
    if (success) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
      this.results.summary.errors.push(testName);
    }

    return result;
  }

  // 1. 프로젝트 중복 생성 방지 테스트
  async testProjectDuplicationPrevention() {
    console.log('\n🛡️ === 프로젝트 중복 생성 방지 테스트 ===');
    
    const testProjectName = `TestProject_${this.testSession}`;
    const projectData = {
      name: testProjectName,
      manager: 'Test Manager',
      consumer: 'Test Consumer',
      description: '중복 생성 테스트용 프로젝트',
      color: '#1631F8',
      process: {
        basic_plan: { start_date: '2025-01-01', end_date: '2025-01-05' },
        story_board: { start_date: '2025-01-06', end_date: '2025-01-10' }
      }
    };

    // 테스트 1: 첫 번째 프로젝트 생성 (성공해야 함)
    const firstResult = await this.makeRequest('POST', '/projects/atomic-create', projectData, {
      'X-Idempotency-Key': `${this.testSession}_1`
    });

    this.results.projectDuplication.push(
      this.logResult('첫 번째 프로젝트 생성', firstResult.status === 201, {
        status: firstResult.status,
        response: firstResult.data,
        projectName: testProjectName
      })
    );

    // 테스트 2: 동일한 이름으로 두 번째 생성 시도 (실패해야 함)
    await this.sleep(100); // 짧은 대기

    const secondResult = await this.makeRequest('POST', '/projects/atomic-create', projectData, {
      'X-Idempotency-Key': `${this.testSession}_2`
    });

    const isDuplicateBlocked = secondResult.status === 409;
    this.results.projectDuplication.push(
      this.logResult('중복 프로젝트 차단', isDuplicateBlocked, {
        status: secondResult.status,
        response: secondResult.data,
        expectedStatus: 409,
        actuallyBlocked: isDuplicateBlocked
      })
    );

    // 테스트 3: 동시 요청 시뮬레이션 (둘 다 실패하거나 하나만 성공해야 함)
    const concurrentProjectName = `ConcurrentTest_${this.testSession}`;
    const concurrentData = { ...projectData, name: concurrentProjectName };

    console.log('동시 요청 테스트 시작...');
    
    const [result1, result2, result3] = await Promise.all([
      this.makeRequest('POST', '/projects/atomic-create', concurrentData, {
        'X-Idempotency-Key': `${this.testSession}_concurrent_1`
      }),
      this.makeRequest('POST', '/projects/atomic-create', concurrentData, {
        'X-Idempotency-Key': `${this.testSession}_concurrent_2`
      }),
      this.makeRequest('POST', '/projects/atomic-create', concurrentData, {
        'X-Idempotency-Key': `${this.testSession}_concurrent_3`
      })
    ]);

    const results = [result1, result2, result3];
    const successCount = results.filter(r => r.status === 201).length;
    const duplicateCount = results.filter(r => r.status === 409).length;
    
    const concurrentSuccess = successCount === 1 && duplicateCount === 2;
    this.results.projectDuplication.push(
      this.logResult('동시 요청 처리', concurrentSuccess, {
        successCount,
        duplicateCount,
        results: results.map(r => ({ status: r.status, message: r.data?.error || r.data?.message })),
        expected: '1개 성공, 2개 중복 차단'
      })
    );
  }

  // 2. 피드백 영상 URL 처리 테스트
  async testFeedbackVideoSystem() {
    console.log('\n🎬 === 피드백 영상 시스템 테스트 ===');

    // 기존 프로젝트가 있는지 확인
    const projectListResult = await this.makeRequest('GET', '/projects/project_list');
    
    if (!projectListResult.ok || !projectListResult.data?.result?.length) {
      this.results.feedbackVideo.push(
        this.logResult('프로젝트 목록 조회', false, {
          error: '테스트할 프로젝트가 없습니다.',
          status: projectListResult.status
        })
      );
      return;
    }

    const firstProject = projectListResult.data.result[0];
    const projectId = firstProject.id;

    this.results.feedbackVideo.push(
      this.logResult('프로젝트 목록 조회', true, {
        projectCount: projectListResult.data.result.length,
        testProjectId: projectId
      })
    );

    // 피드백 데이터 조회 테스트
    const feedbackResult = await this.makeRequest('GET', `/feedbacks/${projectId}`);
    
    const feedbackSuccess = feedbackResult.ok && feedbackResult.data?.result;
    this.results.feedbackVideo.push(
      this.logResult('피드백 데이터 조회', feedbackSuccess, {
        status: feedbackResult.status,
        hasFiles: !!feedbackResult.data?.result?.files,
        fileUrl: feedbackResult.data?.result?.files,
        response: feedbackResult.data
      })
    );

    // 파일 URL 유효성 검증
    if (feedbackResult.data?.result?.files) {
      const fileUrl = feedbackResult.data.result.files;
      
      // URL 형식 검증
      const isValidUrl = /^https?:\/\//.test(fileUrl);
      const isHttps = fileUrl.startsWith('https://');
      const hasCorrectDomain = fileUrl.includes('videoplanet.up.railway.app') || fileUrl.includes('localhost');
      
      this.results.feedbackVideo.push(
        this.logResult('파일 URL 형식 검증', isValidUrl && isHttps && hasCorrectDomain, {
          fileUrl,
          isValidUrl,
          isHttps,
          hasCorrectDomain,
          urlPattern: fileUrl.match(/^(https?):\/\/([^\/]+)(\/.*)?$/)
        })
      );

      // 실제 파일 접근 테스트 (HEAD 요청)
      try {
        const fileResponse = await fetch(fileUrl, { method: 'HEAD' });
        const isAccessible = fileResponse.ok;
        
        this.results.feedbackVideo.push(
          this.logResult('파일 접근 가능성', isAccessible, {
            fileUrl,
            status: fileResponse.status,
            contentType: fileResponse.headers.get('content-type'),
            contentLength: fileResponse.headers.get('content-length')
          })
        );
      } catch (error) {
        this.results.feedbackVideo.push(
          this.logResult('파일 접근 가능성', false, {
            fileUrl,
            error: error.message
          })
        );
      }
    }
  }

  // 3. 전체 API 상태 확인
  async testAPIHealth() {
    console.log('\n🔍 === API 상태 확인 ===');

    const healthChecks = [
      { name: '프로젝트 목록', endpoint: '/projects/project_list' },
      { name: '사용자 이메일 체크', endpoint: '/users/check_email', method: 'POST', data: { email: 'test@test.com' } }
    ];

    for (const check of healthChecks) {
      const result = await this.makeRequest(
        check.method || 'GET', 
        check.endpoint, 
        check.data
      );

      this.logResult(`API 상태: ${check.name}`, result.ok, {
        endpoint: check.endpoint,
        status: result.status,
        responseTime: result.responseTime
      });
    }
  }

  // 메인 테스트 실행
  async runAllTests() {
    console.log(`🚀 VideoPlanet 고질적 문제 해결 검증 테스트 시작`);
    console.log(`📅 테스트 세션: ${this.testSession}`);
    console.log(`🌐 API 베이스: ${API_BASE}\n`);

    const startTime = Date.now();

    try {
      await this.testProjectDuplicationPrevention();
      await this.testFeedbackVideoSystem();
      await this.testAPIHealth();
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
    if (this.results.projectDuplication.length > 0) {
      console.log('\n🛡️ 프로젝트 중복 방지 결과:');
      this.results.projectDuplication.forEach(test => {
        console.log(`   ${test.success ? '✅' : '❌'} ${test.testName}`);
      });
    }

    if (this.results.feedbackVideo.length > 0) {
      console.log('\n🎬 피드백 영상 시스템 결과:');
      this.results.feedbackVideo.forEach(test => {
        console.log(`   ${test.success ? '✅' : '❌'} ${test.testName}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    return this.results;
  }
}

// 테스트 실행
const tester = new CriticalFixesTest();
tester.runAllTests().then(results => {
  console.log('\n🎯 테스트 완료!');
}).catch(error => {
  console.error('테스트 실행 실패:', error);
});