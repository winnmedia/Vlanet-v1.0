#!/usr/bin/env node

/**
 * 고급 !important 제거 스크립트
 * CSS 특정성 분석 및 대안 제시
 */

const fs = require('fs');
const path = require('path');

// 남은 !important 패턴별 해결 전략
const ADVANCED_STRATEGIES = {
  // 그라데이션 배경
  'linear-gradient': {
    pattern: /background:\s*linear-gradient\([^)]+\)\s*!important/g,
    solution: 'CSS 모듈의 composes 또는 더 구체적인 셀렉터 사용',
    alternative: (match) => {
      // :global() 래퍼 사용하여 외부 스타일 오버라이드
      return match.replace('!important', '') + '\n    // Fronty: 외부 스타일 충돌 시 :global() 사용 권장';
    }
  },
  
  // border 속성
  'border-solid': {
    pattern: /border:\s*\$spacing-2xs\s+solid\s+[^;]+\s*!important/g,
    solution: 'CSS 변수 또는 data 속성 활용',
    alternative: (match) => {
      return match.replace('!important', '');
    }
  },
  
  // border-style
  'border-style': {
    pattern: /border-style:\s*(dashed|solid)\s*!important/g,
    solution: '상태 기반 클래스 사용',
    alternative: (match, style) => {
      return `border-style: ${style};\n    // Fronty: &.is-${style} 클래스 사용 권장`;
    }
  },
  
  // background 색상
  'background-color': {
    pattern: /background:\s*(\$color-gray-\d+|\$brand-blue|rgba\([^)]+\))\s*!important/g,
    solution: 'CSS 변수로 동적 관리',
    alternative: (match, color) => {
      return `--bg-color: ${color};\n    background: var(--bg-color)`;
    }
  }
};

// CSS 특정성 계산
function calculateSpecificity(selector) {
  let specificity = [0, 0, 0, 0]; // [inline, id, class, element]
  
  // ID 셀렉터
  const idMatches = selector.match(/#[\w-]+/g);
  if (idMatches) specificity[1] = idMatches.length;
  
  // 클래스, 속성, 의사 클래스
  const classMatches = selector.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/g);
  if (classMatches) specificity[2] = classMatches.length;
  
  // 요소 셀렉터
  const elementMatches = selector.match(/^[a-zA-Z]+|[\s>+~][a-zA-Z]+/g);
  if (elementMatches) specificity[3] = elementMatches.length;
  
  return specificity;
}

