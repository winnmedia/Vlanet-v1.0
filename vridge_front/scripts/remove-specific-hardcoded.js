#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 특정 하드코딩 색상 매핑
const SPECIFIC_COLOR_MAPPINGS = {
  '#444': '$color-gray-444',
  '#555': '$color-gray-555', 
  '#777': '$color-gray-777',
  '#888': '$color-gray-888',
  '#fee': '$color-pink-light',
  '#fcc': '$color-pink-medium',
  '#c00': '$color-red-dark',
  '#bfbfbf': '$color-gray-bfbfbf',
  '#d9d9d9': '$color-gray-d9d9d9',
  '#f0f0f0': '$color-gray-f0f0f0',
  '#fafafa': '$color-gray-fafafa'
};

function removeSpecificHardcoded(filePath, dryRun = true) {
  if (!fs.existsSync(filePath)) {
    console.log(`파일을 찾을 수 없습니다: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let changeCount = 0;
  
  // 각 색상 변환
  Object.entries(SPECIFIC_COLOR_MAPPINGS).forEach(([hex, token]) => {
    // 정확한 매칭을 위한 정규식
    const regex = new RegExp(`(:|\\s)${hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![0-9a-fA-F])`, 'gi');
    const matches = newContent.match(regex) || [];
    
    if (matches.length > 0) {
      newContent = newContent.replace(regex, `$1${token}`);
      changeCount += matches.length;
      console.log(`  ${hex} → ${token}: ${matches.length}개`);
    }
  });
  
  if (changeCount > 0) {
    console.log(`\n✓ ${path.basename(filePath)}: 총 ${changeCount}개 색상 변환`);
    
    if (!dryRun) {
      // 백업 생성
      fs.writeFileSync(`${filePath}.backup-specific`, content);
      // 변경사항 저장
      fs.writeFileSync(filePath, newContent);
      console.log('  파일이 업데이트되었습니다.');
    }
  } else {
    console.log(`${path.basename(filePath)}: 변환할 색상이 없습니다.`);
  }
  
  return changeCount;
}

// 메인 실행
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

console.log('🎨 특정 하드코딩 색상 제거\n');
console.log(`모드: ${dryRun ? '시뮬레이션' : '실행'}\n`);

// 주요 파일들 처리
const targetFiles = [
  'src/page/Cms/VideoPlanning.scss',
  'src/css/Cms/Cms.scss'
];

let totalChanges = 0;

targetFiles.forEach(file => {
  console.log(`\n처리 중: ${file}`);
  const changes = removeSpecificHardcoded(file, dryRun);
  totalChanges += changes || 0;
});

console.log(`\n\n📊 총 ${totalChanges}개 색상이 변환되었습니다.`);

if (dryRun) {
  console.log('\n⚠️  시뮬레이션 모드입니다. 실행하려면 --execute 플래그를 사용하세요.');
}