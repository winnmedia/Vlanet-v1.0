/**
 * 최종 100% 안정성 테스트
 * 테스트 계정으로 전체 플로우 검증
 */

const axios = require('axios');

const CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:8001',
  TEST_USER: {
    username: 'test@test.com',
    password: 'Test1234!',
  }
};

async function testLogin() {
  console.log('🔐 로그인 테스트...');
  
  try {
    const response = await axios.post(`${CONFIG.API_URL}/users/login/`, {
      username: CONFIG.TEST_USER.username,
      password: CONFIG.TEST_USER.password,
    });
    
    console.log('✅ 로그인 성공!');
    console.log('   - Access Token:', response.data.access?.substring(0, 20) + '...');
    console.log('   - User:', response.data.user?.nickname);
    
    return response.data.access;
  } catch (error) {
    console.error('❌ 로그인 실패:', error.response?.data || error.message);
    return null;
  }
}

async function testAuthenticatedRequest(token) {
  console.log('\n🔑 인증된 요청 테스트...');
  
  try {
    const response = await axios.get(`${CONFIG.API_URL}/users/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 인증된 요청 성공!');
    console.log('   - User ID:', response.data.id);
    console.log('   - Email:', response.data.email);
    console.log('   - Nickname:', response.data.nickname);
    
    return true;
  } catch (error) {
    console.error('❌ 인증된 요청 실패:', error.response?.data || error.message);
    return false;
  }
}

async function testAPIEndpoints(token) {
  console.log('\n📡 API 엔드포인트 테스트...');
  
  const endpoints = [
    { name: 'Projects', url: '/api/projects/' },
    { name: 'Feedbacks', url: '/api/feedbacks/' },
    { name: 'Health', url: '/api/health/' },
    { name: 'Version', url: '/api/version/' },
    { name: 'Migrations', url: '/api/system/migrations/' },
  ];
  
  let passed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${CONFIG.API_URL}${endpoint.url}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        validateStatus: (status) => status < 500,
      });
      
      if (response.status < 400) {
        console.log(`✅ ${endpoint.name}: ${response.status}`);
        passed++;
      } else {
        console.log(`⚠️  ${endpoint.name}: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
  
  return passed;
}

async function main() {
  console.log('🚀 VideoPlanet 최종 안정성 테스트');
  console.log('================================\n');
  
  // 1. 로그인 테스트
  const token = await testLogin();
  
  if (!token) {
    console.log('\n⚠️  로그인 실패로 인증 테스트 중단');
  } else {
    // 2. 인증된 요청 테스트
    await testAuthenticatedRequest(token);
  }
  
  // 3. API 엔드포인트 테스트
  const passedEndpoints = await testAPIEndpoints(token);
  
  // 4. 최종 점수 계산
  console.log('\n================================');
  console.log('📊 최종 결과\n');
  
  const totalTests = 7; // 로그인 + 인증 요청 + 5개 엔드포인트
  const passedTests = (token ? 2 : 0) + passedEndpoints;
  const score = Math.round((passedTests / totalTests) * 100);
  
  console.log(`🎯 안정성 점수: ${score}%`);
  console.log(`✅ 통과: ${passedTests}/${totalTests}`);
  
  if (score === 100) {
    console.log('\n🎉 축하합니다! 100% 안정성 달성!');
  } else {
    console.log(`\n📈 100% 달성까지 ${100 - score}% 개선 필요`);
  }
}

main().catch(console.error);