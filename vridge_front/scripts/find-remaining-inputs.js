const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 남은 커스텀 input 찾기...');

// JSX/TSX 파일 찾기
const files = glob.sync('src/**/*.{jsx,tsx}', { 
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.stories.*',
    '**/unified/Input/**',
    '**/components/unified/Input/**'
  ]
});

const customInputs = [];
const unifiedInputUsage = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // 통합 Input 사용 찾기
  const hasUnifiedImport = content.includes("from '../components/unified/Input'") ||
                          content.includes("from '../../components/unified/Input'") ||
                          content.includes("from '../../../components/unified/Input'");
  
  if (hasUnifiedImport) {
    const inputMatches = content.match(/<Input\s/g);
    if (inputMatches) {
      unifiedInputUsage.push({
        file: path.relative('/home/winnmedia/VideoPlanet/vridge_front', file),
        count: inputMatches.length
      });
    }
  }
  
  // 커스텀 input 태그 찾기
  lines.forEach((line, index) => {
    // <input 태그 찾기 (통합 Input이 아닌 것)
    if (line.includes('<input') && !hasUnifiedImport) {
      customInputs.push({
        file: path.relative('/home/winnmedia/VideoPlanet/vridge_front', file),
        line: index + 1,
        content: line.trim()
      });
    }
  });
});

// 결과 정리
const fileGroups = {};
customInputs.forEach(input => {
  if (!fileGroups[input.file]) {
    fileGroups[input.file] = [];
  }
  fileGroups[input.file].push(input);
});

// 가장 많은 커스텀 input을 가진 파일 순으로 정렬
const sortedFiles = Object.entries(fileGroups)
  .map(([file, inputs]) => ({ file, count: inputs.length, inputs }))
  .sort((a, b) => b.count - a.count);

console.log(`\n📊 총 ${sortedFiles.length}개 파일에서 커스텀 input 발견`);
console.log(`\n🔝 가장 많은 커스텀 input을 가진 파일들:\n`);

// 상위 10개 파일 출력
sortedFiles.slice(0, 10).forEach(({ file, count, inputs }) => {
  console.log(`📄 ${file} (${count}개)`);
  inputs.slice(0, 3).forEach(input => {
    const shortContent = input.content.length > 80 ? input.content.substring(0, 80) + '...' : input.content;
    console.log(`  라인 ${input.line}: ${shortContent}`);
  });
  if (inputs.length > 3) {
    console.log(`  ... 외 ${inputs.length - 3}개 더`);
  }
  console.log('');
});

// 전체 리포트 저장
const report = {
  timestamp: new Date().toISOString(),
  totalFiles: sortedFiles.length,
  totalCustomInputs: customInputs.length,
  unifiedInputUsage: unifiedInputUsage.length,
  files: sortedFiles
};

fs.writeFileSync('remaining-inputs-report.json', JSON.stringify(report, null, 2));

console.log('✅ 전체 리포트가 remaining-inputs-report.json에 저장되었습니다.');
console.log(`\n📈 요약:`);
console.log(`- 총 파일 수: ${sortedFiles.length}`);
console.log(`- 총 커스텀 input 수: ${customInputs.length}`);
console.log(`- 통합 Input 사용 파일: ${unifiedInputUsage.length}`);
console.log(`- 평균 input/파일: ${(customInputs.length / sortedFiles.length).toFixed(1)}`);