#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:8000';
const TEST_USER = {
  email: 'test@test.com',
  password: 'password123'
};

async function testLoginFlow() {
  console.log('=== 로그인 플로우 테스트 시작 ===\n');
  
  try {
    // 1. 로그인 테스트
    console.log('1. 로그인 시도...');
    const loginResponse = await axios.post(`${API_URL}/api/users/login/`, TEST_USER);
    
    if (loginResponse.data && loginResponse.data.vridge_session) {
      console.log('✅ 로그인 성공!');
      console.log('- Access Token:', loginResponse.data.vridge_session.substring(0, 50) + '...');
      console.log('- User:', loginResponse.data.user);
      
      const token = loginResponse.data.vridge_session;
      
      // 2. 프로젝트 목록 요청
      console.log('\n2. 프로젝트 목록 요청...');
      const projectsResponse = await axios.get(`${API_URL}/api/projects/project_list/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ 프로젝트 목록 조회 성공!');
      console.log(`- 총 ${projectsResponse.data.result.length}개의 프로젝트`);
      
      // 3. 첫 번째 프로젝트 상세 조회
      if (projectsResponse.data.result.length > 0) {
        const firstProject = projectsResponse.data.result[0];
        console.log(`\n3. 프로젝트 상세 조회 (ID: ${firstProject.id})...`);
        
        const detailResponse = await axios.get(`${API_URL}/api/projects/detail/${firstProject.id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ 프로젝트 상세 조회 성공!');
        console.log('- 프로젝트명:', detailResponse.data.result.name);
        console.log('- 설명:', detailResponse.data.result.description);
      }
      
    } else {
      console.log('❌ 로그인 실패: 토큰이 반환되지 않았습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.response?.data || error.message);
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- URL:', error.config.url);
    }
  }
  
  console.log('\n=== 테스트 완료 ===');
}

// 스크립트 실행
testLoginFlow();