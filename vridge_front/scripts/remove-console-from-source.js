const fs = require('fs');
const path = require('path');
const glob = require('glob');

// console 제거 함수
function removeConsoleStatements(content) {
  let modified = content;
  let changeCount = 0;
  
  // console.log, console.error, console.warn 등 제거
  const consolePatterns = [
    // 단일 라인 console
    /^\s*console\.(log|error|warn|info|debug|trace|time|timeEnd)\([^)]*\);?\s*$/gm,
    // 멀티라인 console
    /^\s*console\.(log|error|warn|info|debug|trace|time|timeEnd)\([^)]*\n[^)]*\);?\s*$/gm,
    // if문 내부의 console
    /if\s*\([^)]*\)\s*{\s*console\.(log|error|warn|info|debug|trace)\([^)]*\);?\s*}/g,
    // 조건부 console
    /[^;]+&&\s*console\.(log|error|warn|info|debug|trace)\([^)]*\);?/g
  ];
  
  consolePatterns.forEach(pattern => {
    const matches = modified.match(pattern);
    if (matches) {
      changeCount += matches.length;
      modified = modified.replace(pattern, '');
    }
  });
  
  // 빈 줄 정리
  modified = modified.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { content: modified, changeCount };
}

// 파일 처리
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, changeCount } = removeConsoleStatements(content);
    
    if (changeCount > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath}: ${changeCount}개 console 제거됨`);
      return changeCount;
    }
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// 메인 실행
console.log('🔍 소스 파일에서 console 문 검색중...\n');

const patterns = [
  'src/**/*.jsx',
  'src/**/*.js',
  'pages/**/*.jsx',
  'pages/**/*.js'
];

// scripts 폴더와 테스트 파일 제외
const ignorePatterns = [
  '**/node_modules/**', 
  '**/dist/**', 
  '**/build/**', 
  '**/*.test.js', 
  '**/*.spec.js',
  '**/scripts/**',
  '**/__tests__/**',
  '**/utils/logger.js' // logger 유틸리티는 console 사용 가능
];

let totalFiles = 0;
let totalConsoleRemoved = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { 
    cwd: path.join(__dirname, '..'),
    absolute: true,
    ignore: ignorePatterns
  });
  
  files.forEach(file => {
    totalFiles++;
    const removed = processFile(file);
    totalConsoleRemoved += removed;
  });
});

console.log('\n📊 요약:');
console.log(`총 검사 파일: ${totalFiles}개`);
console.log(`제거된 console 문: ${totalConsoleRemoved}개`);
console.log('\n✨ console 제거 완료!');