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

console.log(`${colors.cyan}🔨 대용량 CSS 파일 분리 도구${colors.reset}\n`);

// 대상 파일들
const targetFiles = [
  'src/css/Cms/Cms.scss',
  'src/css/Home.scss',
  'src/page/Cms/VideoPlanning.scss'
];

// 각 파일 분석 및 분리
targetFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.red}❌ ${filePath} 파일을 찾을 수 없습니다${colors.reset}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  
  console.log(`\n${colors.blue}📊 ${path.basename(filePath)} 분석${colors.reset}`);
  console.log(`  크기: ${sizeKB}KB`);
  console.log(`  라인 수: ${content.split('\n').length}`);

  // 섹션별로 분리
  const sections = {
    variables: [],
    mixins: [],
    base: [],
    components: [],
    pages: [],
    utilities: [],
    mediaQueries: []
  };

  const lines = content.split('\n');
  let currentSection = 'base';
  let currentComponent = [];
  let braceCount = 0;
  let inMediaQuery = false;

  lines.forEach((line, index) => {
    // 변수 감지
    if (line.match(/^\s*\$/)) {
      sections.variables.push(line);
      return;
    }

    // Mixin 감지
    if (line.match(/@mixin/)) {
      currentSection = 'mixins';
    }

    // 미디어 쿼리 감지
    if (line.match(/@media/)) {
      inMediaQuery = true;
    }

    // 컴포넌트/페이지 분류
    if (line.match(/^\s*\.(feedback|video|player|modal|button|input|card)/i)) {
      currentSection = 'components';
    } else if (line.match(/^\s*\.(home|cms|admin|login|signup)/i)) {
      currentSection = 'pages';
    } else if (line.match(/^\s*\.(flex|grid|text|bg|border|shadow)/i)) {
      currentSection = 'utilities';
    }

    if (inMediaQuery) {
      sections.mediaQueries.push(line);
      if (line.includes('}') && !line.includes('{')) {
        const openBraces = line.split('{').length - 1;
        const closeBraces = line.split('}').length - 1;
        braceCount += openBraces - closeBraces;
        if (braceCount === 0) {
          inMediaQuery = false;
        }
      }
    } else {
      sections[currentSection].push(line);
    }
  });

  // 분리된 파일 생성
  const baseDir = path.dirname(filePath);
  const baseName = path.basename(filePath, '.scss');
  
  // 백업 생성
  const backupPath = filePath + '.backup-split';
  fs.copyFileSync(filePath, backupPath);
  console.log(`  ✅ 백업 생성: ${backupPath}`);

  // 각 섹션을 별도 파일로 저장
  const createdFiles = [];

  // Variables
  if (sections.variables.length > 10) {
    const varPath = path.join(baseDir, `_${baseName}-variables.scss`);
    fs.writeFileSync(varPath, sections.variables.join('\n'));
    createdFiles.push(varPath);
    console.log(`  ✅ 변수 파일 생성: ${path.basename(varPath)}`);
  }

  // Components
  if (sections.components.length > 50) {
    const compPath = path.join(baseDir, `_${baseName}-components.scss`);
    fs.writeFileSync(compPath, sections.components.join('\n'));
    createdFiles.push(compPath);
    console.log(`  ✅ 컴포넌트 파일 생성: ${path.basename(compPath)}`);
  }

  // Pages
  if (sections.pages.length > 50) {
    const pagePath = path.join(baseDir, `_${baseName}-pages.scss`);
    fs.writeFileSync(pagePath, sections.pages.join('\n'));
    createdFiles.push(pagePath);
    console.log(`  ✅ 페이지 파일 생성: ${path.basename(pagePath)}`);
  }

  // Media Queries
  if (sections.mediaQueries.length > 20) {
    const mediaPath = path.join(baseDir, `_${baseName}-responsive.scss`);
    fs.writeFileSync(mediaPath, sections.mediaQueries.join('\n'));
    createdFiles.push(mediaPath);
    console.log(`  ✅ 반응형 파일 생성: ${path.basename(mediaPath)}`);
  }

  // 메인 파일 재구성
  if (createdFiles.length > 0) {
    let newContent = `// ${baseName}.scss - 리팩토링됨\n`;
    newContent += `// Generated: ${new Date().toISOString()}\n\n`;
    
    // imports 추가
    createdFiles.forEach(file => {
      const importPath = path.basename(file);
      newContent += `@import '${importPath}';\n`;
    });
    
    newContent += '\n// Base styles\n';
    newContent += sections.base.join('\n');
    
    // 남은 utilities
    if (sections.utilities.length > 0) {
      newContent += '\n\n// Utilities\n';
      newContent += sections.utilities.join('\n');
    }

    fs.writeFileSync(filePath, newContent);
    console.log(`  ✅ 메인 파일 재구성 완료`);
    
    // 크기 비교
    const newStats = fs.statSync(filePath);
    const newSizeKB = (newStats.size / 1024).toFixed(1);
    const reduction = ((stats.size - newStats.size) / stats.size * 100).toFixed(1);
    console.log(`  📉 크기 감소: ${sizeKB}KB → ${newSizeKB}KB (-${reduction}%)`);
  }
});

console.log(`\n${colors.green}✅ CSS 파일 분리 완료!${colors.reset}`);