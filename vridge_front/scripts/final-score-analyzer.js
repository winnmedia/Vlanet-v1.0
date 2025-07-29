#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

console.log(`${colors.cyan}🎯 VideoPlanet 최종 점수 분석기${colors.reset}\n`);

// 분석 카테고리
const categories = {
  tokenUsage: { weight: 15, score: 0, details: [] },
  componentConsistency: { weight: 20, score: 0, details: [] },
  codeQuality: { weight: 15, score: 0, details: [] },
  performance: { weight: 15, score: 0, details: [] },
  accessibility: { weight: 10, score: 0, details: [] },
  testCoverage: { weight: 10, score: 0, details: [] },
  responsive: { weight: 10, score: 0, details: [] },
  maintenance: { weight: 5, score: 0, details: [] }
};

// 1. 토큰 사용률 분석
function analyzeTokenUsage() {
  const scssFiles = glob.sync('src/**/*.{scss,css}', {
    ignore: ['**/node_modules/**', '**/build/**', '**/*.backup*']
  });

  let totalValues = 0;
  let tokenizedValues = 0;
  const tokenPattern = /\$[a-zA-Z-]+/g;
  const hardcodedColorPattern = /#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)/g;
  const hardcodedSpacingPattern = /:\s*\d+px/g;

  scssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const tokens = content.match(tokenPattern) || [];
    const hardcodedColors = content.match(hardcodedColorPattern) || [];
    const hardcodedSpacing = content.match(hardcodedSpacingPattern) || [];
    
    tokenizedValues += tokens.length;
    totalValues += tokens.length + hardcodedColors.length + hardcodedSpacing.length;
  });

  const tokenUsageRate = totalValues > 0 ? (tokenizedValues / totalValues) * 100 : 0;
  categories.tokenUsage.score = Math.min(tokenUsageRate, 100);
  categories.tokenUsage.details.push(`토큰 사용률: ${tokenUsageRate.toFixed(1)}%`);
  categories.tokenUsage.details.push(`토큰화된 값: ${tokenizedValues}개`);
  categories.tokenUsage.details.push(`전체 값: ${totalValues}개`);
}

// 2. 컴포넌트 일관성 분석
function analyzeComponentConsistency() {
  const componentFiles = glob.sync('src/**/*.{jsx,js}', {
    ignore: ['**/node_modules/**', '**/build/**', '**/*.test.js']
  });

  const buttonPatterns = {
    unified: 0,
    custom: 0
  };
  const inputPatterns = {
    unified: 0,
    custom: 0
  };
  const cardPatterns = {
    unified: 0,
    custom: 0
  };
  const modalPatterns = {
    unified: 0,
    custom: 0
  };

  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 버튼 분석
    if (content.includes('UnifiedButton')) buttonPatterns.unified++;
    if (/<button|<Button/.test(content) && !content.includes('UnifiedButton')) buttonPatterns.custom++;
    
    // 입력 분석
    if (content.includes('UnifiedInput')) inputPatterns.unified++;
    if (/<input|<Input/.test(content) && !content.includes('UnifiedInput')) inputPatterns.custom++;
    
    // 카드 분석
    if (content.includes('UnifiedCard')) cardPatterns.unified++;
    if (/Card[^.]/.test(content) && !content.includes('UnifiedCard')) cardPatterns.custom++;
    
    // 모달 분석
    if (content.includes('UnifiedModal')) modalPatterns.unified++;
    if (/Modal[^.]/.test(content) && !content.includes('UnifiedModal')) modalPatterns.custom++;
  });

  const calculateConsistency = (pattern) => {
    const total = pattern.unified + pattern.custom;
    return total > 0 ? (pattern.unified / total) * 100 : 100;
  };

  const buttonConsistency = calculateConsistency(buttonPatterns);
  const inputConsistency = calculateConsistency(inputPatterns);
  const cardConsistency = calculateConsistency(cardPatterns);
  const modalConsistency = calculateConsistency(modalPatterns);

  const overallConsistency = (buttonConsistency + inputConsistency + cardConsistency + modalConsistency) / 4;
  categories.componentConsistency.score = overallConsistency;
  
  categories.componentConsistency.details.push(`버튼 일관성: ${buttonConsistency.toFixed(1)}%`);
  categories.componentConsistency.details.push(`입력 일관성: ${inputConsistency.toFixed(1)}%`);
  categories.componentConsistency.details.push(`카드 일관성: ${cardConsistency.toFixed(1)}%`);
  categories.componentConsistency.details.push(`모달 일관성: ${modalConsistency.toFixed(1)}%`);
}

