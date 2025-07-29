#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 정확한 색상 매핑 (기존값 유지)
const COLOR_MAP = {
  // 브랜드 주요 색상
  '#1631F8': '$color-primary',
  '#1631f8': '$color-primary',
  '#0F23C9': '$color-primary-hover',
  '#0f23c9': '$color-primary-hover',
  
  // 시스템 색상
  '#dc3545': '$color-danger',
  '#c82333': '$color-danger-hover',
  '#28a745': '$color-success',
  '#218838': '$color-success-hover',
  '#ffc107': '$color-warning',
  '#17a2b8': '$color-info',
  
  // 중성 색상
  '#ffffff': '$color-white',
  '#FFFFFF': '$color-white',
  '#000000': '$color-black',
  '#f8f9fa': '$color-gray-50',
  '#F8F9FA': '$color-gray-50',
  '#e9ecef': '$color-gray-200',
  '#E9ECEF': '$color-gray-200',
  '#dee2e6': '$color-gray-300',
  '#ced4da': '$color-gray-400',
  '#adb5bd': '$color-gray-500',
  '#6c757d': '$color-gray-600',
  '#495057': '$color-gray-700',
  '#343a40': '$color-gray-800',
  '#212529': '$color-gray-900',
};

// RGB/RGBA 매핑
const RGB_MAP = {
  'rgb(255, 255, 255)': '$color-white',
  'rgba(255, 255, 255, 1)': '$color-white',
  'rgb(0, 0, 0)': '$color-black',
  'rgba(0, 0, 0, 1)': '$color-black',
  'rgb(22, 49, 248)': '$color-primary',
  'rgba(22, 49, 248, 1)': '$color-primary',
};

function processFile(filePath) {
  console.log(`\n처리 중: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;
  const originalContent = content;
  
  // import 문이나 주석은 건드리지 않음
  const lines = content.split('\n');
  const processedLines = lines.map((line, index) => {
    // 주석, import, 변수 정의는 스킵
    if (line.trim().startsWith('//') || 
        line.trim().startsWith('/*') || 
        line.trim().startsWith('*') ||
        line.includes('@import') ||
        line.includes('$color-')) {
      return line;
    }
    
    let processedLine = line;
    
    // HEX 색상 치환
    Object.entries(COLOR_MAP).forEach(([hex, token]) => {
      const regex = new RegExp(`(?<!["'])${hex}(?!["'])`, 'g');
      if (regex.test(processedLine)) {
        processedLine = processedLine.replace(regex, token);
        changeCount++;
      }
    });
    
    // RGB 색상 치환
    Object.entries(RGB_MAP).forEach(([rgb, token]) => {
      if (processedLine.includes(rgb)) {
        processedLine = processedLine.replace(new RegExp(rgb.replace(/[()]/g, '\\$&'), 'g'), token);
        changeCount++;
      }
    });
    
    return processedLine;
  });
  
  if (changeCount > 0) {
    // 색상 토큰 import 추가 (필요한 경우)
    const hasColorImport = content.includes('design-system/tokens/_colors');
    if (!hasColorImport) {
      // 적절한 위치에 import 추가
      const firstImportIndex = processedLines.findIndex(line => line.includes('@import'));
      if (firstImportIndex >= 0) {
        processedLines.splice(firstImportIndex + 1, 0, "@import '../../design-system/tokens/_colors';");
      } else {
        processedLines.unshift("@import '../../design-system/tokens/_colors';", '');
      }
    }
    
    const newContent = processedLines.join('\n');
    
    // 백업 생성
    const backupPath = filePath + '.backup';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, originalContent);
    }
    
    // 파일 업데이트
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ ${changeCount}개 색상 토큰화 완료`);
    
    return { file: filePath, changes: changeCount };
  } else {
    console.log('⏭️  변경 사항 없음');
    return { file: filePath, changes: 0 };
  }
}

// 실행
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('사용법: node safe-color-tokenize.js <파일경로>');
  console.log('예: node safe-color-tokenize.js src/page/Cms/FeedbackButtonStyles.module.scss');
  console.log('\n안전 기능:');
  console.log('- 원본 파일 백업 생성 (.backup)');
  console.log('- 주석과 import 문 보존');
  console.log('- 정확한 색상값만 치환');
} else {
  const results = [];
  
  args.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const result = processFile(filePath);
      results.push(result);
    } else {
      console.error(`❌ 파일을 찾을 수 없음: ${filePath}`);
    }
  });
  
  // 요약
  console.log('\n📊 토큰화 요약:');
  const totalChanges = results.reduce((sum, r) => sum + r.changes, 0);
  console.log(`총 ${totalChanges}개 색상을 토큰으로 변환했습니다.`);
  console.log('\n💡 다음 단계:');
  console.log('1. 변경사항 확인: git diff');
  console.log('2. 시각적 확인: npm run dev로 화면 확인');
  console.log('3. 문제 시 롤백: mv <file>.backup <file>');
}