const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 네이티브 HTML input 태그 찾기...\n');

// JSX/TSX 파일 찾기
const files = glob.sync('src/**/*.{jsx,tsx}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/stories/**', '**/components/unified/**']
});

let totalInputs = 0;
const inputFiles = [];

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // 네이티브 <input 태그 찾기 (대소문자 구분 없이)
    lines.forEach((line, index) => {
      if (line.match(/<input\s/i) && !line.includes('<Input')) {
        totalInputs++;
        
        // 이미 추가된 파일인지 확인
        let fileEntry = inputFiles.find(f => f.file === filePath);
        if (!fileEntry) {
          fileEntry = {
            file: path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath),
            inputs: []
          };
          inputFiles.push(fileEntry);
        }
        
        // type 추출
        const typeMatch = line.match(/type=["']([^"']+)["']/i);
        const type = typeMatch ? typeMatch[1] : 'text';
        
        // placeholder 추출
        const placeholderMatch = line.match(/placeholder=["']([^"']+)["']/i);
        const placeholder = placeholderMatch ? placeholderMatch[1] : '';
        
        fileEntry.inputs.push({
          line: index + 1,
          type,
          placeholder,
          code: line.trim()
        });
      }
    });
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
  }
});

// 결과 출력
console.log(`📊 총 ${totalInputs}개의 네이티브 HTML input을 ${inputFiles.length}개 파일에서 발견\n`);

// 타입별 통계
const typeStats = {};
inputFiles.forEach(file => {
  file.inputs.forEach(input => {
    typeStats[input.type] = (typeStats[input.type] || 0) + 1;
  });
});

console.log('📈 타입별 분포:');
Object.entries(typeStats).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}개`);
});

console.log('\n📁 파일별 상세:');
inputFiles.forEach(({ file, inputs }) => {
  console.log(`\n${file} (${inputs.length}개)`);
  inputs.forEach(input => {
    console.log(`  L${input.line}: <input type="${input.type}" ${input.placeholder ? `placeholder="${input.placeholder}"` : ''}`);
    console.log(`         ${input.code.substring(0, 80)}${input.code.length > 80 ? '...' : ''}`);
  });
});