// 3. 코드 품질 분석
function analyzeCodeQuality() {
  const jsFiles = glob.sync('src/**/*.{js,jsx}', {
    ignore: ['**/node_modules/**', '**/build/**']
  });

  let totalIssues = 0;
  let importantCount = 0;
  let consoleLogCount = 0;

  jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // console.log 확인
    const consoleLogs = content.match(/console\.(log|error|warn)/g) || [];
    consoleLogCount += consoleLogs.length;
  });

  // !important 확인
  const scssFiles = glob.sync('src/**/*.{scss,css}', {
    ignore: ['**/node_modules/**', '**/build/**']
  });

  scssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const importants = content.match(/!important/g) || [];
    importantCount += importants.length;
  });

  totalIssues = consoleLogCount + importantCount;
  const qualityScore = Math.max(0, 100 - (totalIssues * 0.5));
  
  categories.codeQuality.score = qualityScore;
  categories.codeQuality.details.push(`console 사용: ${consoleLogCount}개`);
  categories.codeQuality.details.push(`!important 사용: ${importantCount}개`);
  categories.codeQuality.details.push(`전체 이슈: ${totalIssues}개`);
}

// 4. 성능 분석
function analyzePerformance() {
  let performanceScore = 100;
  const details = [];

  // 코드 스플리팅 확인
  const pagesDir = 'pages';
  const pageFiles = glob.sync(`${pagesDir}/**/*.js`, {
    ignore: ['**/api/**', '**/_app.js', '**/_document.js']
  });

  let dynamicImports = 0;
  let totalPages = pageFiles.length;

  pageFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('dynamic(')) dynamicImports++;
  });

  const codeSplittingRate = totalPages > 0 ? (dynamicImports / totalPages) * 100 : 0;
  performanceScore = Math.min(performanceScore, 50 + codeSplittingRate * 0.3);

  // 이미지 최적화 확인
  const imageOptimizations = glob.sync('src/**/*OptimizedImage*').length > 0 ? 20 : 0;
  performanceScore = Math.min(performanceScore, performanceScore + imageOptimizations);

  // 큰 CSS 파일 확인
  const scssFiles = glob.sync('src/**/*.{scss,css}', {
    ignore: ['**/node_modules/**', '**/build/**']
  });
  
  const largeCssFiles = scssFiles.filter(file => {
    const stats = fs.statSync(file);
    return stats.size > 50000; // 50KB 이상
  });

  if (largeCssFiles.length === 0) performanceScore += 10;

  categories.performance.score = Math.min(performanceScore, 100);
  categories.performance.details.push(`코드 스플리팅: ${codeSplittingRate.toFixed(1)}%`);
  categories.performance.details.push(`이미지 최적화: ${imageOptimizations > 0 ? '구현됨' : '미구현'}`);
  categories.performance.details.push(`대용량 CSS 파일: ${largeCssFiles.length}개`);
}

// 5. 접근성 분석
function analyzeAccessibility() {
  const componentFiles = glob.sync('src/**/*.{jsx,js}', {
    ignore: ['**/node_modules/**', '**/build/**', '**/*.test.js']
  });

  let totalInteractiveElements = 0;
  let accessibleElements = 0;

  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 인터랙티브 요소 찾기
    const buttons = content.match(/<button/g) || [];
    const links = content.match(/<a\s/g) || [];
    const inputs = content.match(/<input/g) || [];
    
    totalInteractiveElements += buttons.length + links.length + inputs.length;
    
    // aria-label 또는 alt 속성 확인
    const ariaLabels = content.match(/aria-label/g) || [];
    const alts = content.match(/alt=/g) || [];
    
    accessibleElements += ariaLabels.length + alts.length;
  });

  const accessibilityScore = totalInteractiveElements > 0 
    ? Math.min((accessibleElements / totalInteractiveElements) * 100, 100)
    : 70; // 기본 점수

  categories.accessibility.score = accessibilityScore;
  categories.accessibility.details.push(`접근성 속성 사용률: ${accessibilityScore.toFixed(1)}%`);
  categories.accessibility.details.push(`인터랙티브 요소: ${totalInteractiveElements}개`);
  categories.accessibility.details.push(`접근성 속성: ${accessibleElements}개`);
}

