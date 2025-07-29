#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Input 타입별 variant 매핑
const TYPE_TO_VARIANT = {
  'text': 'default',
  'email': 'default',
  'password': 'default',
  'search': 'outlined',
  'number': 'default',
  'tel': 'default',
  'url': 'default'
};

// 클래스명별 size 매핑
const CLASS_TO_SIZE = {
  'small': 'sm',
  'large': 'lg',
  'input-sm': 'sm',
  'input-lg': 'lg'
};

function analyzeInputs() {
  console.log('🔍 Input 요소 분석 시작...\n');
  
  const files = glob.sync('src/**/*.{jsx,tsx}', {
    ignore: [
      'node_modules/**',
      '**/unified/Input/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*'
    ]
  });
  
  let totalInputs = 0;
  let migratable = 0;
  let complex = 0;
  const report = [];
  
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already using unified Input
    if (content.includes("from '../components/unified/Input'") || 
        content.includes("from '../../components/unified/Input'")) {
      return;
    }
    
    const lines = content.split('\n');
    const inputs = [];
    
    lines.forEach((line, index) => {
      if (line.includes('<input') || line.includes('<Input')) {
        totalInputs++;
        
        // Check complexity
        if (line.includes('onChange') || line.includes('onBlur') || 
            line.includes('value') || line.includes('defaultValue')) {
          migratable++;
        } else {
          complex++;
        }
        
        inputs.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });
    
    if (inputs.length > 0) {
      report.push({
        file: path.relative(process.cwd(), filePath),
        count: inputs.length,
        inputs: inputs.slice(0, 3)
      });
    }
  });
  
  // Sort by count
  report.sort((a, b) => b.count - a.count);
  
  console.log('📊 분석 결과:\n');
  console.log(`- 총 Input 요소: ${totalInputs}개`);
  console.log(`- 자동 마이그레이션 가능: ${migratable}개`);
  console.log(`- 수동 검토 필요: ${complex}개`);
  console.log(`- 관련 파일: ${report.length}개\n`);
  
  console.log('🔝 가장 많은 Input을 가진 파일들:\n');
  report.slice(0, 10).forEach(({ file, count }) => {
    console.log(`- ${file}: ${count}개`);
  });
  
  // Save report
  fs.writeFileSync(
    'input-migration-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ 상세 리포트가 input-migration-report.json에 저장되었습니다.');
}

function migrateInputs(options = {}) {
  const {
    pattern = 'src/**/*.{jsx,tsx}',
    dryRun = true,
    verbose = false
  } = options;
  
  console.log('🔄 Input 마이그레이션 시작...\n');
  console.log(`모드: ${dryRun ? '시뮬레이션' : '실행'}`);
  
  const files = glob.sync(pattern, {
    ignore: [
      'node_modules/**',
      '**/unified/Input/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/*.migrated.*'
    ]
  });
  
  let totalMigrated = 0;
  const results = [];
  
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changeCount = 0;
    
    // Skip if already using unified Input
    if (content.includes("from '../components/unified/Input'") || 
        content.includes("from '../../components/unified/Input'")) {
      return;
    }
    
    // Basic input pattern
    const inputPattern = /<input\s+([^>]*?)\/?>|<Input\s+([^>]*?)\/?>/g;
    
    newContent = newContent.replace(inputPattern, (match, attrs1, attrs2) => {
      const attrs = attrs1 || attrs2;
      
      // Parse attributes
      const typeMatch = attrs.match(/type=["']([^"']+)["']/);
      const type = typeMatch ? typeMatch[1] : 'text';
      
      const classMatch = attrs.match(/className=["']([^"']+)["']/);
      const className = classMatch ? classMatch[1] : '';
      
      const placeholderMatch = attrs.match(/placeholder=["']([^"']+)["']/);
      const valueMatch = attrs.match(/value=\{([^}]+)\}/);
      const onChangeMatch = attrs.match(/onChange=\{([^}]+)\}/);
      
      // Skip non-text inputs
      if (['checkbox', 'radio', 'file', 'submit', 'button'].includes(type)) {
        return match;
      }
      
      changeCount++;
      
      // Build new Input props
      let props = [];
      
      // Variant
      const variant = TYPE_TO_VARIANT[type] || 'default';
      if (variant !== 'default') {
        props.push(`variant="${variant}"`);
      }
      
      // Size
      const size = CLASS_TO_SIZE[className.split(' ').find(c => CLASS_TO_SIZE[c])] || 'md';
      if (size !== 'md') {
        props.push(`inputSize="${size}"`);
      }
      
      // Other props
      if (placeholderMatch) {
        props.push(`placeholder="${placeholderMatch[1]}"`);
      }
      if (valueMatch) {
        props.push(`value={${valueMatch[1]}}`);
      }
      if (onChangeMatch) {
        props.push(`onChange={${onChangeMatch[1]}}`);
      }
      
      // Additional attributes
      const otherAttrs = ['disabled', 'readOnly', 'autoFocus', 'name', 'id'];
      otherAttrs.forEach(attr => {
        if (attrs.includes(attr)) {
          props.push(attr);
        }
      });
      
      return `<Input ${props.join(' ')} />`;
    });
    
    if (changeCount > 0) {
      totalMigrated += changeCount;
      results.push({ file: filePath, count: changeCount });
      
      // Add import
      const fileDir = path.dirname(filePath);
      const inputPath = path.join(process.cwd(), 'src/components/unified/Input');
      const relativePath = path.relative(fileDir, inputPath).replace(/\\/g, '/');
      
      const importMatches = newContent.match(/^import[^;]+;?$/gm);
      if (importMatches) {
        const lastImport = importMatches[importMatches.length - 1];
        const insertPos = newContent.indexOf(lastImport) + lastImport.length;
        newContent = newContent.slice(0, insertPos) + 
          `\nimport { Input } from '${relativePath}';` +
          newContent.slice(insertPos);
      }
      
      if (!dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
      }
      
      console.log(`✓ ${path.relative(process.cwd(), filePath)}: ${changeCount}개 마이그레이션`);
    }
  });
  
  console.log(`\n📊 마이그레이션 요약:`);
  console.log(`- 처리된 파일: ${files.length}개`);
  console.log(`- 수정된 파일: ${results.length}개`);
  console.log(`- 마이그레이션된 Input: ${totalMigrated}개`);
  
  if (dryRun) {
    console.log('\n⚠️  시뮬레이션 모드입니다. 실제 파일은 수정되지 않았습니다.');
    console.log('실행하려면 --execute 플래그를 사용하세요.');
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--analyze')) {
    analyzeInputs();
  } else {
    const options = {
      dryRun: !args.includes('--execute'),
      verbose: args.includes('--verbose')
    };
    migrateInputs(options);
  }
}

module.exports = { analyzeInputs, migrateInputs };