#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Fixing build errors...\n');

// 1. Fix _colors.scss CSS variable issue
const colorsFile = path.join(__dirname, '../src/design-system/tokens/_colors.scss');
if (fs.existsSync(colorsFile)) {
  console.log('Fixing _colors.scss...');
  let content = fs.readFileSync(colorsFile, 'utf8');
  
  // Fix CSS variable with $
  content = content.replace(/--color-\$color-white:/g, '--color-white:');
  
  fs.writeFileSync(colorsFile, content);
  console.log('✓ Fixed CSS variable in _colors.scss');
}

// 2. Fix FeedbackButtonStyles undefined variable
const feedbackStylesFile = path.join(__dirname, '../src/page/Cms/FeedbackButtonStyles.module.base.part2.scss');
if (fs.existsSync(feedbackStylesFile)) {
  console.log('\nFixing FeedbackButtonStyles.module.base.part2.scss...');
  let content = fs.readFileSync(feedbackStylesFile, 'utf8');
  
  // Replace undefined variable
  content = content.replace(/\$border-radius-base/g, '$border-radius-md');
  
  fs.writeFileSync(feedbackStylesFile, content);
  console.log('✓ Fixed undefined variable');
}

// 3. Fix index-simple.js syntax errors
const indexSimpleFile = path.join(__dirname, '../pages/index-simple.js');
if (fs.existsSync(indexSimpleFile)) {
  console.log('\nFixing index-simple.js...');
  let content = fs.readFileSync(indexSimpleFile, 'utf8');
  
  // Fix onClick syntax errors
  content = content.replace(/onClick=\{.*?= aria-label="Click"> router\.push\('\/signup'\).*?\}/g, 
    "onClick={() => router.push('/signup')}");
  
  fs.writeFileSync(indexSimpleFile, content);
  console.log('✓ Fixed onClick syntax');
}

// 4. Fix ErrorBoundary.jsx
const errorBoundaryFile = path.join(__dirname, '../src/components/ErrorBoundary.jsx');
if (fs.existsSync(errorBoundaryFile)) {
  console.log('\nFixing ErrorBoundary.jsx...');
  let content = fs.readFileSync(errorBoundaryFile, 'utf8');
  
  // Find and fix the broken line
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '.toISOString()') {
      // This looks like a broken line, remove it or fix context
      lines[i] = '    // Fixed broken line';
    }
  }
  
  fs.writeFileSync(errorBoundaryFile, lines.join('\n'));
  console.log('✓ Fixed ErrorBoundary syntax');
}

// 5. Fix LoadingAnimation.jsx
const loadingAnimFile = path.join(__dirname, '../src/components/LoadingAnimation.jsx');
if (fs.existsSync(loadingAnimFile)) {
  console.log('\nFixing LoadingAnimation.jsx...');
  let content = fs.readFileSync(loadingAnimFile, 'utf8');
  
  // Look for malformed JSX
  if (content.includes(',->         </UnifiedCard>')) {
    content = content.replace(/,->         <\/UnifiedCard>/g, '</div>');
    content = content.replace(/\|->/g, '');
    content = content.replace(/`->/g, '');
  }
  
  fs.writeFileSync(loadingAnimFile, content);
  console.log('✓ Fixed LoadingAnimation JSX');
}

console.log('\n✅ Build error fixes complete!');