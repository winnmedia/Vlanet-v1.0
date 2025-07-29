const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fix incorrect import paths in SCSS files
function fixImportPaths() {
  const files = glob.sync('src/css/**/*.scss');
  let fixedCount = 0;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Fix design-tokens import path
    if (content.includes("@import '../styles/design-tokens'")) {
      content = content.replace(/@import ['"]\.\.\/styles\/design-tokens['"]/g, "@import '../../styles/design-tokens'");
      modified = true;
    }
    
    // Fix other common import issues
    if (content.includes("@import '../styles/")) {
      content = content.replace(/@import ['"]\.\.\/styles\//g, "@import '../../styles/");
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      fixedCount++;
      console.log(`Fixed: ${file}`);
    }
  });
  
  console.log(`\nFixed ${fixedCount} files`);
}

fixImportPaths();