// 6. 테스트 커버리지 분석
function analyzeTestCoverage() {
  const testFiles = glob.sync('src/**/*.test.{js,jsx}', {
    ignore: ['**/node_modules/**']
  });

  const srcFiles = glob.sync('src/**/*.{js,jsx}', {
    ignore: ['**/node_modules/**', '**/*.test.js', '**/*.spec.js', '**/index.js']
  });

  const testCoverageRate = srcFiles.length > 0 
    ? (testFiles.length / srcFiles.length) * 100 
    : 0;

  // 실제 테스트가 있는지 확인
  let actualTests = 0;
  testFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('it(') || content.includes('test(')) {
      actualTests++;
    }
  });

  const effectiveTestRate = srcFiles.length > 0 
    ? (actualTests / srcFiles.length) * 100 
    : 0;

  categories.testCoverage.score = Math.min(effectiveTestRate * 2, 100); // 목표가 70%이므로 2배 적용
  categories.testCoverage.details.push(`테스트 파일: ${testFiles.length}개`);
  categories.testCoverage.details.push(`소스 파일: ${srcFiles.length}개`);
  categories.testCoverage.details.push(`테스트 커버리지: ${effectiveTestRate.toFixed(1)}%`);
}

// 7. 반응형 디자인 분석
function analyzeResponsive() {
  const scssFiles = glob.sync('src/**/*.{scss,css}', {
    ignore: ['**/node_modules/**', '**/build/**']
  });

  let totalFiles = scssFiles.length;
  let responsiveFiles = 0;

  scssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('@media') || content.includes('breakpoint')) {
      responsiveFiles++;
    }
  });

  const responsiveRate = totalFiles > 0 ? (responsiveFiles / totalFiles) * 100 : 0;
  categories.responsive.score = responsiveRate;
  categories.responsive.details.push(`반응형 스타일 사용: ${responsiveFiles}/${totalFiles} 파일`);
  categories.responsive.details.push(`반응형 적용률: ${responsiveRate.toFixed(1)}%`);
}

// 8. 유지보수성 분석
function analyzeMaintenance() {
  let maintenanceScore = 100;

  // 문서화 확인
  const hasReadme = fs.existsSync('README.md');
  const hasMemory = fs.existsSync('MEMORY.md');
  const hasClaude = fs.existsSync('CLAUDE.md');
  
  if (!hasReadme) maintenanceScore -= 20;
  if (!hasMemory) maintenanceScore -= 20;
  if (!hasClaude) maintenanceScore -= 20;

  // 폴더 구조 확인
  const hasGoodStructure = fs.existsSync('src/components') && 
                          fs.existsSync('src/utils') && 
                          fs.existsSync('src/styles');
  
  if (!hasGoodStructure) maintenanceScore -= 20;

  categories.maintenance.score = Math.max(maintenanceScore, 0);
  categories.maintenance.details.push(`README.md: ${hasReadme ? '✓' : '✗'}`);
  categories.maintenance.details.push(`MEMORY.md: ${hasMemory ? '✓' : '✗'}`);
  categories.maintenance.details.push(`CLAUDE.md: ${hasClaude ? '✓' : '✗'}`);
  categories.maintenance.details.push(`폴더 구조: ${hasGoodStructure ? '✓' : '✗'}`);
}

// 모든 분석 실행
console.log(`${colors.blue}📊 분석 시작...${colors.reset}\n`);

analyzeTokenUsage();
analyzeComponentConsistency();
analyzeCodeQuality();
analyzePerformance();
analyzeAccessibility();
analyzeTestCoverage();
analyzeResponsive();
analyzeMaintenance();

