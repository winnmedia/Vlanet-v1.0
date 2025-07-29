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
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🧹 최종 Console 청소기${colors.reset}\n`);

// 특정 파일들 직접 처리
const problematicFiles = [
  'src/page/Cms/Feedback.jsx',
  'src/utils/logger.js',
  'src/config/axios.js',
  'src/config/axios-original.js',
  'src/components/FeedbackPlayer.jsx',
  'src/page/User/MyPage.jsx',
  'src/page/User/MyPage.migrated.jsx',
  'src/util/util.js',
  'src/store/navigationStore.js'
];

let totalRemoved = 0;
let filesModified = 0;

// 가장 강력한 패턴들
const aggressivePatterns = [
  // 기본 console 메서드
  /console\s*\.\s*(log|debug|info|trace|group|groupEnd|groupCollapsed|table|time|timeEnd|count|assert|dir|dirxml|profile|profileEnd)\s*\([^)]*\)[;,]?\s*/g,
  
  // 멀티라인 console
  /console\s*\.\s*(log|debug|info|trace|group|groupEnd)\s*\([^)]*\n[^)]*\)[;,]?\s*/gm,
  
  // 백틱 템플릿
  /console\s*\.\s*(log|debug|info|trace)\s*\(`[\s\S]*?`\)[;,]?\s*/g,
  
  // 변수에 할당된 console
  /const\s+\w+\s*=\s*console\s*\.\s*(log|debug|info|trace)[;,]?\s*/g,
  
  // if 문 안의 console
  /if\s*\([^)]*\)\s*{\s*console\s*\.\s*(log|debug|info|trace)\s*\([^}]*\);\s*}/g,
  
  // 삼항 연산자의 console
  /[^:?]+\?\s*console\s*\.\s*(log|debug|info|trace)\s*\([^)]*\)\s*:\s*[^;,]+[;,]?\s*/g,
  
  // && 연산자와 console
  /[^&\s]+\s*&&\s*console\s*\.\s*(log|debug|info|trace)\s*\([^)]*\)[;,]?\s*/g,
  
  // || 연산자와 console
  /[^|\s]+\s*\|\|\s*console\s*\.\s*(log|debug|info|trace)\s*\([^)]*\)[;,]?\s*/g,
  
  // 함수 내부의 단독 console 라인
  /^\s*console\s*\.\s*(log|debug|info|trace|group|groupEnd)\s*\([^)]*\)[;,]?\s*$/gm,
  
  // return 전의 console
  /console\s*\.\s*(log|debug|info|trace)\s*\([^)]*\)[;,]?\s*\n\s*return/g,
  
  // 주석처리된 console도 제거
  /\/\/\s*console\s*\.\s*(log|debug|info|trace)\s*\([^)]*\)[;,]?\s*/g
];

// 특별 처리가 필요한 파일들
const specialHandlers = {
  'src/utils/logger.js': (content) => {
    // logger.js는 console을 래핑하는 유틸리티이므로 내부 console.log 제거
    return content
      .replace(/console\.log\([^)]*\);?/g, '')
      .replace(/console\.debug\([^)]*\);?/g, '')
      .replace(/console\.info\([^)]*\);?/g, '');
  },
  'src/config/axios.js': (content) => {
    // axios 인터셉터의 console 제거
    return content
      .replace(/console\.(log|error|warn)\([^)]*\);?\s*/g, '')
      .replace(/\/\/\s*console\.[^;]+;?\s*/g, '');
  },
  'src/page/Cms/Feedback.jsx': (content) => {
    // Feedback.jsx의 대량 console 제거
    let cleaned = content;
    // 모든 패턴 적용
    aggressivePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    // 빈 줄 정리
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    return cleaned;
  }
};

// 모든 파일 처리
const allFiles = glob.sync('src/**/*.{js,jsx}', {
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/*.test.js',
    '**/*.spec.js',
    '**/scripts/**',
    '**/*.backup*'
  ]
});

allFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    let removed = 0;
    
    // 특별 처리가 필요한 파일인지 확인
    const fileName = path.relative(process.cwd(), file);
    if (specialHandlers[fileName]) {
      content = specialHandlers[fileName](content);
      removed = (originalContent.match(/console\./g) || []).length - 
                (content.match(/console\./g) || []).length;
    } else {
      // 일반 파일 처리
      aggressivePatterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        removed += matches.length;
        content = content.replace(pattern, '');
      });
    }
    
    // 빈 줄 정리
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // try-catch 블록 내의 빈 catch 정리
    content = content.replace(/catch\s*\([^)]*\)\s*{\s*}/g, 'catch (e) { /* 에러 무시 */ }');
    
    if (removed > 0) {
      fs.writeFileSync(file, content);
      totalRemoved += removed;
      filesModified++;
      console.log(`${colors.green}✓${colors.reset} ${fileName}: ${removed}개 제거됨`);
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} ${path.relative(process.cwd(), file)}: ${error.message}`);
  }
});

// 결과 출력
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ 완료!${colors.reset}`);
console.log(`  - 총 ${totalRemoved}개의 console 로그 제거됨`);
console.log(`  - ${filesModified}개 파일 수정됨`);

// 재검사
console.log(`\n${colors.yellow}🔍 재검사 중...${colors.reset}`);
let remainingCount = 0;
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/console\.(log|debug|info|trace|group|groupEnd)/g);
  if (matches) {
    remainingCount += matches.length;
  }
});

console.log(`  - 남은 console: ${remainingCount}개`);

if (remainingCount > 0) {
  console.log(`\n${colors.red}⚠️ 아직 console이 남아있습니다.${colors.reset}`);
  console.log('  - console.error와 console.warn은 의도적으로 유지됩니다');
  console.log('  - 일부 특수한 경우는 수동 확인이 필요할 수 있습니다');
}