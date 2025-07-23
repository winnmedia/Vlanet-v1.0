const fs = require('fs');
const path = require('path');

// SSR 구문 오류를 수정하는 함수
function fixSSRSyntax(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 잘못된 구문 패턴들
  const patterns = [
    // window.( 패턴 수정
    {
      pattern: /window\.\(typeof window !== 'undefined' && ([\w.]+)/g,
      replacement: 'typeof window !== \'undefined\' && window.$1'
    },
    // document.( 패턴 수정
    {
      pattern: /\(typeof window !== 'undefined' && document\.([a-zA-Z]+) =/g,
      replacement: 'typeof window !== \'undefined\' && (document.$1 ='
    },
    // 여러 줄의 잘못된 패턴
    {
      pattern: /\(typeof window !== 'undefined' && localStorage\.(getItem|setItem|removeItem)\(/g,
      replacement: 'typeof window !== \'undefined\' && localStorage.$1('
    },
    // 잘못된 window.location 패턴
    {
      pattern: /\(typeof window !== 'undefined' && window\.location\.(href|pathname|hostname)/g,
      replacement: 'typeof window !== \'undefined\' && window.location.$1'
    }
  ];
  
  // 패턴 적용
  patterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed SSR syntax in: ${filePath}`);
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
      fixSSRSyntax(fullPath);
    }
  });
}

// src 디렉토리 처리
console.log('🔍 Fixing SSR syntax errors...');
processDirectory('./src');
console.log('✨ SSR syntax fix complete!');