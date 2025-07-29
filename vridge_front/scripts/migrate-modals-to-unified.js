const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 모달 관련 패턴들
const modalPatterns = [
  // CustomModal, Modal, ModalComponent 등의 import 패턴
  /import\s+(?:{\s*)?(?:CustomModal|Modal|ModalComponent)(?:\s*})?\s+from\s+['"][^'"]+['"]/g,
  // 모달 컴포넌트 사용 패턴
  /<(?:CustomModal|Modal|ModalComponent)(\s+[^>]*)?>/g,
  /<\/(?:CustomModal|Modal|ModalComponent)>/g,
  // div를 사용한 모달 패턴
  /<div\s+className=["']([^"']*\b(?:modal|dialog|popup)\b[^"']*)["'](\s+[^>]*)?>[\s\S]*?<\/div>/g
];

// UnifiedModal로 변환
function migrateToUnifiedModal(content, filePath) {
  let modified = content;
  let hasChanges = false;
  
  // UnifiedModal import 추가 여부 확인
  const hasUnifiedModalImport = /import\s+(?:{\s*)?UnifiedModal(?:\s*})?\s+from/.test(content);
  const hasModalUsage = modalPatterns.some(pattern => pattern.test(content));
  
  if (hasModalUsage && !hasUnifiedModalImport) {
    // import 문 찾기
    const importMatch = content.match(/import[\s\S]+?from\s+['"][^'"]+['"]/);
    if (importMatch) {
      const importEndIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
      modified = content.slice(0, importEndIndex) + 
        "\nimport UnifiedModal from '../../components/unified/UnifiedModal';" + 
        content.slice(importEndIndex);
      hasChanges = true;
    }
  }
  
  // CustomModal, Modal import 제거
  modified = modified.replace(/import\s+(?:{\s*)?(?:CustomModal|Modal|ModalComponent)(?:\s*})?\s+from\s+['"][^'"]+['"]\s*;?\s*\n?/g, '');
  
  // 모달 컴포넌트 변환
  modified = modified.replace(/<(CustomModal|Modal|ModalComponent)(\s+[^>]*)?>/g, (match, component, attrs) => {
    hasChanges = true;
    // isOpen prop을 open으로 변환
    let newAttrs = attrs || '';
    newAttrs = newAttrs.replace(/\bisOpen=/g, 'open=');
    // onClose가 없으면 추가
    if (!newAttrs.includes('onClose=')) {
      newAttrs += ' onClose={() => {}}';
    }
    return `<UnifiedModal${newAttrs}>`;
  });
  
  modified = modified.replace(/<\/(CustomModal|Modal|ModalComponent)>/g, '</UnifiedModal>');
  
  // div 기반 모달을 UnifiedModal로 변환
  modified = modified.replace(/<div\s+className=["']([^"']*\b(?:modal|dialog|popup)\b[^"']*)["'](\s+[^>]*)?>/, (match, className, attrs) => {
    // modal-backdrop, modal-overlay 등은 제외
    if (className.includes('backdrop') || className.includes('overlay')) {
      return match;
    }
    hasChanges = true;
    return `<UnifiedModal open={true} onClose={() => {}} className="${className}"${attrs || ''}>`;
  });
  
  // 모달 관련 prop 표준화
  modified = modified.replace(/\btitle=/g, 'title=');
  modified = modified.replace(/\bshowCloseButton=/g, 'showClose=');
  modified = modified.replace(/\bcloseOnBackdrop=/g, 'closeOnBackdropClick=');
  
  return { content: hasChanges ? modified : content, hasChanges };
}

// 파일 처리
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = migrateToUnifiedModal(content, filePath);
    
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Migrated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// 메인 실행
console.log('🔍 Finding files with modal components...\n');

const patterns = [
  'src/**/*.jsx',
  'src/**/*.js',
  'pages/**/*.jsx',
  'pages/**/*.js'
];

let totalFiles = 0;
let migratedFiles = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { 
    cwd: path.join(__dirname, '..'),
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.js', '**/*.spec.js']
  });
  
  files.forEach(file => {
    totalFiles++;
    if (processFile(file)) {
      migratedFiles++;
    }
  });
});

console.log('\n📊 Migration Summary:');
console.log(`Total files scanned: ${totalFiles}`);
console.log(`Files migrated: ${migratedFiles}`);
console.log('\n✨ Modal migration complete!');