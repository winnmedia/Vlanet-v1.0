const axios = require('axios');

// 피드백 페이지 헬스 체크
async function checkFeedbackPage() {
  const API_URL = process.env.API_URL || 'http://localhost:3001';
  const PROJECT_ID = 1014; // 테스트 프로젝트 ID
  
  console.log('\n=== 피드백 페이지 헬스 체크 시작 ===');
  console.log(`API URL: ${API_URL}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // 1. 페이지 로드 테스트
  try {
    console.log('\n1. 피드백 페이지 로드 테스트...');
    const response = await axios.get(`${API_URL}/feedback/${PROJECT_ID}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log('✅ 페이지 로드 성공');
      results.passed++;
      
      // HTML 내용 확인
      const html = response.data;
      if (html.includes('<!DOCTYPE html>')) {
        console.log('✅ 유효한 HTML 문서');
        results.passed++;
      } else {
        console.log('❌ 유효하지 않은 HTML 문서');
        results.failed++;
        results.errors.push('Invalid HTML document');
      }
      
      // 에러 메시지 확인
      if (html.includes('Error') || html.includes('error')) {
        console.log('⚠️  페이지에 에러 메시지 포함');
        const errorMatch = html.match(/error[^<]*/gi);
        if (errorMatch) {
          console.log('   발견된 에러:', errorMatch[0].substring(0, 100));
        }
      }
      
      // localStorage 관련 에러 확인
      if (html.includes('localStorage is not defined')) {
        console.log('❌ localStorage SSR 에러 발견');
        results.failed++;
        results.errors.push('localStorage SSR error');
      } else {
        console.log('✅ localStorage SSR 에러 없음');
        results.passed++;
      }
      
    } else {
      console.log(`❌ 페이지 로드 실패: ${response.status} ${response.statusText}`);
      results.failed++;
      results.errors.push(`Page load failed: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ 페이지 로드 에러:', error.message);
    results.failed++;
    results.errors.push(`Page load error: ${error.message}`);
  }
  
  // 2. 정적 리소스 확인
  try {
    console.log('\n2. 정적 리소스 확인...');
    const staticResources = [
      '/_next/static/chunks/main.js',
      '/_next/static/chunks/webpack.js',
      '/_next/static/chunks/framework.js'
    ];
    
    for (const resource of staticResources) {
      try {
        const response = await axios.head(`${API_URL}${resource}`, {
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          console.log(`✅ ${resource} - OK`);
          results.passed++;
        } else {
          console.log(`❌ ${resource} - ${response.status}`);
          results.failed++;
          results.errors.push(`Static resource failed: ${resource}`);
        }
      } catch (error) {
        console.log(`❌ ${resource} - 에러: ${error.message}`);
        results.failed++;
        results.errors.push(`Static resource error: ${resource}`);
      }
    }
  } catch (error) {
    console.log('❌ 정적 리소스 확인 에러:', error.message);
    results.failed++;
  }
  
  // 3. API 엔드포인트 확인 (백엔드가 실행 중인 경우)
  try {
    console.log('\n3. API 엔드포인트 확인...');
    const apiResponse = await axios.get('http://localhost:8000/api/health/', {
      validateStatus: () => true,
      timeout: 5000
    });
    
    if (apiResponse.status === 200) {
      console.log('✅ 백엔드 API 정상 작동');
      results.passed++;
    } else {
      console.log(`⚠️  백엔드 API 응답: ${apiResponse.status}`);
    }
  } catch (error) {
    console.log('⚠️  백엔드 API 연결 불가 (백엔드가 실행 중이 아닐 수 있음)');
  }
  
  // 결과 요약
  console.log('\n=== 헬스 체크 결과 ===');
  console.log(`✅ 통과: ${results.passed}`);
  console.log(`❌ 실패: ${results.failed}`);
  console.log(`총 테스트: ${results.passed + results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n발견된 오류:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 모든 테스트 통과! 피드백 페이지가 정상적으로 작동합니다.');
  } else {
    console.log('\n⚠️  일부 테스트 실패. 위의 오류를 확인해주세요.');
  }
  
  return results;
}

// 실행
checkFeedbackPage().catch(console.error);