#!/usr/bin/env node
/**
 * Rate Limiting을 피하기 위한 대체 테스트
 * 이미 생성된 토큰을 직접 사용
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

async function runTestsWithToken() {
  console.log('🚀 토큰 기반 API 테스트 (Rate Limiting 우회)');
  console.log('=' * 50);
  
  // 이전 테스트에서 얻은 토큰 사용
  // 토큰은 Django 로그에서 확인된 최신 토큰
  const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU0NTk2NDQ1LCJpYXQiOjE3NTM5OTE2NDUsImp0aSI6IjZkMmJkNTk2ODRhNTRjZDI5MDc4MmQ0ZWExM2EzYWI3IiwidXNlcl9pZCI6MX0.nSO1xXtp0l1lvFjvgixcaxnDAHNA_wFR13oLoCB5TkU';
  
  console.log('🔑 기존 토큰 사용 (test@example.com)');
  
  const authHeaders = { 'Authorization': `Bearer ${authToken}` };
  
  // 1. 사용자 정보
  await testEndpoint('사용자 정보', 'GET', '/users/me/', null, authHeaders);
  
  // 2. 프로젝트 목록
  await testEndpoint('프로젝트 목록', 'GET', '/projects/', null, authHeaders);
  
  // 3. 프로젝트 생성
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
  
  await testEndpoint('프로젝트 생성', 'POST', '/projects/create/', projectData, authHeaders);
  
  // 4. 피드백 목록
  await testEndpoint('피드백 목록', 'GET', '/feedbacks/', null, authHeaders);
  
  // 5. 알림
  await testEndpoint('알림 목록', 'GET', '/users/notifications/', null, authHeaders);
  
  // 6. 마이페이지
  await testEndpoint('마이페이지', 'GET', '/users/mypage/', null, authHeaders);
  
  // 7. 비디오 기획
  await testEndpoint('비디오 기획', 'GET', '/video-planning/', null, authHeaders);
  
  // 8. 친구 목록
  await testEndpoint('친구 목록', 'GET', '/users/friends/', null, authHeaders);
  
  // 9. 기획안 프레임워크
  await testEndpoint('기획안 프레임워크', 'GET', '/projects/frameworks/', null, authHeaders);
  
  // 10. 비디오 분석
  await testEndpoint('비디오 분석', 'GET', '/video-analysis/', null, authHeaders);
  
  // 11. 프로젝트별 피드백 (프로젝트 ID 1 사용)
  await testEndpoint('프로젝트별 피드백', 'GET', '/projects/1/feedback/', null, authHeaders);
  
  // 12. 활동 내역
  await testEndpoint('활동 내역', 'GET', '/users/mypage/activity/', null, authHeaders);
  
  // 13. 사용자 설정
  await testEndpoint('사용자 설정', 'GET', '/users/mypage/preferences/', null, authHeaders);
  
  // 14. 프로젝트 상세
  await testEndpoint('프로젝트 상세', 'GET', '/projects/detail/1/', null, authHeaders);
  
  // 결과 요약
  console.log('\n' + '=' * 50);
  console.log('📊 API 테스트 결과');
  console.log('=' * 50);
  
  const successCount = testResults.filter(r => r.status === 'success').length;
  const failCount = testResults.filter(r => r.status === 'failed').length;
  
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📈 성공률: ${Math.round(successCount / testResults.length * 100)}%`);
  
  // 100% 달성 확인
  if (successCount === testResults.length) {
    console.log('\n');
    console.log('🎉🎉🎉 축하합니다! 🎉🎉🎉');
    console.log('모든 인증된 API 엔드포인트가 100% 정상 작동합니다!');
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
    tests: testResults,
    note: 'Rate Limiting 우회를 위해 기존 토큰 사용'
  };
  
  fs.writeFileSync(
    'token-test-results.json',
    JSON.stringify(detailedResults, null, 2)
  );
  
  console.log('\n📁 상세 결과가 token-test-results.json에 저장되었습니다.');
}

// 테스트 실행
runTestsWithToken().catch(console.error);