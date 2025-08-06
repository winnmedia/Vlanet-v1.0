const axios = require('axios');

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';
const MCP_URL = 'http://localhost:3001';

async function runTests() {
  const results = {
    frontend: { total: 0, passed: 0 },
    backend: { total: 0, passed: 0 },
    mcp: { total: 0, passed: 0 },
    integration: { total: 0, passed: 0 }
  };

  console.log('🎯 VideoPlanet 최종 통합 테스트');
  console.log('='.repeat(60));
  
  // Frontend Tests
  console.log('\n📱 프론트엔드 테스트');
  const frontendPages = [
    { name: '홈페이지', url: '/' },
    { name: '로그인', url: '/user/Login' },
    { name: '회원가입', url: '/user/SignUp' },
    { name: '프로젝트 목록', url: '/cms/Home' },
    { name: '영상 기획', url: '/cms/Planning' }
  ];
  
  for (const page of frontendPages) {
    results.frontend.total++;
    try {
      const res = await axios.get(FRONTEND_URL + page.url);
      if (res.status === 200) {
        console.log(`✅ ${page.name}: OK`);
        results.frontend.passed++;
      }
    } catch (error) {
      console.log(`❌ ${page.name}: ${error.message}`);
    }
  }
  
  // Backend Tests
  console.log('\n🔧 백엔드 API 테스트');
  results.backend.total++;
  try {
    const res = await axios.get(BACKEND_URL + '/api/health/');
    if (res.status === 200) {
      console.log('✅ 헬스체크: OK');
      results.backend.passed++;
    }
  } catch (error) {
    console.log('❌ 헬스체크:', error.message);
  }
  
  // Login Test
  results.backend.total++;
  try {
    const res = await axios.post(BACKEND_URL + '/api/users/login/', {
      email: 'demo@test.com',
      password: 'demo1234'
    });
    if (res.data.vridge_session) {
      console.log('✅ 로그인 API: OK');
      results.backend.passed++;
    }
  } catch (error) {
    console.log('❌ 로그인 API:', error.response?.data?.message || error.message);
  }
  
  // MCP Tests
  console.log('\n🤖 MCP 에이전트 시스템');
  results.mcp.total++;
  try {
    const res = await axios.get(MCP_URL + '/api/agents');
    console.log(`✅ 에이전트 시스템: ${res.data.agents.length}개 에이전트 활성`);
    results.mcp.passed++;
  } catch (error) {
    console.log('❌ 에이전트 시스템:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));
  
  const totalTests = results.frontend.total + results.backend.total + results.mcp.total;
  const totalPassed = results.frontend.passed + results.backend.passed + results.mcp.passed;
  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`프론트엔드: ${results.frontend.passed}/${results.frontend.total} (${(results.frontend.passed/results.frontend.total*100).toFixed(0)}%)`);
  console.log(`백엔드: ${results.backend.passed}/${results.backend.total} (${(results.backend.passed/results.backend.total*100).toFixed(0)}%)`);
  console.log(`MCP: ${results.mcp.passed}/${results.mcp.total} (${(results.mcp.passed/results.mcp.total*100).toFixed(0)}%)`);
  console.log(`\n전체 성공률: ${successRate}% (${totalPassed}/${totalTests})`);
  
  if (successRate >= 80) {
    console.log('\n✨ 시스템 정상 작동 확인!');
  } else if (successRate >= 60) {
    console.log('\n⚠️ 일부 기능 개선 필요');
  } else {
    console.log('\n❌ 주요 기능 복구 필요');
  }
}

runTests().catch(console.error);