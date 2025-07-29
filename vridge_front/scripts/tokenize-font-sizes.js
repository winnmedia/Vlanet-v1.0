const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 폰트 크기 토큰화 시작...');

// SCSS 파일 찾기
const scssFiles = glob.sync('src/**/*.{scss,module.scss}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
});

// 폰트 크기 매핑
const fontSizeMap = {
  // px 값
  '10px': '$font-size-xs',
  '11px': '$font-size-xs',
  '12px': '$font-size-sm',
  '13px': '$font-size-sm',
  '14px': '$font-size-base',
  '15px': '$font-size-base',
  '16px': '$font-size-md',
  '17px': '$font-size-md',
  '18px': '$font-size-lg',
  '20px': '$font-size-xl',
  '22px': '$font-size-xl',
  '24px': '$font-size-2xl',
  '26px': '$font-size-2xl',
  '28px': '$font-size-3xl',
  '30px': '$font-size-3xl',
  '32px': '$font-size-4xl',
  '36px': '$font-size-4xl',
  '40px': '$font-size-5xl',
  '48px': '$font-size-5xl',
  
  // rem 값
  '0.625rem': '$font-size-xs',
  '0.75rem': '$font-size-sm',
  '0.875rem': '$font-size-base',
  '1rem': '$font-size-md',
  '1.125rem': '$font-size-lg',
  '1.25rem': '$font-size-xl',
  '1.5rem': '$font-size-2xl',
  '1.75rem': '$font-size-3xl',
  '2rem': '$font-size-4xl',
  '2.5rem': '$font-size-5xl',
  '3rem': '$font-size-5xl',
};

let totalTokenized = 0;
let fileCount = 0;

scssFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = 0;

  // font-size 패턴 찾기
  const fontSizePatterns = [
    /font-size:\s*(\d+(?:\.\d+)?(?:px|rem))/g,
    /fontSize:\s*['"](\d+(?:\.\d+)?(?:px|rem))['"]/g,
    /fontSize:\s*(\d+(?:\.\d+)?(?:px|rem))/g,
  ];

  fontSizePatterns.forEach(pattern => {
    content = content.replace(pattern, (match, size) => {
      if (fontSizeMap[size]) {
        changes++;
        return match.replace(size, fontSizeMap[size]);
      }
      return match;
    });
  });

  // line-height도 함께 처리 (폰트 크기와 연관)
  const lineHeightPatterns = [
    /line-height:\s*1\.2(?:\d*)?/g,
    /line-height:\s*1\.3(?:\d*)?/g,
    /line-height:\s*1\.4(?:\d*)?/g,
    /line-height:\s*1\.5(?:\d*)?/g,
    /line-height:\s*1\.6(?:\d*)?/g,
    /line-height:\s*1\.7(?:\d*)?/g,
    /line-height:\s*1\.8(?:\d*)?/g,
  ];

  const lineHeightMap = {
    '1.2': '$line-height-tight',
    '1.3': '$line-height-tight',
    '1.4': '$line-height-base',
    '1.5': '$line-height-base',
    '1.6': '$line-height-relaxed',
    '1.7': '$line-height-relaxed',
    '1.8': '$line-height-loose',
  };

  lineHeightPatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      const value = match.match(/[\d.]+/)[0];
      const baseValue = value.substring(0, 3);
      if (lineHeightMap[baseValue]) {
        changes++;
        return `line-height: ${lineHeightMap[baseValue]}`;
      }
      return match;
    });
  });

  if (changes > 0 && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath)}: ${changes}개 변환`);
    totalTokenized += changes;
    fileCount++;
  }
});

console.log(`\n🎉 폰트 크기 토큰화 완료!`);
console.log(`- 총 ${fileCount}개 파일 수정`);
console.log(`- 총 ${totalTokenized}개 폰트 크기 토큰화`);