const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🎨 공격적인 색상 토큰화 시작...\n');

// SCSS 파일 찾기
const scssFiles = glob.sync('src/**/*.{scss,module.scss}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
});

// 확장된 색상 매핑
const colorMap = {
  // 브랜드 색상
  '#1631F8': '$color-primary',
  '#1631f8': '$color-primary',
  '#0F23C9': '$color-primary-dark',
  '#0f23c9': '$color-primary-dark',
  
  // 시스템 색상
  '#dc3545': '$color-danger',
  '#DC3545': '$color-danger',
  '#ff0000': '$color-danger',
  '#FF0000': '$color-danger',
  '#f00': '$color-danger',
  '#28a745': '$color-success',
  '#28A745': '$color-success',
  '#ffc107': '$color-warning',
  '#FFC107': '$color-warning',
  '#17a2b8': '$color-info',
  '#17A2B8': '$color-info',
  
  // 그레이스케일
  '#ffffff': '$color-white',
  '#FFFFFF': '$color-white',
  '#fff': '$color-white',
  '#FFF': '$color-white',
  '#000000': '$color-black',
  '#000': '$color-black',
  '#f8f9fa': '$color-gray-100',
  '#F8F9FA': '$color-gray-100',
  '#e9ecef': '$color-gray-200',
  '#E9ECEF': '$color-gray-200',
  '#dee2e6': '$color-gray-300',
  '#DEE2E6': '$color-gray-300',
  '#ced4da': '$color-gray-400',
  '#CED4DA': '$color-gray-400',
  '#adb5bd': '$color-gray-500',
  '#ADB5BD': '$color-gray-500',
  '#6c757d': '$color-gray-600',
  '#6C757D': '$color-gray-600',
  '#495057': '$color-gray-700',
  '#495057': '$color-gray-700',
  '#343a40': '$color-gray-800',
  '#343A40': '$color-gray-800',
  '#212529': '$color-gray-900',
  '#212529': '$color-gray-900',
  
  // 추가 색상
  '#333333': '$color-gray-800',
  '#333': '$color-gray-800',
  '#666666': '$color-gray-600',
  '#666': '$color-gray-600',
  '#999999': '$color-gray-500',
  '#999': '$color-gray-500',
  '#cccccc': '$color-gray-400',
  '#ccc': '$color-gray-400',
  '#f5f5f5': '$color-gray-100',
  '#F5F5F5': '$color-gray-100',
  '#fafafa': '$color-gray-50',
  '#FAFAFA': '$color-gray-50',
  '#eeeeee': '$color-gray-200',
  '#eee': '$color-gray-200',
  '#ddd': '$color-gray-300',
  '#dddddd': '$color-gray-300',
  '#e0e0e0': '$color-gray-300',
  '#E0E0E0': '$color-gray-300',
  '#f0f0f0': '$color-gray-100',
  '#F0F0F0': '$color-gray-100',
  '#f3f3f3': '$color-gray-100',
  '#F3F3F3': '$color-gray-100',
  '#f7f7f7': '$color-gray-50',
  '#F7F7F7': '$color-gray-50',
  '#fcfcfc': '$color-gray-50',
  '#FCFCFC': '$color-gray-50',
  
  // 더 많은 색상들
  '#007bff': '$color-primary',
  '#007BFF': '$color-primary',
  '#0056b3': '$color-primary-dark',
  '#0056B3': '$color-primary-dark',
  '#e7e7e7': '$color-gray-200',
  '#E7E7E7': '$color-gray-200',
  '#d3d3d3': '$color-gray-300',
  '#D3D3D3': '$color-gray-300',
  '#b0b0b0': '$color-gray-500',
  '#B0B0B0': '$color-gray-500',
  '#888888': '$color-gray-600',
  '#888': '$color-gray-600',
  '#555555': '$color-gray-700',
  '#555': '$color-gray-700',
  '#444444': '$color-gray-800',
  '#444': '$color-gray-800',
  '#222222': '$color-gray-900',
  '#222': '$color-gray-900',
  '#111111': '$color-gray-900',
  '#111': '$color-gray-900'
};

let totalTokenized = 0;
let fileCount = 0;

scssFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = 0;

  // hex 색상 토큰화
  Object.entries(colorMap).forEach(([hex, token]) => {
    // 모든 색상 속성에서 교체
    const hexPattern = new RegExp(`(:|\\s)${hex.replace('#', '#')}(?![-\\w])`, 'gi');
    content = content.replace(hexPattern, (match, prefix) => {
      changes++;
      return prefix + token;
    });
  });

  // rgba 색상 처리
  const rgbaPatterns = [
    { pattern: /rgba\(0,\s*0,\s*0,\s*([0-9.]+)\)/g, token: 'rgba($color-black, $1)' },
    { pattern: /rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)/g, token: 'rgba($color-white, $1)' },
    { pattern: /rgba\(22,\s*49,\s*248,\s*([0-9.]+)\)/g, token: 'rgba($color-primary, $1)' },
    { pattern: /rgba\(220,\s*53,\s*69,\s*([0-9.]+)\)/g, token: 'rgba($color-danger, $1)' },
    { pattern: /rgba\(40,\s*167,\s*69,\s*([0-9.]+)\)/g, token: 'rgba($color-success, $1)' },
    { pattern: /rgba\(255,\s*193,\s*7,\s*([0-9.]+)\)/g, token: 'rgba($color-warning, $1)' },
    { pattern: /rgba\(23,\s*162,\s*184,\s*([0-9.]+)\)/g, token: 'rgba($color-info, $1)' },
    { pattern: /rgba\(108,\s*117,\s*125,\s*([0-9.]+)\)/g, token: 'rgba($color-gray-600, $1)' },
    { pattern: /rgba\(52,\s*58,\s*64,\s*([0-9.]+)\)/g, token: 'rgba($color-gray-800, $1)' },
    { pattern: /rgba\(33,\s*37,\s*41,\s*([0-9.]+)\)/g, token: 'rgba($color-gray-900, $1)' }
  ];

  rgbaPatterns.forEach(({ pattern, token }) => {
    content = content.replace(pattern, (match, alpha) => {
      changes++;
      return token.replace('$1', alpha);
    });
  });

  // rgb 색상 처리
  const rgbPatterns = [
    { pattern: /rgb\(0,\s*0,\s*0\)/g, token: '$color-black' },
    { pattern: /rgb\(255,\s*255,\s*255\)/g, token: '$color-white' },
    { pattern: /rgb\(22,\s*49,\s*248\)/g, token: '$color-primary' },
    { pattern: /rgb\(220,\s*53,\s*69\)/g, token: '$color-danger' },
    { pattern: /rgb\(40,\s*167,\s*69\)/g, token: '$color-success' }
  ];

  rgbPatterns.forEach(({ pattern, token }) => {
    content = content.replace(pattern, () => {
      changes++;
      return token;
    });
  });

  if (changes > 0 && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath)}: ${changes}개 색상 토큰화`);
    totalTokenized += changes;
    fileCount++;
  }
});

console.log(`\n🎉 공격적인 색상 토큰화 완료!`);
console.log(`- 총 ${fileCount}개 파일 수정`);
console.log(`- 총 ${totalTokenized}개 색상 토큰화`);