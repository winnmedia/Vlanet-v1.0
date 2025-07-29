const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 점수 분석 함수들
function analyzeConsoleUsage() {
  const patterns = ['src/**/*.{js,jsx}', 'pages/**/*.{js,jsx}'];
  const ignorePatterns = [
    '**/node_modules/**', 
    '**/scripts/**', 
    '**/__tests__/**', 
    '**/dist/**',
    '**/build/**',
    '**/utils/logger.js'
  ];
  
  let consoleCount = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      cwd: process.cwd(),
      absolute: true,
      ignore: ignorePatterns
    });
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/console\.(log|error|warn|info|debug)/g);
      if (matches) {
        consoleCount += matches.length;
      }
    });
  });
  
  return consoleCount;
}

function analyzeCodeSplitting() {
  const patterns = ['src/page/**/*.{js,jsx}', 'pages/**/*.{js,jsx}'];
  let totalPages = 0;
  let splittedPages = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      cwd: process.cwd(),
      absolute: true,
      ignore: ['**/node_modules/**', '**/_app.js', '**/_document.js']
    });
    
    files.forEach(file => {
      totalPages++;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('dynamic(') || content.includes('lazy(')) {
        splittedPages++;
      }
    });
  });
  
  return { total: totalPages, splitted: splittedPages, percentage: (splittedPages / totalPages * 100).toFixed(1) };
}

function analyzeResponsiveDesign() {
  const scssFiles = glob.sync('src/**/*.{scss,css}', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**']
  });
  
  let responsiveFiles = 0;
  
  scssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (/@media\s*\([^)]*max-width|min-width/.test(content)) {
      responsiveFiles++;
    }
  });
  
  return { total: scssFiles.length, responsive: responsiveFiles, percentage: (responsiveFiles / scssFiles.length * 100).toFixed(1) };
}

function analyzeModalConsistency() {
  const jsxFiles = glob.sync('src/**/*.{jsx,js}', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/scripts/**']
  });
  
  let modalFiles = 0;
  let unifiedModalFiles = 0;
  
  jsxFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 모달 관련 패턴이 있는지 확인
    if (/<Modal|showModal|isModalOpen|modalVisible|className=.*modal/.test(content)) {
      modalFiles++;
      
      // UnifiedModal 사용 여부 확인
      if (/UnifiedModal/.test(content)) {
        unifiedModalFiles++;
      }
    }
  });
  
  return { 
    total: modalFiles, 
    unified: unifiedModalFiles, 
    percentage: modalFiles > 0 ? (unifiedModalFiles / modalFiles * 100).toFixed(1) : 100 
  };
}

// 메인 실행
console.log('🔍 정확한 점수 분석 중...\n');

const consoleCount = analyzeConsoleUsage();
console.log(`✅ Console 사용: ${consoleCount}개`);

const codeSplitting = analyzeCodeSplitting();
console.log(`✅ 코드 스플리팅: ${codeSplitting.splitted}/${codeSplitting.total} 페이지 (${codeSplitting.percentage}%)`);

const responsive = analyzeResponsiveDesign();
console.log(`✅ 반응형 디자인: ${responsive.responsive}/${responsive.total} 파일 (${responsive.percentage}%)`);

const modalConsistency = analyzeModalConsistency();
console.log(`✅ 모달 일관성: ${modalConsistency.unified}/${modalConsistency.total} 파일 (${modalConsistency.percentage}%)`);

// 점수 계산
const scores = {
  codeQuality: consoleCount === 0 ? 100 : Math.max(70, 100 - consoleCount * 2),
  codeSplitting: parseFloat(codeSplitting.percentage),
  responsive: parseFloat(responsive.percentage),
  modalConsistency: parseFloat(modalConsistency.percentage)
};

console.log('\n📊 개선된 점수:');
console.log(`- 코드 품질: ${scores.codeQuality}점`);
console.log(`- 코드 스플리팅: ${scores.codeSplitting}점`); 
console.log(`- 반응형 디자인: ${scores.responsive}점`);
console.log(`- 모달 일관성: ${scores.modalConsistency}점`);

// 전체 점수 계산 (가중치 적용)
const weights = {
  tokenUsage: { score: 93.2, weight: 0.15 },
  componentConsistency: { 
    score: (100 + 95 + 90.3 + scores.modalConsistency) / 4, 
    weight: 0.20 
  },
  codeQuality: { score: scores.codeQuality, weight: 0.15 },
  performance: { score: scores.codeSplitting, weight: 0.15 },
  accessibility: { score: 100, weight: 0.10 },
  testCoverage: { score: 71.7, weight: 0.10 },
  responsive: { score: scores.responsive, weight: 0.10 },
  maintainability: { score: 100, weight: 0.05 }
};

let totalScore = 0;
Object.values(weights).forEach(item => {
  totalScore += item.score * item.weight;
});

console.log(`\n🎯 예상 최종 점수: ${Math.round(totalScore)}/100`);
console.log(`📈 목표(95점)까지 ${95 - Math.round(totalScore)}점 남음`);