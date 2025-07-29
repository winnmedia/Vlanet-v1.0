const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 코드 스플리팅이 필요한 추가 페이지들
const pagesToSplit = [
  'src/page/Cms/FrameworkManagement.jsx',
  'src/page/Cms/InvitationAccept.jsx', 
  'src/page/User/EmailCheck.jsx',
  'src/page/User/ResetPw.jsx',
  'src/page/User/SignupWithEmail.jsx',
  'src/page/Admin/AdminDashboard.jsx',
  'src/page/Admin/EmailMonitor.jsx',
  'src/page/MobileDebug.jsx'
];

// dynamic import로 변환
function convertToDynamicImport(content, filePath) {
  let modified = content;
  let hasChanges = false;
  
  // React와 Next.js dynamic import 추가
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
  
  // 무거운 컴포넌트들을 dynamic import로 변환
  const componentsToLazy = [
    'CalendarEnhanced',
    'ProjectPhaseBoard', 
    'ProjectDashboard',
    'VideoJsPlayer',
    'FeedbackPlayer',
    'ImageCropper',
    'ExportModal'
  ];
  
  componentsToLazy.forEach(comp => {
    // static import 찾기
    const importRegex = new RegExp(`import\\s+${comp}\\s+from\\s+['"]([^'"]+)['"]`, 'g');
    const importMatch = modified.match(importRegex);
    
    if (importMatch) {
      const pathMatch = importMatch[0].match(/from\s+['"]([^'"]+)['"]/);
      if (pathMatch) {
        const importPath = pathMatch[1];
        
        // dynamic import로 변경
        const dynamicImport = `const ${comp} = dynamic(() => import('${importPath}'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});`;
        
        // 기존 import 제거
        modified = modified.replace(importRegex, '');
        
        // dynamic import 추가 (다른 import 문 다음에)
        const lastImportMatch = modified.match(/import[\s\S]+?from\s+['"][^'"]+['"]/g);
        if (lastImportMatch) {
          const lastImport = lastImportMatch[lastImportMatch.length - 1];
          const insertIndex = modified.indexOf(lastImport) + lastImport.length;
          modified = modified.slice(0, insertIndex) + '\n' + dynamicImport + modified.slice(insertIndex);
          hasChanges = true;
        }
      }
    }
  });
  
  // 빈 줄 정리
  modified = modified.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { content: hasChanges ? modified : content, hasChanges };
}

// 파일 처리
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = convertToDynamicImport(content, filePath);
    
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: 코드 스플리팅 적용됨`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// 메인 실행
console.log('🔍 코드 스플리팅 개선 중...\n');

let improvedCount = 0;

pagesToSplit.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (processFile(fullPath)) {
      improvedCount++;
    }
  } else {
    console.log(`⚠️  파일이 존재하지 않음: ${file}`);
  }
});

// 추가로 대용량 컴포넌트 사용 파일 검색
const patterns = ['src/**/*.jsx', 'src/**/*.js'];
const largeComponents = ['CalendarEnhanced', 'ProjectPhaseBoard', 'VideoJsPlayer'];

patterns.forEach(pattern => {
  const files = glob.sync(pattern, {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.js', '**/scripts/**']
  });
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasLargeComponent = largeComponents.some(comp => 
      new RegExp(`import\\s+${comp}\\s+from`).test(content)
    );
    
    if (hasLargeComponent && !pagesToSplit.includes(path.relative(process.cwd(), file))) {
      if (processFile(file)) {
        improvedCount++;
      }
    }
  });
});

console.log(`\n📊 총 ${improvedCount}개 파일에 코드 스플리팅 적용됨`);
console.log('✨ 코드 스플리팅 개선 완료!');