#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Fixing more build errors...\n');

// 1. Add missing imports to ErrorBoundary.module.scss
const errorBoundaryScssFile = path.join(__dirname, '../src/components/ErrorBoundary.module.scss');
if (fs.existsSync(errorBoundaryScssFile)) {
  console.log('Fixing ErrorBoundary.module.scss...');
  let content = fs.readFileSync(errorBoundaryScssFile, 'utf8');
  
  // Add import at the beginning if not exists
  if (!content.includes('@import') && !content.includes('@use')) {
    content = "@import '../styles/design-tokens';\n\n" + content;
  }
  
  fs.writeFileSync(errorBoundaryScssFile, content);
  console.log('✓ Added design tokens import');
}

// 2. Fix unified Button.module.scss
const unifiedButtonScssFile = path.join(__dirname, '../src/components/unified/Button/Button.module.scss');
if (fs.existsSync(unifiedButtonScssFile)) {
  console.log('\nFixing unified Button.module.scss...');
  let content = fs.readFileSync(unifiedButtonScssFile, 'utf8');
  
  // Replace undefined variable
  content = content.replace(/\$shadow(?!\w)/g, '$shadow-md');
  
  // Add import if missing
  if (!content.includes('@import') && !content.includes('@use')) {
    content = "@import '../../../styles/design-tokens';\n\n" + content;
  }
  
  fs.writeFileSync(unifiedButtonScssFile, content);
  console.log('✓ Fixed shadow variable and added import');
}

// 3. Fix _colors.scss import path
const colorsFile = path.join(__dirname, '../src/design-system/tokens/_colors.scss');
if (fs.existsSync(colorsFile)) {
  console.log('\nFixing _colors.scss import...');
  let content = fs.readFileSync(colorsFile, 'utf8');
  
  // Remove the import - it's not needed in a partial
  content = content.replace(/@import ['"]\.\.\/styles\/design-tokens['"];?\n?/g, '');
  
  fs.writeFileSync(colorsFile, content);
  console.log('✓ Removed circular import');
}

// 4. Fix FeedbackButtonStyles $brand-blue variable
const feedbackStylesFile = path.join(__dirname, '../src/page/Cms/FeedbackButtonStyles.module.base.part2.scss');
if (fs.existsSync(feedbackStylesFile)) {
  console.log('\nFixing FeedbackButtonStyles variables...');
  let content = fs.readFileSync(feedbackStylesFile, 'utf8');
  
  // Replace undefined variables
  content = content.replace(/\$brand-blue/g, '$color-primary');
  
  fs.writeFileSync(feedbackStylesFile, content);
  console.log('✓ Fixed brand-blue variable');
}

// 5. Fix LoadingAnimation.jsx syntax
const loadingAnimFile = path.join(__dirname, '../src/components/LoadingAnimation.jsx');
if (fs.existsSync(loadingAnimFile)) {
  console.log('\nFixing LoadingAnimation.jsx...');
  let content = fs.readFileSync(loadingAnimFile, 'utf8');
  
  // Count div tags
  const openDivs = (content.match(/<div/g) || []).length;
  const closeDivs = (content.match(/<\/div>/g) || []).length;
  
  if (openDivs !== closeDivs) {
    console.log(`Found ${openDivs} opening divs and ${closeDivs} closing divs`);
    
    // Remove extra closing div
    if (closeDivs > openDivs) {
      // Find the last </div> and remove one
      const lines = content.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('</div>')) {
          // Check if this line has multiple </div>
          if (lines[i].match(/<\/div>/g).length > 1) {
            lines[i] = lines[i].replace(/<\/div>/, '');
            break;
          }
        }
      }
      content = lines.join('\n');
    }
  }
  
  fs.writeFileSync(loadingAnimFile, content);
  console.log('✓ Fixed JSX structure');
}

console.log('\n✅ Additional build error fixes complete!');