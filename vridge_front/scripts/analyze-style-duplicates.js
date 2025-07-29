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

console.log(`${colors.cyan}🔍 스타일 파일 중복 분석기${colors.reset}\n`);

// 스타일 파일 찾기
const styleFiles = glob.sync('src/**/*.{css,scss}', {
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

// 파일 그룹화 분석
const fileGroups = {
  feedback: [],
  cmshome: [],
  videoPlanning: [],
  projectCreate: [],
  calendar: [],
  layout: [],
  common: [],
  other: []
};

// 파일 분류
styleFiles.forEach(file => {
  const fileName = path.basename(file).toLowerCase();
  
  if (fileName.includes('feedback')) {
    fileGroups.feedback.push(file);
  } else if (fileName.includes('cmshome')) {
    fileGroups.cmshome.push(file);
  } else if (fileName.includes('videoplanning')) {
    fileGroups.videoPlanning.push(file);
  } else if (fileName.includes('projectcreate')) {
    fileGroups.projectCreate.push(file);
  } else if (fileName.includes('calendar')) {
    fileGroups.calendar.push(file);
  } else if (fileName.includes('layout') || fileName.includes('sidebar')) {
    fileGroups.layout.push(file);
  } else if (fileName.includes('common') || fileName.includes('global') || fileName.includes('reset')) {
    fileGroups.common.push(file);
  } else {
    fileGroups.other.push(file);
  }
});

// 중복 파일 분석
console.log(`${colors.yellow}📊 중복 파일 분석 결과${colors.reset}\n`);

Object.entries(fileGroups).forEach(([group, files]) => {
  if (files.length > 1) {
    console.log(`${colors.bright}${group.toUpperCase()} (${files.length}개 파일)${colors.reset}`);
    
    // 파일 크기와 수정 날짜 정보 수집
    const fileDetails = files.map(file => {
      const stats = fs.statSync(file);
      const content = fs.readFileSync(file, 'utf8');
      const lineCount = content.split('\n').length;
      const hasImportant = (content.match(/!important/g) || []).length;
      
      return {
        path: file,
        size: stats.size,
        lines: lineCount,
        modified: stats.mtime,
        importantCount: hasImportant
      };
    }).sort((a, b) => b.size - a.size);
    
    fileDetails.forEach((detail, index) => {
      const relPath = path.relative(process.cwd(), detail.path);
      const sizeKB = (detail.size / 1024).toFixed(1);
      const modifiedDate = detail.modified.toISOString().split('T')[0];
      
      console.log(`  ${index + 1}. ${relPath}`);
      console.log(`     크기: ${sizeKB}KB | 라인: ${detail.lines} | !important: ${detail.importantCount}개`);
      console.log(`     수정일: ${modifiedDate}`);
      console.log();
    });
  }
});

// CSS 선택자 중복 분석
console.log(`\n${colors.yellow}🔍 CSS 선택자 중복 분석${colors.reset}\n`);

const selectorMap = new Map();
const classPattern = /\.([\w-]+)\s*{/g;

styleFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  
  while ((match = classPattern.exec(content)) !== null) {
    const selector = `.${match[1]}`;
    if (!selectorMap.has(selector)) {
      selectorMap.set(selector, []);
    }
    selectorMap.get(selector).push(file);
  }
});

// 중복 선택자 찾기
const duplicateSelectors = Array.from(selectorMap.entries())
  .filter(([selector, files]) => files.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`${colors.red}⚠️  중복 선택자 TOP 20${colors.reset}\n`);

duplicateSelectors.slice(0, 20).forEach(([selector, files]) => {
  console.log(`${colors.bright}${selector}${colors.reset} (${files.length}개 파일)`);
  files.slice(0, 3).forEach(file => {
    console.log(`  - ${path.relative(process.cwd(), file)}`);
  });
  if (files.length > 3) {
    console.log(`  ... 외 ${files.length - 3}개 파일`);
  }
  console.log();
});

// 통합 추천
console.log(`\n${colors.green}💡 통합 추천 사항${colors.reset}\n`);

const recommendations = [
  {
    group: 'Feedback 스타일',
    files: fileGroups.feedback.length,
    recommendation: 'FeedbackStyles.module.scss로 통합',
    priority: 'HIGH'
  },
  {
    group: 'CmsHome 스타일',
    files: fileGroups.cmshome.length,
    recommendation: 'CmsHome.module.scss로 통합',
    priority: 'HIGH'
  },
  {
    group: 'VideoPlanning 스타일',
    files: fileGroups.videoPlanning.length,
    recommendation: 'VideoPlanning.module.scss로 통합',
    priority: 'MEDIUM'
  },
  {
    group: 'Layout 스타일',
    files: fileGroups.layout.length,
    recommendation: 'Layout.module.scss로 통합',
    priority: 'MEDIUM'
  }
];

recommendations
  .filter(rec => rec.files > 1)
  .forEach(rec => {
    const priorityColor = rec.priority === 'HIGH' ? colors.red : colors.yellow;
    console.log(`${priorityColor}[${rec.priority}]${colors.reset} ${rec.group}`);
    console.log(`  현재: ${rec.files}개 파일`);
    console.log(`  추천: ${rec.recommendation}`);
    console.log();
  });

// 통계 요약
const totalLines = styleFiles.reduce((sum, file) => {
  const content = fs.readFileSync(file, 'utf8');
  return sum + content.split('\n').length;
}, 0);

const totalSize = styleFiles.reduce((sum, file) => {
  return sum + fs.statSync(file).size;
}, 0);

console.log(`\n${colors.cyan}📈 전체 통계${colors.reset}`);
console.log(`  총 파일 수: ${styleFiles.length}개`);
console.log(`  총 라인 수: ${totalLines.toLocaleString()}줄`);
console.log(`  총 크기: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
console.log(`  중복 선택자: ${duplicateSelectors.length}개`);

const potentialReduction = Math.round(duplicateSelectors.length / selectorMap.size * 100);
console.log(`\n${colors.green}예상 개선 효과:${colors.reset}`);
console.log(`  - 파일 수 ${Math.round(styleFiles.length * 0.3)}개 감소 예상`);
console.log(`  - 코드 중복 ${potentialReduction}% 감소 예상`);
console.log(`  - 빌드 시간 20-30% 단축 예상`);