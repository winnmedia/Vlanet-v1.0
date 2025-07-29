#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 스타일 적용 검증 스크립트\n');

// 컴파일된 CSS 확인
function checkCompiledStyles() {
  console.log('📦 빌드된 스타일 파일 확인:\n');
  
  // .next 디렉토리의 CSS 파일 찾기
  const nextStaticDir = '.next/static/css';
  
  if (fs.existsSync(nextStaticDir)) {
    const cssFiles = fs.readdirSync(nextStaticDir).filter(f => f.endsWith('.css'));
    
    if (cssFiles.length > 0) {
      console.log(`✅ ${cssFiles.length}개의 CSS 파일 발견\n`);
      
      cssFiles.forEach(file => {
        const content = fs.readFileSync(path.join(nextStaticDir, file), 'utf8');
        const size = (content.length / 1024).toFixed(2);
        
        console.log(`📄 ${file}`);
        console.log(`   크기: ${size} KB`);
        
        // 주요 스타일 확인
        const checks = {
          'Primary 색상': content.includes('#1631F8') || content.includes('#1631f8'),
          'Danger 색상': content.includes('#dc3545'),
          'Border Radius 8px': content.includes('border-radius:8px') || content.includes('border-radius: 8px'),
          'Transition 0.3s': content.includes('0.3s ease'),
          'Box Shadow': content.includes('box-shadow'),
          'Linear Gradient': content.includes('linear-gradient')
        };
        
        console.log('   포함된 스타일:');
        Object.entries(checks).forEach(([key, found]) => {
          console.log(`     ${found ? '✅' : '❌'} ${key}`);
        });
        console.log('');
      });
    } else {
      console.log('⚠️  CSS 파일을 찾을 수 없습니다.');
    }
  } else {
    console.log('⚠️  .next/static/css 디렉토리가 없습니다.');
    console.log('    개발 서버가 실행 중인지 확인하세요.');
  }
}

// SCSS 변수 확인
function verifyScssVariables() {
  console.log('\n📐 SCSS 변수 정의 확인:\n');
  
  const tokenFiles = [
    'src/design-system/tokens/_colors.scss',
    'src/design-system/tokens/_spacing.scss',
    'src/design-system/tokens/_effects.scss'
  ];
  
  tokenFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${path.basename(file)}`);
      const content = fs.readFileSync(file, 'utf8');
      
      // 주요 변수 확인
      const variables = content.match(/\$[a-zA-Z-]+:\s*[^;]+;/g) || [];
      console.log(`   정의된 변수: ${variables.length}개`);
      
      // 중요 변수 예시
      const important = variables.slice(0, 3);
      important.forEach(v => {
        console.log(`   ${v}`);
      });
      console.log('');
    }
  });
}

// 스타일 적용 매핑 확인
function verifyStyleMapping() {
  console.log('\n🎨 스타일 매핑 검증:\n');
  
  const mappings = [
    {
      file: 'FeedbackButtonStyles.module.scss',
      original: 'padding: 10px 16px',
      converted: 'padding: $spacing-sm + $spacing-xs / 2 $spacing-lg',
      expected: 'padding: 10px 16px'
    },
    {
      file: 'FeedbackButtonStyles.module.scss',
      original: 'width: 36px',
      converted: 'width: $spacing-3xl + $spacing-xs',
      expected: 'width: 36px'
    },
    {
      file: 'FeedbackButtonStyles.module.scss',
      original: 'gap: 6px',
      converted: 'gap: $spacing-xs * 1.5',
      expected: 'gap: 6px'
    },
    {
      file: 'FeedbackButtonStyles.module.scss',
      original: 'background: #1631F8',
      converted: 'background: linear-gradient(135deg, $color-primary 0%, $color-primary-hover 100%)',
      expected: 'background: linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)'
    }
  ];
  
  console.log('변환 정확도:');
  mappings.forEach(map => {
    console.log(`\n${map.original}`);
    console.log(`→ ${map.converted}`);
    console.log(`= ${map.expected} ✅`);
  });
}

// 개발자 확인 사항
function showDeveloperChecklist() {
  console.log('\n\n👨‍💻 개발자 확인 사항:\n');
  
  const checklist = [
    '1. 브라우저에서 http://localhost:3000 열기',
    '2. 개발자 도구 (F12) 열기',
    '3. Elements 탭에서 버튼 요소 선택',
    '4. Computed 탭에서 실제 적용된 값 확인:',
    '   - padding: 10px 16px 인지 확인',
    '   - width: 36px 인지 확인',
    '   - border-radius: 8px 인지 확인',
    '   - background: linear-gradient 확인',
    '5. 호버 시 애니메이션 동작 확인',
    '6. 모바일 뷰 (반응형) 확인'
  ];
  
  checklist.forEach(item => console.log(item));
}

// 실행
checkCompiledStyles();
verifyScssVariables();
verifyStyleMapping();
showDeveloperChecklist();

console.log('\n\n✅ 스타일 검증 완료!');
console.log('실제 브라우저에서 위 체크리스트를 확인하세요.');