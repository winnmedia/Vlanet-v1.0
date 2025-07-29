const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
let totalMigrations = 0;
const migrationReport = [];

// 파일 내용을 안전하게 변경하는 함수
function migrateFileContent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const changes = [];

    // UnifiedButton import 추가 필요 여부
    const hasButtonElement = /<button\s/i.test(content);
    const hasUnifiedButtonImport = /import.*UnifiedButton.*from/i.test(content);
    
    if (hasButtonElement && !hasUnifiedButtonImport) {
      // import 경로 계산
      const relativePath = path.relative(path.dirname(filePath), srcDir);
      const importPath = relativePath ? `${relativePath}/components/unified/UnifiedButton` : './components/unified/UnifiedButton';
      
      // import 추가
      const importStatement = `import { UnifiedButton } from '${importPath.replace(/\\/g, '/')}';\n`;
      
      // 첫 번째 import 문 찾기
      const firstImportMatch = content.match(/^import\s+.*$/m);
      if (firstImportMatch) {
        const insertPos = firstImportMatch.index + firstImportMatch[0].length;
        content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
      } else {
        // import가 없으면 파일 최상단에 추가
        content = importStatement + '\n' + content;
      }
      modified = true;
      changes.push('Added UnifiedButton import');
    }

    // UnifiedInput import 추가 필요 여부  
    const hasInputElement = /<input\s(?!.*type=["'](?:checkbox|radio)["'])/i.test(content);
    const hasUnifiedInputImport = /import.*UnifiedInput.*from/i.test(content);
    
    if (hasInputElement && !hasUnifiedInputImport) {
      const relativePath = path.relative(path.dirname(filePath), srcDir);
      const importPath = relativePath ? `${relativePath}/components/unified/UnifiedInput` : './components/unified/UnifiedInput';
      
      const importStatement = `import { UnifiedInput } from '${importPath.replace(/\\/g, '/')}';\n`;
      
      const firstImportMatch = content.match(/^import\s+.*$/m);
      if (firstImportMatch) {
        const insertPos = firstImportMatch.index + firstImportMatch[0].length;
        content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
      } else {
        content = importStatement + '\n' + content;
      }
      modified = true;
      changes.push('Added UnifiedInput import');
    }

    // button -> UnifiedButton 변환
    const buttonRegex = /<button(\s[^>]*)?>/g;
    content = content.replace(buttonRegex, (match, attrs) => {
      // type 속성이 없으면 추가
      if (attrs && !attrs.includes('type=')) {
        attrs += ' type="button"';
      } else if (!attrs) {
        attrs = ' type="button"';
      }
      
      // aria-label 추가 (없는 경우)
      if (!attrs.includes('aria-label=')) {
        attrs += ' aria-label="Click"';
      }
      
      modified = true;
      changes.push('button -> UnifiedButton');
      return `<UnifiedButton${attrs}>`;
    });
    
    // </button> -> </UnifiedButton>
    content = content.replace(/<\/button>/g, () => {
      modified = true;
      return '</UnifiedButton>';
    });

    // input -> UnifiedInput 변환 (checkbox, radio 제외)
    const inputRegex = /<input(\s[^>]*)?>/g;
    content = content.replace(inputRegex, (match, attrs) => {
      // checkbox나 radio는 제외
      if (attrs && (attrs.includes('type="checkbox"') || attrs.includes("type='checkbox'") || 
                    attrs.includes('type="radio"') || attrs.includes("type='radio'"))) {
        return match;
      }
      
      modified = true;
      changes.push('input -> UnifiedInput');
      return `<UnifiedInput${attrs || ''} />`;
    });

    // MinimalCard -> UnifiedCard 변환
    if (content.includes('MinimalCard')) {
      // import 변경
      content = content.replace(/import.*MinimalCard.*from.*$/gm, (match) => {
        const relativePath = path.relative(path.dirname(filePath), srcDir);
        const importPath = relativePath ? `${relativePath}/components/unified/UnifiedCard` : './components/unified/UnifiedCard';
        return `import { UnifiedCard } from '${importPath.replace(/\\/g, '/')}';`;
      });
      
      // 컴포넌트 사용 변경
      content = content.replace(/<MinimalCard/g, '<UnifiedCard');
      content = content.replace(/<\/MinimalCard>/g, '</UnifiedCard>');
      
      modified = true;
      changes.push('MinimalCard -> UnifiedCard');
    }

    // Modal -> UnifiedModal 변환
    const hasModalElement = /<Modal\s/i.test(content) && !/<UnifiedModal\s/i.test(content);
    if (hasModalElement) {
      // import 변경
      content = content.replace(/import.*Modal.*from.*['"].*\/Modal['"].*$/gm, (match) => {
        const relativePath = path.relative(path.dirname(filePath), srcDir);
        const importPath = relativePath ? `${relativePath}/components/unified/UnifiedModal` : './components/unified/UnifiedModal';
        return `import { UnifiedModal } from '${importPath.replace(/\\/g, '/')}';`;
      });
      
      // 컴포넌트 사용 변경
      content = content.replace(/<Modal(\s)/g, '<UnifiedModal$1');
      content = content.replace(/<\/Modal>/g, '</UnifiedModal>');
      
      modified = true;
      changes.push('Modal -> UnifiedModal');
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      totalMigrations++;
      migrationReport.push({
        file: path.relative(srcDir, filePath),
        changes: changes
      });
      console.log(`✅ ${path.relative(srcDir, filePath)}: ${changes.join(', ')}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

// 디렉토리 순회
function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      walkDirectory(filePath);
    } else if (file.endsWith('.jsx') && !file.includes('.test.') && !file.includes('.spec.')) {
      migrateFileContent(filePath);
    }
  });
}

console.log('🚀 통합 컴포넌트 마이그레이션 시작...\n');
walkDirectory(srcDir);

console.log('\n📊 마이그레이션 완료!');
console.log(`총 ${totalMigrations}개 파일 수정됨\n`);

// 상세 리포트 생성
const reportPath = path.join(__dirname, 'migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(migrationReport, null, 2));
console.log(`📄 상세 리포트: ${reportPath}`);