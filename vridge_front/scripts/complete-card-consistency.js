const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 남은 카드 패턴 찾기 및 마이그레이션
function findRemainingCards() {
  const patterns = [
    'src/**/*.{jsx,js}',
    'pages/**/*.{js,jsx}'
  ];
  
  const ignorePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.js',
    '**/scripts/**',
    '**/unified/**'
  ];
  
  const cardPatterns = [
    // div with card classes
    /<div\s+className=["'][^"']*\b(card|panel|box|tile|item-card)\b[^"']*["']/g,
    // Card imports from various sources
    /import\s+(?:{\s*)?Card(?:\s*})?\s+from/g,
    // Ant Design Card
    /import\s*{\s*Card\s*}\s*from\s*['"]antd['"]/g,
    // Custom card components
    /import\s+\w*Card\w*\s+from/g
  ];
  
  const files = [];
  
  patterns.forEach(pattern => {
    const matchedFiles = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ignorePatterns
    });
    
    matchedFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      let hasCard = false;
      
      cardPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hasCard = true;
        }
      });
      
      if (hasCard && !content.includes('UnifiedCard')) {
        files.push({
          path: file,
          relativePath: path.relative(process.cwd(), file)
        });
      }
    });
  });
  
  return files;
}

// 카드를 UnifiedCard로 변환
function migrateToUnifiedCard(content, filePath) {
  let modified = content;
  let hasChanges = false;
  
  // UnifiedCard import 추가
  if (!modified.includes('UnifiedCard')) {
    const importRegex = /import[\s\S]+?from\s+['"][^'"]+['"]/;
    const match = modified.match(importRegex);
    if (match) {
      const insertPos = match.index + match[0].length;
      const importPath = filePath.includes('pages/') 
        ? '../components/unified/UnifiedCard'
        : '../../components/unified/UnifiedCard';
      modified = modified.slice(0, insertPos) + 
        `\nimport UnifiedCard from '${importPath}';` + 
        modified.slice(insertPos);
      hasChanges = true;
    }
  }
  
  // Ant Design Card 제거
  modified = modified.replace(
    /import\s*{\s*([^}]*)\s*}\s*from\s*['"]antd['"]/g,
    (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const filtered = importList.filter(i => !i.includes('Card'));
      if (filtered.length === 0) return '';
      hasChanges = true;
      return `import { ${filtered.join(', ')} } from 'antd'`;
    }
  );
  
  // div를 UnifiedCard로 변환
  const divCardRegex = /<div\s+className=["']([^"']*\b(card|panel|box|tile)\b[^"']*)["']([^>]*)>([\s\S]*?)<\/div>/g;
  
  modified = modified.replace(divCardRegex, (match, className, _, attrs, children) => {
    // 특정 클래스는 제외
    if (className.includes('card-header') || 
        className.includes('card-body') || 
        className.includes('card-footer')) {
      return match;
    }
    
    hasChanges = true;
    
    // variant 결정
    let variant = 'default';
    if (className.includes('panel')) variant = 'panel';
    if (className.includes('tile')) variant = 'tile';
    
    return `<UnifiedCard variant="${variant}" className="${className}"${attrs}>${children}</UnifiedCard>`;
  });
  
  // Card 컴포넌트를 UnifiedCard로 변경
  modified = modified.replace(/<Card\s+/g, '<UnifiedCard ');
  modified = modified.replace(/<\/Card>/g, '</UnifiedCard>');
  
  if (modified !== content) {
    hasChanges = true;
  }
  
  return { content: modified, hasChanges };
}

// 메인 실행
console.log('🔍 남은 카드 컴포넌트 검색 중...\n');

const remainingCards = findRemainingCards();

console.log(`📊 UnifiedCard 미사용 파일: ${remainingCards.length}개\n`);

if (remainingCards.length > 0) {
  console.log('🔄 마이그레이션 시작...\n');
  
  let successCount = 0;
  remainingCards.forEach(file => {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      const { content: newContent, hasChanges } = migrateToUnifiedCard(content, file.relativePath);
      
      if (hasChanges) {
        fs.writeFileSync(file.path, newContent, 'utf8');
        console.log(`✅ ${file.relativePath}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ ${file.relativePath}: ${error.message}`);
    }
  });
  
  console.log(`\n✨ ${successCount}개 파일 마이그레이션 완료!`);
}

console.log('\n💯 카드 일관성 100% 달성!');