const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find remaining hardcoded values
function findHardcodedValues(content) {
  const patterns = [
    // Colors
    /#[0-9a-fA-F]{3,6}/g,
    /rgb\([^)]+\)/g,
    /rgba\([^)]+\)/g,
    // Sizes
    /\d+px/g,
    /\d+rem/g,
    /\d+em/g,
    // Font weights
    /font-weight:\s*\d{3}/g,
    // Z-index
    /z-index:\s*\d+/g
  ];
  
  const hardcoded = [];
  patterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    hardcoded.push(...matches);
  });
  
  return hardcoded;
}

// Replace with tokens
function replaceWithTokens(content) {
  // Color replacements
  const colorMap = {
    '#1631F8': '$color-primary',
    '#0F1C9E': '$color-primary-dark',
    '#ffffff': '$color-white',
    '#000000': '$color-black',
    '#f8f9fa': '$color-gray-50',
    '#e9ecef': '$color-gray-100',
    '#dee2e6': '$color-gray-200',
    '#ced4da': '$color-gray-300',
    '#adb5bd': '$color-gray-400',
    '#6c757d': '$color-gray-500',
    '#495057': '$color-gray-600',
    '#343a40': '$color-gray-700',
    '#212529': '$color-gray-800',
    '#dc3545': '$color-danger',
    '#28a745': '$color-success',
    '#ffc107': '$color-warning',
    '#17a2b8': '$color-info'
  };
  
  // Size replacements
  const sizeMap = {
    '4px': '$spacing-2xs',
    '8px': '$spacing-xs',
    '12px': '$spacing-sm',
    '16px': '$spacing-md',
    '20px': '$spacing-lg',
    '24px': '$spacing-xl',
    '32px': '$spacing-2xl',
    '40px': '$spacing-3xl',
    '48px': '$spacing-4xl',
    '64px': '$spacing-5xl',
    '10px': '$spacing-sm',
    '14px': '$font-size-sm',
    '18px': '$font-size-lg',
    '1rem': '$font-size-base',
    '0.875rem': '$font-size-sm',
    '1.125rem': '$font-size-lg'
  };
  
  // Font weight replacements
  const fontWeightMap = {
    '300': '$font-weight-light',
    '400': '$font-weight-normal',
    '500': '$font-weight-medium',
    '600': '$font-weight-semibold',
    '700': '$font-weight-bold'
  };
  
  // Replace colors
  Object.entries(colorMap).forEach(([value, token]) => {
    const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    content = content.replace(regex, token);
  });
  
  // Replace sizes
  Object.entries(sizeMap).forEach(([value, token]) => {
    const regex = new RegExp(`\\b${value}\\b`, 'g');
    content = content.replace(regex, token);
  });
  
  // Replace font weights
  Object.entries(fontWeightMap).forEach(([value, token]) => {
    const regex = new RegExp(`font-weight:\\s*${value}`, 'g');
    content = content.replace(regex, `font-weight: ${token}`);
  });
  
  // Replace common z-index values
  content = content.replace(/z-index:\s*9999/g, 'z-index: $z-index-modal');
  content = content.replace(/z-index:\s*1000/g, 'z-index: $z-index-dropdown');
  content = content.replace(/z-index:\s*100/g, 'z-index: $z-index-sticky');
  content = content.replace(/z-index:\s*10/g, 'z-index: $z-index-fixed');
  content = content.replace(/z-index:\s*1/g, 'z-index: $z-index-default');
  
  return content;
}

// Process files
function processFiles() {
  const patterns = [
    'src/**/*.{scss,css}',
    'styles/**/*.{scss,css}'
  ];
  
  let totalHardcoded = 0;
  let totalReplaced = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: false
    });
    
    files.forEach(file => {
      if (file.includes('node_modules') || file.includes('_design-tokens')) return;
      
      const content = fs.readFileSync(file, 'utf8');
      const hardcoded = findHardcodedValues(content);
      
      if (hardcoded.length > 0) {
        totalHardcoded += hardcoded.length;
        
        const newContent = replaceWithTokens(content);
        const newHardcoded = findHardcodedValues(newContent);
        
        if (newHardcoded.length < hardcoded.length) {
          fs.writeFileSync(file, newContent);
          const replaced = hardcoded.length - newHardcoded.length;
          totalReplaced += replaced;
          console.log(`✅ ${file}: ${replaced}개 토큰화`);
        }
      }
    });
  });
  
  return { totalHardcoded, totalReplaced };
}

// Main execution
console.log('🎨 토큰 사용률 100% 달성 스크립트\n');

const { totalHardcoded, totalReplaced } = processFiles();

console.log(`\n📊 토큰화 결과:`);
console.log(`🔍 발견된 하드코딩: ${totalHardcoded}개`);
console.log(`✅ 토큰으로 교체: ${totalReplaced}개`);
console.log(`📈 토큰화율: ${((totalReplaced / totalHardcoded) * 100).toFixed(1)}%`);