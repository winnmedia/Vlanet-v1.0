// 프론트엔드 설정 확인 스크립트
const axios = require('axios');

async function checkFrontendConfig() {
  console.log('=== 프론트엔드 설정 확인 ===\n');
  
  // 환경변수 확인
  console.log('1. 환경변수:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('   REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  
  // 포트별 서버 확인
  console.log('\n2. 서버 상태:');
  
  // 3000 포트 확인
  try {
    const res3000 = await axios.get('http://localhost:3000/', { 
      validateStatus: () => true,
      timeout: 3000 
    });
    console.log('   포트 3000: 응답 코드', res3000.status);
  } catch (e) {
    console.log('   포트 3000: 접속 불가');
  }
  
  // 3003 포트 확인
  try {
    const res3003 = await axios.get('http://localhost:3003/', { 
      validateStatus: () => true,
      timeout: 3000 
    });
    console.log('   포트 3003: 응답 코드', res3003.status);
  } catch (e) {
    console.log('   포트 3003: 접속 불가');
  }
  
  // 8000 포트 백엔드 확인
  try {
    const res8000 = await axios.get('http://localhost:8000/api/health/', { 
      validateStatus: () => true,
      timeout: 3000 
    });
    console.log('   포트 8000 (백엔드): 응답 코드', res8000.status);
  } catch (e) {
    console.log('   포트 8000 (백엔드): 접속 불가');
  }
  
  console.log('\n3. 브라우저에서 확인 방법:');
  console.log('   1) http://localhost:3000/login 또는 http://localhost:3003/login 접속');
  console.log('   2) F12로 개발자 도구 열기');
  console.log('   3) Network 탭 선택');
  console.log('   4) 로그인 시도 (test@example.com / test1234)');
  console.log('   5) "login" 요청 찾아서 클릭');
  console.log('   6) Request URL 확인 - localhost:8000을 가리키는지 확인');
  console.log('   7) Response 탭에서 에러 메시지 확인');
  
  console.log('\n4. axios 기본 설정:');
  console.log('   baseURL:', axios.defaults.baseURL || '설정 안됨');
}

checkFrontendConfig();