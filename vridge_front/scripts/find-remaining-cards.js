const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 남은 커스텀 Card 컴포넌트 찾기...\n');

// JSX/TSX 파일 찾기
const files = glob.sync('src/**/*.{jsx,tsx}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/stories/**']
});

let totalCards = 0;
const cardFiles = [];

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Card 관련 패턴 찾기
  const cardPatterns = [
    /className=["'][\w\s-]*card[\w\s-]*["']/gi,
    /<div[^>]*className=["'][^"']*card[^"']*["'][^>]*>/gi,
    /\.card\s*{/g,
    /\.project-card/gi,
    /\.video-card/gi,
    /\.feedback-card/gi,
    /\.content-card/gi,
    /\.info-card/gi
  ];
  
  let hasCard = false;
  let cardCount = 0;
  const cardInstances = [];
  
  cardPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    if (matches.length > 0) {
      hasCard = true;
      cardCount += matches.length;
      
      // 각 매치에 대한 라인 번호 찾기
      const lines = content.split('\n');
      matches.forEach(match => {
        const lineIndex = lines.findIndex(line => line.includes(match));
        if (lineIndex !== -1) {
          cardInstances.push({
            line: lineIndex + 1,
            code: lines[lineIndex].trim(),
            match
          });
        }
      });
    }
  });
  
  // 통합 Card 컴포넌트 사용 여부 확인
  const hasUnifiedCard = content.includes("from '../components/unified/Card'") ||
                        content.includes("from '../../components/unified/Card'") ||
                        content.includes("from '../../../components/unified/Card'") ||
                        content.includes('<Card ');
  
  if (hasCard && !hasUnifiedCard) {
    cardFiles.push({
      file: path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath),
      count: cardCount,
      instances: cardInstances
    });
    totalCards += cardCount;
  }
});

// 결과 출력
console.log(`📊 총 ${totalCards}개의 커스텀 Card를 ${cardFiles.length}개 파일에서 발견\n`);

// 파일별로 정렬 (가장 많은 카드를 가진 파일 순)
cardFiles.sort((a, b) => b.count - a.count);

console.log('📁 파일별 상세:');
cardFiles.forEach(({ file, count, instances }) => {
  console.log(`\n${file} (${count}개)`);
  instances.slice(0, 3).forEach(instance => {
    console.log(`  L${instance.line}: ${instance.match}`);
  });
  if (instances.length > 3) {
    console.log(`  ... 그리고 ${instances.length - 3}개 더`);
  }
});

// 마이그레이션하기 쉬운 대상 찾기
console.log('\n🎯 마이그레이션하기 쉬운 Card 패턴:');
const easyTargets = cardFiles.filter(file => 
  file.instances.some(i => i.match.includes('project-card') || 
                          i.match.includes('video-card') ||
                          i.match.includes('content-card'))
);

easyTargets.forEach(({ file, instances }) => {
  const relevantInstances = instances.filter(i => 
    i.match.includes('project-card') || 
    i.match.includes('video-card') ||
    i.match.includes('content-card')
  );
  
  if (relevantInstances.length > 0) {
    console.log(`\n${file}:`);
    relevantInstances.forEach(instance => {
      console.log(`  L${instance.line}: ${instance.match}`);
    });
  }
});