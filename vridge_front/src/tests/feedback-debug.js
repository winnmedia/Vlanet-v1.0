// 피드백 페이지 디버깅 스크립트
// 페이지의 상태와 문제점을 분석합니다

console.log('%c🔍 피드백 페이지 디버깅 시작', 'color: blue; font-size: 18px; font-weight: bold');

// 1. React 컴포넌트 확인
console.log('\n📦 React 컴포넌트 분석:');
try {
  const reactRoot = document.querySelector('#__next');
  if (reactRoot && reactRoot._reactRootContainer) {
    console.log('✅ React 앱이 정상적으로 마운트됨');
    
    // React DevTools가 설치되어 있는지 확인
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevTools 사용 가능');
    }
  } else {
    console.error('❌ React 앱을 찾을 수 없음');
  }
} catch (e) {
  console.error('React 확인 중 오류:', e);
}

// 2. 주요 컴포넌트 존재 여부
console.log('\n🧩 주요 컴포넌트 확인:');

const components = {
  '비디오 플레이어': ['video', '.enhanced-video-player', '[class*="video"]'],
  '탭 네비게이션': ['[class*="tabNavigation"]', '.tab-navigation', '[class*="tab"]'],
  '피드백 입력': ['textarea', '[class*="feedback-input"]', '[name*="feedback"]'],
  '시간 입력': ['input[placeholder*="시간"]', '[class*="time-input"]'],
  '등록 버튼': ['button[class*="submit"]', 'button[class*="register"]'],
  '피드백 목록': ['[class*="feedbackList"]', '[class*="feedback-list"]']
};

