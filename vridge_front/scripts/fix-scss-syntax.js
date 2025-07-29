const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fix SCSS syntax errors
function fixSCSSSyntax() {
  const files = glob.sync('src/**/*.scss');
  let fixedCount = 0;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Fix patterns like 0.$variable or -0.$variable
    content = content.replace(/(-?)0\.\$[a-zA-Z0-9_-]+/g, (match, minus) => {
      modified = true;
      return minus ? '-0.5px' : '0.5px';
    });
    
    // Fix patterns like calc(number + px)
    content = content.replace(/(\d+)\s*\+\s*px/g, '$1px');
    
    // Fix patterns like $color-primary-rgb without definition
    content = content.replace(/\$color-primary-rgb/g, '22, 49, 248');
    
    // Fix patterns like $line-height-base without definition
    content = content.replace(/\$line-height-base(?!:)/g, '1.5');
    
    // Fix patterns like $letter-spacing-base without definition
    content = content.replace(/\$letter-spacing-base(?!:)/g, 'normal');
    
    if (modified) {
      fs.writeFileSync(file, content);
      fixedCount++;
    }
  });
  
  console.log(`Fixed ${fixedCount} files`);
}

fixSCSSSyntax();