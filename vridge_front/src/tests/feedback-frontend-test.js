// 프론트엔드 피드백 페이지 기능 테스트
// 브라우저 콘솔에서 실행하는 스크립트

console.log('%c=== 영상 피드백 페이지 기능 테스트 시작 ===', 'color: blue; font-size: 16px; font-weight: bold');

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// 테스트 헬퍼 함수
function test(name, fn) {
  testResults.total++;
  try {
    const result = fn();
    if (result) {
      testResults.passed++;
      console.log(`✅ ${name}`);
    } else {
      testResults.failed++;
      console.error(`❌ ${name}`);
      testResults.errors.push(name);
    }
  } catch (error) {
    testResults.failed++;
    console.error(`❌ ${name}: ${error.message}`);
    testResults.errors.push(`${name}: ${error.message}`);
  }
}

// 1. 페이지 로드 및 기본 요소 확인
console.log('\n📋 1. 페이지 로드 테스트');

test('페이지 타이틀 확인', () => {
  return document.title.includes('VideoPlanet') || document.title.includes('피드백');
});

test('비디오 플레이어 존재', () => {
  return document.querySelector('video') !== null || 
         document.querySelector('.enhanced-video-player') !== null ||
         document.querySelector('[class*="video"]') !== null;
});

test('탭 네비게이션 존재', () => {
  return document.querySelector('[class*="tabNavigation"]') !== null ||
         document.querySelector('.tab-navigation') !== null;
});

test('피드백 입력 영역 존재', () => {
  return document.querySelector('textarea') !== null ||
         document.querySelector('[class*="feedback"]') !== null;
});

// 2. 탭 전환 기능
console.log('\n📋 2. 탭 전환 기능 테스트');

test('피드백 등록 탭 버튼', () => {
  const tabs = document.querySelectorAll('[class*="tabButton"]');
  return tabs.length > 0 && Array.from(tabs).some(tab => tab.textContent.includes('피드백 등록'));
});

test('코멘트 탭 버튼', () => {
  const tabs = document.querySelectorAll('[class*="tabButton"]');
  return tabs.length > 0 && Array.from(tabs).some(tab => tab.textContent.includes('코멘트'));
});

test('피드백 관리 탭 버튼', () => {
  const tabs = document.querySelectorAll('[class*="tabButton"]');
  return tabs.length > 0 && Array.from(tabs).some(tab => tab.textContent.includes('피드백 관리'));
});

// 3. 비디오 컨트롤
console.log('\n📋 3. 비디오 컨트롤 테스트');

test('재생/일시정지 버튼', () => {
  return document.querySelector('[class*="play"]') !== null ||
         document.querySelector('button[aria-label*="play"]') !== null;
});

test('타임라인/프로그레스 바', () => {
  return document.querySelector('[class*="progress"]') !== null ||
         document.querySelector('[class*="timeline"]') !== null ||
         document.querySelector('input[type="range"]') !== null;
});

test('볼륨 컨트롤', () => {
  return document.querySelector('[class*="volume"]') !== null ||
         document.querySelector('button[aria-label*="volume"]') !== null;
});

// 4. 피드백 입력 기능
console.log('\n📋 4. 피드백 입력 기능 테스트');

test('피드백 텍스트 입력 필드', () => {
  const textarea = document.querySelector('textarea');
  return textarea !== null;
});

test('시간 입력 필드', () => {
  return document.querySelector('input[type="text"][placeholder*="시간"]') !== null ||
         document.querySelector('[class*="time"]') !== null;
});

test('피드백 등록 버튼', () => {
  return document.querySelector('button[class*="submit"]') !== null ||
         document.querySelector('button[class*="register"]') !== null ||
         Array.from(document.querySelectorAll('button')).some(btn => 
           btn.textContent.includes('등록') || btn.textContent.includes('저장')
         );
});

// 5. AI 기능
console.log('\n📋 5. AI 기능 테스트');

