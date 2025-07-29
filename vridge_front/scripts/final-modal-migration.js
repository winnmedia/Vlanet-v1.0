const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 남은 모달 패턴을 UnifiedModal로 완전히 변환
function completeModalMigration(content, filePath) {
  let modified = content;
  let hasChanges = false;
  
  // 1. Ant Design Modal import 제거 및 UnifiedModal import 추가
  if (content.includes("from 'antd'") && content.includes('Modal')) {
    // antd에서 Modal 제거
    modified = modified.replace(
      /import\s*{\s*([^}]*)\s*}\s*from\s*['"]antd['"]/g,
      (match, imports) => {
        const importList = imports.split(',').map(i => i.trim());
        const filteredImports = importList.filter(i => !i.includes('Modal'));
        if (filteredImports.length === 0) {
          hasChanges = true;
          return ''; // 전체 import 제거
        }
        hasChanges = true;
        return `import { ${filteredImports.join(', ')} } from 'antd'`;
      }
    );
    
    // UnifiedModal import 추가
    if (!content.includes('UnifiedModal')) {
      const importMatch = content.match(/import[\s\S]+?from\s+['"][^'"]+['"]/);
      if (importMatch) {
        const importEndIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
        modified = modified.slice(0, importEndIndex) + 
          "\nimport UnifiedModal from '../components/unified/UnifiedModal';" + 
          content.slice(importEndIndex);
        hasChanges = true;
      }
    }
  }
  
  // 2. 모달 상태 변수명 표준화
  const modalStatePatterns = [
    { from: /showModal/g, to: 'isModalOpen' },
    { from: /setShowModal/g, to: 'setIsModalOpen' },
    { from: /modalVisible/g, to: 'isModalOpen' },
    { from: /setModalVisible/g, to: 'setIsModalOpen' },
    { from: /isOpen/g, to: 'open' }
  ];
  
  modalStatePatterns.forEach(pattern => {
    if (modified.match(pattern.from)) {
      modified = modified.replace(pattern.from, pattern.to);
      hasChanges = true;
    }
  });
  
  // 3. Modal 컴포넌트를 UnifiedModal로 변경
  modified = modified.replace(/<Modal\s+/g, '<UnifiedModal ');
  modified = modified.replace(/<\/Modal>/g, '</UnifiedModal>');
  
  // 4. props 표준화
  modified = modified.replace(/visible=/g, 'open=');
  modified = modified.replace(/onCancel=/g, 'onClose=');
  modified = modified.replace(/footer={null}/g, 'showFooter={false}');
  
  return { content: hasChanges ? modified : content, hasChanges };
}

// 파일 처리
const patterns = [
  'src/**/*.jsx',
  'src/**/*.js',
  'pages/**/*.jsx',
  'pages/**/*.js'
];

const ignorePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.js',
  '**/scripts/**',
  '**/unified/**'
];

console.log('🔄 최종 모달 마이그레이션 진행 중...\n');

let totalFiles = 0;
let migratedFiles = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, {
    cwd: process.cwd(),
    absolute: true,
    ignore: ignorePatterns
  });
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // 모달 관련 코드가 있는지 확인
      if (content.includes('Modal') || content.includes('modal')) {
        totalFiles++;
        
        const { content: newContent, hasChanges } = completeModalMigration(content, file);
        
        if (hasChanges) {
          fs.writeFileSync(file, newContent, 'utf8');
          console.log(`✅ ${path.relative(process.cwd(), file)}: 모달 마이그레이션 완료`);
          migratedFiles++;
        }
      }
    } catch (error) {
      console.error(`❌ ${path.relative(process.cwd(), file)}: ${error.message}`);
    }
  });
});

console.log(`\n📊 결과:`);
console.log(`- 모달 사용 파일: ${totalFiles}개`);
console.log(`- 마이그레이션된 파일: ${migratedFiles}개`);
console.log('\n✨ 모달 마이그레이션 완료!');