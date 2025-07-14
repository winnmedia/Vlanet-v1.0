// 안전한 비디오 성능 테스트 스크립트
// 피드백 페이지에서 브라우저 콘솔에 복사해서 실행하세요

(function() {
  console.log('🎬 비디오 플레이어 성능 테스트 v2');
  console.log('=====================================\n');
  
  const video = document.querySelector('video');
  if (!video) {
    console.error('❌ 비디오 요소를 찾을 수 없습니다.');
    console.log('📌 피드백 페이지에서 실행해주세요.');
    return;
  }

  // 결과 저장 객체
  const results = {
    basic: {},
    performance: {},
    quality: {},
    issues: []
  };

  // 1. 기본 정보 수집
  console.log('1️⃣ 비디오 기본 정보');
  console.log('-------------------');
  
  results.basic = {
    src: video.src || '없음',
    duration: isFinite(video.duration) ? video.duration + '초' : 'N/A',
    currentTime: video.currentTime.toFixed(2) + '초',
    resolution: video.videoWidth + 'x' + video.videoHeight,
    readyState: video.readyState,
    networkState: video.networkState,
    paused: video.paused,
    volume: (video.volume * 100).toFixed(0) + '%'
  };
  
  Object.entries(results.basic).forEach(([key, value]) => {
    console.log(`- ${key}: ${value}`);
  });

  // 2. 준비 상태 확인
  console.log('\n2️⃣ 비디오 상태 분석');
  console.log('-------------------');
  
  const readyStates = ['없음', '메타데이터', '현재 데이터', '미래 데이터', '충분한 데이터'];
  const networkStates = ['비어있음', '유휴', '로딩중', '소스 없음'];
  
  console.log(`- 준비 상태: ${readyStates[video.readyState] || '알 수 없음'} (${video.readyState})`);
  console.log(`- 네트워크: ${networkStates[video.networkState] || '알 수 없음'} (${video.networkState})`);
  
  // 3. 버퍼링 상태
  console.log('\n3️⃣ 버퍼링 상태');
  console.log('-------------------');
  
  if (video.buffered.length > 0) {
    let totalBuffered = 0;
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i);
      const end = video.buffered.end(i);
      totalBuffered += (end - start);
      console.log(`- 버퍼 ${i + 1}: ${start.toFixed(2)}초 ~ ${end.toFixed(2)}초`);
    }
    console.log(`- 총 버퍼된 시간: ${totalBuffered.toFixed(2)}초`);
    
    if (isFinite(video.duration) && video.duration > 0) {
      const bufferPercent = (totalBuffered / video.duration * 100).toFixed(2);
      console.log(`- 버퍼 비율: ${bufferPercent}%`);
    }
  } else {
    console.log('- 버퍼된 데이터 없음');
  }

  // 4. 재생 품질 (지원하는 경우)
  console.log('\n4️⃣ 재생 품질');
  console.log('-------------------');
  
  if (video.getVideoPlaybackQuality) {
    const quality = video.getVideoPlaybackQuality();
    results.quality = {
      totalFrames: quality.totalVideoFrames,
      droppedFrames: quality.droppedVideoFrames,
      corruptedFrames: quality.corruptedVideoFrames || 0
    };
    
    console.log(`- 총 프레임: ${quality.totalVideoFrames}`);
    console.log(`- 드롭된 프레임: ${quality.droppedVideoFrames}`);
    
    if (quality.totalVideoFrames > 0) {
      const dropRate = (quality.droppedVideoFrames / quality.totalVideoFrames * 100).toFixed(2);
      console.log(`- 프레임 드롭율: ${dropRate}%`);
      
      if (dropRate > 5) {
        results.issues.push(`높은 프레임 드롭율 (${dropRate}%)`);
      }
    }
  } else {
    console.log('- 재생 품질 API 미지원');
  }

  // 5. 메모리 사용량
  console.log('\n5️⃣ 메모리 사용량');
  console.log('-------------------');
  
  if (performance.memory) {
    const memoryMB = {
      used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
      total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
      limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
    };
    
    console.log(`- 사용중: ${memoryMB.used}MB`);
    console.log(`- 전체 힙: ${memoryMB.total}MB`);
    console.log(`- 제한: ${memoryMB.limit}MB`);
    
    const usagePercent = (memoryMB.used / memoryMB.total * 100).toFixed(2);
    console.log(`- 사용률: ${usagePercent}%`);
  } else {
    console.log('- 메모리 API 미지원');
  }

  // 6. Video.js 정보 (있는 경우)
  console.log('\n6️⃣ 플레이어 정보');
  console.log('-------------------');
  
  if (window.videojs && window.videojs.VERSION) {
    console.log(`- Video.js 버전: ${window.videojs.VERSION}`);
    
    const players = window.videojs.players;
    if (players && Object.keys(players).length > 0) {
      const player = Object.values(players)[0];
      console.log(`- 플레이어 준비: ${player.isReady_ ? '예' : '아니오'}`);
      console.log(`- 재생 시작됨: ${player.hasStarted_ ? '예' : '아니오'}`);
    }
  } else {
    console.log('- 기본 HTML5 플레이어 사용중');
  }

  // 7. 성능 테스트 (비디오가 로드된 경우만)
  if (isFinite(video.duration) && video.duration > 0 && video.readyState >= 2) {
    console.log('\n7️⃣ 시크 성능 테스트');
    console.log('-------------------');
    console.log('⏳ 테스트 진행중...');
    
    const testPositions = [0.1, 0.5, 0.9];
    let seekResults = [];
    
    const runSeekTest = async () => {
      for (const pos of testPositions) {
        const startTime = performance.now();
        const targetTime = video.duration * pos;
        
        video.currentTime = targetTime;
        
        await new Promise(resolve => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);
          
          // 타임아웃 설정 (5초)
          setTimeout(() => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          }, 5000);
        });
        
        const seekTime = performance.now() - startTime;
        seekResults.push({
          position: (pos * 100) + '%',
          time: seekTime
        });
        
        console.log(`  ✓ ${pos * 100}% 위치: ${seekTime.toFixed(2)}ms`);
        
        // 다음 테스트 전 잠시 대기
        await new Promise(r => setTimeout(r, 500));
      }
      
      // 평균 계산
      const avgSeekTime = seekResults.reduce((sum, r) => sum + r.time, 0) / seekResults.length;
      console.log(`\n  평균 시크 시간: ${avgSeekTime.toFixed(2)}ms`);
      
      if (avgSeekTime > 1000) {
        results.issues.push(`느린 시크 성능 (평균 ${avgSeekTime.toFixed(0)}ms)`);
      }
    };
    
    runSeekTest().then(() => {
      printSummary();
    });
  } else {
    console.log('\n⚠️ 시크 테스트 건너뜀 (비디오가 준비되지 않음)');
    printSummary();
  }

  // 결과 요약 출력
  function printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 성능 분석 요약');
    console.log('='.repeat(50));
    
    // 문제점 분석
    if (results.issues.length === 0) {
      console.log('\n✅ 성능 이슈가 발견되지 않았습니다.');
    } else {
      console.log('\n⚠️ 발견된 이슈:');
      results.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    // 최적화 제안
    console.log('\n💡 최적화 제안:');
    console.log('  1. CSS 파일 통합 (현재 18개 → 3-4개로 축소)');
    console.log('  2. 비디오 preload="metadata" 속성 추가');
    console.log('  3. 1820줄의 Feedback.jsx 컴포넌트 분할');
    
    if (!video.hasAttribute('preload') || video.preload === 'none') {
      console.log('  4. ⚠️ preload 속성이 설정되지 않음');
    }
    
    console.log('\n✅ 테스트 완료!');
    console.log('💾 결과는 window.videoTestResults에 저장되었습니다.');
    
    window.videoTestResults = results;
  }

  // CSS 파일 수 확인
  const cssFiles = Array.from(document.styleSheets).filter(sheet => {
    try {
      return sheet.href && sheet.href.includes('.css');
    } catch (e) {
      return false;
    }
  });
  
  console.log(`\n📄 로드된 CSS 파일 수: ${cssFiles.length}개`);
  if (cssFiles.length > 10) {
    results.issues.push(`과도한 CSS 파일 (${cssFiles.length}개)`);
  }
})();