const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Remove ALL console.log statements
function removeConsoleLog(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Various console patterns
  const patterns = [
    // Simple console.log
    /console\.log\([^)]*\);?\s*/g,
    // Multi-line console.log
    /console\.log\([\s\S]*?\);?\s*/g,
    // Console with method chaining
    /console\.[a-zA-Z]+\([^)]*\);?\s*/g,
    // Conditional console
    /if\s*\([^)]*\)\s*console\.[a-zA-Z]+\([^)]*\);?\s*/g,
    // Console in ternary
    /\?\s*console\.[a-zA-Z]+\([^)]*\)\s*:\s*/g,
    // Console as expression
    /[,\s]console\.[a-zA-Z]+\([^)]*\)[,;]?\s*/g
  ];
  
  patterns.forEach(pattern => {
    content = content.replace(pattern, '');
  });
  
  // Clean up empty lines left behind
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Find files with console statements
function findFilesWithConsole() {
  const patterns = [
    'src/**/*.{js,jsx}',
    'pages/**/*.{js,jsx}'
  ];
  
  const files = [];
  patterns.forEach(pattern => {
    const matchedFiles = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: false
    });
    
    matchedFiles.forEach(file => {
      if (file.includes('node_modules') || file.includes('.test.')) return;
      
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('console.')) {
        files.push(file);
      }
    });
  });
  
  return files;
}

// Main execution
console.log('🧹 모든 console 문 제거 스크립트\n');

const filesWithConsole = findFilesWithConsole();
console.log(`📊 console이 있는 파일: ${filesWithConsole.length}개\n`);

let cleanedCount = 0;

filesWithConsole.forEach(file => {
  if (removeConsoleLog(file)) {
    console.log(`✅ ${file}`);
    cleanedCount++;
  }
});

console.log(`\n🎯 총 ${cleanedCount}개 파일에서 console 제거 완료!`);