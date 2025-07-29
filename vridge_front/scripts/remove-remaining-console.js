const fs = require('fs');
const path = require('path');

let removedCount = 0;
let filesProcessed = 0;
let errorCount = 0;

// More comprehensive console patterns
const consolePatterns = [
  // Standard console methods
  /console\s*\.\s*(log|debug|info|warn|error|trace|group|groupEnd|groupCollapsed|table|time|timeEnd|count|assert|dir|dirxml|profile|profileEnd)\s*\([^)]*\)\s*;?/g,
  // Multi-line console statements
  /console\s*\.\s*(log|debug|info|warn|error)\s*\([^)]*\n[^)]*\)\s*;?/g,
  // Console with template literals
  /console\s*\.\s*(log|debug|info|warn|error)\s*\(`[^`]*`\)\s*;?/g,
  // Console in JSX
  /{\s*console\s*\.\s*(log|debug|info|warn|error)\s*\([^}]*\)\s*}/g,
  // Console in conditional expressions
  /\s*&&\s*console\s*\.\s*(log|debug|info|warn|error)\s*\([^)]*\)\s*;?/g,
  // Console in ternary
  /\?\s*console\s*\.\s*(log|debug|info|warn|error)\s*\([^)]*\)\s*:\s*/g,
  // Standalone console statements with newlines
  /^\s*console\s*\.\s*(log|debug|info|warn|error|trace)\s*\([^)]*\)\s*;?\s*$/gm
];

function removeConsoleFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileRemovedCount = 0;
    
    // Apply all patterns
    consolePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        fileRemovedCount += matches.length;
        content = content.replace(pattern, '');
      }
    });
    
    // Clean up empty lines left by removal
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (fileRemovedCount > 0) {
      fs.writeFileSync(filePath, content);
      removedCount += fileRemovedCount;
      console.log(`✓ Removed ${fileRemovedCount} console statements from: ${filePath}`);
    }
    
    filesProcessed++;
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    errorCount++;
  }
}

function findJSFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && 
          !file.includes('__tests__') && 
          !file.includes('scripts') &&
          !file.includes('backup')) {
        findJSFiles(filePath);
      }
    } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && 
               !file.includes('.test.') && 
               !file.includes('.spec.') &&
               !file.includes('backup')) {
      removeConsoleFromFile(filePath);
    }
  }
}

// Main execution
console.log('Removing remaining console statements...\n');

// Process all JavaScript files
findJSFiles('src');
findJSFiles('pages');

console.log('\n=== Final Console Removal Summary ===');
console.log(`Total files processed: ${filesProcessed}`);
console.log(`Console statements removed: ${removedCount}`);
console.log(`Errors: ${errorCount}`);

// Check remaining console statements
console.log('\nChecking for any remaining console statements...');
const { execSync } = require('child_process');
try {
  const remaining = execSync('grep -r "console\\." src pages --include="*.js" --include="*.jsx" | grep -v "__tests__" | grep -v "backup" | wc -l', { encoding: 'utf8' });
  console.log(`Remaining console statements: ${remaining.trim()}`);
} catch (error) {
  console.log('Could not count remaining console statements');
}