// 최종 점수 계산
let totalScore = 0;
let totalWeight = 0;

Object.entries(categories).forEach(([name, category]) => {
  totalScore += (category.score * category.weight) / 100;
  totalWeight += category.weight;
});

const finalScore = Math.round(totalScore);

// 등급 계산
function getGrade(score) {
  if (score >= 95) return { grade: 'A+', color: colors.green };
  if (score >= 90) return { grade: 'A', color: colors.green };
  if (score >= 85) return { grade: 'B+', color: colors.green };
  if (score >= 80) return { grade: 'B', color: colors.blue };
  if (score >= 75) return { grade: 'C+', color: colors.blue };
  if (score >= 70) return { grade: 'C', color: colors.yellow };
  if (score >= 65) return { grade: 'D+', color: colors.yellow };
  if (score >= 60) return { grade: 'D', color: colors.yellow };
  return { grade: 'F', color: colors.red };
}

// 결과 출력
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bright}📊 VideoPlanet UI/UX 최종 점수 보고서${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

// 카테고리별 점수
Object.entries(categories).forEach(([name, category]) => {
  const displayName = {
    tokenUsage: '토큰 사용률',
    componentConsistency: '컴포넌트 일관성',
    codeQuality: '코드 품질',
    performance: '성능 최적화',
    accessibility: '접근성',
    testCoverage: '테스트 커버리지',
    responsive: '반응형 디자인',
    maintenance: '유지보수성'
  }[name];

  const gradeInfo = getGrade(category.score);
  
  console.log(`${colors.bright}${displayName}${colors.reset} (${category.weight}%)`);
  console.log(`  점수: ${gradeInfo.color}${category.score.toFixed(1)}/100${colors.reset} ${gradeInfo.grade}`);
  category.details.forEach(detail => {
    console.log(`  - ${detail}`);
  });
  console.log();
});

// 최종 점수
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);

const finalGrade = getGrade(finalScore);
console.log(`${colors.bright}최종 점수: ${finalGrade.color}${finalScore}/100${colors.reset} ${finalGrade.grade}`);

// 목표 달성 여부
if (finalScore >= 95) {
  console.log(`\n${colors.green}🎉 축하합니다! 95점 목표를 달성했습니다!${colors.reset}`);
} else {
  console.log(`\n${colors.yellow}📈 목표(95점)까지 ${95 - finalScore}점 남았습니다.${colors.reset}`);
}

// 개선 제안
console.log(`\n${colors.cyan}💡 개선 제안${colors.reset}`);
const suggestions = [];

if (categories.tokenUsage.score < 90) {
  suggestions.push('- 하드코딩된 색상과 간격 값을 더 많이 토큰화하세요');
}
if (categories.componentConsistency.score < 90) {
  suggestions.push('- 남은 커스텀 컴포넌트를 통합 컴포넌트로 마이그레이션하세요');
}
if (categories.codeQuality.score < 90) {
  suggestions.push('- console 로그를 제거하고 !important 사용을 줄이세요');
}
if (categories.performance.score < 90) {
  suggestions.push('- 더 많은 페이지에 코드 스플리팅을 적용하세요');
}
if (categories.testCoverage.score < 70) {
  suggestions.push('- 핵심 컴포넌트와 유틸리티에 대한 테스트를 추가하세요');
}

suggestions.forEach(suggestion => console.log(suggestion));

// JSON 파일로 저장
const report = {
  timestamp: new Date().toISOString(),
  finalScore,
  grade: finalGrade.grade,
  categories: Object.entries(categories).reduce((acc, [name, data]) => {
    acc[name] = {
      score: data.score,
      weight: data.weight,
      details: data.details
    };
    return acc;
  }, {}),
  suggestions
};

fs.writeFileSync('final-score-report.json', JSON.stringify(report, null, 2));
console.log(`\n${colors.gray}상세 보고서가 final-score-report.json에 저장되었습니다.${colors.reset}`);

console.log(`\n${colors.bright}분석 완료!${colors.reset}`);