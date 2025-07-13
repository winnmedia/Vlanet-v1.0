
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
  console.log('\n📊 비디오 정보:');
  console.log('- URL:', video.src);
  console.log('- 길이:', video.duration, '초');
  console.log('- 해상도:', video.videoWidth + 'x' + video.videoHeight);
  console.log('- 현재 시간:', video.currentTime, '초');
  console.log('- 버퍼 상태:', video.buffered.length, '개 세그먼트');
  console.log('- 준비 상태:', ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][video.readyState]);

  // 2. 시크 성능 테스트
  console.log('\n⏱️ 시크 성능 테스트 시작...');
  
  // duration이 유효한지 확인
  if (!isFinite(video.duration) || video.duration <= 0) {
    console.log('⚠️ 비디오가 아직 로드되지 않았거나 duration이 유효하지 않습니다.');
    console.log('  duration:', video.duration);
  } else {
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
      console.log('\n📊 시크 테스트 결과:');
      results.forEach(r => console.log('- ' + r.position + ':', r.time));
    });
  }

  // 3. 메모리 사용량
  if (performance.memory) {
    console.log('\n💾 메모리 사용량:');
    console.log('- 사용 중:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB');
    console.log('- 전체 힙:', (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB');
    console.log('- 제한:', (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB');
  }

  // 4. 버튼 테스트
  console.log('\n🔘 버튼 기능 테스트...');
  const feedbackBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('현재 시점에 피드백'));
  if (feedbackBtn) {
    console.log('✅ "현재 시점에 피드백" 버튼 발견');
    // 클릭 시뮬레이션 (실제로 클릭하지 않음)
    console.log('- 현재 재생 시간:', video.currentTime.toFixed(2) + '초');
    const minutes = Math.floor(video.currentTime / 60);
    const seconds = Math.floor(video.currentTime % 60);
    console.log('- 피드백 시간 형식:', minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'));
  }

  console.log('\n✅ 성능 측정 완료!');
})();
  