// 특정성 비교
function compareSpecificity(a, b) {
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// 더 높은 특정성을 가진 셀렉터 생성
function generateHigherSpecificitySelector(originalSelector, targetSpecificity) {
  const suggestions = [];
  
  // 1. 클래스 추가
  suggestions.push(`${originalSelector}.high-priority`);
  
  // 2. :not() 의사 클래스 사용
  suggestions.push(`${originalSelector}:not(.unused)`);
  
  // 3. 속성 셀렉터 추가
  suggestions.push(`${originalSelector}[data-variant]`);
  
  // 4. CSS 모듈의 :global() 활용
  suggestions.push(`:global(.external-override) ${originalSelector}`);
  
  return suggestions;
}

// 파일별 분석 및 수정
function analyzeAndFixFile(filePath) {
  console.log(`\n📁 분석 중: ${path.basename(filePath)}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  let modifiedContent = content;
  const report = {
    file: path.basename(filePath),
    totalImportants: 0,
    fixed: 0,
    remaining: 0,
    strategies: []
  };
  
  // !important 전체 개수
  const importantMatches = content.match(/!important/g);
  report.totalImportants = importantMatches ? importantMatches.length : 0;
  
  if (report.totalImportants === 0) {
    console.log('✅ !important가 없습니다.');
    return report;
  }
  
  // 고급 전략 적용
  Object.entries(ADVANCED_STRATEGIES).forEach(([name, strategy]) => {
    const matches = modifiedContent.match(strategy.pattern);
    if (matches) {
      console.log(`\n🔧 ${name} 패턴 발견: ${matches.length}개`);
      console.log(`   해결책: ${strategy.solution}`);
      
      modifiedContent = modifiedContent.replace(strategy.pattern, strategy.alternative);
      report.fixed += matches.length;
      report.strategies.push({
        type: name,
        count: matches.length,
        solution: strategy.solution
      });
    }
  });
  
  // 남은 !important 분석
  const remainingImportants = modifiedContent.match(/!important/g);
  report.remaining = remainingImportants ? remainingImportants.length : 0;
  
  // 결과 저장
  if (report.fixed > 0) {
    const backupPath = filePath + '.advanced-backup';
    fs.writeFileSync(backupPath, content);
    fs.writeFileSync(filePath + '.advanced-preview', modifiedContent);
    
    console.log(`\n📊 결과:`);
    console.log(`   - 전체: ${report.totalImportants}개`);
    console.log(`   - 수정: ${report.fixed}개`);
    console.log(`   - 남음: ${report.remaining}개`);
    console.log(`   - 미리보기: ${filePath}.advanced-preview`);
  }
  
  return report;
}

// CSS 모듈 마이그레이션 제안
function suggestCSSModuleMigration(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const suggestions = [];
  
  // 전역 스타일과 충돌 가능성 있는 클래스 찾기
  const globalConflicts = content.match(/\.btn|\.button|\.card|\.modal/g);
  if (globalConflicts) {
    suggestions.push({
      issue: '전역 클래스명 충돌',
      solution: 'CSS 모듈 사용 또는 BEM 네이밍',
      example: '.btn → .feedbackButton 또는 styles.button'
    });
  }
  
  // 중첩 레벨이 깊은 셀렉터 찾기
  const deepNesting = content.match(/\s{8,}[&.]/g);
  if (deepNesting) {
    suggestions.push({
      issue: '과도한 중첩',
      solution: '플랫한 구조로 리팩토링',
      example: '최대 3단계까지만 중첩'
    });
  }
  
  return suggestions;
}

// 메인 실행 함수
function main() {
  console.log('🚀 Fronty의 고급 !important 제거 시작...\n');
  
  const targetFiles = [
    path.join(__dirname, '../src/page/Cms/FeedbackButtonStyles.module.scss'),
    path.join(__dirname, '../src/components/ProjectPhaseBoard.module.scss'),
    path.join(__dirname, '../src/css/Cms/Cms.scss')
  ];
  
  const totalReport = [];
  
  targetFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const report = analyzeAndFixFile(file);
      totalReport.push(report);
      
      // CSS 모듈 마이그레이션 제안
      const suggestions = suggestCSSModuleMigration(file);
      if (suggestions.length > 0) {
        console.log('\n💡 추가 개선 제안:');
        suggestions.forEach(s => {
          console.log(`   - ${s.issue}: ${s.solution}`);
        });
      }
    }
  });
  
  // 전체 요약
  console.log('\n📈 전체 요약:');
  console.log('═'.repeat(50));
  
  let totalImportants = 0;
  let totalFixed = 0;
  let totalRemaining = 0;
  
  totalReport.forEach(report => {
    totalImportants += report.totalImportants;
    totalFixed += report.fixed;
    totalRemaining += report.remaining;
    
    console.log(`\n${report.file}:`);
    console.log(`  원본: ${report.totalImportants} → 수정: ${report.fixed} → 남음: ${report.remaining}`);
    
    if (report.strategies.length > 0) {
      console.log('  적용된 전략:');
      report.strategies.forEach(s => {
        console.log(`    - ${s.type}: ${s.count}개`);
      });
    }
  });
  
  console.log('\n═'.repeat(50));
  console.log(`총계: ${totalImportants}개 중 ${totalFixed}개 수정 (${Math.round(totalFixed/totalImportants*100)}%)`);
  
  // Fronty의 최종 권고
  console.log('\n🎯 Fronty의 최종 권고:');
  console.log('1. CSS 모듈의 격리 특성을 최대한 활용하세요');
  console.log('2. 외부 라이브러리 스타일은 :global()로 타겟팅하세요');
  console.log('3. CSS 변수로 동적 스타일을 관리하세요');
  console.log('4. 컴포넌트별로 독립적인 스타일 스코프를 유지하세요');
  console.log('5. !important 대신 더 구체적인 셀렉터를 사용하세요');
  
  console.log('\n✨ "모든 픽셀은 정당한 이유로 그 자리에 있어야 합니다."');
}

// 스크립트 실행
main();