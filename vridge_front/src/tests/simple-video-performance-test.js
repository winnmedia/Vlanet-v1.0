#!/usr/bin/env node

/**
 * 간단한 비디오 플레이어 성능 테스트
 * axios를 사용한 API 직접 호출 방식
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 환경 설정
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const PROJECT_ID = process.env.PROJECT_ID || '104';

// 성능 측정 함수
async function measureAPIPerformance() {
  console.log('🚀 비디오 플레이어 API 성능 테스트\n');
  console.log(`백엔드 URL: ${BACKEND_URL}`);
  console.log(`프로젝트 ID: ${PROJECT_ID}\n`);

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // 1. 피드백 API 응답 시간 측정
    console.log('1️⃣ 피드백 API 테스트...');
    const feedbackStart = Date.now();
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/projects/${PROJECT_ID}/feedback/`, {
        headers: {
          'Authorization': 'Bearer ' + (process.env.AUTH_TOKEN || '')
        },
        timeout: 10000
      });
      
      const feedbackTime = Date.now() - feedbackStart;
      console.log(`✅ 피드백 API 응답 시간: ${feedbackTime}ms`);
      
      if (response.data.result && response.data.result.files) {
        console.log(`✅ 비디오 URL: ${response.data.result.files}`);
        results.tests.push({
          name: 'Feedback API',
          status: 'success',
          responseTime: feedbackTime,
          videoUrl: response.data.result.files
        });
      } else {
        console.log('⚠️ 비디오 파일이 없습니다');
        results.tests.push({
          name: 'Feedback API',
          status: 'no_video',
          responseTime: feedbackTime
        });
      }
    } catch (error) {
      console.error(`❌ 피드백 API 오류: ${error.message}`);
      results.tests.push({
        name: 'Feedback API',
        status: 'error',
        error: error.message
      });
    }

    // 2. 인코딩 상태 API 테스트
    console.log('\n2️⃣ 인코딩 상태 API 테스트...');
    const encodingStart = Date.now();
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/projects/${PROJECT_ID}/feedback/encoding-status/`, {
        headers: {
          'Authorization': 'Bearer ' + (process.env.AUTH_TOKEN || '')
        },
        timeout: 10000
      });
      
      const encodingTime = Date.now() - encodingStart;
      console.log(`✅ 인코딩 상태 API 응답 시간: ${encodingTime}ms`);
      console.log(`✅ 인코딩 상태: ${response.data.encoding_status || 'none'}`);
      
      results.tests.push({
        name: 'Encoding Status API',
        status: 'success',
        responseTime: encodingTime,
        encodingStatus: response.data.encoding_status
      });
    } catch (error) {
      console.error(`❌ 인코딩 상태 API 오류: ${error.message}`);
      results.tests.push({
        name: 'Encoding Status API',
        status: 'error',
        error: error.message
      });
    }

    // 3. 헬스체크 API 테스트
    console.log('\n3️⃣ 헬스체크 API 테스트...');
    const healthStart = Date.now();
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/health/`, {
        timeout: 5000
      });
      
      const healthTime = Date.now() - healthStart;
      console.log(`✅ 헬스체크 API 응답 시간: ${healthTime}ms`);
      
      results.tests.push({
        name: 'Health Check API',
        status: 'success',
        responseTime: healthTime
      });
    } catch (error) {
      console.error(`❌ 헬스체크 API 오류: ${error.message}`);
      results.tests.push({
        name: 'Health Check API',
        status: 'error',
        error: error.message
      });
    }

    // 4. 성능 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 성능 테스트 결과 요약');
    console.log('='.repeat(50));
    
    const successfulTests = results.tests.filter(t => t.status === 'success');
    const avgResponseTime = successfulTests.length > 0
      ? successfulTests.reduce((sum, t) => sum + t.responseTime, 0) / successfulTests.length
      : 0;
    
    console.log(`\n✅ 성공한 테스트: ${successfulTests.length}/${results.tests.length}`);
    console.log(`⏱️ 평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`);
    
    // 성능 등급
    let grade = 'A';
    if (avgResponseTime > 500) grade = 'B';
    if (avgResponseTime > 1000) grade = 'C';
    if (avgResponseTime > 2000) grade = 'D';
    if (successfulTests.length < results.tests.length) grade = 'F';
    
    console.log(`🏆 성능 등급: ${grade}`);
    
    results.summary = {
      totalTests: results.tests.length,
      successfulTests: successfulTests.length,
      avgResponseTime,
      grade
    };

    // 결과 저장
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const resultPath = path.join(__dirname, `api-performance-${timestamp}.json`);
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 결과 저장됨: ${resultPath}`);

  } catch (error) {
    console.error('\n❌ 테스트 실행 중 오류:', error);
  }
}

// 프론트엔드 성능 측정 스크립트 생성
function generateFrontendPerformanceScript() {
  const script = `
// 이 스크립트를 브라우저 콘솔에서 실행하세요
// 피드백 페이지에서 실행해야 합니다

(function() {
  console.log('🚀 비디오 플레이어 성능 측정 시작...');
  
  const video = document.querySelector('video');
  if (!video) {
    console.error('❌ 비디오 요소를 찾을 수 없습니다');
    return;
  }

  // 1. 현재 상태 확인
  console.log('\\n📊 비디오 정보:');
  console.log('- URL:', video.src);
  console.log('- 길이:', video.duration, '초');
  console.log('- 해상도:', video.videoWidth + 'x' + video.videoHeight);
  console.log('- 현재 시간:', video.currentTime, '초');
  console.log('- 버퍼 상태:', video.buffered.length, '개 세그먼트');
  console.log('- 준비 상태:', ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][video.readyState]);

  // 2. 시크 성능 테스트
  console.log('\\n⏱️ 시크 성능 테스트 시작...');
  const testSeek = (position) => {
    return new Promise(resolve => {
      const startTime = performance.now();
      const targetTime = video.duration * position;
      
      const onSeeked = () => {
        const endTime = performance.now();
        video.removeEventListener('seeked', onSeeked);
        resolve({
          position: position * 100 + '%',
          time: (endTime - startTime).toFixed(2) + 'ms'
        });
      };
      
      video.addEventListener('seeked', onSeeked);
      video.currentTime = targetTime;
    });
  };

  // 여러 위치로 시크 테스트
  Promise.all([
    testSeek(0.25),
    testSeek(0.5),
    testSeek(0.75)
  ]).then(results => {
    console.log('\\n📊 시크 테스트 결과:');
    results.forEach(r => console.log('- ' + r.position + ':', r.time));
  });

  // 3. 메모리 사용량
  if (performance.memory) {
    console.log('\\n💾 메모리 사용량:');
    console.log('- 사용 중:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB');
    console.log('- 전체 힙:', (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB');
    console.log('- 제한:', (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB');
  }

  // 4. 버튼 테스트
  console.log('\\n🔘 버튼 기능 테스트...');
  const feedbackBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('현재 시점에 피드백'));
  if (feedbackBtn) {
    console.log('✅ "현재 시점에 피드백" 버튼 발견');
    // 클릭 시뮬레이션 (실제로 클릭하지 않음)
    console.log('- 현재 재생 시간:', video.currentTime.toFixed(2) + '초');
    const minutes = Math.floor(video.currentTime / 60);
    const seconds = Math.floor(video.currentTime % 60);
    console.log('- 피드백 시간 형식:', minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'));
  }

  console.log('\\n✅ 성능 측정 완료!');
})();
`;

  const scriptPath = path.join(__dirname, 'browser-performance-test.js');
  fs.writeFileSync(scriptPath, script);
  console.log(`\n📝 브라우저 테스트 스크립트 생성됨: ${scriptPath}`);
  console.log('브라우저 콘솔에서 이 스크립트를 실행하세요.');
}

// 메인 실행
async function main() {
  console.log('비디오 플레이어 성능 테스트\n');
  console.log('1. API 성능 테스트');
  console.log('2. 브라우저 성능 테스트 스크립트 생성');
  console.log('3. 모두 실행\n');

  const args = process.argv.slice(2);
  const option = args[0] || '3';

  switch (option) {
    case '1':
      await measureAPIPerformance();
      break;
    case '2':
      generateFrontendPerformanceScript();
      break;
    case '3':
    default:
      await measureAPIPerformance();
      generateFrontendPerformanceScript();
      break;
  }
}

main().catch(console.error);