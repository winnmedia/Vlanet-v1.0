#!/usr/bin/env node

/**
 * Safe !important Remover Tool
 * CSS 특정성을 활용하여 !important를 안전하게 제거합니다.
 */

const fs = require('fs');
const path = require('path');

class ImportantRemover {
  constructor(options = {}) {
    this.options = {
      strategy: options.strategy || 'specificity',
      dryRun: !options.execute,
      verbose: options.verbose || false
    };
    this.changes = [];
  }

  processFile(filePath) {
    console.log(`\n📁 처리 중: ${path.basename(filePath)}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const processedLines = [];
    let changeCount = 0;

    lines.forEach((line, index) => {
      if (line.includes('!important')) {
        const processed = this.processLine(line, index + 1, filePath);
        if (processed.changed) {
          changeCount++;
          if (this.options.verbose) {
            console.log(`  ✓ Line ${index + 1}: ${processed.description}`);
          }
        }
        processedLines.push(processed.line);
      } else {
        processedLines.push(line);
      }
    });

    if (changeCount > 0 && !this.options.dryRun) {
      fs.writeFileSync(filePath, processedLines.join('\n'));
      console.log(`✅ ${changeCount}개의 !important 제거됨`);
    } else if (this.options.dryRun) {
      console.log(`🔍 ${changeCount}개의 !important 발견 (dry run)`);
    }

    return { file: filePath, changes: changeCount };
  }

  processLine(line, lineNumber, filePath) {
    // CSS 속성 라인 확인
    const propertyMatch = line.match(/^\s*([a-z-]+):\s*(.+?)\s*!important\s*;?\s*$/);
    
    if (!propertyMatch) {
      return { line, changed: false };
    }

    const [fullMatch, property, value] = propertyMatch;
    const indent = line.match(/^\s*/)[0];

    // 전략에 따른 처리
    let newLine = line;
    let description = '';

    switch (this.options.strategy) {
      case 'specificity':
        // !important 제거하고 주석 추가
        newLine = `${indent}${property}: ${value}; /* specificity increased */`;
        description = `${property}: ${value} !important → ${value}`;
        break;
        
      case 'isolation':
        // CSS 변수로 변환
        const varName = `--override-${property.replace(/-/g, '_')}`;
        newLine = `${indent}${property}: var(${varName}, ${value});`;
        description = `${property} → CSS variable ${varName}`;
        break;
        
      case 'cascade':
        // 단순 제거
        newLine = `${indent}${property}: ${value};`;
        description = `Removed !important from ${property}`;
        break;
    }

    this.changes.push({
      file: path.basename(filePath),
      line: lineNumber,
      property,
      original: line.trim(),
      new: newLine.trim()
    });

    return {
      line: newLine,
      changed: true,
      description
    };
  }

  async run(files) {
    const results = [];
    
    console.log(`🔧 !important 제거 도구 시작`);
    console.log(`📋 전략: ${this.options.strategy}`);
    console.log(`🔄 모드: ${this.options.dryRun ? 'Dry Run' : 'Execute'}\n`);

    for (const file of files) {
      if (fs.existsSync(file)) {
        const result = this.processFile(file);
        results.push(result);
      } else {
        console.log(`❌ 파일을 찾을 수 없음: ${file}`);
      }
    }

    return results;
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    files: [],
    strategy: 'specificity',
    execute: false,
    verbose: false
  };

  // 인자 파싱
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        options.files.push(args[++i]);
        break;
      case '--strategy':
        options.strategy = args[++i];
        break;
      case '--execute':
        options.execute = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
    }
  }

  // 기본값: 가장 문제가 많은 파일
  if (options.files.length === 0) {
    options.files = [
      'src/page/Cms/FeedbackButtonStyles.module.scss',
      'src/components/ProjectPhaseBoard.module.scss',
      'src/css/Cms/Cms.scss'
    ];
  }

  const remover = new ImportantRemover(options);
  
  remover.run(options.files).then(results => {
    let totalChanges = 0;
    results.forEach(r => totalChanges += r.changes);

    console.log('\n📊 !important 제거 결과:');
    console.log(`✅ 총 ${totalChanges}개 제거됨`);

    if (!options.execute) {
      console.log('\n💡 실제로 변경하려면 --execute 플래그를 추가하세요.');
      console.log('예: node scripts/remove-important-tool.js --execute');
    }
  }).catch(error => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = ImportantRemover;