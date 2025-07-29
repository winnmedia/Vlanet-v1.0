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

console.log(`${colors.cyan}🧹 전체 Console 제거기${colors.reset}\n`);

// 모든 JS/JSX 파일 찾기
const files = glob.sync('src/**/*.{js,jsx}', {
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/*.test.js',
    '**/*.spec.js',
    '**/*.test.jsx',
    '**/*.spec.jsx',
    '**/scripts/**',
    '**/*.backup*',
    '**/logger.js' // logger 파일 제외
  ]
});

console.log(`${colors.blue}📁 ${files.length}개 파일 검사 중...${colors.reset}\n`);

let totalRemoved = 0;
let filesModified = 0;

// 모든 console 패턴
const consolePatterns = [
  // 표준 console 메서드
  /console\s*\.\s*(log|debug|info|trace|group|groupEnd|groupCollapsed|table|time|timeEnd|count|assert|dir|dirxml|profile|profileEnd|error|warn)\s*\([^)]*\)\s*;?/g,
  // 멀티라인 console
  /console\s*\.\s*(log|debug|info|trace|error|warn)\s*\([^)]*\n[^)]*\)\s*;?/gm,
  // 템플릿 리터럴
  /console\s*\.\s*(log|debug|info|trace|error|warn)\s*\(`[\s\S]*?`\)\s*;?/g,
  // 조건부 console
  /[^&|]*&&\s*console\s*\.\s*(log|debug|info|trace|error|warn)\s*\([^)]*\)\s*;?/g,
  /[^&|]*\|\|\s*console\s*\.\s*(log|debug|info|trace|error|warn)\s*\([^)]*\)\s*;?/g,
  // try-catch 내의 console
  /catch\s*\([^)]*\)\s*{\s*console\s*\.\s*(log|error|warn)\s*\([^}]*\)\s*;?\s*}/g
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    let removed = 0;
    
    // 각 패턴으로 console 제거
    consolePatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      removed += matches.length;
      content = content.replace(pattern, (match) => {
        // catch 블록의 경우 빈 블록 유지
        if (match.includes('catch')) {
          return 'catch (e) {}';
        }
        // && 또는 || 연산자의 경우 연산자 제거
        if (match.includes('&&') || match.includes('||')) {
          return '';
        }
        return '';
      });
    });
    
    // 빈 줄 정리
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.replace(/{\s*\n\s*\n\s*}/g, '{\n}');
    
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
console.log(`  - 총 ${totalRemoved}개의 console 제거됨`);
console.log(`  - ${filesModified}개 파일 수정됨`);

// 검증
console.log(`\n${colors.yellow}🔍 검증 중...${colors.reset}`);
let remainingConsoles = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/console\./g) || [];
  remainingConsoles += matches.length;
});

console.log(`  - 남은 console: ${remainingConsoles}개`);

if (remainingConsoles === 0) {
  console.log(`\n${colors.green}✨ 모든 console이 성공적으로 제거되었습니다!${colors.reset}`);
} else {
  console.log(`\n${colors.yellow}⚠️ 일부 console이 남아있을 수 있습니다.${colors.reset}`);
}