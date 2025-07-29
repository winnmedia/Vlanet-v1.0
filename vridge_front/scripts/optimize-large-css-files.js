const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find large CSS files
function findLargeCSSFiles() {
  const patterns = [
    'src/**/*.{scss,css}',
    'pages/**/*.{scss,css}',
    'styles/**/*.{scss,css}'
  ];
  
  const largeFiles = [];
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: false
    });
    
    files.forEach(file => {
      const stats = fs.statSync(file);
      const sizeInKB = stats.size / 1024;
      
      if (sizeInKB > 50) { // Files larger than 50KB
        largeFiles.push({
          path: file,
          size: sizeInKB
        });
      }
    });
  });
  
  return largeFiles.sort((a, b) => b.size - a.size);
}

// Optimize CSS file
function optimizeCSSFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalSize = content.length;
  
  // Remove comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  content = content.replace(/\/\/.*$/gm, '');
  
  // Remove empty rules
  content = content.replace(/[^{}]+\{\s*\}/g, '');
  
  // Merge duplicate selectors
  const rules = {};
  const rulePattern = /([^{]+)\{([^}]+)\}/g;
  let match;
  
  while (match = rulePattern.exec(content)) {
    const selector = match[1].trim();
    const properties = match[2].trim();
    
    if (rules[selector]) {
      rules[selector] += '; ' + properties;
    } else {
      rules[selector] = properties;
    }
  }
  
  // Rebuild CSS
  let optimized = '';
  for (const [selector, properties] of Object.entries(rules)) {
    optimized += `${selector} { ${properties} }\n`;
  }
  
  // Remove multiple spaces and newlines
  optimized = optimized.replace(/\s+/g, ' ');
  optimized = optimized.replace(/\s*{\s*/g, '{');
  optimized = optimized.replace(/\s*}\s*/g, '}');
  optimized = optimized.replace(/\s*;\s*/g, ';');
  optimized = optimized.replace(/\s*:\s*/g, ':');
  
  // Add newlines for readability
  optimized = optimized.replace(/}/g, '}\n');
  
  if (optimized.length < originalSize * 0.9) { // Only save if 10% smaller
    fs.writeFileSync(filePath, optimized);
    return {
      originalSize: originalSize / 1024,
      newSize: optimized.length / 1024,
      reduction: ((originalSize - optimized.length) / originalSize * 100).toFixed(1)
    };
  }
  
  return null;
}

// Split large files if needed
function splitLargeCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  if (lines.length < 500) return false;
  
  // Group by component/section
  const sections = {};
  let currentSection = 'base';
  
  lines.forEach(line => {
    // Detect section comments
    const sectionMatch = line.match(/\/\*\s*=+\s*([^=]+)\s*=+\s*\*\//);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
    }
    
    if (!sections[currentSection]) {
      sections[currentSection] = [];
    }
    sections[currentSection].push(line);
  });
  
  // Only split if we have multiple sections
  if (Object.keys(sections).length > 1) {
    const baseDir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath);
    
    // Create split files
    Object.entries(sections).forEach(([section, lines]) => {
      if (lines.length > 50) { // Only create file if significant content
        const newFileName = `${baseName}.${section}${ext}`;
        const newFilePath = path.join(baseDir, newFileName);
        fs.writeFileSync(newFilePath, lines.join('\n'));
      }
    });
    
    // Create index file
    const imports = Object.keys(sections)
      .filter(section => sections[section].length > 50)
      .map(section => `@import './${baseName}.${section}';`)
      .join('\n');
    
    fs.writeFileSync(filePath, imports);
    return true;
  }
  
  return false;
}

// Main execution
console.log('🎨 CSS 파일 최적화 스크립트\n');

const largeFiles = findLargeCSSFiles();
console.log(`📊 대용량 CSS 파일: ${largeFiles.length}개\n`);

let optimizedCount = 0;
let splitCount = 0;

largeFiles.forEach(({ path: filePath, size }) => {
  console.log(`\n📄 ${filePath} (${size.toFixed(1)}KB)`);
  
  // Try to optimize first
  const result = optimizeCSSFile(filePath);
  if (result) {
    console.log(`  ✅ 최적화: ${result.originalSize.toFixed(1)}KB → ${result.newSize.toFixed(1)}KB (-${result.reduction}%)`);
    optimizedCount++;
  }
  
  // Try to split if still large
  if (size > 100) {
    if (splitLargeCSSFile(filePath)) {
      console.log(`  ✂️  파일 분할 완료`);
      splitCount++;
    }
  }
});

console.log(`\n📊 최적화 결과:`);
console.log(`✅ 최적화된 파일: ${optimizedCount}개`);
console.log(`✂️  분할된 파일: ${splitCount}개`);