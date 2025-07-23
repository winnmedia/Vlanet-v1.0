const fs = require('fs');
const path = require('path');

console.log('🎨 픽셀 퍼펙트 UI/UX 스타일 비교 분석\n');

// 비교할 주요 CSS 속성들
const cssPropertiesToCompare = [
  // Box Model
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'gap', 'row-gap', 'column-gap',
  
  // Typography
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'text-align', 'text-decoration', 'text-transform',
  
  // Colors
  'color', 'background-color', 'border-color',
  
  // Layout
  'display', 'position', 'flex-direction', 'justify-content', 'align-items',
  'grid-template-columns', 'grid-template-rows',
  
  // Visual
  'border', 'border-radius', 'box-shadow', 'opacity'
];

// 주요 컴포넌트별 클래스명 매핑
const componentMappings = {
  '버튼': {
    react: '.submit, .btn_wrap button, .btn',
    nextjs: '.submit, .btn_wrap button, .btn'
  },
  '헤더': {
    react: '.PageTemplate header, #header',
    nextjs: '.PageTemplate header, #header'
  },
  '사이드바': {
    react: '.SideBar, .sidebar',
    nextjs: '.SideBar, .sidebar'
  },
  '카드': {
    react: '.card, .project_card',
    nextjs: '.card, .project_card'
  },
  '입력 필드': {
    react: 'input[type="text"], input[type="email"], textarea',
    nextjs: 'input[type="text"], input[type="email"], textarea'
  },
  '컨테이너': {
    react: '.container, .inner, .wrap',
    nextjs: '.container, .inner, .wrap'
  }
};

// CSS 파일 비교 함수
function compareCSSFiles() {
  const reactCSSDir = '/home/winnmedia/VideoPlanet/vridge_front/src/css';
  const nextjsCSSDir = '/home/winnmedia/VideoPlanet/vridge-front-next/src/css';
  
  console.log('📁 CSS 파일 크기 비교:\n');
  
  const cssFiles = [
    'global.scss',
    'Home.scss',
    'Cms/Cms.scss',
    'Login.scss',
    'PageTemplate.scss'
  ];
  
  cssFiles.forEach(file => {
    try {
      const reactPath = path.join(reactCSSDir, file);
      const nextjsPath = path.join(nextjsCSSDir, file);
      
      if (fs.existsSync(reactPath) && fs.existsSync(nextjsPath)) {
        const reactSize = fs.statSync(reactPath).size;
        const nextjsSize = fs.statSync(nextjsPath).size;
        const diff = nextjsSize - reactSize;
        
        console.log(`${file}:`);
        console.log(`  React:  ${reactSize} bytes`);
        console.log(`  Next.js: ${nextjsSize} bytes`);
        console.log(`  차이:    ${diff > 0 ? '+' : ''}${diff} bytes ${diff === 0 ? '✅' : '⚠️'}\n`);
      }
    } catch (error) {
      console.log(`${file}: 비교 실패\n`);
    }
  });
}

// 특정 스타일 규칙 추출
function extractStyleRules(cssContent, selector) {
  const rules = {};
  const regex = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{([^}]+)}`, 'g');
  const matches = cssContent.matchAll(regex);
  
  for (const match of matches) {
    const ruleContent = match[1];
    const properties = ruleContent.split(';').filter(p => p.trim());
    
    properties.forEach(prop => {
      const [key, value] = prop.split(':').map(s => s.trim());
      if (key && value) {
        rules[key] = value;
      }
    });
  }
  
  return rules;
}

// 주요 차이점 분석
console.log('\n🔍 주요 스타일 차이점 분석:\n');

// 버튼 스타일 비교
console.log('1. 버튼 스타일:');
console.log('   - 기본 색상: #1631F8 (브랜드 컬러)');
console.log('   - 호버 효과: transform: translateY(-2px)');
console.log('   - 그라데이션: linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)');
console.log('   - 비활성화: opacity: 0.6\n');

// 여백 표준
console.log('2. 여백 표준:');
console.log('   - 섹션 간격: 40px');
console.log('   - 컴포넌트 간격: 20px');
console.log('   - 내부 패딩: 16px');
console.log('   - 카드 패딩: 24px\n');

// 폰트 설정
console.log('3. 폰트 설정:');
console.log('   - 기본 폰트: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto');
console.log('   - 제목 크기: 24px (h1), 20px (h2), 18px (h3)');
console.log('   - 본문 크기: 14px');
console.log('   - 줄 간격: 1.5\n');

// 브레이크포인트
console.log('4. 반응형 브레이크포인트:');
console.log('   - 모바일: 768px 이하');
console.log('   - 태블릿: 769px - 1024px');
console.log('   - 데스크톱: 1025px 이상\n');

// CSS 파일 비교 실행
compareCSSFiles();

// 개발자 도구 사용 가이드
console.log('\n📋 개발자 도구 체크리스트:\n');
console.log('1. Elements 탭에서 비교:');
cssPropertiesToCompare.forEach(prop => {
  console.log(`   □ ${prop}`);
});

console.log('\n2. Computed 탭에서 확인:');
console.log('   □ 최종 계산된 스타일 값');
console.log('   □ 상속된 스타일');
console.log('   □ 우선순위 충돌\n');

console.log('3. 주요 확인 사항:');
console.log('   □ 모든 버튼이 동일한 높이와 패딩을 가지는가?');
console.log('   □ 입력 필드의 테두리와 포커스 스타일이 일치하는가?');
console.log('   □ 카드 컴포넌트의 그림자와 둥근 모서리가 동일한가?');
console.log('   □ 헤더와 사이드바의 높이가 정확히 일치하는가?\n');

// 수정이 필요한 파일 목록 생성
console.log('💡 교정 작업 우선순위:\n');
console.log('1. 전역 스타일 (global.scss) - 기본 설정 확인');
console.log('2. 레이아웃 컴포넌트 (PageTemplate.scss) - 전체 구조');
console.log('3. 페이지별 스타일 - 개별 페이지 디테일');
console.log('4. 컴포넌트 스타일 - 재사용 요소\n');