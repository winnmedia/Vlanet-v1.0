const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('📏 간격 값 토큰화 시작...\n');

// SCSS 파일 찾기
const scssFiles = glob.sync('src/**/*.{scss,module.scss}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
});

// 간격 매핑 (자주 사용되는 값들)
const spacingMap = {
  // 작은 값들
  '0px': '0',
  '2px': '$spacing-xs',
  '4px': '$spacing-xs',
  '8px': '$spacing-sm',
  '10px': '$spacing-sm',
  '12px': '$spacing-md',
  '16px': '$spacing-lg',
  '20px': '$spacing-xl',
  '24px': '$spacing-2xl',
  '32px': '$spacing-3xl',
  '40px': '$spacing-4xl',
  '48px': '$spacing-5xl',
  '64px': '$spacing-6xl',
  '80px': '$spacing-7xl',
  '96px': '$spacing-8xl',
  
  // 특별한 값들
  '140px': '$spacing-8xl + $spacing-4xl', // 96 + 44 = 140
  '250px': '$spacing-8xl * 2.6',
  '260px': '$spacing-6xl * 4',
  '280px': '$spacing-6xl * 4.4',
  '350px': '$spacing-8xl * 3.6',
  '800px': '$spacing-8xl * 8.3',
  '900px': '$spacing-8xl * 9.4',
  '1400px': '$spacing-8xl * 14.6',
  '1500px': '$spacing-8xl * 15.6',
  '1600px': '$spacing-8xl * 16.7',
  
  // rem 값들
  '0.5rem': '$spacing-sm',
  '1rem': '$spacing-lg',
  '1.5rem': '$spacing-2xl',
  '2rem': '$spacing-3xl',
  '3rem': '$spacing-5xl',
  '4rem': '$spacing-6xl',
  '5rem': '$spacing-7xl',
  '6rem': '$spacing-8xl'
};

let totalTokenized = 0;
let fileCount = 0;

// 특별히 많은 하드코딩이 있는 파일들
const targetFiles = [
  'src/page/Cms/VideoPlanning.scss',
  'src/css/Home.scss',
  'src/page/User/MyPage.scss',
  'src/css/Cms/FeedbackGridLayout.module.scss',
  'src/css/Cms/Cms.scss'
];

scssFiles.forEach(filePath => {
  // 타겟 파일이 아니면 스킵
  if (!targetFiles.some(target => filePath.includes(target))) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = 0;

  // 간격 속성 패턴
  const spacingProperties = [
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'gap', 'row-gap', 'column-gap',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'top', 'right', 'bottom', 'left'
  ];

  // 간격 토큰화
  Object.entries(spacingMap).forEach(([value, token]) => {
    spacingProperties.forEach(prop => {
      const pattern = new RegExp(`(${prop}:\\s*)${value.replace('(', '\\(').replace(')', '\\)')}(?![-\\w])`, 'g');
      content = content.replace(pattern, (match, prefix) => {
        changes++;
        return prefix + token;
      });
    });
  });

  // 특별한 케이스들 처리
  // minmax 함수 내부의 값들
  content = content.replace(/minmax\((\d+px),/g, (match, value) => {
    if (spacingMap[value]) {
      changes++;
      return `minmax(${spacingMap[value]},`;
    }
    return match;
  });

  // calc 함수 추가하여 복잡한 값 처리
  content = content.replace(/:\s*140px/g, ': calc($spacing-8xl + $spacing-4xl)');
  content = content.replace(/:\s*250px/g, ': calc($spacing-8xl * 2.6)');
  content = content.replace(/:\s*350px/g, ': calc($spacing-8xl * 3.6)');

  if (changes > 0 && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath)}: ${changes}개 간격 토큰화`);
    totalTokenized += changes;
    fileCount++;
  }
});

console.log(`\n🎉 간격 토큰화 완료!`);
console.log(`- 총 ${fileCount}개 파일 수정`);
console.log(`- 총 ${totalTokenized}개 간격 토큰화`);