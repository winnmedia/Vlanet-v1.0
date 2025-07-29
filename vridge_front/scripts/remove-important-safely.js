#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// CSS Module에서는 !important가 대부분 불필요함
// 클래스가 고유하게 해시되므로 우선순위 충돌이 적음

function analyzeImportantUsage(filePath) {
  console.log(`\n📊 ${path.basename(filePath)} 분석 중...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const importantUsages = [];
  let totalImportant = 0;
  
  lines.forEach((line, index) => {
    const importantMatches = line.match(/!important/g);
    if (importantMatches) {
      totalImportant += importantMatches.length;
      
      // 속성 추출
      const propertyMatch = line.match(/([a-z-]+)\s*:\s*[^;]+\s*!important/);
      if (propertyMatch) {
        importantUsages.push({
          line: index + 1,
          property: propertyMatch[1],
          fullLine: line.trim(),
          context: getContext(lines, index)
        });
      }
    }
  });
  
  return { totalImportant, importantUsages };
}

function getContext(lines, index) {
  // 해당 라인이 속한 선택자 찾기
  for (let i = index; i >= 0; i--) {
    if (lines[i].includes('{') && !lines[i].includes('}')) {
      return lines[i].trim();
    }
  }
  return '';
}

function createSafeVersion(filePath, analysis) {
  console.log(`\n🔧 안전한 버전 생성 중...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // CSS Module 파일인지 확인
  const isModule = filePath.includes('.module.');
  
  if (isModule) {
    console.log('✅ CSS Module 파일 - 대부분의 !important 제거 가능');
    
    // 안전하게 제거 가능한 속성들
    const safeToRemove = [
      'display', 'align-items', 'justify-content', 'gap', 'flex',
      'padding', 'margin', 'width', 'height', 'font-size', 'font-weight',
      'cursor', 'position', 'overflow', 'white-space', 'text-overflow',
      'min-width', 'min-height', 'max-width', 'max-height',
      'flex-shrink', 'flex-grow', 'flex-direction', 'flex-wrap'
    ];
    
    analysis.importantUsages.forEach(usage => {
      if (safeToRemove.includes(usage.property)) {
        // !important 제거
        const regex = new RegExp(`(${usage.property}\\s*:\\s*[^;]+)\\s*!important`, 'g');
        newContent = newContent.replace(regex, '$1');
      }
    });
    
  } else {
    console.log('⚠️  Global SCSS 파일 - 신중한 접근 필요');
    
    // 전역 파일에서는 매우 제한적으로만 제거
    const veryBasicProperties = ['cursor', 'user-select', 'pointer-events'];
    
    analysis.importantUsages.forEach(usage => {
      if (veryBasicProperties.includes(usage.property)) {
        const regex = new RegExp(`(${usage.property}\\s*:\\s*[^;]+)\\s*!important`, 'g');
        newContent = newContent.replace(regex, '$1');
      }
    });
  }
  
  // 변경사항이 있는 경우에만 저장
  if (newContent !== content) {
    // 백업 생성
    const backupPath = filePath + '.important-backup';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, content);
    }
    
    // 새 버전 저장
    fs.writeFileSync(filePath, newContent);
    
    // 변경 수 계산
    const newAnalysis = analyzeImportantUsage(filePath);
    const removed = analysis.totalImportant - newAnalysis.totalImportant;
    
    console.log(`✅ ${removed}개의 !important 제거됨`);
    console.log(`   남은 !important: ${newAnalysis.totalImportant}개`);
    
    return { removed, remaining: newAnalysis.totalImportant };
  } else {
    console.log('⏭️  변경사항 없음');
    return { removed: 0, remaining: analysis.totalImportant };
  }
}

// 실행
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('사용법: node remove-important-safely.js <파일경로>');
  console.log('예: node remove-important-safely.js src/page/Cms/FeedbackButtonStyles.module.scss');
  console.log('\n안전 기능:');
  console.log('- CSS Module에서만 적극적 제거');
  console.log('- 백업 파일 생성 (.important-backup)');
  console.log('- 레이아웃에 영향없는 속성 우선 제거');
} else {
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 파일을 찾을 수 없음: ${filePath}`);
    process.exit(1);
  }
  
  // 분석
  const analysis = analyzeImportantUsage(filePath);
  console.log(`\n📈 현재 상태:`);
  console.log(`   총 !important 사용: ${analysis.totalImportant}개`);
  
  if (analysis.totalImportant > 0) {
    // 속성별 통계
    const propertyCount = {};
    analysis.importantUsages.forEach(usage => {
      propertyCount[usage.property] = (propertyCount[usage.property] || 0) + 1;
    });
    
    console.log('\n   속성별 사용:');
    Object.entries(propertyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([prop, count]) => {
        console.log(`   - ${prop}: ${count}개`);
      });
    
    // 안전한 버전 생성
    const result = createSafeVersion(filePath, analysis);
    
    console.log('\n💡 다음 단계:');
    console.log('1. 변경사항 확인: git diff');
    console.log('2. 시각적 확인: npm run dev');
    console.log('3. 문제 시 롤백: mv <file>.important-backup <file>');
  } else {
    console.log('🎉 !important 사용 없음!');
  }
}