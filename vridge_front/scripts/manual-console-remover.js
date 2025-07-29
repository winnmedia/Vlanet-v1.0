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

console.log(`${colors.cyan}🧹 수동 Console 로그 제거기${colors.reset}\n`);

// 모든 JS/JSX 파일 찾기
const files = glob.sync('src/**/*.{js,jsx}', {
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/*.test.js',
    '**/*.spec.js',
    '**/*.test.jsx',
    '**/*.spec.jsx',
    '**/scripts/**',
    '**/*.backup*'
  ]
});

console.log(`${colors.blue}📁 ${files.length}개 파일 검사 중...${colors.reset}\n`);

let totalRemoved = 0;
let filesModified = 0;

// console 제거를 위한 정규식 패턴들
const patterns = [
  // 기본 console 메서드들 (error와 warn 제외)
  /console\.(log|debug|info|trace|group|groupEnd|groupCollapsed|table|time|timeEnd|count|assert|dir|dirxml|profile|profileEnd)\s*\([^)]*\)\s*;?/g,
  // 멀티라인 console 호출
  /console\.(log|debug|info|trace|group|groupEnd|groupCollapsed|table|time|timeEnd|count|assert|dir|dirxml|profile|profileEnd)\s*\([^)]*\n[^)]*\)\s*;?/g,
  // 백틱을 사용한 템플릿 리터럴
  /console\.(log|debug|info|trace|group|groupEnd|groupCollapsed|table|time|timeEnd|count|assert|dir|dirxml|profile|profileEnd)\s*\(`[^`]*`\)\s*;?/g,
  // 조건부 console
  /if\s*\([^)]*\)\s*{\s*console\.(log|debug|info|trace|group|groupEnd|groupCollapsed)\s*\([^}]*\);\s*}/g,
  // 삼항 연산자 내의 console
  /[^:]+\?\s*console\.(log|debug|info|trace)\s*\([^)]*\)\s*:\s*[^;]+;?/g,
  // && 연산자와 함께 사용된 console
  /[^&]+&&\s*console\.(log|debug|info|trace)\s*\([^)]*\)\s*;?/g
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    let removed = 0;
    
    // 각 패턴으로 console 제거
    patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      removed += matches.length;
      content = content.replace(pattern, '');
    });
    
    // 빈 줄 정리
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
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
console.log(`  - 총 ${totalRemoved}개의 console 로그 제거됨`);
console.log(`  - ${filesModified}개 파일 수정됨`);

console.log(`\n${colors.yellow}💡 참고:${colors.reset}`);
console.log('  - console.error와 console.warn은 유지되었습니다');
console.log('  - 테스트 파일과 백업 파일은 제외되었습니다');
console.log('  - 변경사항을 확인 후 커밋하세요');

// 다시 검사하여 남은 console 확인
const remainingConsoles = [];
files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/console\.(log|debug|info|trace|group|groupEnd)/g);
    if (matches && matches.length > 0) {
      remainingConsoles.push({
        file: path.relative(process.cwd(), file),
        count: matches.length
      });
    }
  } catch (error) {
    // 무시
  }
});

if (remainingConsoles.length > 0) {
  console.log(`\n${colors.red}⚠️ 아직 ${remainingConsoles.length}개 파일에 console이 남아있습니다:${colors.reset}`);
  remainingConsoles.sort((a, b) => b.count - a.count).slice(0, 10).forEach(item => {
    console.log(`  - ${item.file}: ${item.count}개`);
  });
}