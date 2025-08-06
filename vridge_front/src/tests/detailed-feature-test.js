/**
 * VideoPlanet 상세 기능 테스트 스크립트
 * 마이페이지 및 피드백 페이지의 모든 기능을 테스트
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 환경 설정
const API_URL = 'http://localhost:8001';
const FRONTEND_URL = 'http://localhost:3001';

// 테스트 결과 저장
const testResults = {
  startTime: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0
  }
};

// API 클라이언트
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// 인증 토큰 저장
let authToken = '';
let sessionCookies = '';
let testProjectId = '';
let testUserId = '';

// 테스트 데이터
const testData = {
  user: {
    email: 'demo@test.com',
    password: 'demo1234'
  },
  secondUser: {
    email: 'demo2@test.com',
    password: 'demo1234',
    nickname: '테스트유저2'
  },
  profile: {
    nickname: '업데이트된 닉네임',
    bio: '안녕하세요! VideoPlanet에서 활동하는 영상 제작자입니다.',
    skills: ['영상 편집', '모션 그래픽', '색보정']
  },
  project: {
    name: `피드백 테스트 프로젝트 ${Date.now()}`,
    consumer: '테스트 고객사',
    manager: '데모유저',
    description: '피드백 시스템 테스트를 위한 프로젝트',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  feedback: {
    text: '0:30 지점에서 전환이 너무 빠릅니다. 좀 더 부드럽게 처리해주세요.',
    section: '00:30',
    security: false
  },
  comment: {
    text: '동의합니다. 추가로 배경음악도 조정이 필요할 것 같습니다.'
  },
  invitation: {
    email: 'demo2@test.com',
    role: '팀원'
  }
};

// 헬퍼 함수
function logTest(name, result, duration, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name} (${duration}ms)`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({
    name,
    result,
    duration,
    details,
    timestamp: new Date()
  });
  
  testResults.summary.total++;
  if (result) testResults.summary.passed++;
  else testResults.summary.failed++;
}

async function testEndpoint(name, method, url, data = null, options = {}) {
  const startTime = Date.now();
  try {
    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': authToken ? `Bearer ${authToken}` : undefined,
        'Cookie': sessionCookies || undefined
      }
    };
    
    const response = await api[method](url, data, config);
    const duration = Date.now() - startTime;
    
    logTest(name, true, duration, `Status: ${response.status}`);
    return { success: true, data: response.data, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const details = error.response 
      ? `Status: ${error.response.status}, ${error.response.data?.message || error.message}`
      : error.message;
    
    logTest(name, false, duration, details);
    return { success: false, error, duration };
  }
}

// 파일 업로드 테스트
async function testFileUpload(name, url, filePath, fieldName = 'file') {
  const startTime = Date.now();
  try {
    const form = new FormData();
    
    // 테스트용 파일 생성 (존재하지 않는 경우)
    if (!fs.existsSync(filePath)) {
      // 테스트 이미지 생성
      if (filePath.endsWith('.jpg') || filePath.endsWith('.png')) {
        // 1x1 픽셀 PNG 이미지
        const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(filePath, buffer);
      }
      // 테스트 비디오 생성
      else if (filePath.endsWith('.mp4')) {
        // 작은 MP4 파일 (실제로는 텍스트지만 테스트용)
        fs.writeFileSync(filePath, 'This is a test video file');
      }
    }
    
    form.append(fieldName, fs.createReadStream(filePath));
    
    const response = await api.post(url, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': authToken ? `Bearer ${authToken}` : undefined
      }
    });
    
    const duration = Date.now() - startTime;
    logTest(name, true, duration, `Status: ${response.status}`);
    
    // 테스트 파일 삭제
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return { success: true, data: response.data, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const details = error.response 
      ? `Status: ${error.response.status}, ${error.response.data?.message || error.message}`
      : error.message;
    
    logTest(name, false, duration, details);
    return { success: false, error, duration };
  }
}

// 테스트 시나리오들
const testScenarios = {
  // 0. 사전 준비: 로그인
  async prepare() {
    console.log('\n🔧 테스트 준비');
    
    // 로그인
    const loginResult = await testEndpoint(
      '로그인',
      'post',
      '/api/users/login/',
      {
        email: testData.user.email,
        password: testData.user.password
      }
    );
    
    if (loginResult.success) {
      authToken = loginResult.data.token || '';
      testUserId = loginResult.data.user?.id || '';
      
      // 프로젝트 생성
      const projectResult = await testEndpoint(
        '테스트 프로젝트 생성',
        'post',
        '/api/projects/project/',
        testData.project
      );
      
      if (projectResult.success) {
        testProjectId = projectResult.data.result?.id || '';
      }
    }
    
    return loginResult.success;
  },

  // 1. 마이페이지 테스트
  async testMyPage() {
    console.log('\n👤 마이페이지 기능 테스트');
    console.log('=====================================');
    
    // 프로필 조회
    await testEndpoint('프로필 정보 조회', 'get', '/api/users/me/');
    
    // 프로필 업데이트
    await testEndpoint(
      '프로필 정보 업데이트',
      'patch',
      '/api/users/profile/',
      testData.profile
    );
    
    // 프로필 이미지 업로드
    await testFileUpload(
      '프로필 이미지 업로드',
      '/api/users/profile/image/',
      path.join(__dirname, 'test-profile.jpg'),
      'profile_image'
    );
    
    // 참여 프로젝트 목록
    await testEndpoint('참여 프로젝트 목록 조회', 'get', '/api/users/projects/');
    
    // 활동 통계
    await testEndpoint('활동 통계 조회', 'get', '/api/users/stats/');
    
    // 알림 설정
    await testEndpoint(
      '알림 설정 업데이트',
      'patch',
      '/api/users/notification-settings/',
      {
        email_notifications: true,
        push_notifications: false,
        feedback_alerts: true
      }
    );
  },

  // 2. 피드백 페이지 상세 테스트
  async testFeedbackPage() {
    console.log('\n💬 피드백 페이지 상세 기능 테스트');
    console.log('=====================================');
    
    if (!testProjectId) {
      console.log('   ⚠️  테스트 프로젝트가 없어 피드백 테스트를 건너뜁니다.');
      return;
    }
    
    // 영상 업로드
    const videoUploadResult = await testFileUpload(
      '영상 파일 업로드',
      `/api/feedbacks/project/${testProjectId}/upload/`,
      path.join(__dirname, 'test-video.mp4'),
      'video'
    );
    
    let videoId = '';
    if (videoUploadResult.success) {
      videoId = videoUploadResult.data.video_id || '';
    }
    
    // 피드백 추가
    const feedbackResult = await testEndpoint(
      '타임스탬프 피드백 추가',
      'post',
      `/api/feedbacks/feedback/${testProjectId}/`,
      {
        ...testData.feedback,
        video_id: videoId
      }
    );
    
    let feedbackId = '';
    if (feedbackResult.success) {
      feedbackId = feedbackResult.data.id || '';
    }
    
    // 코멘트 추가
    if (feedbackId) {
      await testEndpoint(
        '피드백에 코멘트 추가',
        'post',
        `/api/feedbacks/comment/${feedbackId}/`,
        testData.comment
      );
    }
    
    // 감정 표시 (좋아요 등)
    if (feedbackId) {
      await testEndpoint(
        '피드백 좋아요',
        'post',
        `/api/feedbacks/reaction/${feedbackId}/`,
        { type: 'like' }
      );
      
      await testEndpoint(
        '피드백 하트',
        'post',
        `/api/feedbacks/reaction/${feedbackId}/`,
        { type: 'heart' }
      );
    }
    
    // 멤버 초대
    const inviteResult = await testEndpoint(
      '프로젝트 멤버 초대',
      'post',
      `/api/projects/project/${testProjectId}/invite/`,
      testData.invitation
    );
    
    let invitationToken = '';
    if (inviteResult.success) {
      invitationToken = inviteResult.data.token || '';
    }
    
    // 초대장 발송 상태 확인
    await testEndpoint(
      '초대 상태 확인',
      'get',
      `/api/projects/invitation/${invitationToken}/`
    );
    
    // 비디오 플레이어 기능 테스트
    await testVideoPlayerFeatures();
  },

  // 3. 비디오 플레이어 기능 테스트
  async testVideoPlayerFeatures() {
    console.log('\n🎬 비디오 플레이어 기능 테스트');
    console.log('=====================================');
    
    // 플레이어 설정
    await testEndpoint(
      '플레이어 설정 저장',
      'post',
      '/api/users/player-settings/',
      {
        playback_speed: 1.5,
        quality: '1080p',
        autoplay: false,
        loop: false
      }
    );
    
    // 북마크 추가
    await testEndpoint(
      '비디오 북마크 추가',
      'post',
      `/api/feedbacks/bookmark/`,
      {
        project_id: testProjectId,
        timestamp: '01:23',
        note: '중요한 부분'
      }
    );
    
    // 재생 기록
    await testEndpoint(
      '재생 진행률 저장',
      'post',
      `/api/feedbacks/progress/`,
      {
        project_id: testProjectId,
        current_time: 85,
        duration: 300
      }
    );
  },

  // 4. 초대 수락 및 협업 테스트
  async testCollaboration() {
    console.log('\n🤝 협업 기능 테스트');
    console.log('=====================================');
    
    // 두 번째 사용자 생성 및 로그인
    const createUserResult = await testEndpoint(
      '두 번째 사용자 생성',
      'post',
      '/api/users/signup/',
      testData.secondUser
    );
    
    if (createUserResult.success || createUserResult.error?.response?.status === 400) {
      // 두 번째 사용자로 로그인
      const secondLoginResult = await testEndpoint(
        '두 번째 사용자 로그인',
        'post',
        '/api/users/login/',
        {
          username: testData.secondUser.email,
          password: testData.secondUser.password
        }
      );
      
      if (secondLoginResult.success) {
        const secondUserToken = secondLoginResult.data.token;
        
        // 임시로 토큰 변경
        const originalToken = authToken;
        authToken = secondUserToken;
        
        // 초대 수락
        await testEndpoint(
          '초대 수락',
          'post',
          `/api/projects/invitation/accept/`,
          { token: 'test-invitation-token' }
        );
        
        // 두 번째 사용자로 피드백 남기기
        await testEndpoint(
          '협업자 피드백 추가',
          'post',
          `/api/feedbacks/feedback/${testProjectId}/`,
          {
            text: '협업자입니다. 전체적으로 좋은데 음악 볼륨을 조정해주세요.',
            section: '02:15',
            security: false
          }
        );
        
        // 원래 토큰으로 복구
        authToken = originalToken;
      }
    }
  },

  // 5. 실시간 기능 테스트
  async testRealtimeFeatures() {
    console.log('\n⚡ 실시간 기능 테스트');
    console.log('=====================================');
    
    // WebSocket 연결 테스트
    await testEndpoint(
      'WebSocket 연결 정보',
      'get',
      `/api/feedbacks/ws/info/${testProjectId}/`
    );
    
    // 실시간 알림 구독
    await testEndpoint(
      '실시간 알림 구독',
      'post',
      '/api/notifications/subscribe/',
      {
        project_id: testProjectId,
        types: ['feedback', 'comment', 'mention']
      }
    );
    
    // 온라인 상태 업데이트
    await testEndpoint(
      '온라인 상태 업데이트',
      'post',
      '/api/onlines/status/',
      {
        project_id: testProjectId,
        status: 'active'
      }
    );
  },

  // 6. 내보내기/다운로드 기능
  async testExportFeatures() {
    console.log('\n📥 내보내기 기능 테스트');
    console.log('=====================================');
    
    // 피드백 리포트 생성
    await testEndpoint(
      '피드백 리포트 생성',
      'post',
      `/api/feedbacks/export/${testProjectId}/`,
      {
        format: 'pdf',
        include_comments: true,
        include_timeline: true
      }
    );
    
    // 프로젝트 데이터 백업
    await testEndpoint(
      '프로젝트 백업',
      'get',
      `/api/projects/backup/${testProjectId}/`
    );
  }
};

// 메인 테스트 실행
async function runDetailedTests() {
  console.log('🎯 VideoPlanet 상세 기능 테스트 시작');
  console.log('='.repeat(60));
  console.log(`백엔드 URL: ${API_URL}`);
  console.log(`프론트엔드 URL: ${FRONTEND_URL}`);
  console.log(`테스트 시작: ${new Date().toLocaleString('ko-KR')}`);
  console.log('='.repeat(60));
  
  try {
    // 사전 준비
    const prepared = await testScenarios.prepare();
    
    if (prepared) {
      // 순차적으로 테스트 실행
      await testScenarios.testMyPage();
      await testScenarios.testFeedbackPage();
      await testScenarios.testCollaboration();
      await testScenarios.testRealtimeFeatures();
      await testScenarios.testExportFeatures();
    } else {
      console.log('\n⚠️  로그인 실패로 인해 상세 테스트를 중단합니다.');
    }
    
  } catch (error) {
    console.error('\n💥 예상치 못한 오류:', error.message);
  }
  
  // 최종 결과 요약
  testResults.summary.duration = Date.now() - testResults.startTime;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`총 테스트: ${testResults.summary.total}개`);
  console.log(`✅ 성공: ${testResults.summary.passed}개`);
  console.log(`❌ 실패: ${testResults.summary.failed}개`);
  console.log(`⏱️  총 소요시간: ${(testResults.summary.duration / 1000).toFixed(1)}초`);
  console.log(`📈 성공률: ${(testResults.summary.passed / testResults.summary.total * 100).toFixed(1)}%`);
  
  // 결과 파일 저장
  const reportPath = path.join(__dirname, `detailed-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 상세 리포트: ${reportPath}`);
  
  // 주요 실패 항목 요약
  const failedTests = testResults.tests.filter(t => !t.result);
  if (failedTests.length > 0) {
    console.log('\n⚠️  실패한 테스트 요약:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.details}`);
    });
  }
  
  console.log('\n✨ 상세 기능 테스트 완료!');
}

// 실행
if (require.main === module) {
  runDetailedTests().catch(console.error);
}

module.exports = { runDetailedTests };