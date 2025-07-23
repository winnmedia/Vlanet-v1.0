const fs = require('fs');

console.log('🎯 픽셀 퍼펙트 UI/UX 체크리스트\n');

// 페이지별 체크리스트
const pageChecklist = {
  '홈페이지 (/)': {
    elements: [
      { name: '로고', selector: '.logo img', properties: ['width', 'height'] },
      { name: '헤더 높이', selector: '#header', properties: ['height', 'padding'] },
      { name: '시작하기 버튼', selector: '.submit', properties: ['width', 'height', 'padding', 'font-size', 'border-radius'] },
      { name: '섹션 간격', selector: 'section', properties: ['margin-top', 'margin-bottom', 'padding'] },
      { name: '비주얼 이미지', selector: '.visual img', properties: ['width', 'height', 'object-fit'] }
    ]
  },
  '로그인 (/login)': {
    elements: [
      { name: '로그인 폼', selector: '.form', properties: ['width', 'padding', 'margin'] },
      { name: '입력 필드', selector: 'input', properties: ['height', 'padding', 'font-size', 'border'] },
      { name: '로그인 버튼', selector: '.submit', properties: ['width', 'height', 'margin-top'] },
      { name: '소셜 로그인', selector: '.social_login button', properties: ['height', 'margin'] }
    ]
  },
  '프로젝트 목록 (/calendar)': {
    elements: [
      { name: '사이드바', selector: '.SideBar', properties: ['width', 'padding'] },
      { name: '캘린더 헤더', selector: '.calendar .filter', properties: ['height', 'padding'] },
      { name: '프로젝트 카드', selector: '.project_card', properties: ['padding', 'margin', 'border-radius', 'box-shadow'] },
      { name: '날짜 셀', selector: '.calendar_body td', properties: ['width', 'height', 'padding'] }
    ]
  },
  '프로젝트 생성 (/project/create)': {
    elements: [
      { name: '폼 컨테이너', selector: '.form', properties: ['max-width', 'padding'] },
      { name: '입력 그룹', selector: '.form_list', properties: ['margin-bottom'] },
      { name: '등록 버튼', selector: '.btn_wrap .submit', properties: ['width', 'height'] },
      { name: '레이블', selector: 'label', properties: ['font-size', 'margin-bottom'] }
    ]
  }
};

// 컴포넌트별 표준 스타일
const standardStyles = {
  '버튼': {
    primary: {
      'background': 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
      'color': '#ffffff',
      'padding': '12px 30px',
      'border-radius': '8px',
      'font-size': '14px',
      'font-weight': '500',
      'min-height': '44px',
      'border': 'none',
      'cursor': 'pointer',
      'transition': 'all 0.3s ease',
      'hover': {
        'transform': 'translateY(-2px)',
        'box-shadow': '0 4px 12px rgba(22, 49, 248, 0.25)'
      }
    },
    secondary: {
      'background': '#ffffff',
      'color': '#333333',
      'border': '1px solid #e0e0e0'
    }
  },
  '입력필드': {
    'height': '44px',
    'padding': '0 16px',
    'border': '1px solid #e0e0e0',
    'border-radius': '8px',
    'font-size': '14px',
    'transition': 'border-color 0.3s ease',
    'focus': {
      'border-color': '#1631F8',
      'outline': 'none'
    }
  },
  '카드': {
    'background': '#ffffff',
    'border-radius': '12px',
    'padding': '24px',
    'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.06)',
    'transition': 'box-shadow 0.3s ease',
    'hover': {
      'box-shadow': '0 4px 16px rgba(0, 0, 0, 0.1)'
    }
  }
};

// 체크리스트 출력
console.log('📋 페이지별 체크 항목:\n');

Object.entries(pageChecklist).forEach(([page, config]) => {
  console.log(`${page}:`);
  config.elements.forEach(element => {
    console.log(`  □ ${element.name}`);
    element.properties.forEach(prop => {
      console.log(`     - ${prop}`);
    });
  });
  console.log('');
});

