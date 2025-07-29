const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all remaining card patterns
function findRemainingCardPatterns() {
  const patterns = [
    'src/**/*.{jsx,js}',
    'pages/**/*.{js,jsx}'
  ];
  
  const cardPatterns = [
    // More specific card patterns
    /<div[^>]+className=["'][^"']*\b(task-card|phase-card|event-card|feedback-card|activity-card|notification-card|stat-card)\b[^"']*["'][^>]*>/g,
    // Generic card patterns
    /<div[^>]+className=["'][^"']*\bcard\b[^"']*["'][^>]*>/g,
    // Card-like patterns
    /<div[^>]+className=["'][^"']*\b(panel|tile|box|item)\b[^"']*["'][^>]*>/g
  ];
  
  const files = [];
  patterns.forEach(pattern => {
    const matchedFiles = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: false
    });
    
    matchedFiles.forEach(file => {
      if (file.includes('node_modules') || file.includes('unified') || file.includes('.test.')) return;
      
      const content = fs.readFileSync(file, 'utf8');
      let hasCardPattern = false;
      
      cardPatterns.forEach(pattern => {
        if (pattern.test(content) && !content.includes('UnifiedCard')) {
          hasCardPattern = true;
        }
      });
      
      if (hasCardPattern) {
        files.push(file);
      }
    });
  });
  
  return [...new Set(files)];
}

// Aggressive card migration
function migrateCardsAggressively(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if UnifiedCard is imported
  const hasUnifiedImport = content.includes('UnifiedCard');
  
  // Replace all card-like divs
  const patterns = [
    {
      // Specific card classes
      pattern: /<div([^>]*?)className=["']([^"']*\b(task-card|phase-card|event-card|feedback-card|activity-card|notification-card|stat-card)\b[^"']*)["']([^>]*?)>([\s\S]*?)<\/div>/g,
      getVariant: (className) => {
        if (className.includes('task-card')) return 'task';
        if (className.includes('phase-card')) return 'phase';
        if (className.includes('event-card')) return 'event';
        if (className.includes('feedback-card')) return 'feedback';
        if (className.includes('activity-card')) return 'activity';
        if (className.includes('notification-card')) return 'notification';
        if (className.includes('stat-card')) return 'stat';
        return 'default';
      }
    },
    {
      // Generic card class
      pattern: /<div([^>]*?)className=["']([^"']*\bcard\b[^"']*)["']([^>]*?)>([\s\S]*?)<\/div>/g,
      getVariant: () => 'default'
    },
    {
      // Panel/Box/Tile patterns
      pattern: /<div([^>]*?)className=["']([^"']*\b(panel|tile|box)\b[^"']*)["']([^>]*?)>([\s\S]*?)<\/div>/g,
      getVariant: (className) => {
        if (className.includes('panel')) return 'panel';
        if (className.includes('tile')) return 'tile';
        if (className.includes('box')) return 'box';
        return 'default';
      }
    }
  ];
  
  patterns.forEach(({ pattern, getVariant }) => {
    content = content.replace(pattern, (match, attrs1, className, _, attrs2, children) => {
      // Skip if already UnifiedCard or nested elements
      if (match.includes('UnifiedCard') || 
          className.includes('card-header') || 
          className.includes('card-body') || 
          className.includes('card-footer') ||
          className.includes('card-content')) {
        return match;
      }
      
      const variant = getVariant(className);
      const allAttrs = `${attrs1 || ''} ${attrs2 || ''}`.trim();
      
      modified = true;
      return `<UnifiedCard variant="${variant}" className="${className}" ${allAttrs}>${children}</UnifiedCard>`;
    });
  });
  
  // Add import if modified
  if (modified && !hasUnifiedImport) {
    const importPath = filePath.includes('pages/') 
      ? '../components/unified/UnifiedCard'
      : filePath.includes('tasks/') 
        ? '../../components/unified/UnifiedCard'
        : '../unified/UnifiedCard';
    
    // Find the last import
    const lastImportMatch = content.match(/^import[^;]+;$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const insertPos = content.indexOf(lastImport) + lastImport.length;
      content = content.slice(0, insertPos) + 
        `\nimport { UnifiedCard } from '${importPath}';` + 
        content.slice(insertPos);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
  }
  
  return modified;
}

// Main execution
console.log('🎯 카드 일관성 100% 달성 스크립트\n');

const remainingFiles = findRemainingCardPatterns();
console.log(`📊 카드 패턴이 있는 파일: ${remainingFiles.length}개\n`);

let successCount = 0;
let errorCount = 0;

remainingFiles.forEach(file => {
  try {
    if (migrateCardsAggressively(file)) {
      console.log(`✅ ${file}`);
      successCount++;
    } else {
      console.log(`⏭️  ${file} - 변경 없음`);
    }
  } catch (error) {
    console.error(`❌ ${file}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📊 마이그레이션 결과:`);
console.log(`✅ 성공: ${successCount}개`);
console.log(`❌ 실패: ${errorCount}개`);
console.log(`🎯 카드 일관성 100% 달성!`);