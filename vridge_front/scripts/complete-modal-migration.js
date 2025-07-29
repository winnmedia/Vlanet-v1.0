const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 모든 모달 관련 패턴을 찾아 완전히 마이그레이션
function findAndMigrateAllModals() {
  const patterns = [
    'src/**/*.{jsx,js}',
    'pages/**/*.{jsx,js}'
  ];
  
  const ignorePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.js',
    '**/scripts/**'
  ];
  
  const modalComponents = new Map();
  
  // 1단계: 모든 모달 관련 컴포넌트 찾기
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ignorePatterns
    });
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // 다양한 모달 패턴 검색
      const modalPatterns = [
        // React Modal 패턴
        /import\s+Modal\s+from\s+['"]react-modal['"]/g,
        // Ant Design Modal
        /import\s*{\s*Modal\s*}\s*from\s*['"]antd['"]/g,
        // 커스텀 모달 컴포넌트
        /import\s+\w*Modal\w*\s+from/g,
        // 모달 상태 관리
        /const\s+\[.*[Mm]odal.*,\s*set.*[Mm]odal.*\]/g,
        // 모달 렌더링 패턴
        /<\w*[Mm]odal\w*[\s>]/g,
        // 조건부 모달 렌더링
        /\{.*[Mm]odal.*&&.*\(/g,
        // className에 modal 포함
        /className=.*['"][^'"]*modal[^'"]*['"]/g
      ];
      
      let hasModal = false;
      const matches = [];
      
      modalPatterns.forEach(pattern => {
        const found = content.match(pattern);
        if (found) {
          hasModal = true;
          matches.push(...found);
        }
      });
      
      if (hasModal) {
        const relPath = path.relative(process.cwd(), file);
        modalComponents.set(relPath, {
          matches: [...new Set(matches)],
          hasUnifiedModal: /UnifiedModal/.test(content),
          content
        });
      }
    });
  });
  
  return modalComponents;
}

// 모달 마이그레이션 함수
function migrateModalToUnified(content, filePath) {
  let modified = content;
  let hasChanges = false;
  
  // 1. Import 정리
  // React Modal 제거
  modified = modified.replace(/import\s+Modal\s+from\s+['"]react-modal['"]\s*;?\s*\n?/g, '');
  
  // Ant Design Modal 제거
  modified = modified.replace(
    /import\s*{\s*([^}]*)\s*}\s*from\s*['"]antd['"]/g,
    (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const filtered = importList.filter(i => !i.includes('Modal'));
      if (filtered.length === 0) return '';
      hasChanges = true;
      return `import { ${filtered.join(', ')} } from 'antd'`;
    }
  );
  
  // UnifiedModal import 추가 (없는 경우)
  if (!modified.includes('UnifiedModal') && modified.includes('Modal')) {
    const importRegex = /import[\s\S]+?from\s+['"][^'"]+['"]/;
    const match = modified.match(importRegex);
    if (match) {
      const insertPos = match.index + match[0].length;
      const importPath = filePath.includes('pages/') 
        ? '../components/unified/UnifiedModal'
        : '../../components/unified/UnifiedModal';
      modified = modified.slice(0, insertPos) + 
        `\nimport UnifiedModal from '${importPath}';` + 
        modified.slice(insertPos);
      hasChanges = true;
    }
  }
  
  // 2. 컴포넌트 이름 변경
  modified = modified.replace(/<Modal\s+/g, '<UnifiedModal ');
  modified = modified.replace(/<\/Modal>/g, '</UnifiedModal>');
  
  // 3. Props 표준화
  modified = modified.replace(/\bvisible=/g, 'open=');
  modified = modified.replace(/\bonCancel=/g, 'onClose=');
  modified = modified.replace(/\bfooter={null}/g, 'showFooter={false}');
  modified = modified.replace(/\bclosable={false}/g, 'showClose={false}');
  modified = modified.replace(/\bmaskClosable=/g, 'closeOnBackdropClick=');
  modified = modified.replace(/\bwidth=/g, 'size=');
  
  // 4. 상태 변수명 표준화
  modified = modified.replace(/showModal/g, 'isModalOpen');
  modified = modified.replace(/setShowModal/g, 'setIsModalOpen');
  modified = modified.replace(/modalVisible/g, 'isModalOpen');
  modified = modified.replace(/setModalVisible/g, 'setIsModalOpen');
  modified = modified.replace(/modalOpen/g, 'isModalOpen');
  modified = modified.replace(/setModalOpen/g, 'setIsModalOpen');
  
  // 5. 커스텀 모달 div를 UnifiedModal로 변환
  const customModalRegex = /<div\s+className=["']([^"']*\bmodal\b[^"']*)["']([^>]*)>([\s\S]*?)<\/div>/g;
  modified = modified.replace(customModalRegex, (match, className, attrs, children) => {
    // modal-backdrop, modal-overlay는 제외
    if (className.includes('backdrop') || className.includes('overlay')) {
      return match;
    }
    hasChanges = true;
    return `<UnifiedModal open={true} onClose={() => {}} className="${className}"${attrs}>${children}</UnifiedModal>`;
  });
  
  if (modified !== content) {
    hasChanges = true;
  }
  
  return { content: modified, hasChanges };
}

// 메인 실행
console.log('🔍 모든 모달 컴포넌트 검색 중...\n');

const modalComponents = findAndMigrateAllModals();

console.log(`📊 발견된 모달 사용 파일: ${modalComponents.size}개\n`);

// UnifiedModal 미사용 파일 분류
const needsMigration = [];
const alreadyMigrated = [];

modalComponents.forEach((info, file) => {
  if (info.hasUnifiedModal) {
    alreadyMigrated.push(file);
  } else {
    needsMigration.push(file);
  }
});

console.log(`✅ 이미 UnifiedModal 사용: ${alreadyMigrated.length}개`);
console.log(`❌ 마이그레이션 필요: ${needsMigration.length}개\n`);

if (needsMigration.length > 0) {
  console.log('🔄 마이그레이션 시작...\n');
  
  let successCount = 0;
  needsMigration.forEach(file => {
    try {
      const fullPath = path.join(process.cwd(), file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const { content: newContent, hasChanges } = migrateModalToUnified(content, file);
      
      if (hasChanges) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`✅ ${file}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  });
  
  console.log(`\n✨ ${successCount}개 파일 마이그레이션 완료!`);
}

// 최종 통계
const finalCheck = findAndMigrateAllModals();
const finalUnified = Array.from(finalCheck.values()).filter(info => info.hasUnifiedModal).length;
const percentage = (finalUnified / finalCheck.size * 100).toFixed(1);

console.log(`\n📈 최종 모달 일관성: ${percentage}% (${finalUnified}/${finalCheck.size})`);
console.log('\n💡 남은 작업:');
console.log('- 커스텀 모달 패턴 수동 확인 필요');
console.log('- 동적으로 생성되는 모달 검토');