const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('📱 반응형 토큰 적용 시작...\n');

// SCSS 파일 찾기
const scssFiles = glob.sync('src/**/*.{scss,module.scss}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
});

// 반응형 브레이크포인트 매핑
const breakpointMap = {
  // 직접적인 미디어 쿼리 변환
  '@media (max-width: 767px)': '@include mobile',
  '@media (max-width: 768px)': '@include mobile',
  '@media (min-width: 768px)': '@include tablet-up',
  '@media (min-width: 768px) and (max-width: 1023px)': '@include tablet-only',
  '@media (min-width: 1024px)': '@include desktop-up',
  '@media (min-width: 1200px)': '@include large-up',
  '@media (max-width: 1023px)': '@include tablet-down',
  '@media (max-width: 1199px)': '@include desktop-down',
  
  // screen 포함 버전
  '@media screen and (max-width: 767px)': '@include mobile',
  '@media screen and (max-width: 768px)': '@include mobile',
  '@media screen and (min-width: 768px)': '@include tablet-up',
  '@media screen and (min-width: 768px) and (max-width: 1023px)': '@include tablet-only',
  '@media screen and (min-width: 1024px)': '@include desktop-up',
  '@media screen and (min-width: 1200px)': '@include large-up',
  
  // 일반적인 브레이크포인트
  '@media (max-width: 575px)': '@include mobile',
  '@media (max-width: 576px)': '@include mobile',
  '@media (min-width: 576px)': '@include mobile-up',
  '@media (min-width: 992px)': '@include desktop-up',
  '@media (min-width: 1280px)': '@include large-up',
  '@media (min-width: 1440px)': '@include xlarge-up'
};

let totalConverted = 0;
let fileCount = 0;

scssFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = 0;
  
  // design-tokens import 확인
  const hasDesignTokensImport = content.includes('@import') && 
    (content.includes('design-tokens') || content.includes('_variables'));
  
  // 미디어 쿼리 변환
  Object.entries(breakpointMap).forEach(([oldQuery, newMixin]) => {
    const regex = new RegExp(oldQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*{', 'g');
    if (content.match(regex)) {
      content = content.replace(regex, `${newMixin} {`);
      changes++;
    }
  });
  
  // design-tokens import가 없으면 추가
  if (changes > 0 && !hasDesignTokensImport) {
    // 파일 시작 부분의 import 문 찾기
    const importMatch = content.match(/^(@import\s+[^;]+;[\s\n]*)+/m);
    if (importMatch) {
      // 기존 import 문 뒤에 추가
      content = content.replace(importMatch[0], 
        importMatch[0] + '@import "../../styles/design-tokens";\n');
    } else {
      // import 문이 없으면 파일 시작에 추가
      content = '@import "../../styles/design-tokens";\n\n' + content;
    }
  }
  
  // 파일 저장
  if (changes > 0 && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath)}: ${changes}개 미디어 쿼리 변환`);
    totalConverted += changes;
    fileCount++;
  }
});

console.log(`\n🎉 반응형 토큰 적용 완료!`);
console.log(`- 총 ${fileCount}개 파일 수정`);
console.log(`- 총 ${totalConverted}개 미디어 쿼리 변환`);

// 추가 분석: 아직 변환되지 않은 미디어 쿼리 찾기
console.log('\n🔍 남은 하드코딩된 미디어 쿼리 검색...');

let remainingQueries = 0;
const remainingFiles = [];

scssFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 남은 미디어 쿼리 패턴
  const mediaQueryPattern = /@media\s*(?:screen\s+and\s*)?\([^)]+\)/g;
  const matches = content.match(mediaQueryPattern) || [];
  
  if (matches.length > 0) {
    remainingQueries += matches.length;
    remainingFiles.push({
      file: path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath),
      queries: matches
    });
  }
});

if (remainingFiles.length > 0) {
  console.log(`\n⚠️  ${remainingQueries}개의 미디어 쿼리가 아직 하드코딩되어 있습니다:`);
  remainingFiles.slice(0, 10).forEach(({ file, queries }) => {
    console.log(`\n📄 ${file}:`);
    queries.slice(0, 3).forEach(query => {
      console.log(`   - ${query}`);
    });
  });
}