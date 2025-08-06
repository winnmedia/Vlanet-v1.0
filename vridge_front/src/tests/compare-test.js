/**
 * 두 테스트 방식 비교
 */

const axios = require('axios');

async function test() {
  // 로그인
  const loginResponse = await axios.post('http://localhost:8001/api/users/login/', {
    email: 'demo@test.com',
    password: 'demo1234'
  });
  
  const token = loginResponse.data.vridge_session;
  console.log('토큰:', token.substring(0, 50) + '...');
  
  // 1. 직접 axios 사용 (simple-jwt-test.js 방식)
  console.log('\n1. 직접 axios 사용:');
  try {
    const response1 = await axios.get('http://localhost:8001/api/users/me/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 성공:', response1.data.email);
  } catch (error) {
    console.log('❌ 실패:', error.response?.data);
  }
  
  // 2. axios 인스턴스 사용 (working-feature-test.js 방식)
  console.log('\n2. axios 인스턴스 사용:');
  const api = axios.create({
    baseURL: 'http://localhost:8001',
    timeout: 10000
  });
  
  try {
    const fullUrl = 'http://localhost:8001/api/users/me/';
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    const response2 = await axios.get(fullUrl, config);
    console.log('✅ 성공:', response2.data.email);
  } catch (error) {
    console.log('❌ 실패:', error.response?.data);
  }
  
  // 3. axios.get의 세 번째 파라미터 문제 확인
  console.log('\n3. axios.get 파라미터 테스트:');
  try {
    // axios.get(url, data, config) - 잘못된 방식
    const response3 = await axios.get('http://localhost:8001/api/users/me/', null, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 성공:', response3.data.email);
  } catch (error) {
    console.log('❌ 실패:', error.response?.data);
  }
}

test().catch(console.error);