// 표준 스타일 가이드
console.log('📏 표준 스타일 가이드:\n');

Object.entries(standardStyles).forEach(([component, styles]) => {
  console.log(`${component}:`);
  if (styles.primary) {
    console.log('  Primary 스타일:');
    Object.entries(styles.primary).forEach(([prop, value]) => {
      if (typeof value !== 'object') {
        console.log(`    ${prop}: ${value}`);
      }
    });
  } else {
    Object.entries(styles).forEach(([prop, value]) => {
      if (typeof value !== 'object') {
        console.log(`  ${prop}: ${value}`);
      }
    });
  }
  console.log('');
});

// 개발자 도구 스크립트
console.log('🔧 개발자 도구에서 실행할 스크립트:\n');

const devToolsScript = `
// 현재 페이지의 모든 버튼 스타일 추출
const buttons = document.querySelectorAll('button, .submit, .btn');
const buttonStyles = Array.from(buttons).map(btn => {
  const computed = window.getComputedStyle(btn);
  return {
    selector: btn.className,
    width: computed.width,
    height: computed.height,
    padding: computed.padding,
    fontSize: computed.fontSize,
    backgroundColor: computed.backgroundColor,
    borderRadius: computed.borderRadius
  };
});
console.table(buttonStyles);

// 여백 일관성 확인
const sections = document.querySelectorAll('section, .content, main');
const margins = Array.from(sections).map(sec => {
  const computed = window.getComputedStyle(sec);
  return {
    element: sec.className || sec.tagName,
    marginTop: computed.marginTop,
    marginBottom: computed.marginBottom,
    paddingTop: computed.paddingTop,
    paddingBottom: computed.paddingBottom
  };
});
console.table(margins);
`;

console.log('```javascript');
console.log(devToolsScript);
console.log('```\n');

// 수정 우선순위
console.log('🚨 주요 확인 사항:\n');
console.log('1. 버튼 높이가 44px로 통일되어 있는가?');
console.log('2. 입력 필드의 높이가 44px로 통일되어 있는가?');
console.log('3. 섹션 간 여백이 40px로 일정한가?');
console.log('4. 카드의 padding이 24px로 통일되어 있는가?');
console.log('5. border-radius가 8px(버튼/입력) 또는 12px(카드)로 일정한가?');
console.log('6. 폰트 크기가 14px(본문), 16px(제목)로 일정한가?');
console.log('7. 색상이 브랜드 가이드라인을 따르는가? (#1631F8)');
console.log('8. 호버 효과가 일관되게 적용되는가?');

// 픽셀 퍼펙트 검증 방법
console.log('\n🎯 픽셀 퍼펙트 검증 방법:\n');
console.log('1. 동일한 페이지를 두 브라우저 탭에서 열기');
console.log('2. 개발자 도구로 동일한 요소 선택');
console.log('3. Computed 탭에서 실제 계산된 값 비교');
console.log('4. 차이가 있는 속성을 CSS 파일에서 수정');
console.log('5. 수정 후 브라우저 새로고침으로 확인\n');

fs.writeFileSync('/home/winnmedia/VideoPlanet/ui-comparison/pixel-differences.md', `
# 픽셀 퍼펙트 UI/UX 차이점 기록

## 발견된 차이점

### 1. 버튼 스타일
- [ ] 높이 불일치
- [ ] 패딩 차이
- [ ] 호버 효과 차이

### 2. 입력 필드
- [ ] 테두리 스타일
- [ ] 포커스 효과
- [ ] placeholder 색상

### 3. 레이아웃
- [ ] 사이드바 너비
- [ ] 헤더 높이
- [ ] 섹션 간격

### 4. 타이포그래피
- [ ] 폰트 크기
- [ ] 줄 간격
- [ ] 자간

## 수정 내역

| 파일 | 선택자 | 속성 | 원본값 | 수정값 |
|------|--------|------|--------|--------|
| | | | | |

`);

console.log('📝 차이점 기록 파일 생성됨: pixel-differences.md');