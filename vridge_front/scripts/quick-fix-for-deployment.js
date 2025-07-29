#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Applying quick fixes for deployment...\n');

// 1. Fix ErrorBoundary.module.scss - add missing variable
const errorBoundaryScss = path.join(__dirname, '../src/components/ErrorBoundary.module.scss');
if (fs.existsSync(errorBoundaryScss)) {
  console.log('Fixing ErrorBoundary.module.scss...');
  let content = fs.readFileSync(errorBoundaryScss, 'utf8');
  
  // Add missing variable definitions at the top
  if (!content.includes('$color-text-primary')) {
    content = content.replace(
      "@import '../styles/design-tokens';\n\n",
      "@import '../styles/design-tokens';\n\n// Quick fix - define missing variables\n$color-text-primary: #1a1f36;\n\n"
    );
  }
  
  fs.writeFileSync(errorBoundaryScss, content);
  console.log('✓ Fixed ErrorBoundary.module.scss');
}

// 2. Fix unified Button - add mobile mixin
const unifiedButtonScss = path.join(__dirname, '../src/components/unified/Button/Button.module.scss');
if (fs.existsSync(unifiedButtonScss)) {
  console.log('\nFixing unified Button.module.scss...');
  let content = fs.readFileSync(unifiedButtonScss, 'utf8');
  
  // Add mobile mixin import
  if (!content.includes('mobile-mixins')) {
    content = content.replace(
      "@import '../../../styles/design-tokens';\n\n",
      "@import '../../../styles/design-tokens';\n@import '../../../styles/mobile-mixins';\n\n"
    );
  }
  
  fs.writeFileSync(unifiedButtonScss, content);
  console.log('✓ Fixed unified Button.module.scss');
}

// 3. Fix _colors.scss - add missing variables
const colorsScss = path.join(__dirname, '../src/design-system/tokens/_colors.scss');
if (fs.existsSync(colorsScss)) {
  console.log('\nFixing _colors.scss...');
  let content = fs.readFileSync(colorsScss, 'utf8');
  
  // Add missing color definitions
  const missingColors = [
    '$color-info-dark: #0d45ac;',
    '$color-warning-dark: #dc3545;'
  ];
  
  for (const color of missingColors) {
    if (!content.includes(color.split(':')[0])) {
      content = color + '\n' + content;
    }
  }
  
  fs.writeFileSync(colorsScss, content);
  console.log('✓ Fixed _colors.scss');
}

// 4. Fix LoadingAnimation UnifiedCard import
const loadingAnimation = path.join(__dirname, '../src/components/LoadingAnimation.jsx');
if (fs.existsSync(loadingAnimation)) {
  console.log('\nFixing LoadingAnimation.jsx...');
  let content = fs.readFileSync(loadingAnimation, 'utf8');
  
  // Replace UnifiedCard with div
  content = content.replace('<UnifiedCard variant="default" className="loading-box">', '<div className="loading-box">');
  content = content.replace('</UnifiedCard>', '</div>');
  
  // Remove import if exists
  content = content.replace(/import.*UnifiedCard.*\n/g, '');
  
  fs.writeFileSync(loadingAnimation, content);
  console.log('✓ Fixed LoadingAnimation.jsx');
}

// 5. Fix FeedbackButtonStyles - add missing variable
const feedbackStyles = path.join(__dirname, '../src/page/Cms/FeedbackButtonStyles.module.base.part2.scss');
if (fs.existsSync(feedbackStyles)) {
  console.log('\nFixing FeedbackButtonStyles...');
  let content = fs.readFileSync(feedbackStyles, 'utf8');
  
  // Replace undefined variable
  content = content.replace(/\$color-warning-dark/g, '$color-danger');
  
  fs.writeFileSync(feedbackStyles, content);
  console.log('✓ Fixed FeedbackButtonStyles');
}

console.log('\n✅ Quick fixes applied!');