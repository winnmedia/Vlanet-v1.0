#!/usr/bin/env node

/**
 * 비디오 플레이어 성능 테스트
 * 
 * 테스트 항목:
 * 1. 비디오 로딩 시간
 * 2. 버퍼링 성능
 * 3. 시크(탐색) 성능
 * 4. 메모리 사용량
 * 5. 다양한 비디오 포맷 지원
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 테스트 설정
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || '104';
const TEST_EMAIL = process.env.TEST_EMAIL || 'q@q.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'q';

// 성능 측정 결과 저장
const performanceResults = {
  loadTime: [],
  seekTime: [],
  memoryUsage: [],
  bufferingEvents: [],
  errors: []
};

async function measurePerformance() {
  console.log('🚀 비디오 플레이어 성능 테스트 시작...\n');
  
  // 브라우저 실행
  const browser = await puppeteer.launch({
    headless: false, // UI를 보면서 테스트
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-features=NetworkService',
      '--disable-web-security'
    ]
  });

  const page = await browser.newPage();
  
  // 성능 모니터링 활성화
  await page.evaluateOnNewDocument(() => {
    window.performanceData = {
      videoLoadStart: 0,
      videoLoadEnd: 0,
      bufferingCount: 0,
      seekOperations: [],
      errors: []
    };
  });

  // 콘솔 로그 수집
  page.on('console', msg => {
    if (msg.text().includes('[VideoPlayer]')) {
      console.log('📺', msg.text());
    }
  });

  // 에러 수집
  page.on('pageerror', error => {
    console.error('❌ 페이지 에러:', error.message);
    performanceResults.errors.push(error.message);
  });

  try {
    console.log('1️⃣ 로그인 중...');
    // 로그인 페이지로 이동
    await page.goto(`${TEST_URL}/Login`, { waitUntil: 'networkidle0' });
    
    // 로그인
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('✅ 로그인 성공\n');

    console.log('2️⃣ 피드백 페이지로 이동...');
    // 피드백 페이지로 이동
    const feedbackUrl = `${TEST_URL}/Feedback/${TEST_PROJECT_ID}`;
    await page.goto(feedbackUrl, { waitUntil: 'networkidle0' });
    
    // 비디오 플레이어가 로드될 때까지 대기
    await page.waitForSelector('video', { timeout: 10000 });
    console.log('✅ 비디오 플레이어 로드 완료\n');

    // 성능 측정 시작
    console.log('3️⃣ 성능 측정 시작...\n');

    // 3-1. 비디오 로딩 시간 측정
    const loadStartTime = Date.now();
    const videoLoadTime = await page.evaluate(() => {
      return new Promise((resolve) => {
        const video = document.querySelector('video');
        if (!video) {
          resolve({ error: '비디오 요소를 찾을 수 없습니다' });
          return;
        }

        const startTime = performance.now();
        
        video.addEventListener('loadeddata', () => {
          const endTime = performance.now();
          resolve({
            loadTime: endTime - startTime,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            src: video.src
          });
        });

        video.addEventListener('error', (e) => {
          resolve({ error: `비디오 로드 실패: ${e.message}` });
        });

        // 이미 로드된 경우
        if (video.readyState >= 2) {
          resolve({
            loadTime: 0,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            src: video.src,
            note: '이미 로드됨'
          });
        }
      });
    });

    if (videoLoadTime.error) {
      console.error('❌', videoLoadTime.error);
    } else {
      console.log(`📊 비디오 로딩 시간: ${videoLoadTime.loadTime?.toFixed(2) || 0}ms`);
      console.log(`📊 비디오 길이: ${videoLoadTime.duration?.toFixed(2) || 0}초`);
      console.log(`📊 비디오 해상도: ${videoLoadTime.videoWidth}x${videoLoadTime.videoHeight}`);
      console.log(`📊 비디오 URL: ${videoLoadTime.src}`);
      performanceResults.loadTime.push(videoLoadTime.loadTime || 0);
    }

    // 3-2. 재생 테스트
    console.log('\n4️⃣ 재생 테스트...');
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) {
        video.play();
      }
    });
    await page.waitForFunction(
      () => new Promise(resolve => setTimeout(resolve, 3000))
    ); // 3초 재생

    // 3-3. 시크(탐색) 성능 테스트
    console.log('\n5️⃣ 시크 성능 테스트...');
    const seekPositions = [0.25, 0.5, 0.75]; // 25%, 50%, 75% 위치
    
    for (const position of seekPositions) {
      const seekResult = await page.evaluate((pos) => {
        return new Promise((resolve) => {
          const video = document.querySelector('video');
          if (!video) {
            resolve({ error: '비디오 요소를 찾을 수 없습니다' });
            return;
          }

          const targetTime = video.duration * pos;
          const startTime = performance.now();
          
          video.addEventListener('seeked', function onSeeked() {
            const endTime = performance.now();
            video.removeEventListener('seeked', onSeeked);
            resolve({
              seekTime: endTime - startTime,
              targetPosition: pos * 100,
              actualTime: video.currentTime
            });
          });

          video.currentTime = targetTime;
        });
      }, position);

      if (seekResult.error) {
        console.error('❌', seekResult.error);
      } else {
        console.log(`📊 ${seekResult.targetPosition}% 위치 시크 시간: ${seekResult.seekTime.toFixed(2)}ms`);
        performanceResults.seekTime.push(seekResult.seekTime);
      }
    }

    // 3-4. 버퍼링 이벤트 모니터링
    console.log('\n6️⃣ 버퍼링 모니터링...');
    const bufferingData = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return { error: '비디오 요소를 찾을 수 없습니다' };

      const buffered = video.buffered;
      const bufferInfo = [];
      
      for (let i = 0; i < buffered.length; i++) {
        bufferInfo.push({
          start: buffered.start(i),
          end: buffered.end(i),
          duration: buffered.end(i) - buffered.start(i)
        });
      }

      return {
        bufferCount: buffered.length,
        buffers: bufferInfo,
        totalBuffered: bufferInfo.reduce((acc, buf) => acc + buf.duration, 0),
        networkState: video.networkState,
        readyState: video.readyState
      };
    });

    console.log(`📊 버퍼 세그먼트 수: ${bufferingData.bufferCount}`);
    console.log(`📊 총 버퍼링된 시간: ${bufferingData.totalBuffered?.toFixed(2) || 0}초`);

    // 3-5. 메모리 사용량 측정
    console.log('\n7️⃣ 메모리 사용량 측정...');
    const metrics = await page.metrics();
    console.log(`📊 JavaScript 힙 사용량: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📊 전체 JavaScript 힙 크기: ${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)}MB`);
    performanceResults.memoryUsage.push(metrics.JSHeapUsedSize);

    // 3-6. 버튼 기능 테스트
    console.log('\n8️⃣ 버튼 기능 테스트...');
    
    // 현재 시점에 피드백 버튼 테스트
    const feedbackButtonTest = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent.includes('현재 시점에 피드백')
      );
      if (button) {
        button.click();
        return { success: true };
      }
      return { error: '버튼을 찾을 수 없습니다' };
    });

    if (feedbackButtonTest.success) {
      console.log('✅ "현재 시점에 피드백" 버튼 클릭 성공');
      
      // 피드백 등록 탭이 활성화되었는지 확인
      await page.waitForFunction(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      const timeInputValue = await page.evaluate(() => {
        const input = document.querySelector('input[name="section"]');
        return input ? input.value : null;
      });
      
      if (timeInputValue) {
        console.log(`✅ 시간이 자동 입력됨: ${timeInputValue}`);
      }
    }

    // 3-7. 비디오 포맷 지원 테스트
    console.log('\n9️⃣ 비디오 포맷 지원 확인...');
    const formatSupport = await page.evaluate(() => {
      const video = document.createElement('video');
      const formats = {
        'MP4': video.canPlayType('video/mp4'),
        'WebM': video.canPlayType('video/webm'),
        'Ogg': video.canPlayType('video/ogg'),
        'MOV': video.canPlayType('video/quicktime'),
        'AVI': video.canPlayType('video/x-msvideo'),
        'MKV': video.canPlayType('video/x-matroska')
      };
      return formats;
    });

    console.log('📊 지원 포맷:');
    Object.entries(formatSupport).forEach(([format, support]) => {
      const icon = support === 'probably' ? '✅' : support === 'maybe' ? '⚠️' : '❌';
      console.log(`  ${icon} ${format}: ${support || 'not supported'}`);
    });

    // 최종 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 성능 테스트 결과 요약:');
    console.log('='.repeat(50));
    
    const avgLoadTime = performanceResults.loadTime.reduce((a, b) => a + b, 0) / performanceResults.loadTime.length || 0;
    const avgSeekTime = performanceResults.seekTime.reduce((a, b) => a + b, 0) / performanceResults.seekTime.length || 0;
    const avgMemory = performanceResults.memoryUsage.reduce((a, b) => a + b, 0) / performanceResults.memoryUsage.length || 0;
    
    console.log(`\n🎯 평균 로딩 시간: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`🎯 평균 시크 시간: ${avgSeekTime.toFixed(2)}ms`);
    console.log(`🎯 평균 메모리 사용량: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🎯 에러 발생 수: ${performanceResults.errors.length}`);
    
    // 성능 등급 판정
    let grade = 'A';
    if (avgLoadTime > 3000) grade = 'B';
    if (avgLoadTime > 5000) grade = 'C';
    if (avgSeekTime > 1000) grade = 'B';
    if (avgSeekTime > 2000) grade = 'C';
    if (performanceResults.errors.length > 0) grade = 'D';
    
    console.log(`\n🏆 전체 성능 등급: ${grade}`);
    
    // 결과를 파일로 저장
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultPath = path.join(__dirname, `performance-test-result-${timestamp}.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      url: feedbackUrl,
      results: performanceResults,
      summary: {
        avgLoadTime,
        avgSeekTime,
        avgMemory,
        errorCount: performanceResults.errors.length,
        grade
      }
    }, null, 2));
    
    console.log(`\n💾 결과가 저장되었습니다: ${resultPath}`);

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    performanceResults.errors.push(error.message);
  } finally {
    console.log('\n🏁 테스트 완료');
    await browser.close();
  }
}

// 테스트 실행
measurePerformance().catch(console.error);