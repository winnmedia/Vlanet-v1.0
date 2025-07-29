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

console.log(`${colors.cyan}🔧 CmsHome 스타일 통합 도구${colors.reset}\n`);

// CmsHome 관련 파일 목록
const cmsHomeFiles = [
  'src/css/Cms/CmsHomeMinimal.scss',
  'src/css/Cms/CmsHomeRestore.scss',
  'src/css/Cms/CmsHomeEnhanced.scss'
];

// 통합 대상 파일
const targetFile = 'src/page/Cms/CmsHomeMinimal.module.scss';

// 커맨드 라인 인자 파싱
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

console.log(`모드: ${isDryRun ? colors.yellow + 'DRY RUN (테스트)' : colors.green + 'EXECUTE (실행)'}${colors.reset}\n`);

// 파일 존재 확인
console.log(`${colors.blue}📁 파일 확인 중...${colors.reset}\n`);

const existingFiles = [];
const missingFiles = [];

cmsHomeFiles.forEach(file => {
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

// 기존 타겟 파일 읽기
let targetContent = '';
if (fs.existsSync(targetFile)) {
  targetContent = fs.readFileSync(targetFile, 'utf8');
  console.log(`\n  ✅ ${targetFile} - 기존 파일 발견 (${(fs.statSync(targetFile).size / 1024).toFixed(1)}KB)`);
}

// 통합할 내용 수집
console.log(`\n${colors.blue}📝 스타일 내용 통합 중...${colors.reset}\n`);

const consolidatedSections = {
  imports: new Set(),
  variables: [],
  mixins: [],
  classes: new Map()
};

// import 문 패턴
const importPattern = /@import\s+['"]([^'"]+)['"]/g;

// 타겟 파일의 기존 클래스 수집
const existingClasses = new Set();
const lines = targetContent.split('\n');
let currentClass = null;
let braceCount = 0;

lines.forEach((line) => {
  if (currentClass === null && line.match(/^\s*\.[\w-]+\s*{/)) {
    const classMatch = line.match(/\.([\w-]+)/);
    if (classMatch) {
      currentClass = classMatch[1];
      existingClasses.add(currentClass);
    }
  } else if (currentClass !== null) {
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    
    if (braceCount === 0) {
      currentClass = null;
    }
  }
});

console.log(`  기존 파일에 ${existingClasses.size}개의 클래스 발견`);

// 각 파일에서 새로운 클래스만 수집
existingFiles.forEach(file => {
  console.log(`  분석 중: ${path.basename(file)}`);
  const content = fs.readFileSync(file, 'utf8');
  
  // imports 수집
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    if (!match[1].includes('node_modules')) {
      consolidatedSections.imports.add(match[1]);
    }
  }
  
  // 클래스 수집 (중복 제거)
  const fileLines = content.split('\n');
  let fileCurrentClass = null;
  let classContent = [];
  let fileBraceCount = 0;
  
  fileLines.forEach((line) => {
    if (fileCurrentClass === null && line.match(/^\s*\.[\w-]+\s*{/)) {
      const classMatch = line.match(/\.([\w-]+)/);
      if (classMatch) {
        fileCurrentClass = classMatch[1];
        classContent = [line];
        fileBraceCount = 1;
      }
    } else if (fileCurrentClass !== null) {
      classContent.push(line);
      fileBraceCount += (line.match(/{/g) || []).length;
      fileBraceCount -= (line.match(/}/g) || []).length;
      
      if (fileBraceCount === 0) {
        const fullClass = classContent.join('\n');
        // 기존 파일에 없는 클래스만 추가
        if (!existingClasses.has(fileCurrentClass) && !consolidatedSections.classes.has(fileCurrentClass)) {
          consolidatedSections.classes.set(fileCurrentClass, {
            content: fullClass,
            source: path.basename(file)
          });
        }
        fileCurrentClass = null;
        classContent = [];
      }
    }
  });
});

// 통합 파일 생성
if (!isDryRun) {
  console.log(`\n${colors.green}📦 통합 파일 업데이트 중...${colors.reset}\n`);
  
  // 백업 생성
  const backupFile = targetFile + '.consolidation-backup';
  fs.copyFileSync(targetFile, backupFile);
  console.log(`  백업 생성: ${backupFile}`);
  
  // 새로운 클래스들만 추가
  let newContent = '\n\n// ===================================\n';
  newContent += '// CmsHome 스타일 통합 추가\n';
  newContent += '// ' + new Date().toISOString() + '\n';
  newContent += '// ===================================\n\n';
  
  // 클래스 추가 (알파벳 순 정렬)
  const sortedClasses = Array.from(consolidatedSections.classes.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  sortedClasses.forEach(([className, data]) => {
    newContent += `// Source: ${data.source}\n`;
    newContent += data.content + '\n\n';
  });
  
  // 파일에 추가
  const updatedContent = targetContent + newContent;
  fs.writeFileSync(targetFile, updatedContent);
  console.log(`  ✅ 통합 완료: ${targetFile}`);
  console.log(`  ✅ ${consolidatedSections.classes.size}개의 새로운 클래스 추가됨`);
  
  // 기존 파일 삭제 제안
  console.log(`\n${colors.yellow}📋 다음 파일들을 삭제할 수 있습니다:${colors.reset}\n`);
  existingFiles.forEach(file => {
    console.log(`  rm ${file}`);
  });
  
} else {
  // DRY RUN 결과
  console.log(`\n${colors.cyan}📊 통합 분석 결과${colors.reset}`);
  console.log(`  - 통합할 파일: ${existingFiles.length}개`);
  console.log(`  - 새로 추가될 클래스: ${consolidatedSections.classes.size}개`);
  console.log(`  - 기존 클래스: ${existingClasses.size}개`);
  
  console.log(`\n${colors.yellow}ℹ️  실제로 통합하려면 다음 명령어를 실행하세요:${colors.reset}`);
  console.log(`   ${colors.cyan}node ${path.basename(__filename)} --execute${colors.reset}`);
}