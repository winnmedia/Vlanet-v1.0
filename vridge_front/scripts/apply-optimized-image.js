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
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🖼️  이미지 최적화 컴포넌트 적용${colors.reset}\n`);

// 이미지 태그 패턴
const imgPatterns = {
  // HTML img 태그
  htmlImg: /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g,
  // React 스타일 img 태그
  jsxImg: /<img\s+[^}]*src={["']([^"']+)["'][^}]*}/g,
  // 동적 src
  dynamicImg: /<img\s+[^}]*src={([^}]+)}[^}]*}/g
};

// JSX/JS 파일 찾기
const files = glob.sync('src/**/*.{jsx,js}', {
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/*.test.js',
    '**/*.spec.js',
    '**/OptimizedImage.jsx' // 자기 자신 제외
  ]
});

console.log(`${colors.blue}📁 ${files.length}개 파일 분석 중...${colors.reset}\n`);

let totalImages = 0;
let optimizableImages = 0;
const fileStats = [];

// 각 파일 분석
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let matches = 0;
  
  // 각 패턴 확인
  Object.entries(imgPatterns).forEach(([type, pattern]) => {
    const found = content.match(pattern);
    if (found) {
      matches += found.length;
      totalImages += found.length;
      
      // 최적화 가능한 이미지 확인 (외부 URL 제외)
      found.forEach(match => {
        if (!match.includes('http://') && !match.includes('https://')) {
          optimizableImages++;
        }
      });
    }
  });
  
  if (matches > 0) {
    fileStats.push({
      file: path.relative(process.cwd(), file),
      count: matches
    });
  }
});

// 결과 출력
console.log(`${colors.yellow}📊 분석 결과${colors.reset}\n`);
console.log(`  - 총 이미지 태그: ${totalImages}개`);
console.log(`  - 최적화 가능: ${optimizableImages}개`);
console.log(`  - 영향받는 파일: ${fileStats.length}개\n`);

// 상위 10개 파일 표시
if (fileStats.length > 0) {
  console.log(`${colors.bright}이미지가 많은 파일 (상위 10개)${colors.reset}`);
  fileStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .forEach(({ file, count }) => {
      console.log(`  - ${file}: ${count}개`);
    });
  console.log();
}

// 마이그레이션 예시
console.log(`${colors.green}💡 마이그레이션 예시${colors.reset}\n`);

console.log('1. 기본 이미지:');
console.log('   Before: <img src="/images/logo.png" alt="Logo" />');
console.log('   After:  <OptimizedImage src="/images/logo.png" alt="Logo" width={200} height={100} />\n');

console.log('2. 썸네일:');
console.log('   Before: <img src={video.thumbnail} alt={video.title} className="thumbnail" />');
console.log('   After:  <Thumbnail src={video.thumbnail} alt={video.title} size="medium" />\n');

console.log('3. 프로필 이미지:');
console.log('   Before: <img src={user.avatar} alt={user.name} className="avatar" />');
console.log('   After:  <Avatar src={user.avatar} alt={user.name} size="medium" />\n');

console.log('4. 배너 이미지:');
console.log('   Before: <img src="/images/hero.jpg" alt="Hero" className="banner" />');
console.log('   After:  <Banner src="/images/hero.jpg" alt="Hero" aspectRatio="16:9" />\n');

// 예상 효과 계산
const webpSavings = Math.round(optimizableImages * 0.3); // 30% 파일 크기 감소
const lazyLoadSavings = Math.round(optimizableImages * 0.5); // 50% 초기 로드 감소

console.log(`${colors.cyan}🎯 예상 효과${colors.reset}`);
console.log(`  - WebP 변환: 평균 30% 파일 크기 감소`);
console.log(`  - Lazy Loading: ${lazyLoadSavings}개 이미지 지연 로드`);
console.log(`  - 초기 로드 시간: 약 ${Math.round(lazyLoadSavings * 0.1)}초 단축`);
console.log(`  - 대역폭 절약: 약 ${Math.round(webpSavings * 50)}KB`);

// 자동 마이그레이션 함수 (예시)
function migrateToOptimizedImage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // OptimizedImage import 추가
  if (!content.includes('OptimizedImage') && content.includes('<img')) {
    const importRegex = /^import\s+.*\s+from\s+['"][^'"]+['"];?\s*$/m;
    const lastImport = content.match(importRegex);
    if (lastImport) {
      const insertPos = content.indexOf(lastImport[0]) + lastImport[0].length;
      content = content.slice(0, insertPos) + 
        '\nimport OptimizedImage, { Thumbnail, Avatar, Banner } from \'../components/OptimizedImage\';' + 
        content.slice(insertPos);
      modified = true;
    }
  }
  
  // 간단한 이미지 태그 변환 (실제로는 더 복잡한 로직 필요)
  // 예시로만 제공
  
  return modified;
}

// 다음 단계
console.log(`\n${colors.yellow}📋 구현 단계${colors.reset}`);
console.log('1. 높은 트래픽 페이지부터 적용 (홈, 피드백, 프로젝트)');
console.log('2. 썸네일이 많은 리스트 페이지 우선 적용');
console.log('3. next.config.js에 이미지 도메인 설정');
console.log('4. 성능 모니터링 및 개선 효과 측정');

console.log(`\n${colors.bright}완료!${colors.reset}`);