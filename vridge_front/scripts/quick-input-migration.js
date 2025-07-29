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

console.log(`${colors.cyan}🔄 빠른 Input 마이그레이션${colors.reset}\n`);

// 모든 JSX 파일 찾기
const files = glob.sync('src/**/*.{jsx,js}', {
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/*.test.js',
    '**/*.spec.js',
    '**/unified/**',
    '**/scripts/**'
  ]
});

console.log(`${colors.blue}📁 ${files.length}개 파일 검사 중...${colors.reset}\n`);

let totalMigrated = 0;
let filesModified = 0;
const errors = [];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    let modified = false;
    
    // input 태그를 UnifiedInput으로 변경
    const inputRegex = /<input\s+([^>]*?)\/>/g;
    const inputWithClosingRegex = /<input\s+([^>]*?)>([^<]*)<\/input>/g;
    
    // self-closing input tags
    content = content.replace(inputRegex, (match, attrs) => {
      // type="submit"이나 type="button"은 제외
      if (attrs.includes('type="submit"') || attrs.includes('type="button"') || 
          attrs.includes("type='submit'") || attrs.includes("type='button'")) {
        return match;
      }
      
      totalMigrated++;
      modified = true;
      
      // className 처리
      attrs = attrs.replace(/className=/g, 'className=');
      
      // type 속성 확인
      let type = 'text';
      const typeMatch = attrs.match(/type=["']([^"']+)["']/);
      if (typeMatch) {
        type = typeMatch[1];
      }
      
      // size 추론
      let size = 'medium';
      if (attrs.includes('small') || attrs.includes('sm')) size = 'small';
      if (attrs.includes('large') || attrs.includes('lg')) size = 'large';
      
      return `<UnifiedInput ${attrs} />`;
    });
    
    // input tags with closing tag
    content = content.replace(inputWithClosingRegex, (match, attrs, children) => {
      if (attrs.includes('type="submit"') || attrs.includes('type="button"')) {
        return match;
      }
      
      totalMigrated++;
      modified = true;
      
      return `<UnifiedInput ${attrs}>${children}</UnifiedInput>`;
    });
    
    // Input 컴포넌트도 변경 (커스텀 Input 컴포넌트)
    const customInputRegex = /<Input\s+([^>]*?)\/>/g;
    content = content.replace(customInputRegex, (match, attrs) => {
      if (file.includes('unified')) return match;
      
      totalMigrated++;
      modified = true;
      return `<UnifiedInput ${attrs} />`;
    });
    
    // import 추가
    if (modified && !content.includes('UnifiedInput')) {
      const importRegex = /(import[\s\S]*?from\s+['"][^'"]+['"];?\n)/;
      const lastImport = content.match(importRegex);
      
      if (lastImport) {
        const relPath = path.relative(path.dirname(file), 'src/components/unified/UnifiedInput').replace(/\\/g, '/');
        const importStatement = `import UnifiedInput from '${relPath.startsWith('.') ? relPath : './' + relPath}';\n`;
        
        // 마지막 import 뒤에 추가
        const imports = content.match(/import[\s\S]*?from\s+['"][^'"]+['"];?\n/g);
        if (imports && imports.length > 0) {
          const lastImportIndex = content.lastIndexOf(imports[imports.length - 1]);
          const insertPosition = lastImportIndex + imports[imports.length - 1].length;
          content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      filesModified++;
      console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), file)}: input 태그 마이그레이션됨`);
    }
  } catch (error) {
    errors.push({ file: path.relative(process.cwd(), file), error: error.message });
  }
});

// 결과 출력
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ 완료!${colors.reset}`);
console.log(`  - 총 ${totalMigrated}개의 input 마이그레이션됨`);
console.log(`  - ${filesModified}개 파일 수정됨`);

if (errors.length > 0) {
  console.log(`\n${colors.red}⚠️ ${errors.length}개 파일에서 오류 발생:${colors.reset}`);
  errors.slice(0, 5).forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
}

console.log(`\n${colors.yellow}💡 참고:${colors.reset}`);
console.log('  - type="submit"과 type="button"은 제외되었습니다');
console.log('  - import 경로를 확인해주세요');
console.log('  - 스타일이 제대로 적용되는지 테스트하세요');