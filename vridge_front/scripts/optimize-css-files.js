const fs = require('fs');
const path = require('path');
const glob = require('glob');

// CSS 파일 크기 분석 및 분할
function analyzeCSSFiles() {
  const cssFiles = glob.sync('src/**/*.{scss,css}', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
  
  const largeFiles = [];
  const threshold = 50 * 1024; // 50KB
  
  cssFiles.forEach(file => {
    const stats = fs.statSync(file);
    if (stats.size > threshold) {
      const content = fs.readFileSync(file, 'utf8');
      const lineCount = content.split('\n').length;
      
      largeFiles.push({
        path: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(1),
        lines: lineCount,
        relativePath: path.relative(process.cwd(), file)
      });
    }
  });
  
  return largeFiles.sort((a, b) => b.size - a.size);
}

// CSS 파일을 논리적 섹션으로 분할
function splitCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const basename = path.basename(filePath, path.extname(filePath));
  const dir = path.dirname(filePath);
  
  // CSS 내용을 섹션별로 분류
  const sections = {
    variables: [],
    mixins: [],
    base: [],
    layout: [],
    components: [],
    utilities: [],
    responsive: []
  };
  
  const lines = content.split('\n');
  let currentSection = 'base';
  
  lines.forEach(line => {
    // 섹션 감지
    if (line.includes('// Variables') || line.includes('/* Variables')) {
      currentSection = 'variables';
    } else if (line.includes('@mixin') || line.includes('// Mixins')) {
      currentSection = 'mixins';
    } else if (line.includes('// Layout') || line.includes('/* Layout')) {
      currentSection = 'layout';
    } else if (line.includes('// Components') || line.includes('/* Components')) {
      currentSection = 'components';
    } else if (line.includes('// Utilities') || line.includes('/* Utilities')) {
      currentSection = 'utilities';
    } else if (line.includes('@media')) {
      currentSection = 'responsive';
    }
    
    sections[currentSection].push(line);
  });
  
  // 각 섹션을 별도 파일로 저장
  const createdFiles = [];
  
  Object.entries(sections).forEach(([section, lines]) => {
    if (lines.length > 10) { // 10줄 이상인 섹션만 분리
      const newFileName = `${basename}.${section}.scss`;
      const newFilePath = path.join(dir, newFileName);
      
      const sectionContent = lines.join('\n');
      fs.writeFileSync(newFilePath, sectionContent, 'utf8');
      
      createdFiles.push({
        section,
        path: newFilePath,
        lines: lines.length
      });
    }
  });
  
  // 메인 파일을 import 문으로 대체
  if (createdFiles.length > 0) {
    const imports = createdFiles.map(file => 
      `@import './${path.basename(file.path)}';`
    ).join('\n');
    
    const mainContent = `// ${basename} - Optimized and split into modules\n${imports}\n`;
    
    // 원본 파일 백업
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    
    // 메인 파일 업데이트
    fs.writeFileSync(filePath, mainContent, 'utf8');
    
    return createdFiles;
  }
  
  return [];
}

// Critical CSS 추출
function extractCriticalCSS(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const criticalPatterns = [
    // Reset 및 기본 스타일
    /^(html|body|h[1-6]|p|a)/m,
    // 레이아웃 관련
    /\.(container|wrapper|layout|header|main|footer)/,
    // 중요 유틸리티
    /\.(hidden|visible|flex|grid)/,
    // Above-the-fold 컴포넌트
    /\.(navbar|hero|banner)/
  ];
  
  const criticalCSS = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    if (criticalPatterns.some(pattern => pattern.test(line))) {
      criticalCSS.push(line);
    }
  });
  
  return criticalCSS.join('\n');
}

// 메인 실행
console.log('🔍 대용량 CSS 파일 분석 중...\n');

const largeFiles = analyzeCSSFiles();

console.log(`📊 50KB 이상 파일: ${largeFiles.length}개\n`);

if (largeFiles.length > 0) {
  console.log('📋 대용량 파일 목록:');
  largeFiles.forEach(file => {
    console.log(`- ${file.relativePath} (${file.sizeKB}KB, ${file.lines}줄)`);
  });
  
  console.log('\n🔄 파일 최적화 시작...\n');
  
  let optimizedCount = 0;
  largeFiles.slice(0, 5).forEach(file => { // 상위 5개 파일만 처리
    try {
      console.log(`📦 ${path.basename(file.path)} 분할 중...`);
      const splitFiles = splitCSSFile(file.path);
      
      if (splitFiles.length > 0) {
        console.log(`  ✅ ${splitFiles.length}개 모듈로 분할됨:`);
        splitFiles.forEach(split => {
          console.log(`     - ${path.basename(split.path)} (${split.lines}줄)`);
        });
        optimizedCount++;
      } else {
        console.log(`  ⏭️  분할할 섹션이 충분하지 않음`);
      }
    } catch (error) {
      console.error(`  ❌ 오류: ${error.message}`);
    }
  });
  
  console.log(`\n✨ ${optimizedCount}개 파일 최적화 완료!`);
}

// CSS 번들 최적화 제안
console.log('\n💡 추가 최적화 제안:');
console.log('1. CSS-in-JS 라이브러리 도입 검토 (styled-components, emotion)');
console.log('2. PostCSS 플러그인 활용 (PurgeCSS, cssnano)');
console.log('3. Critical CSS 인라인화');
console.log('4. CSS 모듈별 lazy loading 구현');
console.log('5. 사용하지 않는 스타일 제거');