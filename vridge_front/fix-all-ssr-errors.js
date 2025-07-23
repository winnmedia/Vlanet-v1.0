const fs = require('fs');
const path = require('path');

function fixAllSSRErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 모든 SSR 패턴을 수정
  const patterns = [
    // 잘못된 괄호 패턴
    {
      pattern: /typeof window !== 'undefined' && \(document\.cookie = ([^;]+);/g,
      replacement: (match, p1) => `if (typeof window !== 'undefined') {\n          document.cookie = ${p1};\n        }`
    },
    {
      pattern: /typeof window !== 'undefined' && \(window\.location\.([a-zA-Z]+) = ([^;]+);/g,
      replacement: (match, p1, p2) => `if (typeof window !== 'undefined') {\n        window.location.${p1} = ${p2};\n      }`
    },
    // 논리 연산자 패턴
    {
      pattern: /typeof window !== 'undefined' && window\.location\.([a-zA-Z]+) = ([^;]+);/g,
      replacement: (match, p1, p2) => `if (typeof window !== 'undefined') {\n        window.location.${p1} = ${p2};\n      }`
    },
    {
      pattern: /typeof window !== 'undefined' && localStorage\.([a-zA-Z]+)\(([^)]+)\)/g,
      replacement: (match, p1, p2) => `typeof window !== 'undefined' && localStorage.${p1}(${p2})`
    },
    // 중복된 typeof 체크
    {
      pattern: /typeof window !== 'undefined' \? typeof window !== 'undefined' && ([^:]+) : /g,
      replacement: (match, p1) => `typeof window !== 'undefined' ? ${p1} : `
    },
    // 잘못된 논리 연산자
    {
      pattern: /\!typeof window !== 'undefined' && window/g,
      replacement: `!(typeof window !== 'undefined') || !window`
    }
  ];
  
  patterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed all SSR errors in: ${filePath}`);
  }
  
  return modified;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.js'))) {
      fixAllSSRErrors(fullPath);
    }
  });
}

console.log('🔍 Fixing all SSR errors...');
processDirectory('./src');
console.log('✨ All SSR errors fixed!');