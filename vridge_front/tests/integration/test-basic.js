const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testBasicPages() {
  console.log('Next.js 기본 페이지 테스트 시작...\n');
  
  const pages = [
    { url: '/', name: '홈페이지' },
    { url: '/login', name: '로그인 페이지' },
    { url: '/signup', name: '회원가입 페이지' },
    { url: '/cmshome', name: '대시보드' }
  ];
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${API_URL}${page.url}`);
      console.log(`✅ ${page.name}: OK (${response.status})`);
    } catch (error) {
      console.log(`❌ ${page.name}: 오류 - ${error.message}`);
    }
  }
}

testBasicPages().catch(console.error);