#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 추가 색상 매핑
const ADDITIONAL_COLOR_MAPPINGS = {
  // 특수 색상
  '#f5222d': '$color-danger',
  '#ff4d4f': '$color-danger-light',
  '#52c41a': '$color-success',
  '#73d13d': '$color-success-light',
  '#faad14': '$color-warning',
  '#ffc53d': '$color-warning-light',
  '#1890ff': '$color-info',
  '#40a9ff': '$color-info-light',
  
  // 회색 계열 추가
  '#bfbfbf': '$color-gray-400',
  '#d9d9d9': '$color-gray-300',
  '#f0f0f0': '$color-gray-100',
  '#fafafa': '$color-gray-50',
  
  // 투명도 색상
  'rgba(0,0,0,0.45)': 'rgba($color-black, 0.45)',
  'rgba(0,0,0,0.65)': 'rgba($color-black, 0.65)',
  'rgba(0,0,0,0.85)': 'rgba($color-black, 0.85)',
  'rgba(255,255,255,0.1)': 'rgba($color-white, 0.1)',
  'rgba(255,255,255,0.2)': 'rgba($color-white, 0.2)',
  
  // 브랜드 색상 변형
  '#0056cc': '$color-primary-dark',
  '#004099': '$color-primary-darker',
  '#e6f0ff': '$color-primary-lightest'
};

// px 값을 토큰으로 변환
const PX_TO_TOKEN = {
  '2px': '$spacing-2xs',
  '4px': '$spacing-xs',
  '8px': '$spacing-sm',
  '12px': '$spacing-md',
  '16px': '$spacing-lg',
  '20px': '$spacing-xl',
  '24px': '$spacing-2xl',
  '32px': '$spacing-3xl',
  '40px': '$spacing-4xl',
  '48px': '$spacing-5xl',
  // 폰트 크기
  '12px': '$font-size-xs',
  '14px': '$font-size-sm',
  '16px': '$font-size-base',
  '18px': '$font-size-lg',
  '20px': '$font-size-xl',
  '24px': '$font-size-2xl',
  '32px': '$font-size-3xl',
  // 라인 높이
  '1.2': '$line-height-tight',
  '1.5': '$line-height-base',
  '1.75': '$line-height-relaxed',
  '2': '$line-height-loose'
};

function removeHardcodedValues(options = {}) {
  const {
    targetFiles = [],
    dryRun = true
  } = options;
  
  console.log('🔄 남은 하드코딩 값 제거 시작...\n');
  
  // 타겟 파일이 지정되지 않으면 상위 5개 파일 처리
  const files = targetFiles.length > 0 ? targetFiles : [
    'src/page/Cms/VideoPlanning.scss',
    'src/css/Home.scss',
    'src/page/User/MyPage.scss',
    'src/css/Cms/Cms.scss',
    'src/css/Cms/FeedbackGridLayout.module.scss'
  ];
  
  let totalChanges = 0;
  
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일을 찾을 수 없음: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changeCount = 0;
    const originalContent = content;
    
    // 1. 추가 색상 변환
    Object.entries(ADDITIONAL_COLOR_MAPPINGS).forEach(([hardcoded, token]) => {
      const regex = new RegExp(hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex) || [];
      if (matches.length > 0) {
        content = content.replace(regex, token);
        changeCount += matches.length;
      }
    });
    
    // 2. px 값 변환 (CSS 속성에서만)
    const pxPattern = /(\s*)(padding|margin|font-size|width|height|top|bottom|left|right|gap|border-radius):\s*(\d+px)/g;
    content = content.replace(pxPattern, (match, space, property, value) => {
      if (PX_TO_TOKEN[value]) {
        changeCount++;
        return `${space}${property}: ${PX_TO_TOKEN[value]}`;
      }
      return match;
    });
    
    // 3. 남은 hex 색상 찾기
    const remainingHex = content.match(/#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g) || [];
    if (remainingHex.length > 0) {
      console.log(`⚠️  ${filePath}에 아직 ${remainingHex.length}개의 hex 색상이 남아있습니다:`);
      console.log(`   ${[...new Set(remainingHex)].join(', ')}`);
    }
    
    // 4. 변경사항 저장
    if (changeCount > 0) {
      totalChanges += changeCount;
      console.log(`✓ ${filePath}: ${changeCount}개 값 변환`);
      
      if (!dryRun) {
        // 백업 생성
        fs.writeFileSync(`${filePath}.backup-hardcoded`, originalContent);
        // 변경사항 저장
        fs.writeFileSync(filePath, content);
      }
    }
  });
  
  console.log(`\n📊 요약:`);
  console.log(`- 처리된 파일: ${files.length}개`);
  console.log(`- 총 변환된 값: ${totalChanges}개`);
  
  if (dryRun) {
    console.log('\n⚠️  시뮬레이션 모드입니다. --execute로 실행하세요.');
  }
}

// 특정 파일의 하드코딩 상세 분석
function analyzeHardcodedDetails(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`파일을 찾을 수 없습니다: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`\n📋 ${filePath} 하드코딩 상세 분석:\n`);
  
  const issues = [];
  
  lines.forEach((line, index) => {
    // Hex 색상
    const hexMatches = line.match(/#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g);
    if (hexMatches) {
      hexMatches.forEach(hex => {
        issues.push({
          line: index + 1,
          type: 'color',
          value: hex,
          content: line.trim()
        });
      });
    }
    
    // RGB 색상
    const rgbMatches = line.match(/rgba?\([^)]+\)/g);
    if (rgbMatches) {
      rgbMatches.forEach(rgb => {
        issues.push({
          line: index + 1,
          type: 'color',
          value: rgb,
          content: line.trim()
        });
      });
    }
    
    // px 값
    const pxMatches = line.match(/\d+px/g);
    if (pxMatches) {
      pxMatches.forEach(px => {
        issues.push({
          line: index + 1,
          type: 'spacing',
          value: px,
          content: line.trim()
        });
      });
    }
  });
  
  // 타입별 그룹화
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {});
  
  Object.entries(grouped).forEach(([type, items]) => {
    console.log(`${type === 'color' ? '🎨 색상' : '📏 간격'}: ${items.length}개`);
    items.slice(0, 5).forEach(item => {
      console.log(`  라인 ${item.line}: ${item.value}`);
      console.log(`    ${item.content.substring(0, 60)}...`);
    });
    if (items.length > 5) {
      console.log(`  ... 그 외 ${items.length - 5}개 더`);
    }
    console.log('');
  });
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--analyze' && args[1]) {
    analyzeHardcodedDetails(args[1]);
  } else {
    const options = {
      dryRun: !args.includes('--execute'),
      targetFiles: args.filter(arg => !arg.startsWith('--'))
    };
    removeHardcodedValues(options);
  }
}

module.exports = { removeHardcodedValues, analyzeHardcodedDetails };