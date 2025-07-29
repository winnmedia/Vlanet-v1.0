const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Comprehensive SCSS fix script
function fixAllSCSSIssues() {
  const files = glob.sync('src/**/*.scss');
  let fixedCount = 0;
  
  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      const originalContent = content;
      
      // Count braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      
      // Add missing closing braces at the end
      if (openBraces > closeBraces) {
        const missing = openBraces - closeBraces;
        console.log(`${file}: Missing ${missing} closing braces`);
        content += '\n' + '}'.repeat(missing);
        modified = true;
      }
      
      // Fix common syntax issues
      // Fix patterns like 0.$variable
      content = content.replace(/(-?)0\.\$[a-zA-Z0-9_-]+/g, (match, minus) => {
        modified = true;
        return minus ? '-0.5px' : '0.5px';
      });
      
      // Fix calc expressions with invalid operations
      content = content.replace(/calc\([^)]*\$[^)]*\)/g, (match) => {
        // Replace variables in calc with reasonable defaults
        let fixed = match;
        fixed = fixed.replace(/\$spacing-6xl/g, '96px');
        fixed = fixed.replace(/\$spacing-5xl/g, '80px');
        fixed = fixed.replace(/\$spacing-4xl/g, '64px');
        fixed = fixed.replace(/\$spacing-3xl/g, '48px');
        fixed = fixed.replace(/\$spacing-2xl/g, '32px');
        fixed = fixed.replace(/\$spacing-xl/g, '24px');
        fixed = fixed.replace(/\$spacing-lg/g, '20px');
        fixed = fixed.replace(/\$spacing-md/g, '16px');
        fixed = fixed.replace(/\$spacing-sm/g, '12px');
        fixed = fixed.replace(/\$spacing-xs/g, '8px');
        fixed = fixed.replace(/\$spacing-2xs/g, '4px');
        fixed = fixed.replace(/\$font-size-[a-z0-9]+/g, '16px');
        if (fixed !== match) {
          modified = true;
        }
        return fixed;
      });
      
      // Fix invalid property names
      content = content.replace(/\$color-white-space:\s*nowrap;/g, 'white-space: nowrap;');
      
      // Fix missing units in minmax
      content = content.replace(/minmax\((\d+),/g, 'minmax($1px,');
      
      // Fix media query missing units
      content = content.replace(/@media\s*\(\s*max-width:\s*(\d+)\s*\)/g, '@media (max-width: $1px)');
      content = content.replace(/@media\s*\(\s*min-width:\s*(\d+)\s*\)/g, '@media (min-width: $1px)');
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content);
        fixedCount++;
        console.log(`Fixed: ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  });
  
  console.log(`\nFixed ${fixedCount} files`);
}

fixAllSCSSIssues();