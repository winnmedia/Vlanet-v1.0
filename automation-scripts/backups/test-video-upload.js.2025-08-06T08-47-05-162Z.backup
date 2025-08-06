// 비디오 업로드 API 테스트
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// API 기본 URL
const API_BASE_URL = 'http://localhost:8000';

// 테스트 토큰 (실제로는 로그인 후 받은 토큰 사용)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzA5NDQwNjU4LCJpYXQiOjE3MDgxNDQ2NTgsImp0aSI6IjAzZWU0NWYxNDVjMzRlNmM5NWJlMWQ2YWM3MDliNDcxIiwidXNlcl9pZCI6MX0.DF4UD2tgCQBJqBBUTTg5Pjo3HMoL3sSCLO0QoJGXCHw';

// 테스트 프로젝트 ID
const TEST_PROJECT_ID = 1;

// 색상 코드
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

// API URL 테스트
async function testAPIEndpoints() {
  console.log(`${COLORS.BLUE}=== API 엔드포인트 테스트 ===${COLORS.RESET}\n`);
  
  const endpoints = [
    { method: 'GET', url: '/api/', description: '기본 API 상태' },
    { method: 'GET', url: '/api/projects/', description: '프로젝트 목록' },
    { method: 'GET', url: `/api/projects/${TEST_PROJECT_ID}/`, description: '프로젝트 상세' },
    { method: 'GET', url: `/api/projects/${TEST_PROJECT_ID}/feedback/`, description: '피드백 조회' },
    { method: 'POST', url: `/api/projects/${TEST_PROJECT_ID}/feedback/upload/`, description: '피드백 업로드 (POST)' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`${COLORS.YELLOW}테스트: ${endpoint.description}${COLORS.RESET}`);
      console.log(`URL: ${API_BASE_URL}${endpoint.url}`);
      
      const config = {
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.url}`,
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      };
      
      if (endpoint.method === 'POST') {
        // POST 요청인 경우 빈 FormData 전송
        const formData = new FormData();
        config.data = formData;
        config.headers = {
          ...config.headers,
          ...formData.getHeaders()
        };
      }
      
      const response = await axios(config);
      console.log(`${COLORS.GREEN}✓ 성공: 상태 코드 ${response.status}${COLORS.RESET}`);
      console.log(`응답:`, response.data);
    } catch (error) {
      if (error.response) {
        console.log(`${COLORS.RED}✗ 실패: 상태 코드 ${error.response.status}${COLORS.RESET}`);
        console.log(`오류 메시지:`, error.response.data);
      } else {
        console.log(`${COLORS.RED}✗ 연결 실패: ${error.message}${COLORS.RESET}`);
      }
    }
    console.log('---\n');
  }
}

// 실제 파일 업로드 테스트
async function testFileUpload() {
  console.log(`${COLORS.BLUE}=== 파일 업로드 테스트 ===${COLORS.RESET}\n`);
  
  try {
    // 테스트 파일 생성
    const testFilePath = path.join(__dirname, 'test-video.txt');
    fs.writeFileSync(testFilePath, 'This is a test video file');
    
    // FormData 생성
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), 'test-video.mp4');
    
    console.log(`${COLORS.YELLOW}업로드 URL: ${API_BASE_URL}/api/projects/${TEST_PROJECT_ID}/feedback/upload/${COLORS.RESET}`);
    
    // 업로드 요청
    const response = await axios.post(
      `${API_BASE_URL}/api/projects/${TEST_PROJECT_ID}/feedback/upload/`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log(`${COLORS.GREEN}✓ 업로드 성공!${COLORS.RESET}`);
    console.log('응답:', response.data);
    
    // 테스트 파일 삭제
    fs.unlinkSync(testFilePath);
  } catch (error) {
    if (error.response) {
      console.log(`${COLORS.RED}✗ 업로드 실패: 상태 코드 ${error.response.status}${COLORS.RESET}`);
      console.log('오류 응답:', error.response.data);
      console.log('오류 헤더:', error.response.headers);
    } else {
      console.log(`${COLORS.RED}✗ 연결 실패: ${error.message}${COLORS.RESET}`);
    }
  }
}

// Django URL 패턴 확인
async function checkDjangoUrls() {
  console.log(`${COLORS.BLUE}=== Django URL 패턴 확인 ===${COLORS.RESET}\n`);
  
  try {
    // Django 디버그 페이지 또는 404 페이지에서 URL 패턴 확인
    const response = await axios.get(`${API_BASE_URL}/api/projects/999999/feedback/upload/`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('404 응답 HTML:');
      console.log(error.response.data.substring(0, 500) + '...');
    }
  }
}

// 메인 실행 함수
async function main() {
  console.log(`${COLORS.BLUE}VideoPlanet 비디오 업로드 API 테스트${COLORS.RESET}\n`);
  
  // 1. API 엔드포인트 테스트
  await testAPIEndpoints();
  
  // 2. 실제 파일 업로드 테스트
  await testFileUpload();
  
  // 3. Django URL 패턴 확인
  await checkDjangoUrls();
  
  console.log(`\n${COLORS.BLUE}테스트 완료${COLORS.RESET}`);
  
  // 로그인 방법 안내
  console.log(`\n${COLORS.YELLOW}💡 팁: 실제 토큰을 얻으려면:${COLORS.RESET}`);
  console.log('1. 브라우저에서 http://localhost:3000/login 접속');
  console.log('2. 테스트 계정으로 로그인: admin / admin1234');
  console.log('3. 개발자 도구 > Application > Local Storage > VGID 값 복사');
  console.log('4. 이 스크립트의 TEST_TOKEN 변수에 붙여넣기\n');
}

// 실행
main().catch(console.error);