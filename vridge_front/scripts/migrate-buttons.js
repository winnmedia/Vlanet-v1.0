#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Button migration patterns
const migrationPatterns = {
  // Pattern 1: Native button with className
  nativeButtonWithClass: {
    pattern: /<button\s+([^>]*?)className=["']([^"']+)["']([^>]*?)>(.*?)<\/button>/gs,
    transform: (match, preAttrs, className, postAttrs, children) => {
      const variant = getVariantFromClass(className);
      const size = getSizeFromClass(className);
      const fullWidth = className.includes('full-width') || className.includes('w-full');
      
      const newProps = [];
      if (variant && variant !== 'primary') newProps.push(`variant="${variant}"`);
      if (size && size !== 'md') newProps.push(`size="${size}"`);
      if (fullWidth) newProps.push('fullWidth');
      
      // Extract other attributes
      const allAttrs = (preAttrs + ' ' + postAttrs).trim();
      const otherAttrs = extractOtherAttributes(allAttrs);
      
      return `<Button ${newProps.join(' ')} ${otherAttrs}>${children}</Button>`;
    }
  },
  
  // Pattern 2: Antd Button import replacement
  antdButton: {
    pattern: /import\s*{\s*([^}]*)\s*Button\s*([^}]*)\s*}\s*from\s*['"]antd['"]/g,
    transform: (match, before, after) => {
      const otherImports = (before + after).split(',').filter(imp => imp.trim() && imp.trim() !== 'Button').join(', ');
      if (otherImports) {
        return `import { ${otherImports} } from 'antd'`;
      }
      return '';
    }
  },
  
  // Pattern 3: Add unified Button import
  addButtonImport: {
    shouldAdd: (content) => {
      return content.includes('<Button') && !content.includes("from '../components/unified/Button'");
    },
    import: "import { Button } from '../components/unified/Button'"
  }
};

// Map class names to Button component variants
function getVariantFromClass(className) {
  const classMap = {
    'btn-primary': 'primary',
    'btn-secondary': 'secondary',
    'btn-danger': 'danger',
    'btn-success': 'success',
    'btn-warning': 'warning',
    'btn-ghost': 'ghost',
    'btn-link': 'link',
    'cancel-btn': 'secondary',
    'save-btn': 'primary',
    'delete-btn': 'danger',
    'edit-btn': 'secondary',
    'submit-btn': 'primary',
    'back-btn': 'ghost',
    'export-btn': 'primary',
    'generate-btn': 'primary',
    'upload-btn': 'primary',
    'download-btn': 'secondary'
  };
  
  for (const [cls, variant] of Object.entries(classMap)) {
    if (className.includes(cls)) return variant;
  }
  
  return 'primary';
}

// Map class names to Button component sizes
function getSizeFromClass(className) {
  const sizeMap = {
    'btn-xs': 'xs',
    'btn-sm': 'sm',
    'btn-md': 'md',
    'btn-lg': 'lg',
    'btn-xl': 'xl',
    'small': 'sm',
    'large': 'lg'
  };
  
  for (const [cls, size] of Object.entries(sizeMap)) {
    if (className.includes(cls)) return size;
  }
  
  return 'md';
}

// Extract non-className attributes
function extractOtherAttributes(attrs) {
  const attrRegex = /(\w+)(?:=["']([^"']+)["'])?/g;
  const extracted = [];
  let match;
  
  while ((match = attrRegex.exec(attrs)) !== null) {
    const [, name, value] = match;
    if (name !== 'className' && name !== 'class') {
      if (value) {
        extracted.push(`${name}="${value}"`);
      } else {
        extracted.push(name);
      }
    }
  }
  
  return extracted.join(' ');
}

// Process a single file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let hasChanges = false;
  
  // Apply native button transformations
  if (migrationPatterns.nativeButtonWithClass.pattern.test(newContent)) {
    newContent = newContent.replace(
      migrationPatterns.nativeButtonWithClass.pattern,
      migrationPatterns.nativeButtonWithClass.transform
    );
    hasChanges = true;
  }
  
  // Replace Antd Button imports
  if (migrationPatterns.antdButton.pattern.test(newContent)) {
    newContent = newContent.replace(
      migrationPatterns.antdButton.pattern,
      migrationPatterns.antdButton.transform
    );
    hasChanges = true;
  }
  
  // Add unified Button import if needed
  if (hasChanges && migrationPatterns.addButtonImport.shouldAdd(newContent)) {
    // Find the last import statement
    const importRegex = /^import\s+.*$/gm;
    const imports = newContent.match(importRegex);
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = newContent.lastIndexOf(lastImport);
      newContent = newContent.slice(0, lastImportIndex + lastImport.length) + 
                   '\n' + migrationPatterns.addButtonImport.import + 
                   newContent.slice(lastImportIndex + lastImport.length);
    }
  }
  
  return { content: newContent, hasChanges };
}

// Generate migration report
function generateReport(results) {
  const report = {
    totalFiles: results.length,
    modifiedFiles: results.filter(r => r.hasChanges).length,
    patterns: {},
    files: []
  };
  
  results.forEach(result => {
    if (result.hasChanges) {
      report.files.push({
        path: result.filePath,
        changes: result.changes
      });
    }
  });
  
  return report;
}

// Main migration function
async function migrateButtons(options = {}) {
  const { 
    pattern = 'src/**/*.{js,jsx,ts,tsx}',
    dryRun = true,
    reportPath = 'button-migration-report.json'
  } = options;
  
  console.log(`Starting button migration...`);
  console.log(`Pattern: ${pattern}`);
  console.log(`Mode: ${dryRun ? 'Dry Run' : 'Execute'}`);
  
  const files = glob.sync(pattern, {
    ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*', '**/unified/Button/**']
  });
  
  console.log(`Found ${files.length} files to process`);
  
  const results = [];
  
  for (const filePath of files) {
    const { content, hasChanges } = processFile(filePath);
    
    if (hasChanges) {
      console.log(`✓ ${filePath} - Changes detected`);
      
      if (!dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
      
      results.push({
        filePath,
        hasChanges,
        changes: 'Button components migrated'
      });
    }
  }
  
  const report = generateReport(results);
  
  if (reportPath) {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nMigration report saved to: ${reportPath}`);
  }
  
  console.log(`\nMigration Summary:`);
  console.log(`- Total files scanned: ${report.totalFiles}`);
  console.log(`- Files with changes: ${report.modifiedFiles}`);
  
  return report;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--execute'),
    pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1],
    reportPath: args.find(arg => arg.startsWith('--report='))?.split('=')[1]
  };
  
  migrateButtons(options).catch(console.error);
}

module.exports = { migrateButtons };