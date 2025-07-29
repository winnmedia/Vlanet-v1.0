#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

console.log(`${colors.cyan}🔧 Feedback 스타일 통합 도구${colors.reset}\n`);

// Feedback 관련 파일 목록
const feedbackFiles = [
  'src/css/Cms/FeedbackPage.scss',
  'src/css/Cms/FeedbackHeader.scss',
  'src/css/Cms/FeedbackButtons.scss',
  'src/css/Cms/FeedbackMoreStyle.scss',
  'src/css/Cms/FeedbackGridLayout.module.scss',
  'src/css/Cms/FeedbackLayoutRestore.scss',
  'src/css/Cms/FeedbackSectionRedesign-improved.scss',
  'src/components/FeedbackPlayer.scss',
  'src/tasks/Feedback/FeedbackInput.module.scss',
  'src/tasks/Feedback/FeedbackManage.module.scss'
];

// 통합 대상 파일
const targetFile = 'src/page/Cms/FeedbackButtonStyles.module.scss';

// 커맨드 라인 인자 파싱
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

console.log(`모드: ${isDryRun ? colors.yellow + 'DRY RUN (테스트)' : colors.green + 'EXECUTE (실행)'}${colors.reset}\n`);

// 파일 존재 확인
console.log(`${colors.blue}📁 파일 확인 중...${colors.reset}\n`);

const existingFiles = [];
const missingFiles = [];

feedbackFiles.forEach(file => {
  if (fs.existsSync(file)) {
    existingFiles.push(file);
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`  ✅ ${file} (${sizeKB}KB)`);
  } else {
    missingFiles.push(file);
    console.log(`  ❌ ${file} - 파일 없음`);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n${colors.yellow}⚠️  ${missingFiles.length}개 파일을 찾을 수 없습니다. 계속 진행합니다.${colors.reset}`);
}

// 통합할 내용 수집
console.log(`\n${colors.blue}📝 스타일 내용 분석 중...${colors.reset}\n`);

const consolidatedSections = {
  imports: new Set(),
  variables: [],
  mixins: [],
  classes: new Map(),
  mediaQueries: []
};

// import 문 패턴
const importPattern = /@import\s+['"]([^'"]+)['"]/g;
// 변수 패턴
const variablePattern = /^\s*\$[\w-]+:/gm;
// mixin 패턴
const mixinPattern = /@mixin\s+[\w-]+/g;
// 미디어 쿼리 패턴
const mediaQueryPattern = /@media[^{]+{[^}]*}/gs;

existingFiles.forEach(file => {
  console.log(`  분석 중: ${path.basename(file)}`);
  const content = fs.readFileSync(file, 'utf8');
  
  // imports 수집
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    // design-tokens는 한 번만 포함
    if (!match[1].includes('node_modules')) {
      consolidatedSections.imports.add(match[1]);
    }
  }
  
  // 변수 수집
  const variables = content.match(variablePattern) || [];
  if (variables.length > 0) {
    consolidatedSections.variables.push(`// From ${path.basename(file)}`);
    consolidatedSections.variables.push(...variables);
  }
  
  // 클래스 수집 (중복 제거)
  const lines = content.split('\n');
  let currentClass = null;
  let classContent = [];
  let braceCount = 0;
  
  lines.forEach((line, index) => {
    if (currentClass === null && line.match(/^\s*\.[\w-]+\s*{/)) {
      currentClass = line.match(/\.([\w-]+)/)[1];
      classContent = [line];
      braceCount = 1;
    } else if (currentClass !== null) {
      classContent.push(line);
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (braceCount === 0) {
        const fullClass = classContent.join('\n');
        if (!consolidatedSections.classes.has(currentClass)) {
          consolidatedSections.classes.set(currentClass, {
            content: fullClass,
            source: path.basename(file)
          });
        }
        currentClass = null;
        classContent = [];
      }
    }
  });
});

// 통합 파일 생성
if (!isDryRun) {
  console.log(`\n${colors.green}📦 통합 파일 생성 중...${colors.reset}\n`);
  
  // 백업 생성
  if (fs.existsSync(targetFile)) {
    const backupFile = targetFile + '.consolidation-backup';
    fs.copyFileSync(targetFile, backupFile);
    console.log(`  백업 생성: ${backupFile}`);
  }
  
  // 통합 내용 생성
  let consolidatedContent = '';
  
  // Imports
  consolidatedContent += '// ===================================\n';
  consolidatedContent += '// Feedback 스타일 통합 파일\n';
  consolidatedContent += '// ' + new Date().toISOString() + '\n';
  consolidatedContent += '// ===================================\n\n';
  
  // 필수 imports
  consolidatedContent += "@import '../../styles/design-tokens';\n";
  consolidatedContent += "@import '../../styles/mobile-mixins';\n\n";
  
  // 추가 imports
  consolidatedSections.imports.forEach(imp => {
    if (!imp.includes('design-tokens') && !imp.includes('mobile-mixins')) {
      consolidatedContent += `@import '${imp}';\n`;
    }
  });
  
  consolidatedContent += '\n// ===================================\n';
  consolidatedContent += '// 변수 정의\n';
  consolidatedContent += '// ===================================\n\n';
  
  // 변수
  if (consolidatedSections.variables.length > 0) {
    consolidatedContent += consolidatedSections.variables.join('\n') + '\n\n';
  }
  
  consolidatedContent += '// ===================================\n';
  consolidatedContent += '// 클래스 정의\n';
  consolidatedContent += '// ===================================\n\n';
  
  // 클래스 (알파벳 순 정렬)
  const sortedClasses = Array.from(consolidatedSections.classes.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  sortedClasses.forEach(([className, data]) => {
    consolidatedContent += `// Source: ${data.source}\n`;
    consolidatedContent += data.content + '\n\n';
  });
  
  // 파일 저장
  fs.writeFileSync(targetFile, consolidatedContent);
  console.log(`  ✅ 통합 완료: ${targetFile}`);
  
  // 기존 파일 삭제 제안
  console.log(`\n${colors.yellow}📋 다음 파일들을 삭제할 수 있습니다:${colors.reset}\n`);
  existingFiles.forEach(file => {
    console.log(`  rm ${file}`);
  });
  
  console.log(`\n${colors.yellow}📋 import 문 업데이트가 필요한 컴포넌트를 찾으려면:${colors.reset}`);
  console.log(`  grep -r "FeedbackPage\\|FeedbackHeader\\|FeedbackButtons" src/`);
  
} else {
  // DRY RUN 결과
  console.log(`\n${colors.cyan}📊 통합 분석 결과${colors.reset}`);
  console.log(`  - 통합할 파일: ${existingFiles.length}개`);
  console.log(`  - 고유 imports: ${consolidatedSections.imports.size}개`);
  console.log(`  - 변수 정의: ${consolidatedSections.variables.length}개`);
  console.log(`  - 클래스 정의: ${consolidatedSections.classes.size}개`);
  
  console.log(`\n${colors.green}💡 예상 효과:${colors.reset}`);
  const totalSize = existingFiles.reduce((sum, file) => {
    return sum + fs.statSync(file).size;
  }, 0);
  console.log(`  - ${existingFiles.length}개 파일 → 1개 파일로 통합`);
  console.log(`  - 전체 크기: ${(totalSize / 1024).toFixed(1)}KB`);
  console.log(`  - 중복 제거로 약 30% 크기 감소 예상`);
  
  console.log(`\n${colors.yellow}ℹ️  실제로 통합하려면 다음 명령어를 실행하세요:${colors.reset}`);
  console.log(`   ${colors.cyan}node ${path.basename(__filename)} --execute${colors.reset}`);
}