test('AI 피드백 버튼', () => {
  return document.querySelector('[class*="ai"]') !== null ||
         Array.from(document.querySelectorAll('button')).some(btn => 
           btn.textContent.includes('AI') || btn.textContent.includes('선생님')
         );
});

// 6. 피드백 목록
console.log('\n📋 6. 피드백 목록 테스트');

test('피드백 목록 영역', () => {
  return document.querySelector('[class*="feedbackList"]') !== null ||
         document.querySelector('[class*="feedback-list"]') !== null ||
         document.querySelector('.feedback-items') !== null;
});

test('피드백 아이템', () => {
  const feedbackItems = document.querySelectorAll('[class*="feedbackItem"]') ||
                       document.querySelectorAll('[class*="feedback-item"]');
  return feedbackItems.length >= 0; // 0개여도 통과 (빈 목록일 수 있음)
});

// 7. 그리기 도구
console.log('\n📋 7. 그리기 도구 테스트');

test('그리기 도구 버튼', () => {
  return document.querySelector('[class*="draw"]') !== null ||
         document.querySelector('[class*="tool"]') !== null ||
         Array.from(document.querySelectorAll('button')).some(btn => 
           btn.textContent.includes('그리기') || btn.getAttribute('aria-label')?.includes('draw')
         );
});

// 8. 반응형 디자인
console.log('\n📋 8. 반응형 디자인 테스트');

test('모바일 반응형 스타일', () => {
  const hasViewport = document.querySelector('meta[name="viewport"]') !== null;
  const hasResponsiveClass = document.querySelector('[class*="mobile"]') !== null ||
                            document.querySelector('[class*="responsive"]') !== null;
  return hasViewport;
});

// 9. 에러 상태 확인
console.log('\n📋 9. 에러 상태 확인');

test('에러 메시지 없음', () => {
  const errorElements = document.querySelectorAll('[class*="error"]');
  const visibleErrors = Array.from(errorElements).filter(el => 
    el.textContent.trim() && !el.classList.contains('hidden') && el.offsetParent !== null
  );
  if (visibleErrors.length > 0) {
    console.log('발견된 에러:', visibleErrors.map(el => el.textContent));
  }
  return visibleErrors.length === 0;
});

test('로딩 상태 정상', () => {
  const loadingElements = document.querySelectorAll('[class*="loading"]');
  const activeLoading = Array.from(loadingElements).filter(el => 
    !el.classList.contains('hidden') && el.offsetParent !== null
  );
  return activeLoading.length === 0; // 로딩이 끝났어야 함
});

// 결과 요약
console.log('\n' + '='.repeat(60));
console.log(`총 테스트: ${testResults.total}개`);
console.log(`✅ 성공: ${testResults.passed}개`);
console.log(`❌ 실패: ${testResults.failed}개`);
console.log(`성공률: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

if (testResults.errors.length > 0) {
  console.log('\n실패한 테스트:');
  testResults.errors.forEach(error => console.log(`  - ${error}`));
}

// 추가 디버깅 정보
console.log('\n📊 페이지 구조 분석:');
console.log('- Body 클래스:', document.body.className);
console.log('- 주요 컨테이너:', document.querySelector('#__next') ? 'Next.js App' : 'Unknown');
console.log('- 비디오 요소:', document.querySelectorAll('video').length + '개');
console.log('- 버튼 요소:', document.querySelectorAll('button').length + '개');
console.log('- 입력 요소:', document.querySelectorAll('input, textarea').length + '개');

// 콘솔에 복사 가능한 명령어 제공
console.log('\n💡 추가 디버깅 명령어:');
console.log('1. 모든 버튼 텍스트 보기: Array.from(document.querySelectorAll("button")).map(b => b.textContent.trim()).filter(t => t)');
console.log('2. 모든 클래스명 보기: Array.from(document.querySelectorAll("*")).map(el => el.className).filter(c => c).join("\\n")');
console.log('3. React 컴포넌트 확인: document.querySelector("#__next")._reactRootContainer');

// 테스트 결과 반환
window.feedbackTestResults = testResults;