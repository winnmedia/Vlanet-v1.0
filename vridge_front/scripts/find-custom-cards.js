const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 커스텀 Card 컴포넌트 찾기...\n');

// JSX/JS 파일 찾기
const jsxFiles = glob.sync('src/**/*.{js,jsx,tsx}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
});

// 이미 통합 Card를 사용하는 파일들
const migratedFiles = new Set([
  'CmsHomeMinimal.jsx',
  'VideoPlanningMinimal.jsx',
  'ProjectDashboard.jsx'
]);

const customCards = {};
let totalCustomCards = 0;

jsxFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // 통합 Card 컴포넌트를 사용하는지 확인
  const hasUnifiedCard = content.includes("from '../components/unified/Card'") ||
                        content.includes("from '../../components/unified/Card'") ||
                        content.includes("from '../../../components/unified/Card'");
  
  // 이미 마이그레이션된 파일은 제외
  if (hasUnifiedCard || migratedFiles.has(fileName)) {
    return;
  }
  
  // Card 관련 패턴 찾기
  const cardPatterns = [
    /<div\s+className=["'].*card.*["']/gi,
    /<div\s+class=["'].*card.*["']/gi,
    /className={.*styles\.card.*}/g,
    /className={.*['"]card.*['"].*}/g,
  ];
  
  let fileCardCount = 0;
  
  cardPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    fileCardCount += matches.length;
  });
  
  // 특정 Card 컴포넌트 import 찾기
  if (content.includes('MinimalCard') || content.includes('CardHeader') || content.includes('CardContent')) {
    fileCardCount += 5; // Card 컴포넌트 사용 가능성 높음
  }
  
  if (fileCardCount > 0) {
    customCards[filePath] = fileCardCount;
    totalCustomCards += fileCardCount;
  }
});

// 결과 출력
const sortedFiles = Object.entries(customCards)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.log(`📊 총 ${totalCustomCards}개의 커스텀 card가 ${Object.keys(customCards).length}개 파일에서 발견됨\n`);

console.log('🎯 가장 많은 커스텀 card를 가진 파일들:');
sortedFiles.forEach(([file, count], index) => {
  const relPath = path.relative('/home/winnmedia/VideoPlanet/vridge_front', file);
  console.log(`${index + 1}. ${relPath}: ${count}개`);
});

console.log('\n💡 추천: 위 파일들부터 마이그레이션하면 효율적입니다.');