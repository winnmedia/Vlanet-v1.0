const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 모든 남은 커스텀 input 찾기...\n');

// JSX 파일 찾기
const jsxFiles = glob.sync('src/**/*.{jsx,tsx}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/stories/**']
});

let totalCustomInputs = 0;
const customInputFiles = [];

jsxFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // <input 태그 찾기 (통합 Input 컴포넌트가 아닌 것)
  const inputMatches = content.match(/<input[^>]*>/gi) || [];
  
  // 통합 Input 컴포넌트 import 확인
  const hasUnifiedInput = content.includes("from '../components/unified/Input'") ||
                         content.includes("from '../../components/unified/Input'") ||
                         content.includes("from '../../../components/unified/Input'") ||
                         content.includes('from "./components/unified/Input"') ||
                         content.includes('from "../../components/unified/Input"');
  
  if (inputMatches.length > 0) {
    const lines = content.split('\n');
    const inputs = [];
    
    inputMatches.forEach(match => {
      const lineIndex = lines.findIndex(line => line.includes(match));
      if (lineIndex !== -1) {
        // input type 추출
        const typeMatch = match.match(/type=["']([^"']+)["']/i);
        const type = typeMatch ? typeMatch[1] : 'text';
        
        // placeholder 추출
        const placeholderMatch = match.match(/placeholder=["']([^"']+)["']/i);
        const placeholder = placeholderMatch ? placeholderMatch[1] : '';
        
        // className 추출  
        const classMatch = match.match(/className=["']([^"']+)["']/i);
        const className = classMatch ? classMatch[1] : '';
        
        inputs.push({
          line: lineIndex + 1,
          type,
          placeholder,
          className,
          code: lines[lineIndex].trim()
        });
      }
    });
    
    if (inputs.length > 0) {
      customInputFiles.push({
        file: path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath),
        count: inputs.length,
        hasUnifiedInput,
        inputs
      });
      totalCustomInputs += inputs.length;
    }
  }
});

// 타입별로 정렬
customInputFiles.sort((a, b) => b.count - a.count);

console.log(`📊 총 ${totalCustomInputs}개의 커스텀 input을 ${customInputFiles.length}개 파일에서 발견\n`);

// 타입별 통계
const typeStats = {};
customInputFiles.forEach(file => {
  file.inputs.forEach(input => {
    typeStats[input.type] = (typeStats[input.type] || 0) + 1;
  });
});

console.log('📈 타입별 분포:');
Object.entries(typeStats).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}개`);
});

console.log('\n📁 파일별 상세:');
customInputFiles.forEach(({ file, count, hasUnifiedInput, inputs }) => {
  console.log(`\n${file} (${count}개) ${hasUnifiedInput ? '[Input 컴포넌트 사용중]' : ''}`);
  inputs.forEach(input => {
    console.log(`  L${input.line}: ${input.type} ${input.placeholder ? `"${input.placeholder}"` : ''}`);
  });
});

// 쉽게 마이그레이션 가능한 input 찾기
console.log('\n🎯 쉽게 마이그레이션 가능한 input (text, email, password):');
const easyTargets = customInputFiles.filter(file => 
  file.inputs.some(input => ['text', 'email', 'password', 'search', 'tel', 'url'].includes(input.type))
);

easyTargets.forEach(({ file, inputs }) => {
  const easyInputs = inputs.filter(input => ['text', 'email', 'password', 'search', 'tel', 'url'].includes(input.type));
  if (easyInputs.length > 0) {
    console.log(`\n${file}:`);
    easyInputs.forEach(input => {
      console.log(`  L${input.line}: ${input.type} ${input.placeholder ? `"${input.placeholder}"` : ''}`);
    });
  }
});