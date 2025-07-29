#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 간격 토큰 매핑 (정확한 값 유지)
const SPACING_MAP = {
  // 기본 간격
  '0': '$spacing-0',
  '2px': '$spacing-xs / 2',  // 4px의 절반
  '3px': '$spacing-xs * 0.75', // 4px의 75%
  '4px': '$spacing-xs',      // 4px
  '6px': '$spacing-xs * 1.5', // 4px * 1.5
  '8px': '$spacing-sm',      // 8px
  '10px': '$spacing-sm + $spacing-xs / 2', // 8px + 2px
  '12px': '$spacing-md',     // 12px
  '14px': '$spacing-md + $spacing-xs / 2', // 12px + 2px
  '16px': '$spacing-lg',     // 16px
  '20px': '$spacing-xl',     // 20px
  '24px': '$spacing-2xl',    // 24px
  '32px': '$spacing-3xl',    // 32px
  '36px': '$spacing-3xl + $spacing-xs', // 32px + 4px
  '40px': '$spacing-4xl',    // 40px
  '48px': '$spacing-5xl',    // 48px
  '60px': '$spacing-5xl + $spacing-md', // 48px + 12px
  '64px': '$spacing-lg * 4', // 16px * 4
};

// 테두리 반경 매핑
const RADIUS_MAP = {
  '2px': '$radius-xs',
  '4px': '$radius-sm',
  '6px': '$radius-sm + 2px', // 유지
  '8px': '$radius-md',
  '10px': '$radius-md + 2px', // 유지
  '12px': '$radius-lg',
  '16px': '$radius-xl',
  '20px': '$radius-2xl',
  '50%': '$radius-full',
  '9999px': '$radius-full'
};

function processFile(filePath) {
  console.log(`\n📏 ${path.basename(filePath)} 간격 토큰화 중...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let changeCount = 0;
  
  const lines = content.split('\n');
  const processedLines = lines.map((line, index) => {
    // 주석, import, 이미 토큰화된 라인은 스킵
    if (line.trim().startsWith('//') || 
        line.trim().startsWith('/*') || 
        line.trim().startsWith('*') ||
        line.includes('@import') ||
        line.includes('$spacing-') ||
        line.includes('$radius-')) {
      return line;
    }
    
    let processedLine = line;
    
    // padding, margin, gap 등의 간격 속성 처리
    const spacingProperties = [
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'gap', 'top', 'right', 'bottom', 'left',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'
    ];
    
    spacingProperties.forEach(prop => {
      // 속성: 값 패턴 찾기
      const regex = new RegExp(`(${prop}\\s*:\\s*)([^;]+)(;|\\s*!important)`, 'g');
      processedLine = processedLine.replace(regex, (match, prop, value, ending) => {
        let newValue = value;
        let changed = false;
        
        // 각 간격 값을 토큰으로 교체
        Object.entries(SPACING_MAP).forEach(([px, token]) => {
          if (value.includes(px) && !value.includes('calc') && !value.includes('$')) {
            // 정확히 매칭되는 경우만 교체
            const exactRegex = new RegExp(`\\b${px}\\b`, 'g');
            if (exactRegex.test(value)) {
              newValue = newValue.replace(exactRegex, token);
              changed = true;
            }
          }
        });
        
        if (changed) {
          changeCount++;
          return `${prop}${newValue}${ending}`;
        }
        return match;
      });
    });
    
    // border-radius 처리
    const radiusRegex = /border-radius\s*:\s*([^;]+)(;|\\s*!important)/g;
    processedLine = processedLine.replace(radiusRegex, (match, value, ending) => {
      let newValue = value;
      let changed = false;
      
      Object.entries(RADIUS_MAP).forEach(([px, token]) => {
        if (value.includes(px) && !value.includes('$')) {
          newValue = newValue.replace(new RegExp(`\\b${px}\\b`, 'g'), token);
          changed = true;
        }
      });
      
      if (changed) {
        changeCount++;
        return `border-radius: ${newValue}${ending}`;
      }
      return match;
    });
    
    return processedLine;
  });
  
  if (changeCount > 0) {
    // 필요한 import 추가
    const hasSpacingImport = content.includes('design-system/tokens/_spacing');
    const hasEffectsImport = content.includes('design-system/tokens/_effects');
    
    let imports = [];
    let importIndex = -1;
    
    // 기존 import 위치 찾기
    processedLines.forEach((line, index) => {
      if (line.includes('@import') && importIndex === -1) {
        importIndex = index;
      }
    });
    
    if (!hasSpacingImport) {
      imports.push("@import '../../design-system/tokens/_spacing';");
    }
    if (!hasEffectsImport) {
      imports.push("@import '../../design-system/tokens/_effects';");
    }
    
    if (imports.length > 0) {
      if (importIndex >= 0) {
        // 기존 import 뒤에 추가
        processedLines.splice(importIndex + 1, 0, ...imports);
      } else {
        // 파일 시작 부분에 추가
        processedLines.unshift(...imports, '');
      }
    }
    
    const newContent = processedLines.join('\n');
    
    // 백업 생성
    const backupPath = filePath + '.spacing-backup';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, originalContent);
    }
    
    // 파일 업데이트
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ ${changeCount}개 간격값 토큰화 완료`);
    
    return { file: filePath, changes: changeCount };
  } else {
    console.log('⏭️  변경 사항 없음');
    return { file: filePath, changes: 0 };
  }
}

// 실행
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('사용법: node tokenize-spacing.js <파일경로>');
  console.log('예: node tokenize-spacing.js src/page/Cms/FeedbackButtonStyles.module.scss');
  console.log('\n간격 토큰 매핑:');
  console.log('  4px → $spacing-xs');
  console.log('  8px → $spacing-sm');
  console.log('  12px → $spacing-md');
  console.log('  16px → $spacing-lg');
  console.log('  24px → $spacing-2xl');
  console.log('\n안전 기능:');
  console.log('- 원본 파일 백업 생성 (.spacing-backup)');
  console.log('- calc() 함수 내부는 변경하지 않음');
  console.log('- 이미 토큰화된 값은 건드리지 않음');
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
  console.log(`총 ${totalChanges}개 간격값을 토큰으로 변환했습니다.`);
  console.log('\n💡 다음 단계:');
  console.log('1. 변경사항 확인: git diff');
  console.log('2. 시각적 확인: npm run dev로 레이아웃 확인');
  console.log('3. 문제 시 롤백: mv <file>.spacing-backup <file>');
}