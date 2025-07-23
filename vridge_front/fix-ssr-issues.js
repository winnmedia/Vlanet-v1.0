const fs = require('fs');
const path = require('path');

// SSR 문제를 수정하는 함수
function fixSSRIssues(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // localStorage 직접 사용 패턴
  const localStoragePatterns = [
    // 즉시 실행되는 localStorage
    {
      pattern: /const\s+savedImage\s*=\s*localStorage\.getItem\('profileImage'\)/g,
      replacement: "const savedImage = typeof window !== 'undefined' ? localStorage.getItem('profileImage') : null"
    },
    // setState 초기값에서의 localStorage
    {
      pattern: /useState\(\(\)\s*=>\s*{\s*\/\/[^}]*?const\s+savedImage\s*=\s*localStorage/g,
      replacement: "useState(() => {\n    // localStorage에서 프로필 이미지 불러오기\n    if (typeof window !== 'undefined') {\n      const savedImage = localStorage"
    },
    // 단순 localStorage 사용
    {
      pattern: /([^'])\blocalStorage\.(getItem|setItem|removeItem)\(/g,
      replacement: "$1(typeof window !== 'undefined' && localStorage.$2("
    }
  ];
  
  // window 직접 사용 패턴
  const windowPatterns = [
    {
      pattern: /([^'])\bwindow\.location\./g,
      replacement: "$1(typeof window !== 'undefined' && window.location."
    },
    {
      pattern: /([^'])\bdocument\.(cookie|getElementById|querySelector)/g,
      replacement: "$1(typeof window !== 'undefined' && document.$2"
    }
  ];
  
  // localStorage 패턴 적용
  localStoragePatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  // window 패턴 적용
  windowPatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed SSR issues in: ${filePath}`);
  }
  
  return modified;
}

// 재귀적으로 파일 탐색
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.js'))) {
      fixSSRIssues(fullPath);
    }
  });
}

// src 디렉토리 처리
console.log('🔍 Fixing SSR issues...');
processDirectory('./src');
processDirectory('./pages');
console.log('✨ SSR fix complete!');