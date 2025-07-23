// 비디오 플레이어 진단 스크립트
// 브라우저 콘솔에서 실행하세요

(function() {
  console.log('🔍 비디오 플레이어 진단 도구');
  console.log('================================\n');
  
  // 1. 비디오 요소 찾기
  const videos = document.querySelectorAll('video');
  console.log(`📹 발견된 비디오 요소: ${videos.length}개\n`);
  
  if (videos.length === 0) {
    console.error('❌ 비디오 요소를 찾을 수 없습니다.');
    return;
  }
  
  videos.forEach((video, index) => {
    console.log(`\n=== 비디오 ${index + 1} 분석 ===`);
    
    // 2. 비디오 URL 및 형식 확인
    const videoUrl = video.src || video.currentSrc;
    console.log(`📎 URL: ${videoUrl || '없음'}`);
    
    if (videoUrl) {
      // URL에서 파일 확장자 추출
      const match = videoUrl.match(/\.([^.]+)(?:\?.*)?$/);
      const extension = match ? match[1].toLowerCase() : '알 수 없음';
      console.log(`📄 파일 형식: .${extension}`);
      
      // 문제가 되는 형식 확인
      const problematicFormats = ['avi', 'mkv', 'wmv', 'flv', 'm4v'];
      if (problematicFormats.includes(extension)) {
        console.warn(`⚠️ 문제가 될 수 있는 형식입니다: .${extension}`);
        console.log('   → 네이티브 플레이어로 전환됩니다.');
      }
      
      // source 태그 확인
      const sources = video.querySelectorAll('source');
      if (sources.length > 0) {
        console.log(`\n📌 Source 태그 (${sources.length}개):`);
        sources.forEach((source, i) => {
          console.log(`  ${i + 1}. src: ${source.src}`);
          console.log(`     type: ${source.type || '미지정'}`);
        });
      }
    }
    
    // 3. 비디오 상태
    console.log('\n📊 비디오 상태:');
    console.log(`- Ready State: ${video.readyState} (${['없음', '메타데이터', '현재 데이터', '미래 데이터', '충분한 데이터'][video.readyState]})`);
    console.log(`- Network State: ${video.networkState} (${['비어있음', '유휴', '로딩중', '소스 없음'][video.networkState]})`);
    console.log(`- 에러: ${video.error ? video.error.message : '없음'}`);
    
    // 4. 비디오 속성
    console.log('\n⚙️ 비디오 속성:');
    console.log(`- 해상도: ${video.videoWidth}x${video.videoHeight}`);
    console.log(`- 길이: ${isFinite(video.duration) ? video.duration.toFixed(2) + '초' : 'N/A'}`);
    console.log(`- Preload: ${video.preload || 'none'}`);
    console.log(`- Autoplay: ${video.autoplay}`);
    console.log(`- Controls: ${video.controls}`);
    console.log(`- Muted: ${video.muted}`);
    console.log(`- CrossOrigin: ${video.crossOrigin || '미설정'}`);
    
    // 5. 부모 요소 확인
    const parent = video.parentElement;
    if (parent) {
      console.log('\n🏷️ 부모 요소:');
      console.log(`- 태그: ${parent.tagName}`);
      console.log(`- 클래스: ${parent.className || '없음'}`);
      
      // Video.js 플레이어인지 확인
      if (parent.className.includes('video-js') || parent.hasAttribute('data-vjs-player')) {
        console.log('✅ Video.js 플레이어 감지됨');
      } else if (parent.className.includes('native-player')) {
        console.log('✅ 네이티브 플레이어 사용중');
      }
    }
    
    // 6. 지원 형식 테스트
    console.log('\n🎥 브라우저 비디오 형식 지원:');
    const formats = {
      'MP4 (H.264)': 'video/mp4; codecs="avc1.42E01E"',
      'WebM (VP8)': 'video/webm; codecs="vp8, vorbis"',
      'WebM (VP9)': 'video/webm; codecs="vp9"',
      'Ogg': 'video/ogg; codecs="theora"',
      'MOV': 'video/quicktime',
      'AVI': 'video/x-msvideo',
      'MKV': 'video/x-matroska'
    };
    
    Object.entries(formats).forEach(([name, type]) => {
      const support = video.canPlayType(type);
      const icon = support === 'probably' ? '✅' : support === 'maybe' ? '⚠️' : '❌';
      console.log(`${icon} ${name}: ${support || '지원 안함'}`);
    });
  });
  
  // 7. 권장사항
  console.log('\n💡 권장사항:');
  console.log('1. MP4, WebM, Ogg 형식 사용 권장');
  console.log('2. 비디오에 preload="metadata" 속성 추가');
  console.log('3. CORS 설정 확인 (crossorigin="anonymous")');
  console.log('4. 여러 형식 제공으로 호환성 향상:');
  console.log('   <video>');
  console.log('     <source src="video.mp4" type="video/mp4">');
  console.log('     <source src="video.webm" type="video/webm">');
  console.log('   </video>');
  
  // 8. 성능 최적화 제안
  console.log('\n🚀 성능 최적화:');
  console.log('1. 비디오 인코딩 최적화 (H.264, 적절한 비트레이트)');
  console.log('2. CDN 사용으로 전송 속도 향상');
  console.log('3. HLS/DASH로 적응형 스트리밍 구현');
  console.log('4. 썸네일 프리뷰 제공');
  
  console.log('\n✅ 진단 완료!');
})();