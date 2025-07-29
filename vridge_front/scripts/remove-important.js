#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

console.log(`${colors.cyan}🎯 !important 제거기${colors.reset}\n`);

// 모든 SCSS/CSS 파일 찾기
const files = glob.sync('src/**/*.{scss,css}', {
  ignore: ['**/node_modules/**', '**/build/**', '**/*.backup*']
});

console.log(`${colors.blue}📁 ${files.length}개 파일 검사 중...${colors.reset}\n`);

let totalRemoved = 0;
let filesModified = 0;
const importantUsages = [];

// CSS 특정성을 높이는 헬퍼
function increaseSpecificity(selector, property, value) {
  // 기본 전략: 선택자를 더 구체적으로 만들기
  const strategies = [
    // 1. 클래스를 두 번 반복
    () => {
      if (selector.includes('.')) {
        const className = selector.match(/\.[\w-]+/)?.[0];
        if (className) {
          return `${selector}${className} { ${property}: ${value}; }`;
        }
      }
      return null;
    },
    // 2. :not() 의사 클래스 사용
    () => `${selector}:not(#\\9) { ${property}: ${value}; }`,
    // 3. 속성 선택자 추가
    () => {
      if (selector.includes('.')) {
        return `${selector}[class] { ${property}: ${value}; }`;
      }
      return null;
    },
    // 4. :where() 래퍼 사용 (특정성 0)
    () => `:where(${selector}) { ${property}: ${value}; }`
  ];

  // 첫 번째 성공하는 전략 사용
  for (const strategy of strategies) {
    const result = strategy();
    if (result) return result;
  }
  
  // 기본: 그냥 !important 제거
  return `${selector} { ${property}: ${value}; }`;
}

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let removed = 0;
    
    // !important 찾기 및 제거
    const importantRegex = /([^{};]+)\s*{\s*([^}]*?)([a-zA-Z-]+)\s*:\s*([^;!]+)\s*!important\s*;?([^}]*?)\s*}/g;
    const simpleImportantRegex = /([a-zA-Z-]+)\s*:\s*([^;!]+)\s*!important\s*;/g;
    
    // 복잡한 규칙 처리
    content = content.replace(importantRegex, (match, selector, before, property, value, after) => {
      removed++;
      importantUsages.push({
        file: path.relative(process.cwd(), file),
        selector: selector.trim(),
        property: property.trim(),
        value: value.trim()
      });
      
      // 특정성 증가 시도
      const enhanced = increaseSpecificity(selector.trim(), property.trim(), value.trim());
      return before + enhanced + after;
    });
    
    // 단순한 규칙 처리
    content = content.replace(simpleImportantRegex, (match, property, value) => {
      removed++;
      return `${property}: ${value};`;
    });
    
    // 특별한 케이스 처리
    // 1. display: none !important -> display: none; visibility: hidden;
    content = content.replace(/display\s*:\s*none\s*!important/g, 'display: none; visibility: hidden');
    
    // 2. z-index !important -> 더 높은 z-index 값으로
    content = content.replace(/z-index\s*:\s*(\d+)\s*!important/g, (match, value) => {
      const newValue = parseInt(value) + 1000;
      return `z-index: ${newValue}`;
    });
    
    // 3. width/height 100% !important -> min/max 속성 추가
    content = content.replace(/width\s*:\s*100%\s*!important/g, 'width: 100%; min-width: 100%; max-width: 100%');
    content = content.replace(/height\s*:\s*100%\s*!important/g, 'height: 100%; min-height: 100%; max-height: 100%');
    
    if (removed > 0) {
      fs.writeFileSync(file, content);
      totalRemoved += removed;
      filesModified++;
      console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), file)}: ${removed}개 제거됨`);
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} ${path.relative(process.cwd(), file)}: ${error.message}`);
  }
});

// 결과 출력
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ 완료!${colors.reset}`);
console.log(`  - 총 ${totalRemoved}개의 !important 제거됨`);
console.log(`  - ${filesModified}개 파일 수정됨`);

// 주요 사용 패턴 분석
if (importantUsages.length > 0) {
  console.log(`\n${colors.yellow}📊 주요 !important 사용 패턴:${colors.reset}`);
  
  // 프로퍼티별 통계
  const propertyStats = {};
  importantUsages.forEach(usage => {
    propertyStats[usage.property] = (propertyStats[usage.property] || 0) + 1;
  });
  
  Object.entries(propertyStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([property, count]) => {
      console.log(`  - ${property}: ${count}개`);
    });
}

// 리포트 저장
const report = {
  timestamp: new Date().toISOString(),
  totalRemoved,
  filesModified,
  usages: importantUsages
};

fs.writeFileSync('important-removal-report.json', JSON.stringify(report, null, 2));
console.log(`\n${colors.gray}상세 보고서가 important-removal-report.json에 저장되었습니다.${colors.reset}`);

console.log(`\n${colors.magenta}⚠️  주의사항:${colors.reset}`);
console.log('  - CSS 특정성이 변경되었으므로 스타일을 확인해주세요');
console.log('  - 일부 스타일은 추가 조정이 필요할 수 있습니다');
console.log('  - 브라우저에서 실제 렌더링을 테스트해주세요');