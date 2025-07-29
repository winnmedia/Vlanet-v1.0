#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function findRemainingButtons() {
  console.log('🔍 남은 커스텀 버튼 찾기...\n');
  
  const files = glob.sync('src/**/*.{jsx,tsx}', {
    ignore: [
      'node_modules/**',
      '**/unified/Button/**',
      '**/*.migrated.*',
      '**/*.stories.*'
    ]
  });
  
  const results = [];
  
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if unified Button is imported
    const hasUnifiedButton = 
      content.includes("import { Button } from") && content.includes("/unified/Button");
    
    if (!hasUnifiedButton) {
      // Find all button instances
      const lines = content.split('\n');
      const buttonInstances = [];
      
      lines.forEach((line, index) => {
        if (line.includes('<button') || (line.includes('<Button') && !hasUnifiedButton)) {
          buttonInstances.push({
            lineNumber: index + 1,
            line: line.trim(),
            context: lines.slice(Math.max(0, index - 1), index + 2).join('\n')
          });
        }
      });
      
      if (buttonInstances.length > 0) {
        results.push({
          file: path.relative(process.cwd(), filePath),
          count: buttonInstances.length,
          instances: buttonInstances.slice(0, 3) // Show first 3 instances
        });
      }
    }
  });
  
  // Sort by count
  results.sort((a, b) => b.count - a.count);
  
  console.log(`📊 총 ${results.length}개 파일에서 커스텀 버튼 발견\n`);
  
  // Show top 10 files
  console.log('🔝 가장 많은 커스텀 버튼을 가진 파일들:\n');
  results.slice(0, 10).forEach(result => {
    console.log(`📄 ${result.file} (${result.count}개)`);
    result.instances.forEach(instance => {
      console.log(`  라인 ${instance.lineNumber}: ${instance.line.substring(0, 80)}...`);
    });
    console.log('');
  });
  
  // Save full results
  fs.writeFileSync(
    'remaining-buttons-report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('✅ 전체 리포트가 remaining-buttons-report.json에 저장되었습니다.');
  
  // Summary
  const totalButtons = results.reduce((sum, r) => sum + r.count, 0);
  console.log(`\n📈 요약:`);
  console.log(`- 총 파일 수: ${results.length}`);
  console.log(`- 총 커스텀 버튼 수: ${totalButtons}`);
  console.log(`- 평균 버튼/파일: ${(totalButtons / results.length).toFixed(1)}`);
}

findRemainingButtons();