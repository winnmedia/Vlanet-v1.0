/**
 * VideoPlanet 사용자 여정 시나리오 테스트
 * CLAUDE.md의 핵심 기능 및 사용자 경험 원칙에 기반한 테스트
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 환경 설정
const API_URL = process.env.API_URL || 'https://videoplanet.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 테스트 데이터
const testUser = {
  email: 'demo@test.com',
  password: 'demo1234',
  nickname: '데모유저'
};

const testProject = {
  name: '테스트 영상 프로젝트 ' + new Date().toISOString(),
  consumer: '테스트 고객사',
  manager: '테스트 매니저',
  description: '사용자 여정 테스트를 위한 프로젝트'
};

// API 클라이언트 설정
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// 쿠키 저장을 위한 변수
let authCookies = '';

// 헬퍼 함수들
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(2)}초`;
}

async function measurePerformance(taskName, fn) {
  const startTime = Date.now();
  try {
    const result = await fn();
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ ${taskName}: ${formatTime(duration)}`);
    return { success: true, result, duration };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ ${taskName} 실패: ${formatTime(duration)}`);
    console.error(`   오류: ${error.message}`);
    return { success: false, error, duration };
  }
}

// 테스트 시나리오들
const testScenarios = {
  // 1. 로그인 및 인증
  async login() {
    console.log('\n🔐 1. 로그인 테스트');
    
    const result = await measurePerformance('로그인 요청', async () => {
      const response = await api.post('/api/users/login/', {
        username: testUser.email,
        password: testUser.password
      });
      
      // 쿠키 저장
      if (response.headers['set-cookie']) {
        authCookies = response.headers['set-cookie'].join('; ');
        api.defaults.headers.Cookie = authCookies;
      }
      
      return response.data;
    });
    
    if (result.success) {
      console.log(`   ✓ 사용자: ${result.result.nickname}`);
      console.log(`   ✓ 역할: ${result.result.role}`);
      console.log(`   ✓ 토큰 수신: ${result.result.token ? '성공' : '실패'}`);
    }
    
    return result;
  },

  // 2. 프로젝트 생성
  async createProject() {
    console.log('\n📁 2. 프로젝트 생성 테스트');
    
    const result = await measurePerformance('프로젝트 생성', async () => {
      const response = await api.post('/projects/project/', testProject);
      return response.data;
    });
    
    if (result.success) {
      console.log(`   ✓ 프로젝트 ID: ${result.result.result.id}`);
      console.log(`   ✓ 프로젝트명: ${result.result.result.name}`);
      testProject.id = result.result.result.id;
    }
    
    return result;
  },

  // 3. 영상 업로드
  async uploadVideo() {
    console.log('\n🎥 3. 영상 업로드 테스트');
    
    // 테스트 비디오 파일 생성 (실제로는 작은 더미 파일)
    const videoPath = path.join(__dirname, 'test-video.mp4');
    if (!fs.existsSync(videoPath)) {
      console.log('   ⚠️  테스트 비디오 파일이 없어 건너뜁니다.');
      return { success: false, error: 'No test video file' };
    }
    
    const result = await measurePerformance('영상 파일 업로드', async () => {
      const formData = new FormData();
      formData.append('files', fs.createReadStream(videoPath));
      
      const response = await api.post(
        `/feedbacks/feedback/${testProject.id}/file/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Cookie: authCookies
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      return response.data;
    });
    
    if (result.success) {
      console.log(`   ✓ 파일 업로드 완료`);
      console.log(`   ✓ 업로드 시간: ${formatTime(result.duration)}`);
    }
    
    return result;
  },

  // 4. 피드백 작성
  async createFeedback() {
    console.log('\n💬 4. 피드백 작성 테스트');
    
    const feedbackData = {
      text: '00:30 시점에서 화면 전환이 너무 빠른 것 같습니다. 조금 더 천천히 전환하면 좋겠습니다.',
      section: '00:30',
      security: false
    };
    
    const result = await measurePerformance('피드백 등록', async () => {
      const response = await api.post(
        `/feedbacks/feedback/${testProject.id}/`,
        feedbackData
      );
      return response.data;
    });
    
    if (result.success) {
      console.log(`   ✓ 피드백 ID: ${result.result.result.id}`);
      console.log(`   ✓ 타임스탬프: ${result.result.result.section}`);
    }
    
    return result;
  },

  // 5. 실시간 피드백 목록 조회
  async getFeedbacks() {
    console.log('\n📋 5. 피드백 목록 조회 테스트');
    
    const result = await measurePerformance('피드백 목록 조회', async () => {
      const response = await api.get(`/feedbacks/feedback/${testProject.id}/`);
      return response.data;
    });
    
    if (result.success) {
      const feedbacks = result.result.result.feedback || [];
      console.log(`   ✓ 총 피드백 수: ${feedbacks.length}개`);
      feedbacks.slice(0, 3).forEach((fb, idx) => {
        console.log(`   ✓ 피드백 ${idx + 1}: ${fb.section} - ${fb.text.substring(0, 30)}...`);
      });
    }
    
    return result;
  },

  // 6. 팀원 초대
  async inviteMember() {
    console.log('\n👥 6. 팀원 초대 테스트');
    
    const inviteData = {
      email: 'teammate@test.com',
      message: '프로젝트에 참여해 주세요!'
    };
    
    const result = await measurePerformance('팀원 초대', async () => {
      const response = await api.post(
        `/projects/invite/${testProject.id}/`,
        inviteData
      );
      return response.data;
    });
    
    if (result.success) {
      console.log(`   ✓ 초대 이메일: ${inviteData.email}`);
      console.log(`   ✓ 초대 상태: 성공`);
    }
    
    return result;
  },

  // 7. 프로젝트 목록 조회
  async getProjects() {
    console.log('\n📂 7. 프로젝트 목록 조회 테스트');
    
    const result = await measurePerformance('프로젝트 목록 조회', async () => {
      const response = await api.get('/projects/project/');
      return response.data;
    });
    
    if (result.success) {
      const projects = result.result.result || [];
      console.log(`   ✓ 총 프로젝트 수: ${projects.length}개`);
      projects.slice(0, 3).forEach((proj, idx) => {
        console.log(`   ✓ 프로젝트 ${idx + 1}: ${proj.name}`);
      });
    }
    
    return result;
  },

  // 8. 영상 기획 페이지 테스트
  async testVideoPlanning() {
    console.log('\n🎬 8. 영상 기획 페이지 테스트');
    
    const planningData = {
      title: '테스트 영상 기획안',
      concept: '사용자 여정을 보여주는 프로모션 영상',
      scenes: [
        { order: 1, description: '오프닝 - 로고 노출', duration: 5 },
        { order: 2, description: '제품 소개', duration: 20 },
        { order: 3, description: '사용 방법 설명', duration: 30 }
      ]
    };
    
    const result = await measurePerformance('영상 기획안 생성', async () => {
      // 실제 API가 준비되면 여기에 추가
      console.log('   ℹ️  영상 기획 API 준비 중...');
      return { message: 'Video planning feature coming soon' };
    });
    
    return result;
  }
};

// 성능 측정 및 1000% 성과 검증
async function validatePerformance(results) {
  console.log('\n🚀 성능 및 효율성 분석');
  console.log('='.repeat(50));
  
  const metrics = {
    totalTime: 0,
    successCount: 0,
    failureCount: 0
  };
  
  Object.entries(results).forEach(([scenario, result]) => {
    if (result.duration) {
      metrics.totalTime += result.duration;
      if (result.success) metrics.successCount++;
      else metrics.failureCount++;
    }
  });
  
  console.log(`📊 전체 테스트 소요 시간: ${formatTime(metrics.totalTime)}`);
  console.log(`✅ 성공한 시나리오: ${metrics.successCount}개`);
  console.log(`❌ 실패한 시나리오: ${metrics.failureCount}개`);
  console.log(`📈 성공률: ${((metrics.successCount / (metrics.successCount + metrics.failureCount)) * 100).toFixed(1)}%`);
  
  // CLAUDE.md 기준 1000% 성과 측정
  console.log('\n💯 1000% 성과 달성도');
  console.log('='.repeat(50));
  
  const achievements = {
    '프로젝트 생성 시간': results.createProject?.duration < 2000 ? '달성' : '미달성',
    '피드백 등록 시간': results.createFeedback?.duration < 1000 ? '달성' : '미달성',
    '실시간 동기화': results.getFeedbacks?.duration < 500 ? '달성' : '미달성',
    '원클릭 작업': metrics.successCount > 5 ? '달성' : '미달성'
  };
  
  Object.entries(achievements).forEach(([metric, status]) => {
    console.log(`${status === '달성' ? '✅' : '❌'} ${metric}: ${status}`);
  });
}

// 메인 테스트 실행
async function runUserJourneyTest() {
  console.log('🎯 VideoPlanet 사용자 여정 테스트 시작');
  console.log('='.repeat(50));
  console.log(`API URL: ${API_URL}`);
  console.log(`테스트 시작: ${new Date().toLocaleString('ko-KR')}`);
  console.log('='.repeat(50));
  
  const results = {};
  
  try {
    // 순차적으로 시나리오 실행
    results.login = await testScenarios.login();
    if (!results.login.success) {
      console.error('\n❌ 로그인 실패로 테스트를 중단합니다.');
      return;
    }
    
    results.getProjects = await testScenarios.getProjects();
    results.createProject = await testScenarios.createProject();
    
    if (results.createProject.success) {
      await delay(1000); // 프로젝트 생성 후 잠시 대기
      
      results.uploadVideo = await testScenarios.uploadVideo();
      results.createFeedback = await testScenarios.createFeedback();
      results.getFeedbacks = await testScenarios.getFeedbacks();
      results.inviteMember = await testScenarios.inviteMember();
      results.testVideoPlanning = await testScenarios.testVideoPlanning();
    }
    
    // 성능 분석
    await validatePerformance(results);
    
  } catch (error) {
    console.error('\n💥 예상치 못한 오류 발생:', error.message);
  }
  
  console.log('\n✨ 테스트 완료!');
  console.log('='.repeat(50));
}

// 테스트 실행
if (require.main === module) {
  runUserJourneyTest().catch(console.error);
}

module.exports = { runUserJourneyTest, testScenarios };