const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('📏 추가 간격 값 토큰화 시작...\n');

// SCSS 파일 찾기
const scssFiles = glob.sync('src/**/*.{scss,module.scss}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
});

// 더 많은 간격 매핑
const spacingMap = {
  // 작은 값들
  '0px': '0',
  '1px': '$spacing-2xs',
  '2px': '$spacing-2xs',
  '3px': '$spacing-xs',
  '4px': '$spacing-xs',
  '5px': '$spacing-xs',
  '6px': '$spacing-sm',
  '8px': '$spacing-sm',
  '10px': '$spacing-sm',
  '12px': '$spacing-md',
  '14px': '$spacing-md',
  '15px': '$spacing-md',
  '16px': '$spacing-lg',
  '18px': '$spacing-lg',
  '20px': '$spacing-xl',
  '24px': '$spacing-2xl',
  '28px': '$spacing-2xl',
  '30px': '$spacing-2xl',
  '32px': '$spacing-3xl',
  '36px': '$spacing-3xl',
  '40px': '$spacing-4xl',
  '48px': '$spacing-5xl',
  '50px': '$spacing-5xl',
  '56px': '$spacing-5xl',
  '60px': '$spacing-6xl',
  '64px': '$spacing-6xl',
  '72px': '$spacing-6xl',
  '80px': '$spacing-7xl',
  '96px': '$spacing-8xl',
  '100px': '$spacing-8xl',
  '120px': '$spacing-8xl + $spacing-2xl',
  '150px': '$spacing-8xl + $spacing-5xl',
  '180px': '$spacing-8xl * 2',
  '200px': '$spacing-8xl * 2.1',
  
  // rem 값들
  '0.25rem': '$spacing-xs',
  '0.5rem': '$spacing-sm',
  '0.75rem': '$spacing-md',
  '1rem': '$spacing-lg',
  '1.25rem': '$spacing-xl',
  '1.5rem': '$spacing-2xl',
  '2rem': '$spacing-3xl',
  '2.5rem': '$spacing-4xl',
  '3rem': '$spacing-5xl',
  '4rem': '$spacing-6xl',
  '5rem': '$spacing-7xl',
  '6rem': '$spacing-8xl'
};

let totalTokenized = 0;
let fileCount = 0;

scssFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = 0;

  // 모든 간격 속성
  const spacingProperties = [
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'gap', 'row-gap', 'column-gap',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'top', 'right', 'bottom', 'left',
    'border-radius', 'font-size', 'line-height',
    'grid-gap', 'flex-gap'
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
    
    // 약식 속성들 (padding: 10px 20px; 형식)
    const shorthandPattern = new RegExp(`((?:padding|margin):\\s*[^;]*\\s)${value}(?![-\\w])`, 'g');
    content = content.replace(shorthandPattern, (match, prefix) => {
      changes++;
      return prefix + token;
    });
  });

  // grid-template-columns의 특수한 경우
  content = content.replace(/grid-template-columns:\s*180px\s+1fr/g, 'grid-template-columns: calc($spacing-8xl * 2) 1fr');

  if (changes > 0 && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath)}: ${changes}개 간격 토큰화`);
    totalTokenized += changes;
    fileCount++;
  }
});

console.log(`\n🎉 추가 간격 토큰화 완료!`);
console.log(`- 총 ${fileCount}개 파일 수정`);
console.log(`- 총 ${totalTokenized}개 간격 토큰화`);