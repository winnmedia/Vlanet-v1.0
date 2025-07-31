#!/usr/bin/env node
/**
 * 최종 프론트엔드-백엔드 통합 테스트
 * 모든 API 엔드포인트 100% 검증
 */

const axios = require('axios');
const fs = require('fs');

// 백엔드 URL
const API_BASE = 'http://localhost:8000/api';

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

async function runFinalIntegrationTests() {
  console.log('🚀 최종 통합 테스트 - 100% 검증');
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
    
    // 6. 프로젝트 생성 (수정된 형식)
    const projectData = {
      name: `테스트 프로젝트 ${Date.now()}`,
      manager: '홍길동',
      consumer: '테스트 고객사',
      description: '통합 테스트용 프로젝트',
      color: '#1631F8',
      process: [
        {
          name: '기획',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    const createdProject = await testEndpoint('프로젝트 생성', 'POST', '/projects/create/', projectData, authHeaders);
    
    // 7. 피드백 목록 (수정된 경로)
    await testEndpoint('피드백 목록', 'GET', '/feedbacks/', null, authHeaders);
    
    // 8. 알림
    await testEndpoint('알림 목록', 'GET', '/users/notifications/', null, authHeaders);
    
    // 9. 마이페이지
    await testEndpoint('마이페이지', 'GET', '/users/mypage/', null, authHeaders);
    
    // 10. 비디오 기획
    await testEndpoint('비디오 기획 목록', 'GET', '/video-planning/', null, authHeaders);
    
    // 11. 프로젝트별 피드백 (있는 경우)
    if (createdProject && createdProject.project_id) {
      await testEndpoint(
        '프로젝트별 피드백', 
        'GET', 
        `/projects/${createdProject.project_id}/feedback/`, 
        null, 
        authHeaders
      );
    }
    
    // 12. 친구 목록
    await testEndpoint('친구 목록', 'GET', '/users/friends/', null, authHeaders);
    
    // 13. 프레임워크 목록
    await testEndpoint('기획안 프레임워크', 'GET', '/projects/frameworks/', null, authHeaders);
  }
  
  // 결과 요약
  console.log('\n' + '=' * 50);
  console.log('📊 최종 테스트 결과');
  console.log('=' * 50);
  
  const successCount = testResults.filter(r => r.status === 'success').length;
  const failCount = testResults.filter(r => r.status === 'failed').length;
  
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📈 성공률: ${Math.round(successCount / testResults.length * 100)}%`);
  
  // 성공률 100% 체크
  if (successCount === testResults.length) {
    console.log('\n🎉 축하합니다! 모든 테스트가 100% 성공했습니다!');
  } else {
    console.log('\n⚠️ 실패한 테스트:');
    testResults
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`  - ${r.name} (${r.statusCode}): ${r.error}`);
      });
  }
  
  // 상세 결과 저장
  const detailedResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.length,
      success: successCount,
      failed: failCount,
      successRate: Math.round(successCount / testResults.length * 100)
    },
    tests: testResults
  };
  
  fs.writeFileSync(
    'final-test-results.json',
    JSON.stringify(detailedResults, null, 2)
  );
  
  console.log('\n📁 상세 결과가 final-test-results.json에 저장되었습니다.');
}

// 테스트 실행
runFinalIntegrationTests().catch(console.error);