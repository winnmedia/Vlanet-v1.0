/**
 * 남은 오류 디버깅
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:8000/api';

// 로그인 정보
const TEST_EMAIL = 'ceo@winnmedia.co.kr';
const TEST_PASSWORD = 'Qwerasdf!234';

// 콘솔 색상
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function debugRemainingErrors() {
  console.log(`${colors.blue}남은 오류 디버깅 시작${colors.reset}`);

  // 1. 로그인
  try {
    const loginResponse = await axios.post(`${BASE_URL}/users/login/`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    const token = loginResponse.data.vridge_session || loginResponse.data.access;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log(`${colors.green}✓ 로그인 성공${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ 로그인 실패 - 테스트 중단${colors.reset}`);
    return;
  }

  // 2. 프로젝트 생성 상세 디버깅
  console.log(`\n${colors.cyan}=== 프로젝트 생성 상세 디버깅 ===${colors.reset}`);
  
  // JSON 방식 시도
  try {
    const jsonResponse = await axios.post(`${BASE_URL}/projects/create/`, {
      name: `JSON 테스트 프로젝트 ${Date.now()}`,
      description: 'JSON 테스트용 프로젝트',
      manager: '테스트 매니저',
      consumer: '테스트 고객',
      color: '#1631F8',
      process: []
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`${colors.green}✓ JSON 방식 성공!${colors.reset}`);
    console.log('응답:', jsonResponse.data);
  } catch (error) {
    console.log(`${colors.red}✗ JSON 방식 실패${colors.reset}`);
    console.log('오류:', error.response?.data);
  }

  // FormData 방식 시도
  console.log(`\n${colors.cyan}FormData 방식 시도${colors.reset}`);
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('inputs', JSON.stringify({
      name: `FormData 테스트 프로젝트 ${Date.now()}`,
      description: 'FormData 테스트용 프로젝트',
      manager: '테스트 매니저',
      consumer: '테스트 고객',
      color: '#1631F8'
    }));
    form.append('process', JSON.stringify([]));

    const formResponse = await axios.post(`${BASE_URL}/projects/create/`, form, {
      headers: form.getHeaders()
    });
    console.log(`${colors.green}✓ FormData 방식 성공!${colors.reset}`);
    console.log('응답:', formResponse.data);
  } catch (error) {
    console.log(`${colors.red}✗ FormData 방식 실패${colors.reset}`);
    console.log('오류:', error.response?.data);
  }

  // 3. 기획 저장 500 오류 디버깅
  console.log(`\n${colors.cyan}=== 기획 저장 500 오류 디버깅 ===${colors.reset}`);
  
  try {
    const saveResponse = await axios.post(`${BASE_URL}/video-planning/save/`, {
      title: 'MECE 테스트 기획',
      planning_text: '테스트 기획 내용',
      stories: [],
      scenes: [],
      shots: [],
      storyboards: []
    });
    console.log(`${colors.green}✓ 기획 저장 성공!${colors.reset}`);
    console.log('응답:', saveResponse.data);
  } catch (error) {
    console.log(`${colors.red}✗ 기획 저장 실패${colors.reset}`);
    console.log('상태 코드:', error.response?.status);
    console.log('오류 메시지:', error.response?.data);
  }

  // 4. 피드백 생성 디버깅
  console.log(`\n${colors.cyan}=== 피드백 생성 디버깅 ===${colors.reset}`);
  
  // 먼저 프로젝트 목록 조회
  try {
    const listResponse = await axios.get(`${BASE_URL}/projects/project_list/`);
    console.log('프로젝트 목록 응답 구조:', Object.keys(listResponse.data));
    
    if (listResponse.data.length > 0) {
      const projectId = listResponse.data[0].id;
      console.log('사용할 프로젝트 ID:', projectId);
      
      // 피드백 생성 시도
      const feedbackResponse = await axios.post(`${BASE_URL}/feedbacks/create/`, {
        project: projectId,
        content: 'MECE 테스트 피드백',
        feedback_type: 'comment'
      });
      console.log(`${colors.green}✓ 피드백 생성 성공!${colors.reset}`);
      console.log('응답:', feedbackResponse.data);
    } else {
      console.log(`${colors.yellow}프로젝트가 없어 피드백 테스트 스킵${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ 피드백 관련 오류${colors.reset}`);
    console.log('오류:', error.response?.data || error.message);
  }

  console.log(`\n${colors.blue}디버깅 완료!${colors.reset}`);
}

// 실행
axios.get(`${BASE_URL}/health/`)
  .then(() => {
    console.log(`${colors.green}✓ 백엔드 서버 연결 확인${colors.reset}`);
    debugRemainingErrors();
  })
  .catch(() => {
    console.error(`${colors.red}✗ 백엔드 서버에 연결할 수 없습니다.${colors.reset}`);
  });