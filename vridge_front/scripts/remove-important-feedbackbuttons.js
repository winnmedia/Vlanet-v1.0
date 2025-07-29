#!/usr/bin/env node

/**
 * FeedbackButtonStyles.module.scss !important 제거 스크립트
 * Fronty의 픽셀 퍼펙트 정화 작전 Phase 1
 */

const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../src/page/Cms/FeedbackButtonStyles.module.scss');
const BACKUP_PATH = FILE_PATH + '.important-removal-backup';

// 안전하게 제거 가능한 !important 패턴들
const SAFE_REMOVAL_PATTERNS = [
  // 기본 속성들 - CSS 모듈에서는 필요 없음
  /border:\s*none\s*!important/g,
  /border-radius:\s*([^;]+)\s*!important/g,
  /transition:\s*([^;]+)\s*!important/g,
  /background:\s*(transparent|white)\s*!important/g,
  /display:\s*(inline-)?flex\s*!important/g,
  /align-items:\s*center\s*!important/g,
  /gap:\s*([^;]+)\s*!important/g,
  /padding:\s*([^;]+)\s*!important/g,
  /margin(-\w+)?:\s*([^;]+)\s*!important/g,
  /font-size:\s*([^;]+)\s*!important/g,
  /font-weight:\s*([^;]+)\s*!important/g,
  /cursor:\s*pointer\s*!important/g,
  /position:\s*relative\s*!important/g,
  /overflow:\s*hidden\s*!important/g,
  /box-shadow:\s*([^;]+)\s*!important/g,
  
  // transform 속성들
  /transform:\s*none\s*!important/g,
  /transform:\s*scale\(([^)]+)\)\s*!important/g,
  /transform:\s*translateY\(([^)]+)\)\s*!important/g,
  
  // 색상 관련 - CSS 모듈에서 안전
  /color:\s*(white|[^;]+)\s*!important/g,
  /opacity:\s*([^;]+)\s*!important/g,
];

// 조건부 제거가 필요한 패턴들 (hover, active 상태)
const CONDITIONAL_PATTERNS = [
  {
    pattern: /(&:hover\s*{[^}]*)(background:\s*[^;]+)\s*!important([^}]*})/g,
    replacement: '$1$2$3'
  },
  {
    pattern: /(&:active\s*{[^}]*)(transform:\s*[^;]+)\s*!important([^}]*})/g,
    replacement: '$1$2$3'
  },
  {
    pattern: /(&\[disabled\]\s*{[^}]*)(opacity:\s*[^;]+)\s*!important([^}]*})/g,
    replacement: '$1$2$3'
  }
];

// 제거 통계
const stats = {
  total: 0,
  removed: 0,
  conditional: 0,
  skipped: 0
};

function removeImportants(content) {
  let modifiedContent = content;
  
  // 전체 !important 개수 계산
  const totalMatches = content.match(/!important/g);
  stats.total = totalMatches ? totalMatches.length : 0;
  
  console.log(`\n🔍 발견된 !important: ${stats.total}개\n`);
  
  // 1. 안전한 패턴 제거
  SAFE_REMOVAL_PATTERNS.forEach(pattern => {
    const matches = modifiedContent.match(pattern);
    if (matches) {
      console.log(`✅ 제거 중: ${matches.length}개 - ${pattern.source.substring(0, 30)}...`);
      modifiedContent = modifiedContent.replace(pattern, (match) => {
        stats.removed++;
        return match.replace(/\s*!important/g, '');
      });
    }
  });
  
  // 2. 조건부 패턴 제거
  CONDITIONAL_PATTERNS.forEach(({pattern, replacement}) => {
    const matches = modifiedContent.match(pattern);
    if (matches) {
      console.log(`⚠️  조건부 제거: ${matches.length}개`);
      modifiedContent = modifiedContent.replace(pattern, replacement);
      stats.conditional += matches.length;
    }
  });
  
  // 3. 남은 !important 확인
  const remainingMatches = modifiedContent.match(/!important/g);
  const remaining = remainingMatches ? remainingMatches.length : 0;
  stats.skipped = remaining;
  
  return modifiedContent;
}

function analyzeRemaining(content) {
  const lines = content.split('\n');
  const remainingImportants = [];
  
  lines.forEach((line, index) => {
    if (line.includes('!important')) {
      remainingImportants.push({
        lineNumber: index + 1,
        content: line.trim()
      });
    }
  });
  
  if (remainingImportants.length > 0) {
    console.log('\n⚠️  남은 !important 목록:');
    remainingImportants.forEach(({lineNumber, content}) => {
      console.log(`  라인 ${lineNumber}: ${content}`);
    });
  }
  
  return remainingImportants;
}

function main() {
  console.log('🧹 FeedbackButtonStyles !important 제거 시작...\n');
  
  // 파일 읽기
  if (!fs.existsSync(FILE_PATH)) {
    console.error('❌ 파일을 찾을 수 없습니다:', FILE_PATH);
    process.exit(1);
  }
  
  const originalContent = fs.readFileSync(FILE_PATH, 'utf8');
  
  // 백업 생성
  fs.writeFileSync(BACKUP_PATH, originalContent);
  console.log('📁 백업 생성 완료:', BACKUP_PATH);
  
  // !important 제거
  const modifiedContent = removeImportants(originalContent);
  
  // 결과 분석
  console.log('\n📊 제거 결과:');
  console.log(`  - 전체: ${stats.total}개`);
  console.log(`  - 제거됨: ${stats.removed}개`);
  console.log(`  - 조건부 제거: ${stats.conditional}개`);
  console.log(`  - 유지됨: ${stats.skipped}개`);
  console.log(`  - 제거율: ${Math.round((stats.removed + stats.conditional) / stats.total * 100)}%`);
  
  // 남은 !important 분석
  analyzeRemaining(modifiedContent);
  
  // 실행 모드 확인
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');
  
  if (isDryRun) {
    console.log('\n🔔 DRY RUN 모드 - 실제 파일은 수정되지 않았습니다.');
    console.log('실제로 적용하려면 --execute 플래그를 추가하세요.');
    
    // 미리보기 저장
    const previewPath = FILE_PATH + '.preview';
    fs.writeFileSync(previewPath, modifiedContent);
    console.log('📄 미리보기 파일:', previewPath);
  } else {
    // 실제 파일 수정
    fs.writeFileSync(FILE_PATH, modifiedContent);
    console.log('\n✅ 파일 수정 완료!');
  }
  
  // Fronty의 추가 권고사항
  console.log('\n💡 Fronty의 권고사항:');
  console.log('1. 시각적 회귀 테스트를 실행하세요');
  console.log('2. 브라우저에서 피드백 페이지 버튼들을 확인하세요');
  console.log('3. hover/active 상태를 특히 주의깊게 확인하세요');
  console.log('4. 문제 발생 시 백업 파일로 복원 가능합니다');
}

// 스크립트 실행
main();