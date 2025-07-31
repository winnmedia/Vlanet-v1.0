#!/usr/bin/env node
/**
 * 프론트엔드-백엔드 통합 테스트
 * 실제 프론트엔드에서 사용하는 API 호출 테스트
 */

const axios = require('axios');

// 백엔드 URL
const API_BASE = 'http://localhost:8000/api';
const FRONTEND_BASE = 'http://localhost:3000';

// axios 기본 설정
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 테스트 결과 저장
const testResults = [];

async function testEndpoint(name, method, url, data = null, headers = {}) {
  console.log(`\n🔍 테스트: ${name}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const config = { 
      method, 
      url,
      headers: { ...headers }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await api(config);
    
    console.log(`   ✅ 성공 (${response.status})`);
    testResults.push({
      name,
      status: 'success',
      statusCode: response.status,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.message || error.message;
    
    console.log(`   ❌ 실패 (${status}): ${message}`);
    testResults.push({
      name,
      status: 'failed',
      statusCode: status,
      error: message
    });
    
    return null;
  }
}

async function runIntegrationTests() {
  console.log('🚀 프론트엔드-백엔드 통합 테스트 시작');
  console.log('=' * 50);
  
  // 1. 헬스체크
  await testEndpoint('헬스체크', 'GET', '/health/');
  
  // 2. 회원가입 테스트
  const signupData = {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!',
    nickname: `테스터_${Date.now()}`
  };
  
  const signupResult = await testEndpoint('회원가입', 'POST', '/users/signup/', signupData);
  
  // 3. 로그인 테스트
  const loginData = {
    email: 'test@example.com',
    password: 'Test123!'
  };
  
  const loginResult = await testEndpoint('로그인', 'POST', '/users/login/', loginData);
  
  // 토큰 추출
  let authToken = null;
  if (loginResult) {
    authToken = loginResult.vridge_session || loginResult.access;
    console.log(`   🔑 토큰 획득: ${authToken ? '성공' : '실패'}`);
  }
  
  // 인증이 필요한 엔드포인트 테스트
  if (authToken) {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };
    
    // 4. 사용자 정보
    await testEndpoint('사용자 정보', 'GET', '/users/me/', null, authHeaders);
    
    // 5. 프로젝트 목록
    const projects = await testEndpoint('프로젝트 목록', 'GET', '/projects/', null, authHeaders);
    
    // 6. 프로젝트 생성 (POST가 405 오류 반환하므로 create 엔드포인트 확인)
    const projectData = {
      name: `테스트 프로젝트 ${Date.now()}`,
      description: '통합 테스트용 프로젝트',
      genre: '광고'
    };
    
    // create 엔드포인트 시도
    await testEndpoint('프로젝트 생성 (create)', 'POST', '/projects/create/', projectData, authHeaders);
    
    // 7. 피드백 목록 (엔드포인트 확인 필요)
    await testEndpoint('피드백 목록', 'GET', '/feedback/', null, authHeaders);
    
    // 8. 알림
    await testEndpoint('알림 목록', 'GET', '/users/notifications/', null, authHeaders);
    
    // 9. 마이페이지
    await testEndpoint('마이페이지', 'GET', '/users/mypage/', null, authHeaders);
    
    // 10. 비디오 기획
    await testEndpoint('비디오 기획 목록', 'GET', '/video-planning/', null, authHeaders);
  }
  
  // 결과 요약
  console.log('\n' + '=' * 50);
  console.log('📊 테스트 결과 요약');
  console.log('=' * 50);
  
  const successCount = testResults.filter(r => r.status === 'success').length;
  const failCount = testResults.filter(r => r.status === 'failed').length;
  
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📈 성공률: ${Math.round(successCount / testResults.length * 100)}%`);
  
  // 실패한 테스트 상세
  if (failCount > 0) {
    console.log('\n⚠️ 실패한 테스트:');
    testResults
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`  - ${r.name} (${r.statusCode}): ${r.error}`);
      });
  }
  
  // 프론트엔드 연동 가이드
  console.log('\n📝 프론트엔드 연동 가이드:');
  console.log('1. 로그인 응답에서 vridge_session을 access token으로 사용');
  console.log('2. Authorization 헤더에 Bearer 토큰 포함');
  console.log('3. 프로젝트 생성은 /api/projects/create/ 엔드포인트 사용');
  console.log('4. 피드백 API는 /api/feedback/ 경로 확인 필요');
  
  // 결과 저장
  const fs = require('fs');
  fs.writeFileSync(
    'integration-test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  
  console.log('\n✅ 테스트 결과가 integration-test-results.json에 저장되었습니다.');
}

// 테스트 실행
runIntegrationTests().catch(console.error);