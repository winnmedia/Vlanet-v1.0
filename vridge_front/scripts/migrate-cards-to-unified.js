const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
let migratedCount = 0;
const migrationReport = [];

// 파일 내용을 변경하는 함수
function migrateCardsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const changes = [];

    // UnifiedCard import 필요 여부 확인
    const hasCardElement = /(className.*card|<Card\s|\.card\s|kanban-card|project-card|type-card)/i.test(content);
    const hasUnifiedCardImport = /import.*UnifiedCard.*from/i.test(content);
    
    if (hasCardElement && !hasUnifiedCardImport && !filePath.includes('UnifiedCard')) {
      // Import 경로 계산
      const relativePath = path.relative(path.dirname(filePath), srcDir);
      const importPath = relativePath ? `${relativePath}/components/unified/UnifiedCard` : './components/unified/UnifiedCard';
      
      // Import 추가
      const importStatement = `import UnifiedCard from '${importPath.replace(/\\/g, '/')}';\n`;
      
      // 첫 번째 import 문 찾기
      const firstImportMatch = content.match(/^import\s+.*$/m);
      if (firstImportMatch) {
        const insertPos = firstImportMatch.index + firstImportMatch[0].length;
        content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
      } else {
        content = importStatement + '\n' + content;
      }
      changes.push('Added UnifiedCard import');
      modified = true;
    }

    // div with card classes를 UnifiedCard로 변경
    const cardPatterns = [
      {
        pattern: /<div\s+className=["']([^"']*\b(card|kanban-card|project-card|type-card)\b[^"']*)["']\s*([^>]*)>([\s\S]*?)<\/div>/g,
        replace: (match, className, _, attrs, children) => {
          // card-header, card-body, card-footer는 제외
          if (className.includes('card-header') || className.includes('card-body') || className.includes('card-footer')) {
            return match;
          }
          
          // Extract variant based on class
          let variant = 'default';
          if (className.includes('elevated')) variant = 'elevated';
          else if (className.includes('outlined')) variant = 'outlined';
          
          changes.push(`div.${className} -> UnifiedCard`);
          return `<UnifiedCard variant="${variant}" className="${className}" ${attrs}>${children}</UnifiedCard>`;
        }
      }
    ];

    // 패턴 적용
    cardPatterns.forEach(({ pattern, replace }) => {
      const newContent = content.replace(pattern, replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    // Card 컴포넌트 import를 UnifiedCard로 변경
    if (content.includes('import { Card }') || content.includes('import Card')) {
      content = content.replace(/import\s+{\s*Card\s*}\s+from\s+['"].*?\/Card['"];?/g, '');
      content = content.replace(/import\s+Card\s+from\s+['"].*?\/Card['"];?/g, '');
      
      // <Card> 사용을 <UnifiedCard>로 변경
      content = content.replace(/<Card\s/g, '<UnifiedCard ');
      content = content.replace(/<\/Card>/g, '</UnifiedCard>');
      
      changes.push('Card -> UnifiedCard component');
      modified = true;
    }

    // ProjectDashboard의 특수한 경우 처리
    if (filePath.includes('ProjectDashboard')) {
      // kanban-card 처리
      content = content.replace(
        /className={`kanban-card \${project\.status}`}/g,
        'variant="interactive" hoverable clickable className={`kanban-card ${project.status}`}'
      );
      
      // project-card 처리  
      content = content.replace(
        /className={`project-card \${project\.status}`}/g,
        'variant="interactive" hoverable clickable className={`project-card ${project.status}`}'
      );
      
      if (content.includes('kanban-card') || content.includes('project-card')) {
        modified = true;
        changes.push('ProjectDashboard card classes migrated');
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      migratedCount++;
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
      migrateCardsInFile(filePath);
    }
  });
}

console.log('🚀 카드 컴포넌트 마이그레이션 시작...\n');
walkDirectory(srcDir);

console.log('\n📊 마이그레이션 완료!');
console.log(`총 ${migratedCount}개 파일 수정됨\n`);

// 리포트 저장
const reportPath = path.join(__dirname, 'card-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(migrationReport, null, 2));
console.log(`📄 상세 리포트: ${reportPath}`);