Object.entries(components).forEach(([name, selectors]) => {
  let found = false;
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ ${name}: ${selector}`);
      found = true;
      break;
    }
  }
  if (!found) {
    console.error(`❌ ${name}: 찾을 수 없음`);
  }
});

// 3. 비디오 상태 분석
console.log('\n🎥 비디오 상태:');
const video = document.querySelector('video');
if (video) {
  console.log('✅ 비디오 요소 발견');
  console.log(`  - 소스: ${video.src || '없음'}`);
  console.log(`  - 준비 상태: ${video.readyState} (4 = 완전 로드)`);
  console.log(`  - 네트워크 상태: ${video.networkState}`);
  console.log(`  - 에러: ${video.error ? video.error.message : '없음'}`);
  console.log(`  - 재생 가능: ${video.canPlayType('video/mp4')}`);
  
  // 비디오 이벤트 리스너 추가
  video.addEventListener('error', (e) => {
    console.error('비디오 에러 발생:', e);
  });
} else {
  console.error('❌ 비디오 요소를 찾을 수 없음');
}

// 4. 네트워크 요청 모니터링
console.log('\n🌐 네트워크 요청 모니터링:');

// XMLHttpRequest 인터셉트
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  const xhr = new originalXHR();
  const originalOpen = xhr.open;
  const originalSend = xhr.send;
  
  xhr.open = function(method, url, ...args) {
    console.log(`📡 XHR: ${method} ${url}`);
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  xhr.send = function(data) {
    if (data) {
      console.log('  요청 데이터:', data);
    }
    return originalSend.apply(this, [data]);
  };
  
  return xhr;
};

// Fetch 인터셉트
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  console.log(`📡 Fetch: ${options.method || 'GET'} ${url}`);
  if (options.body) {
    console.log('  요청 데이터:', options.body);
  }
  
  return originalFetch(url, options)
    .then(response => {
      if (!response.ok) {
        console.error(`  ❌ 응답 에러: ${response.status} ${response.statusText}`);
      } else {
        console.log(`  ✅ 응답 성공: ${response.status}`);
      }
      return response;
    })
    .catch(error => {
      console.error('  ❌ 네트워크 에러:', error);
      throw error;
    });
};

// 5. 콘솔 에러 모니터링
console.log('\n⚠️ 에러 모니터링 시작됨');
window.addEventListener('error', (event) => {
  console.error('🚨 전역 에러:', {
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 처리되지 않은 Promise 거부:', event.reason);
});

// 6. 유틸리티 함수들
console.log('\n🛠️ 디버깅 유틸리티:');
console.log('사용 가능한 명령어:');

// 모든 버튼 찾기
window.findAllButtons = () => {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.map(btn => ({
    text: btn.textContent.trim(),
    className: btn.className,
    onclick: btn.onclick ? 'Yes' : 'No',
    element: btn
  }));
};
console.log('- findAllButtons(): 모든 버튼 찾기');

// 모든 입력 필드 찾기
window.findAllInputs = () => {
  const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
  return inputs.map(input => ({
    type: input.type || input.tagName.toLowerCase(),
    name: input.name,
    id: input.id,
    placeholder: input.placeholder,
    value: input.value,
    element: input
  }));
};
console.log('- findAllInputs(): 모든 입력 필드 찾기');

// 클릭 이벤트 시뮬레이션
window.simulateClick = (selector) => {
  const element = document.querySelector(selector);
  if (element) {
    element.click();
    console.log(`✅ ${selector} 클릭됨`);
  } else {
    console.error(`❌ ${selector}를 찾을 수 없음`);
  }
};
console.log('- simulateClick(selector): 요소 클릭 시뮬레이션');

// 탭 전환 테스트
window.testTabSwitch = () => {
  const tabs = document.querySelectorAll('[class*="tabButton"]');
  tabs.forEach((tab, index) => {
    setTimeout(() => {
      console.log(`탭 클릭: ${tab.textContent}`);
      tab.click();
    }, index * 1000);
  });
};
console.log('- testTabSwitch(): 모든 탭 순차적으로 전환');

// 피드백 입력 테스트
window.testFeedbackInput = (message = '테스트 피드백입니다') => {
  const textarea = document.querySelector('textarea');
  const timeInput = document.querySelector('input[placeholder*="시간"]') || 
                   document.querySelector('[class*="time-input"]');
  
  if (textarea) {
    textarea.value = message;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ 피드백 텍스트 입력됨');
  }
  
  if (timeInput) {
    timeInput.value = '00:30';
    timeInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ 시간 입력됨');
  }
  
  // 등록 버튼 찾기
  const submitBtn = document.querySelector('button[class*="submit"]') ||
                   document.querySelector('button[class*="register"]') ||
                   Array.from(document.querySelectorAll('button'))
                     .find(btn => btn.textContent.includes('등록'));
  
  if (submitBtn) {
    console.log('✅ 등록 버튼 발견 (클릭하려면 submitBtn.click() 실행)');
    window.submitBtn = submitBtn;
  }
};
console.log('- testFeedbackInput(message): 피드백 입력 테스트');

// 현재 상태 스냅샷
window.getPageState = () => {
  return {
    url: window.location.href,
    title: document.title,
    videoSrc: document.querySelector('video')?.src,
    buttons: window.findAllButtons().length,
    inputs: window.findAllInputs().length,
    errors: document.querySelectorAll('[class*="error"]').length,
    loading: document.querySelectorAll('[class*="loading"]').length
  };
};
console.log('- getPageState(): 현재 페이지 상태 요약');

// 7. 자동 진단
console.log('\n🏥 자동 진단 실행 중...');
setTimeout(() => {
  const state = window.getPageState();
  console.log('\n📊 페이지 상태 요약:', state);
  
  // 문제 진단
  const issues = [];
  
  if (!document.querySelector('video')) {
    issues.push('비디오 플레이어가 없음');
  }
  
  if (state.buttons < 3) {
    issues.push('버튼이 너무 적음 (3개 미만)');
  }
  
  if (state.inputs < 1) {
    issues.push('입력 필드가 없음');
  }
  
  if (state.errors > 0) {
    issues.push(`에러 요소 ${state.errors}개 발견됨`);
  }
  
  if (issues.length > 0) {
    console.error('\n❌ 발견된 문제들:', issues);
  } else {
    console.log('\n✅ 페이지가 정상적으로 로드된 것으로 보입니다.');
  }
  
  console.log('\n💡 다음 단계:');
  console.log('1. testTabSwitch()로 탭 전환 테스트');
  console.log('2. testFeedbackInput()로 입력 테스트');
  console.log('3. 네트워크 탭에서 API 요청 확인');
  
}, 2000);

console.log('\n🔍 디버깅 준비 완료!');