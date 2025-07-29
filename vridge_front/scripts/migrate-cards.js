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

console.log(`${colors.cyan}🎴 Card 컴포넌트 마이그레이션${colors.reset}\n`);

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

// Card 패턴 찾기
const cardPatterns = [
  // className에 card가 포함된 div
  /<div\s+[^>]*className=['""][^'"]*card[^'"]*['""][^>]*>/gi,
  // Card 컴포넌트 (커스텀)
  /<Card\s+[^>]*>/gi,
  // 특정 카드 클래스 패턴
  /className=['""](?:project-card|feedback-card|stat-card|info-card|content-card)['"]/gi
];

// 카드 타입 판별
function determineCardType(attributes, content) {
  if (attributes.includes('project') || content.includes('project')) {
    return 'ProjectCard';
  }
  if (attributes.includes('feedback') || content.includes('feedback')) {
    return 'FeedbackCard';
  }
  if (attributes.includes('stat') || content.includes('statistic')) {
    return 'StatCard';
  }
  return 'UnifiedCard';
}

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    let modified = false;
    
    // Card 관련 div를 UnifiedCard로 변환
    const divCardRegex = /<div\s+([^>]*className=['""][^'"]*card[^'"]*['""][^>]*)>([\s\S]*?)<\/div>/gi;
    
    content = content.replace(divCardRegex, (match, attrs, innerContent) => {
      // 이미 UnifiedCard인 경우 스킵
      if (match.includes('UnifiedCard')) {
        return match;
      }
      
      // 단순한 wrapper div는 스킵
      if (innerContent.trim().startsWith('<') && !attrs.includes('onClick')) {
        return match;
      }
      
      const cardType = determineCardType(attrs, innerContent);
      
      // 속성 파싱
      let variant = 'default';
      if (attrs.includes('elevated') || attrs.includes('shadow')) variant = 'elevated';
      if (attrs.includes('outlined') || attrs.includes('border')) variant = 'outlined';
      if (attrs.includes('clickable') || attrs.includes('onClick')) variant = 'interactive';
      
      // onClick 핸들러 추출
      const onClickMatch = attrs.match(/onClick={([^}]+)}/);
      const onClickAttr = onClickMatch ? ` onClick={${onClickMatch[1]}}` : '';
      
      // className 정리
      const classNameMatch = attrs.match(/className=['""]([^'"]+)['"]/);
      let cleanedClassName = '';
      if (classNameMatch) {
        cleanedClassName = classNameMatch[1]
          .split(' ')
          .filter(cls => !cls.match(/card|elevated|outlined|shadow|border/))
          .join(' ')
          .trim();
      }
      const classNameAttr = cleanedClassName ? ` className="${cleanedClassName}"` : '';
      
      modified = true;
      totalMigrated++;
      
      if (cardType === 'UnifiedCard') {
        return `<UnifiedCard variant="${variant}"${onClickAttr}${classNameAttr}>
${innerContent}
</UnifiedCard>`;
      } else {
        // 특수 카드 타입
        return `<${cardType}${onClickAttr}${classNameAttr}>
${innerContent}
</${cardType}>`;
      }
    });
    
    // 커스텀 Card 컴포넌트도 변환
    content = content.replace(/<Card\s+([^>]*)>/gi, (match, attrs) => {
      if (file.includes('unified')) return match;
      
      modified = true;
      totalMigrated++;
      return `<UnifiedCard ${attrs}>`;
    });
    
    content = content.replace(/<\/Card>/gi, (match) => {
      if (file.includes('unified')) return match;
      return '</UnifiedCard>';
    });
    
    // import 추가
    if (modified && !content.includes('UnifiedCard')) {
      const importRegex = /(import[\s\S]*?from\s+['"][^'"]+['"];?\n)/;
      const lastImport = content.match(importRegex);
      
      if (lastImport) {
        const relPath = path.relative(path.dirname(file), 'src/components/unified/UnifiedCard').replace(/\\/g, '/');
        const importStatement = `import { UnifiedCard, ProjectCard, FeedbackCard, StatCard } from '${relPath.startsWith('.') ? relPath : './' + relPath}';\n`;
        
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
      console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), file)}: Card 컴포넌트 마이그레이션됨`);
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} ${path.relative(process.cwd(), file)}: ${error.message}`);
  }
});

// 결과 출력
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ 완료!${colors.reset}`);
console.log(`  - 총 ${totalMigrated}개의 Card 마이그레이션됨`);
console.log(`  - ${filesModified}개 파일 수정됨`);

console.log(`\n${colors.yellow}💡 참고:${colors.reset}`);
console.log('  - div.card 패턴을 UnifiedCard로 변환했습니다');
console.log('  - 프로젝트/피드백/통계 카드는 전용 컴포넌트로 변환했습니다');
console.log('  - import 경로를 확인해주세요');