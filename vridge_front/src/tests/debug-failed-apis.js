/**
 * 실패한 API 디버깅 테스트
 * 각 실패한 API의 정확한 오류 메시지를 파악
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

async function debugAPI(apiName, apiCall) {
  console.log(`\n${colors.cyan}=== ${apiName} 디버깅 ===${colors.reset}`);
  
  try {
    const response = await apiCall();
    console.log(`${colors.green}✓ 성공!${colors.reset}`);
    console.log('응답:', JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`${colors.red}✗ 실패!${colors.reset}`);
    console.log('상태 코드:', error.response?.status || 'N/A');
    console.log('오류 메시지:', error.response?.data || error.message);
    return { 
      success: false, 
      status: error.response?.status,
      error: error.response?.data || error.message 
    };
  }
}

async function runDebugTests() {
  console.log(`${colors.blue}실패한 API 디버깅 시작${colors.reset}`);

  // 1. 로그인
  console.log(`\n${colors.yellow}1. 로그인 수행${colors.reset}`);
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

  // 2. 프로젝트 생성 디버깅
  await debugAPI('프로젝트 생성', async () => {
    console.log('요청 데이터:', {
      name: `테스트 프로젝트 ${Date.now()}`,
      description: 'MECE 테스트용 프로젝트'
    });
    
    return await axios.post(`${BASE_URL}/projects/create/`, {
      name: `테스트 프로젝트 ${Date.now()}`,
      description: 'MECE 테스트용 프로젝트'
    });
  });

  // 3. 프로젝트 목록 조회 (삭제 테스트를 위해)
  const listResult = await debugAPI('프로젝트 목록 조회', async () => {
    return await axios.get(`${BASE_URL}/projects/list/`);
  });

  // 4. 프로젝트 삭제 디버깅
  if (listResult.success && listResult.data?.data?.projects?.length > 0) {
    const projectId = listResult.data.data.projects[0].id;
    await debugAPI('프로젝트 삭제', async () => {
      console.log('삭제할 프로젝트 ID:', projectId);
      return await axios.delete(`${BASE_URL}/projects/${projectId}/delete/`);
    });
  } else {
    console.log(`\n${colors.yellow}프로젝트 삭제 테스트 스킵 - 프로젝트가 없음${colors.reset}`);
  }

  // 5. 기획 저장 디버깅
  await debugAPI('기획 저장', async () => {
    const saveData = {
      title: 'MECE 테스트 기획',
      planning: '테스트 기획 내용',
      stories: [],
      scenes: [],
      shots: [],
      storyboards: []
    };
    console.log('요청 데이터:', saveData);
    
    return await axios.post(`${BASE_URL}/video-planning/save/`, saveData);
  });

  // 6. PDF 내보내기 디버깅
  await debugAPI('PDF 내보내기', async () => {
    const pdfData = {
      planning_data: {
        title: 'MECE 테스트 기획',
        planning: '테스트 내용',
        stories: [],
        scenes: []
      }
    };
    console.log('요청 데이터:', pdfData);
    
    return await axios.post(`${BASE_URL}/video-planning/export/pdf/`, pdfData, {
      responseType: 'blob'
    });
  });

  // 7. 피드백 작성 디버깅 (프로젝트 생성 후)
  const createProjectResult = await debugAPI('피드백용 프로젝트 생성', async () => {
    return await axios.post(`${BASE_URL}/projects/create/`, {
      name: `피드백 테스트 프로젝트 ${Date.now()}`,
      description: '피드백 테스트용'
    });
  });

  if (createProjectResult.success) {
    const projectId = createProjectResult.data.data.project.id;
    await debugAPI('피드백 작성', async () => {
      const feedbackData = {
        project: projectId,
        content: 'MECE 테스트 피드백',
        feedback_type: 'comment'
      };
      console.log('요청 데이터:', feedbackData);
      
      return await axios.post(`${BASE_URL}/feedbacks/create/`, feedbackData);
    });
  }

  // 8. 비밀번호 변경 API 디버깅
  await debugAPI('비밀번호 변경', async () => {
    const passwordData = {
      old_password: 'wrongpassword',
      new_password1: 'newpassword123!',
      new_password2: 'newpassword123!'
    };
    console.log('요청 데이터:', passwordData);
    
    return await axios.post(`${BASE_URL}/users/password/change/`, passwordData);
  });

  console.log(`\n${colors.blue}디버깅 완료!${colors.reset}`);
}

// 실행
axios.get(`${BASE_URL}/health/`)
  .then(() => {
    console.log(`${colors.green}✓ 백엔드 서버 연결 확인${colors.reset}`);
    runDebugTests();
  })
  .catch(() => {
    console.error(`${colors.red}✗ 백엔드 서버에 연결할 수 없습니다.${colors.reset}`);
  });