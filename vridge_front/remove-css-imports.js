const fs = require('fs');
const path = require('path');

// CSS import를 제거하는 함수
function removeCSSImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // CSS/SCSS import 패턴
  const cssImportPattern = /^import\s+['"].*\.(css|scss)['"];?\s*$/gm;
  
  if (cssImportPattern.test(content)) {
    content = content.replace(cssImportPattern, '');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Removed CSS imports from: ${filePath}`);
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
      removeCSSImports(fullPath);
    }
  });
}

// src 디렉토리 처리
console.log('🔍 Removing CSS imports from all components...');
processDirectory('./src');
console.log('✨ CSS import removal complete!');