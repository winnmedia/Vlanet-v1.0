const axios = require('axios');

// API 기본 URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://videoplanet.up.railway.app';

// 로그인하고 토큰 받기
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/login/`, {
      email: 'testuser1@example.com',
      password: 'testpass123'
    });
    
    if (response.data.status === 'success') {
      return response.data.token;
    }
    throw new Error('Login failed');
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
}

// 최근 기획 목록 테스트
async function testRecentPlannings(token) {
  try {
    console.log('\n=== Testing Recent Plannings API ===');
    
    const response = await axios.get(`${API_BASE_URL}/api/video-planning/recent/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Success! Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data.planning_logs) {
      console.log(`\nFound ${response.data.data.planning_logs.length} recent plannings`);
      response.data.data.planning_logs.forEach((planning, index) => {
        console.log(`${index + 1}. ${planning.title} (Created: ${planning.created_at})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error calling recent plannings:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 메인 테스트 함수
async function runTest() {
  try {
    console.log('Starting recent plannings test...');
    
    // 로그인
    console.log('\n1. Logging in...');
    const token = await login();
    console.log('Login successful! Token received.');
    
    // 최근 기획 테스트
    console.log('\n2. Testing recent plannings endpoint...');
    const success = await testRecentPlannings(token);
    
    if (success) {
      console.log('\n✅ Recent plannings test PASSED!');
    } else {
      console.log('\n❌ Recent plannings test FAILED!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// 테스트 실행
runTest();