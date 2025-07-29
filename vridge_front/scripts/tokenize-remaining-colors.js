const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🎨 남은 하드코딩 색상 토큰화 시작...\n');

// SCSS 파일 찾기
const scssFiles = glob.sync('src/**/*.{scss,module.scss}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/design-tokens.scss']
});

// 추가 색상 매핑
const colorMap = {
  // 회색 계열
  '#f5f5f5': '$color-gray-50',
  '#f0f0f0': '$color-gray-100',
  '#e0e0e0': '$color-gray-200',
  '#ccc': '$color-gray-400',
  '#999': '$color-gray-500',
  '#666': '$color-gray-600',
  '#333': '$color-gray-800',
  '#222': '$color-gray-900',
  '#000': '$color-black',
  '#fff': '$color-white',
  '#ffffff': '$color-white',
  '#000000': '$color-black',
  
  // 파란색 계열
  '#1631F8': '$color-vp-blue',
  '#0F23C9': '$color-vp-blue-dark',
  '#3B57FF': '$color-vp-blue-light',
  '#007bff': '$color-primary',
  '#0056b3': '$color-primary-dark',
  '#004085': '$color-primary-dark',
  
  // 빨간색 계열
  '#dc3545': '$color-danger',
  '#c82333': '$color-danger-dark',
  '#bd2130': '$color-danger-dark',
  '#f8d7da': '$color-danger-light',
  '#721c24': '$color-danger-dark',
  
  // 녹색 계열
  '#28a745': '$color-success',
  '#218838': '$color-success-dark',
  '#1e7e34': '$color-success-dark',
  '#d4edda': '$color-success-light',
  '#155724': '$color-success-dark',
  
  // 노란색 계열
  '#ffc107': '$color-warning',
  '#e0a800': '$color-warning-dark',
  '#d39e00': '$color-warning-dark',
  '#fff3cd': '$color-warning-light',
  '#856404': '$color-warning-dark',
  
  // 청록색 계열
  '#17a2b8': '$color-info',
  '#138496': '$color-info-dark',
  '#117a8b': '$color-info-dark',
  '#d1ecf1': '$color-info-light',
  '#0c5460': '$color-info-dark',
  
  // 투명도 포함
  'rgba(0, 0, 0, 0.5)': 'rgba($color-black, $opacity-50)',
  'rgba(0, 0, 0, 0.3)': 'rgba($color-black, $opacity-30)',
  'rgba(0, 0, 0, 0.1)': 'rgba($color-black, $opacity-10)',
  'rgba(0, 0, 0, 0.05)': 'rgba($color-black, $opacity-5)',
  'rgba(0, 0, 0, 0.8)': 'rgba($color-black, $opacity-80)',
  'rgba(255, 255, 255, 0.5)': 'rgba($color-white, $opacity-50)',
  'rgba(255, 255, 255, 0.3)': 'rgba($color-white, $opacity-30)',
  'rgba(255, 255, 255, 0.1)': 'rgba($color-white, $opacity-10)',
  'rgba(255, 255, 255, 0.9)': 'rgba($color-white, $opacity-90)',
  'rgba(255, 255, 255, 0.95)': 'rgba($color-white, $opacity-95)',
  
  // 특수 색상
  'transparent': 'transparent',
  'inherit': 'inherit'
};

let totalTokenized = 0;
let fileCount = 0;

scssFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = 0;

  // 색상 관련 속성들
  const colorProperties = [
    'color', 'background-color', 'background', 'border-color', 
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'box-shadow', 'text-shadow', 'outline-color', 'fill', 'stroke'
  ];

  // 각 색상 토큰화
  Object.entries(colorMap).forEach(([color, token]) => {
    // 속성별로 색상 교체
    colorProperties.forEach(prop => {
      // 일반 속성
      const pattern = new RegExp(`(${prop}:\\s*)${color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      content = content.replace(pattern, (match, prefix) => {
        changes++;
        return prefix + token;
      });
    });
    
    // border 속성에서 색상 교체
    const borderPattern = new RegExp(`(border(?:-top|-right|-bottom|-left)?:\\s*[^;]*\\s)${color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    content = content.replace(borderPattern, (match, prefix) => {
      changes++;
      return prefix + token;
    });
    
    // box-shadow에서 색상 교체
    const shadowPattern = new RegExp(`(box-shadow:\\s*[^;]*\\s)${color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    content = content.replace(shadowPattern, (match, prefix) => {
      changes++;
      return prefix + token;
    });
  });

  // 파일 저장
  if (changes > 0 && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath)}: ${changes}개 색상 토큰화`);
    totalTokenized += changes;
    fileCount++;
  }
});

console.log(`\n🎉 색상 토큰화 완료!`);
console.log(`- 총 ${fileCount}개 파일 수정`);
console.log(`- 총 ${totalTokenized}개 색상 토큰화`);