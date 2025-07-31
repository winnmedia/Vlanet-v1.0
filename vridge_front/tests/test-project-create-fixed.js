#!/usr/bin/env node
/**
 * 프로젝트 생성 API 수정 테스트
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

// axios 기본 설정
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testProjectCreate() {
  console.log('🚀 프로젝트 생성 API 테스트');
  console.log('=' * 50);
  
  // 1. 로그인
  const loginData = {
    email: 'test@example.com',
    password: 'Test123!'
  };
  
  try {
    const loginResponse = await api.post('/users/login/', loginData);
    const token = loginResponse.data.vridge_session;
    console.log('✅ 로그인 성공');
    
    // 2. 프로젝트 생성 - 올바른 형식
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
        },
        {
          name: '촬영',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    console.log('\n📝 프로젝트 생성 요청 데이터:');
    console.log(JSON.stringify(projectData, null, 2));
    
    const createResponse = await api.post('/projects/create/', projectData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ 프로젝트 생성 성공!');
    console.log('응답:', createResponse.data);
    
    // 3. 생성된 프로젝트 확인
    const projectsResponse = await api.get('/projects/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\n📋 프로젝트 목록:');
    const projects = projectsResponse.data;
    console.log(`총 ${projects.length}개의 프로젝트`);
    
    // 가장 최근 프로젝트 표시
    if (projects.length > 0) {
      const latestProject = projects[projects.length - 1];
      console.log('\n🆕 가장 최근 프로젝트:');
      console.log(`- 이름: ${latestProject.name}`);
      console.log(`- ID: ${latestProject.id}`);
      console.log(`- 생성일: ${latestProject.created_at}`);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('\n오류 상세:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 테스트 실행
testProjectCreate().catch(console.error);