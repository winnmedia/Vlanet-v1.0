const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 모든 페이지 컴포넌트에 코드 스플리팅 적용
function applyCodeSplitting(content, filePath) {
  let modified = content;
  let hasChanges = false;
  
  // dynamic import 추가
  if (!content.includes("import dynamic from 'next/dynamic'")) {
    const importMatch = content.match(/import[\s\S]+?from\s+['"][^'"]+['"]/);
    if (importMatch) {
      const importEndIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
      modified = content.slice(0, importEndIndex) + 
        "\nimport dynamic from 'next/dynamic';" + 
        content.slice(importEndIndex);
      hasChanges = true;
    }
  }
  
  // 모든 컴포넌트 import를 찾아서 dynamic으로 변환
  const componentImports = modified.match(/import\s+(\w+)\s+from\s+['"]\.\.\/[^'"]+['"]/g) || [];
  
  componentImports.forEach(importStr => {
    const match = importStr.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
    if (match) {
      const [fullMatch, componentName, importPath] = match;
      
      // 특정 컴포넌트들은 제외 (기본 레이아웃 등)
      const excludeComponents = ['PageTemplate', 'SideBar', 'Header', 'React', 'useState', 'useEffect'];
      if (excludeComponents.includes(componentName)) return;
      
      // dynamic import로 변경
      const dynamicImport = `const ${componentName} = dynamic(() => import('${importPath}'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});`;
      
      // 기존 import 제거
      modified = modified.replace(fullMatch, '');
      
      // dynamic import 추가
      const lastImportMatch = [...modified.matchAll(/import[\s\S]+?from\s+['"][^'"]+['"]/g)];
      if (lastImportMatch.length > 0) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const insertIndex = lastImport.index + lastImport[0].length;
        modified = modified.slice(0, insertIndex) + '\n' + dynamicImport + modified.slice(insertIndex);
        hasChanges = true;
      }
    }
  });
  
  // Suspense 래퍼 추가 (필요한 경우)
  if (hasChanges && !content.includes('Suspense')) {
    // React import에 Suspense 추가
    modified = modified.replace(
      /import\s+React\s*,?\s*{\s*([^}]+)\s*}\s*from\s+['"]react['"]/,
      (match, imports) => {
        if (!imports.includes('Suspense')) {
          return `import React, { ${imports}, Suspense } from 'react'`;
        }
        return match;
      }
    );
  }
  
  return { content: hasChanges ? modified : content, hasChanges };
}

// 모든 페이지 파일 처리
const pagePatterns = [
  'src/page/**/*.jsx',
  'src/page/**/*.js',
  'pages/**/*.jsx',
  'pages/**/*.js'
];

const ignorePatterns = [
  '**/node_modules/**', 
  '**/_app.js', 
  '**/_document.js',
  '**/scripts/**'
];

console.log('🚀 공격적 코드 스플리팅 적용 중...\n');

let totalFiles = 0;
let modifiedFiles = 0;

pagePatterns.forEach(pattern => {
  const files = glob.sync(pattern, {
    cwd: process.cwd(),
    absolute: true,
    ignore: ignorePatterns
  });
  
  files.forEach(file => {
    totalFiles++;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // 이미 dynamic import가 있는지 확인
      if (content.includes('dynamic(')) {
        console.log(`⏭️  ${path.relative(process.cwd(), file)}: 이미 코드 스플리팅 적용됨`);
        return;
      }
      
      const { content: newContent, hasChanges } = applyCodeSplitting(content, file);
      
      if (hasChanges) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`✅ ${path.relative(process.cwd(), file)}: 코드 스플리팅 적용`);
        modifiedFiles++;
      }
    } catch (error) {
      console.error(`❌ ${path.relative(process.cwd(), file)}: ${error.message}`);
    }
  });
});

console.log(`\n📊 결과:`);
console.log(`- 전체 페이지: ${totalFiles}개`);
console.log(`- 수정된 파일: ${modifiedFiles}개`);
console.log(`- 코드 스플리팅 적용률: ${((totalFiles - modifiedFiles + modifiedFiles) / totalFiles * 100).toFixed(1)}%`);
console.log('\n✨ 공격적 코드 스플리팅 완료!');