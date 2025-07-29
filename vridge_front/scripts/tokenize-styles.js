#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 토큰 매핑 정의
const TOKEN_MAPPINGS = {
  // 간격 매핑 (px to spacing token)
  spacing: {
    '0': '$spacing-0',
    '4px': '$spacing-xs',
    '8px': '$spacing-sm',
    '12px': '$spacing-md',
    '16px': '$spacing-lg',
    '20px': '$spacing-xl',
    '24px': '$spacing-2xl',
    '32px': '$spacing-3xl',
    '40px': '$spacing-4xl',
    '48px': '$spacing-5xl'
  },
  
  // 테두리 반경 매핑
  borderRadius: {
    '2px': '$radius-xs',
    '4px': '$radius-sm',
    '8px': '$radius-md',
    '12px': '$radius-lg',
    '16px': '$radius-xl',
    '20px': '$radius-2xl',
    '50%': '$radius-full',
    '100px': '$radius-full',
    '9999px': '$radius-full'
  },
  
  // 색상 매핑 (주요 색상만)
  colors: {
    '#ffffff': '$color-white',
    '#000000': '$color-black',
    '#1631F8': '$color-primary',
    '#dc3545': '$color-danger',
    '#28a745': '$color-success',
    '#ffc107': '$color-warning',
    '#17a2b8': '$color-info',
    '#6c757d': '$color-gray-600',
    '#f8f9fa': '$color-gray-50',
    '#e9ecef': '$color-gray-100',
    '#dee2e6': '$color-gray-200',
    '#ced4da': '$color-gray-300',
    '#adb5bd': '$color-gray-400',
    '#495057': '$color-gray-700',
    '#343a40': '$color-gray-800',
    '#212529': '$color-gray-900'
  },
  
  // 그림자 매핑
  shadows: {
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)': '$shadow-xs',
    '0 2px 8px rgba(0, 0, 0, 0.08)': '$shadow-default',
    '0 2px 8px rgba(0, 0, 0, 0.06)': '$shadow-default',
    '0 4px 12px rgba(22, 49, 248, 0.25)': '$shadow-button',
    '0 6px 20px rgba(22, 49, 248, 0.4)': '$shadow-button-hover'
  }
};

// 교체 통계
const stats = {
  totalFiles: 0,
  modifiedFiles: 0,
  replacements: {
    spacing: 0,
    borderRadius: 0,
    colors: 0,
    shadows: 0
  }
};

// 파일 처리 함수
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const lines = content.split('\\n');
  
  const newLines = lines.map((line, index) => {
    let newLine = line;
    
    // 이미 변수를 사용중이거나 import 문이면 스킵
    if (line.includes('$') || line.includes('@import') || line.includes('//')) {
      return line;
    }
    
    // padding, margin 속성 교체
    ['padding', 'margin', 'gap', 'top', 'right', 'bottom', 'left', 'width', 'height'].forEach(prop => {
      Object.entries(TOKEN_MAPPINGS.spacing).forEach(([px, token]) => {
        // 더 유연한 정규식 패턴
        const escapedPx = px.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${prop}[^:]*:|\\s)${escapedPx}(?!\\w)`, 'g');
        if (regex.test(newLine)) {
          newLine = newLine.replace(regex, `$1${token}`);
          stats.replacements.spacing++;
          modified = true;
        }
      });
    });
    
    // border-radius 교체
    Object.entries(TOKEN_MAPPINGS.borderRadius).forEach(([px, token]) => {
      const regex = new RegExp(`(border-radius[^:]*:\\s*)${px}`, 'g');
      if (regex.test(newLine)) {
        newLine = newLine.replace(regex, `$1${token}`);
        stats.replacements.borderRadius++;
        modified = true;
      }
    });
    
    // 색상 교체
    Object.entries(TOKEN_MAPPINGS.colors).forEach(([hex, token]) => {
      const regex = new RegExp(`(:[^:]+)${hex}`, 'gi');
      if (regex.test(newLine)) {
        newLine = newLine.replace(regex, `$1${token}`);
        stats.replacements.colors++;
        modified = true;
      }
    });
    
    // box-shadow 교체
    Object.entries(TOKEN_MAPPINGS.shadows).forEach(([shadow, token]) => {
      if (newLine.includes(shadow)) {
        newLine = newLine.replace(shadow, token);
        stats.replacements.shadows++;
        modified = true;
      }
    });
    
    return newLine;
  });
  
  if (modified) {
    // design-system import 추가
    const hasSpacingImport = content.includes('design-system/tokens/_spacing');
    const hasEffectsImport = content.includes('design-system/tokens/_effects');
    const hasColorsImport = content.includes('design-system/tokens/_colors');
    
    let imports = [];
    if (stats.replacements.spacing > 0 && !hasSpacingImport) {
      imports.push("@import '../../design-system/tokens/_spacing';");
    }
    if ((stats.replacements.borderRadius > 0 || stats.replacements.shadows > 0) && !hasEffectsImport) {
      imports.push("@import '../../design-system/tokens/_effects';");
    }
    if (stats.replacements.colors > 0 && !hasColorsImport) {
      imports.push("@import '../../design-system/tokens/_colors';");
    }
    
    if (imports.length > 0) {
      // 기존 import 뒤에 추가
      const firstImportIndex = newLines.findIndex(line => line.includes('@import'));
      if (firstImportIndex >= 0) {
        newLines.splice(firstImportIndex + 1, 0, ...imports);
      } else {
        newLines.unshift(...imports, '');
      }
    }
    
    fs.writeFileSync(filePath, newLines.join('\\n'));
    stats.modifiedFiles++;
    
    console.log(`✅ ${path.basename(filePath)}: ${Object.values(stats.replacements).reduce((a, b) => a + b, 0)} 교체`);
  }
}

// 특정 파일을 토큰화하는 함수
function tokenizeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    return;
  }
  
  console.log(`\\n🔄 ${filePath} 토큰화 시작...\\n`);
  
  // 통계 초기화
  Object.keys(stats.replacements).forEach(key => {
    stats.replacements[key] = 0;
  });
  
  processFile(filePath);
  
  console.log('\\n📊 토큰화 결과:');
  console.log(`  간격: ${stats.replacements.spacing}개`);
  console.log(`  테두리 반경: ${stats.replacements.borderRadius}개`);
  console.log(`  색상: ${stats.replacements.colors}개`);
  console.log(`  그림자: ${stats.replacements.shadows}개`);
}

// 메인 실행
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('사용법: node tokenize-styles.js <파일경로>');
  console.log('예: node tokenize-styles.js src/tasks/Project/ProcessDateEnhanced.scss');
} else {
  tokenizeFile(args[0]);
}

// 사용 가능한 토큰 목록 출력
console.log('\\n📋 사용 가능한 토큰:');
console.log('\\n간격 토큰:');
Object.entries(TOKEN_MAPPINGS.spacing).forEach(([px, token]) => {
  console.log(`  ${px} → ${token}`);
});
console.log('\\n더 많은 토큰은 design-system/tokens/ 폴더를 참조하세요.');