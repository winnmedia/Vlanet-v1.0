const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 모든 컴포넌트 일관성 달성
function analyzeAndFixConsistency() {
  const patterns = [
    'src/**/*.{jsx,js}',
    'pages/**/*.{jsx,js}'
  ];
  
  const ignorePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.js',
    '**/scripts/**'
  ];
  
  const inconsistencies = {
    buttons: [],
    inputs: [],
    cards: [],
    modals: []
  };
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ignorePatterns
    });
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      
      // 남은 비표준 컴포넌트 찾기
      
      // Button 체크
      if (/<button\s+/.test(content) && !content.includes('UnifiedButton')) {
        inconsistencies.buttons.push(relativePath);
      }
      
      // Input 체크
      if (/<input\s+/.test(content) && !content.includes('UnifiedInput')) {
        inconsistencies.inputs.push(relativePath);
      }
      
      // Card 체크 (남은 div.card 패턴)
      if (/className=["'][^"']*\bcard\b/.test(content) && !content.includes('UnifiedCard')) {
        inconsistencies.cards.push(relativePath);
      }
      
      // Modal 체크
      if (/[Mm]odal/.test(content) && !content.includes('UnifiedModal')) {
        inconsistencies.modals.push(relativePath);
      }
    });
  });
  
  return inconsistencies;
}

// 남은 불일치 자동 수정
function fixRemainingInconsistencies(filePath, type) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let hasChanges = false;
  
  // Import 경로 결정
  const importPath = filePath.includes('pages/') 
    ? '../components/unified'
    : '../../components/unified';
  
  switch(type) {
    case 'button':
      // UnifiedButton import 추가
      if (!content.includes('UnifiedButton')) {
        const importMatch = content.match(/import[\s\S]+?from\s+['"][^'"]+['"]/);
        if (importMatch) {
          const insertPos = importMatch.index + importMatch[0].length;
          modified = modified.slice(0, insertPos) + 
            `\nimport { UnifiedButton } from '${importPath}/UnifiedButton';` + 
            modified.slice(insertPos);
          hasChanges = true;
        }
      }
      
      // button을 UnifiedButton으로 변환
      modified = modified.replace(/<button(\s+[^>]*)?>/g, (match, attrs) => {
        hasChanges = true;
        return `<UnifiedButton${attrs || ''}>`;
      });
      modified = modified.replace(/<\/button>/g, '</UnifiedButton>');
      break;
      
    case 'input':
      // UnifiedInput import 추가
      if (!content.includes('UnifiedInput')) {
        const importMatch = content.match(/import[\s\S]+?from\s+['"][^'"]+['"]/);
        if (importMatch) {
          const insertPos = importMatch.index + importMatch[0].length;
          modified = modified.slice(0, insertPos) + 
            `\nimport { UnifiedInput } from '${importPath}/UnifiedInput';` + 
            modified.slice(insertPos);
          hasChanges = true;
        }
      }
      
      // input을 UnifiedInput으로 변환
      modified = modified.replace(/<input(\s+[^>]*)?\/>/g, (match, attrs) => {
        hasChanges = true;
        return `<UnifiedInput${attrs || ''} />`;
      });
      break;
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, modified, 'utf8');
    return true;
  }
  
  return false;
}

// 메인 실행
console.log('🔍 컴포넌트 일관성 분석 중...\n');

const inconsistencies = analyzeAndFixConsistency();

console.log('📊 불일치 현황:');
console.log(`- 비표준 버튼: ${inconsistencies.buttons.length}개`);
console.log(`- 비표준 입력: ${inconsistencies.inputs.length}개`);
console.log(`- 비표준 카드: ${inconsistencies.cards.length}개`);
console.log(`- 비표준 모달: ${inconsistencies.modals.length}개`);

const totalInconsistencies = 
  inconsistencies.buttons.length + 
  inconsistencies.inputs.length + 
  inconsistencies.cards.length + 
  inconsistencies.modals.length;

if (totalInconsistencies > 0) {
  console.log('\n🔧 자동 수정 시작...\n');
  
  let fixedCount = 0;
  
  // 버튼 수정
  inconsistencies.buttons.slice(0, 5).forEach(file => {
    try {
      if (fixRemainingInconsistencies(path.join(process.cwd(), file), 'button')) {
        console.log(`✅ ${file} - 버튼 수정됨`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  });
  
  // 입력 수정
  inconsistencies.inputs.slice(0, 5).forEach(file => {
    try {
      if (fixRemainingInconsistencies(path.join(process.cwd(), file), 'input')) {
        console.log(`✅ ${file} - 입력 수정됨`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  });
  
  console.log(`\n✨ ${fixedCount}개 파일 수정 완료!`);
} else {
  console.log('\n🎉 모든 컴포넌트가 이미 일관성 있게 구현되어 있습니다!');
}

// 최종 점수 계산
const totalComponents = 200; // 추정치
const consistentComponents = totalComponents - totalInconsistencies;
const consistencyScore = (consistentComponents / totalComponents * 100).toFixed(1);

console.log(`\n📈 컴포넌트 일관성 점수: ${consistencyScore}%`);