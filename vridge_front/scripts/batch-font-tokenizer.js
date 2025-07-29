#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// 폰트 크기 토큰 매핑
const fontTokens = {
  '10px': '$font-size-2xs',
  '11px': '$font-size-xs',
  '12px': '$font-size-xs',
  '13px': '$font-size-sm',
  '14px': '$font-size-sm',
  '15px': '$font-size-base',
  '16px': '$font-size-base',
  '18px': '$font-size-lg',
  '20px': '$font-size-xl',
  '24px': '$font-size-2xl',
  '28px': '$font-size-3xl',
  '32px': '$font-size-4xl',
  '36px': '$font-size-5xl',
  '48px': '$font-size-6xl',
  '1rem': '$font-size-base',
  '0.875rem': '$font-size-sm',
  '1.125rem': '$font-size-lg',
  '1.25rem': '$font-size-xl',
  '1.5rem': '$font-size-2xl'
};

// 커맨드 라인 인자 파싱
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');
const targetDirectory = args.find(arg => !arg.startsWith('--')) || 'src';

console.log(`${colors.cyan}🔤 Batch Font Size Tokenizer 시작...${colors.reset}\n`);
console.log(`모드: ${isDryRun ? colors.yellow + 'DRY RUN (테스트)' : colors.green + 'EXECUTE (실행)'}${colors.reset}`);
console.log(`대상 디렉토리: ${targetDirectory}\n`);

// 스타일 파일 찾기
const styleFiles = glob.sync(`${targetDirectory}/**/*.{css,scss}`, {
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/*.min.css',
    '**/*.backup',
    '**/backup/**'
  ]
});

console.log(`${colors.blue}📁 ${styleFiles.length}개 스타일 파일 발견${colors.reset}\n`);

// 전체 통계
const globalStats = {
  totalFiles: 0,
  totalReplacements: 0,
  fontSizeFrequency: {},
  contextStats: {
    'font-size': 0,
    'line-height': 0,
    other: 0
  },
  nonStandardValues: {}
};

// 폰트 크기 패턴
const fontSizePattern = /(\d+(?:\.\d+)?(?:px|rem|em))/g;

// 컨텍스트 감지 함수
function detectContext(line, position) {
  const beforeText = line.substring(0, position);
  
  if (beforeText.includes('font-size:')) {
    return 'font-size';
  } else if (beforeText.includes('line-height:')) {
    return 'line-height';
  }
  
  return 'other';
}

// 파일 처리 함수
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let modifiedContent = content;
  let fileStats = {
    replacements: 0,
    fontSizes: []
  };
  
  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = fontSizePattern.exec(line)) !== null) {
      const fontValue = match[1];
      const context = detectContext(line, match.index);
      
      // font-size 컨텍스트에서만 토큰화
      if (context === 'font-size' && fontTokens[fontValue]) {
        const token = fontTokens[fontValue];
        
        // 이미 토큰화된 경우 건너뛰기
        if (line.includes(token)) continue;
        
        fileStats.replacements++;
        fileStats.fontSizes.push({ value: fontValue, token, line: lineIndex + 1 });
        
        // 전체 통계 업데이트
        globalStats.fontSizeFrequency[fontValue] = (globalStats.fontSizeFrequency[fontValue] || 0) + 1;
        globalStats.contextStats[context]++;
        
        if (!isDryRun) {
          // 안전한 교체를 위해 정규식 사용
          const safePattern = new RegExp(`font-size:\\s*${fontValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          modifiedContent = modifiedContent.replace(safePattern, `font-size: ${token}`);
        }
      } else if (context === 'font-size' && !fontTokens[fontValue]) {
        // 비표준 값 기록
        globalStats.nonStandardValues[fontValue] = (globalStats.nonStandardValues[fontValue] || 0) + 1;
      }
    }
  });
  
  if (fileStats.replacements > 0) {
    console.log(`\n${colors.blue}📝 ${path.relative(process.cwd(), filePath)}${colors.reset}`);
    console.log(`   ${fileStats.replacements}개 폰트 크기 토큰화 가능`);
    
    if (!isDryRun) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`   ${colors.green}✅ 파일 업데이트 완료${colors.reset}`);
    } else {
      console.log(`   ${colors.gray}예시 변경사항:${colors.reset}`);
      fileStats.fontSizes.slice(0, 3).forEach(item => {
        console.log(`   ${colors.gray}라인 ${item.line}: ${item.value} → ${item.token}${colors.reset}`);
      });
    }
    
    globalStats.totalFiles++;
    globalStats.totalReplacements += fileStats.replacements;
  }
}

// 모든 파일 처리
styleFiles.forEach(processFile);

// 최종 보고서
console.log(`\n${colors.bright}${colors.cyan}📊 폰트 크기 토큰화 분석 보고서${colors.reset}`);
console.log('='.repeat(50));
console.log(`총 파일 수: ${globalStats.totalFiles}개`);
console.log(`총 교체 가능: ${globalStats.totalReplacements}개`);

console.log(`\n${colors.yellow}🔤 폰트 크기 사용 빈도 TOP 10:${colors.reset}`);
const sortedFonts = Object.entries(globalStats.fontSizeFrequency)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedFonts.forEach(([value, count], index) => {
  const token = fontTokens[value] || '토큰 없음';
  console.log(`  ${index + 1}. ${value}: ${count}회 → ${token}`);
});

console.log(`\n${colors.yellow}🎯 컨텍스트별 교체 통계:${colors.reset}`);
Object.entries(globalStats.contextStats).forEach(([context, count]) => {
  if (count > 0) {
    console.log(`  - ${context}: ${count}개`);
  }
});

if (Object.keys(globalStats.nonStandardValues).length > 0) {
  console.log(`\n${colors.red}⚠️  비표준 폰트 크기:${colors.reset}`);
  const sortedNonStandard = Object.entries(globalStats.nonStandardValues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sortedNonStandard.forEach(([value, count]) => {
    console.log(`  - ${value}: ${count}회`);
  });
}

console.log(`\n${colors.green}💡 예상 효과:${colors.reset}`);
console.log(`  - 폰트 크기 하드코딩 ${Math.round(globalStats.totalReplacements / styleFiles.length * 10)}% 감소`);
console.log(`  - 타이포그래피 일관성 향상`);
console.log(`  - 반응형 폰트 시스템 구축`);

if (isDryRun) {
  console.log(`\n${colors.yellow}ℹ️  실제로 파일을 수정하려면 다음 명령어를 실행하세요:${colors.reset}`);
  console.log(`   ${colors.cyan}node ${path.basename(__filename)} --execute${colors.reset}`);
}