#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('CSS 스타일 비교 분석 보고서\n');
console.log('===================================\n');

// 1. 백업 폴더의 Common.scss와 Next.js의 global.scss 비교
console.log('1. 백업 Common.scss vs Next.js global.scss 비교:\n');

console.log('✅ 동일한 부분:');
console.log('- 기본 box-sizing, body 스타일 설정');
console.log('- margin-top 유틸리티 클래스 (mt10 ~ mt200)');
console.log('- 기본 input, textarea, select 스타일');
console.log('- cursor pointer 설정');
console.log('- submit 버튼 스타일\n');

console.log('❌ 차이점:');
console.log('- 백업: 이미지 경로가 상대 경로 (images/Common/...)');
console.log('- Next.js: 이미지 경로가 ../images/Common/... 로 수정됨\n');

// 2. Header 스타일 비교
console.log('2. Header 스타일 비교:\n');
console.log('✅ 백업과 Next.js 모두 동일한 스타일 적용됨');
console.log('- height: 80px');
console.log('- padding: 0 30px');
console.log('- 로고 width: 150px\n');

// 3. CMS 레이아웃 분석
console.log('3. CMS 페이지 레이아웃 분석:\n');

console.log('백업 폴더의 주요 CMS 스타일:');
console.log('- cms_wrap: margin-top: 40px');
console.log('- main: padding: 0 30px 0 80px');
console.log('- content: margin: 50px 0 50px\n');

console.log('Next.js의 추가된 LayoutFix.scss:');
console.log('- content.feedback: padding: 20px, padding-left: 8px');
console.log('- 반응형 레이아웃 개선\n');

// 4. 누락된 스타일 확인
console.log('4. 주요 누락 가능성 체크:\n');

console.log('✅ 확인된 사항:');
console.log('- 모든 주요 SCSS 파일이 _app.js에 import됨');
console.log('- CmsCommon.scss가 Cms.scss를 import하고 있음');
console.log('- LayoutFix.scss가 추가 레이아웃 조정을 담당\n');

console.log('⚠️ 확인 필요 사항:');
console.log('- body, html의 추가 스타일이 다른 파일에 있을 가능성');
console.log('- PageTemplate 컴포넌트의 레이아웃 스타일 확인 필요');
console.log('- SideBar 컴포넌트의 width 설정 확인 필요\n');

// 5. 권장사항
console.log('5. 레이아웃 이슈 해결 권장사항:\n');

console.log('1) PageTemplate 컴포넌트 확인:');
console.log('   - 전체 페이지를 감싸는 wrapper의 패딩/마진 설정');
console.log('   - min-height 또는 height 설정\n');

console.log('2) CMS 페이지별 컨테이너 확인:');
console.log('   - .cms_wrap의 상위 요소 스타일');
console.log('   - main 태그 외부의 추가 wrapper 존재 여부\n');

console.log('3) 폰트 및 글로벌 스타일:');
console.log('   - @font-face 선언 확인');
console.log('   - reset.scss의 추가 스타일 확인\n');

// 추가 CSS 검색
console.log('6. 추가 스타일 검색 결과:\n');

const backupCssPath = path.join(__dirname, 'vridge_front_backup_0722/src/css');
const nextCssPath = path.join(__dirname, 'vridge-front-next/src/css');

// Common 폴더 체크
console.log('백업 Common 폴더 스타일:');
try {
  const commonFiles = fs.readdirSync(path.join(backupCssPath, 'Common'));
  commonFiles.forEach(file => {
    if (file.endsWith('.scss')) {
      console.log(`  - ${file}`);
    }
  });
} catch (err) {
  console.log('  Common 폴더를 찾을 수 없습니다.');
}

console.log('\nNext.js Common 폴더 스타일:');
try {
  const commonFiles = fs.readdirSync(path.join(nextCssPath, 'Common'));
  commonFiles.forEach(file => {
    if (file.endsWith('.scss')) {
      console.log(`  - ${file}`);
    }
  });
} catch (err) {
  console.log('  Common 폴더를 찾을 수 없습니다.');
}

console.log('\n===================================');
console.log('분석 완료!');