/**
 * axios와 curl 헤더 비교 테스트
 */

const axios = require('axios');
const http = require('http');

// 헤더를 캡처하는 프록시 서버 생성
const proxyServer = http.createServer((req, res) => {
  console.log('\n=== 요청 받음 ===');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log('Headers:');
  Object.entries(req.headers).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // 실제 백엔드로 요청 전달
  const options = {
    hostname: 'localhost',
    port: 8001,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  
  req.pipe(proxyReq, { end: true });
});

// 프록시 서버 시작
const PROXY_PORT = 8002;
proxyServer.listen(PROXY_PORT, () => {
  console.log(`프록시 서버가 포트 ${PROXY_PORT}에서 실행 중...`);
  runTests();
});

async function runTests() {
  // 로그인해서 토큰 받기
  try {
    const loginResponse = await axios.post('http://localhost:8001/api/users/login/', {
      email: 'demo@test.com',
      password: 'demo1234'
    });
    
    const token = loginResponse.data.vridge_session;
    console.log(`\n토큰 획득: ${token.substring(0, 50)}...`);
    
    // axios로 테스트
    console.log('\n### 1. axios 요청 테스트 ###');
    try {
      await axios.get('http://localhost:8002/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.log(`axios 응답: ${error.response?.status} ${error.response?.statusText}`);
    }
    
    // axios 인스턴스로 테스트
    console.log('\n### 2. axios 인스턴스 요청 테스트 ###');
    const api = axios.create({
      baseURL: 'http://localhost:8002',
      timeout: 10000
    });
    
    try {
      await api.get('/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.log(`axios 인스턴스 응답: ${error.response?.status} ${error.response?.statusText}`);
    }
    
    // curl 명령 출력
    console.log('\n### 3. curl 명령 (수동 실행 필요) ###');
    console.log(`curl -X GET http://localhost:8002/api/users/me/ \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -v`);
    
    console.log('\n테스트 완료. Ctrl+C로 종료하세요.');
    
  } catch (error) {
    console.error('로그인 실패:', error.message);
    process.exit(1);
  }
}

// 정리
process.on('SIGINT', () => {
  console.log('\n프록시 서버 종료...');
  proxyServer.close();
  process.exit(0);
});