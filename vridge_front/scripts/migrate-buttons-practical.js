#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common button class to variant/size mappings based on analysis
const CLASS_TO_VARIANT = {
  // Primary actions
  'save-btn': 'primary',
  'submit-btn': 'primary',
  'generate-btn': 'primary',
  'export-btn': 'primary',
  'upload-btn': 'primary',
  'create-btn': 'primary',
  'confirm-btn': 'primary',
  'accept-btn': 'primary',
  'complete-project-btn': 'primary',
  'generate-all-btn': 'primary',
  'generate-storyboard-btn': 'primary',
  'save-edit-btn': 'primary',
  'save-story-btn': 'primary',
  'upload-confirm-btn': 'primary',
  
  // Secondary actions
  'cancel-btn': 'secondary',
  'edit-btn': 'secondary',
  'back-btn': 'secondary',
  'close-btn': 'secondary',
  'cancel-custom-btn': 'secondary',
  'cancel-edit-btn': 'secondary',
  'cancel-story-btn': 'secondary',
  'cancel-upload-btn': 'secondary',
  'pdf-download-btn': 'secondary',
  'download-btn': 'secondary',
  'download-storyboard-btn': 'secondary',
  'prev-step-btn': 'secondary',
  'new-btn': 'secondary',
  'new-planning-btn': 'secondary',
  'replace-video-btn': 'secondary',
  'view-project-btn': 'secondary',
  'view-btn': 'secondary',
  
  // Danger actions
  'delete-btn': 'danger',
  'remove-btn': 'danger',
  'delete-planning-btn': 'danger',
  'delete-video-btn': 'danger',
  'remove-image-btn': 'danger',
  'decline-btn': 'danger',
  'block-btn': 'danger',
  
  // Ghost actions
  'btn-ghost': 'ghost',
  'btn-outline': 'ghost',
  'back-button': 'ghost',
  'close-button': 'ghost',
  'upload-guide-btn': 'ghost',
  
  // Link style
  'btn-link': 'link',
  'link-btn': 'link',
  
  // Special
  'btn-primary': 'primary',
  'btn-secondary': 'secondary',
  'btn-danger': 'danger',
  'btn-success': 'success',
  'btn-warning': 'warning',
  'cert': 'primary',
  'feedbackButtonIconOnly': 'ghost',
  'add-friend-btn': 'primary',
  'message-btn': 'secondary',
  'invite-btn': 'secondary',
  'edit-story-btn': 'secondary',
  'edit-storyboard-btn': 'secondary',
  'regenerate-storyboard-btn': 'secondary',
  'insert-shot-btn': 'secondary'
};

const CLASS_TO_SIZE = {
  'btn-sm': 'sm',
  'btn-small': 'sm',
  'btn-lg': 'lg',
  'btn-large': 'lg',
  'small': 'sm',
  'large': 'lg'
};

function getVariantFromClass(className) {
  if (!className) return null;
  
  // Check each class in the className string
  const classes = className.split(/\s+/);
  for (const cls of classes) {
    if (CLASS_TO_VARIANT[cls]) {
      return CLASS_TO_VARIANT[cls];
    }
  }
  
  // Check if any mapping key is contained in the className
  for (const [key, variant] of Object.entries(CLASS_TO_VARIANT)) {
    if (className.includes(key)) {
      return variant;
    }
  }
  
  return null;
}

function getSizeFromClass(className) {
  if (!className) return null;
  
  const classes = className.split(/\s+/);
  for (const cls of classes) {
    if (CLASS_TO_SIZE[cls]) {
      return CLASS_TO_SIZE[cls];
    }
  }
  
  for (const [key, size] of Object.entries(CLASS_TO_SIZE)) {
    if (className.includes(key)) {
      return size;
    }
  }
  
  return null;
}

function migrateButton(match, beforeClass, className, afterClass, content) {
  const variant = getVariantFromClass(className) || 'primary';
  const size = getSizeFromClass(className);
  
  // Extract other attributes
  const allAttrs = (beforeClass + ' ' + afterClass).trim();
  const attrs = [];
  
  // Extract onClick
  const onClickMatch = allAttrs.match(/onClick=(\{[^}]+\})/);
  if (onClickMatch) {
    attrs.push(`onClick=${onClickMatch[1]}`);
  }
  
  // Extract disabled
  if (allAttrs.includes('disabled')) {
    attrs.push('disabled');
  }
  
  // Extract type
  const typeMatch = allAttrs.match(/type=["']([^"']+)["']/);
  if (typeMatch && typeMatch[1] !== 'button') {
    attrs.push(`type="${typeMatch[1]}"`);
  }
  
  // Extract title
  const titleMatch = allAttrs.match(/title=["']([^"']+)["']/);
  if (titleMatch) {
    attrs.push(`title="${titleMatch[1]}"`);
  }
  
  // Extract style
  const styleMatch = allAttrs.match(/style=\{([^}]+)\}/);
  if (styleMatch) {
    attrs.push(`style={${styleMatch[1]}}`);
  }
  
  // Build props
  const props = [];
  if (variant !== 'primary') {
    props.push(`variant="${variant}"`);
  }
  if (size) {
    props.push(`size="${size}"`);
  }
  if (className && className.includes('full-width')) {
    props.push('fullWidth');
  }
  
  // Check if it's an icon-only button
  const hasIcon = content.includes('<svg') || content.includes('<img') || content.includes('Icon');
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const hasText = textContent.length > 0;
  
  if (hasIcon && !hasText) {
    // Icon-only button
    return `<Button ${[...props, ...attrs].join(' ')} icon={${content.trim()}} />`;
  } else {
    // Regular button
    return `<Button ${[...props, ...attrs].join(' ')}>${content}</Button>`;
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let changeCount = 0;
  
  // Pattern to match buttons with className
  const buttonPattern = /<button\s+([^>]*?)className=["']([^"']+)["']([^>]*?)>(.*?)<\/button>/gs;
  
  newContent = newContent.replace(buttonPattern, (match, beforeClass, className, afterClass, content) => {
    changeCount++;
    return migrateButton(match, beforeClass, className, afterClass, content);
  });
  
  // Pattern to match buttons without className but with common attributes
  const simpleButtonPattern = /<button\s+([^>]*?)(onClick=\{[^}]+\}|disabled|type=["'][^"']+["'])([^>]*?)>(.*?)<\/button>/gs;
  
  newContent = newContent.replace(simpleButtonPattern, (match, beforeAttrs, mainAttr, afterAttrs, content) => {
    // Only migrate if it doesn't already have a className
    if (!match.includes('className=')) {
      changeCount++;
      return `<Button ${beforeAttrs}${mainAttr}${afterAttrs}>${content}</Button>`;
    }
    return match;
  });
  
  // Add Button import if we made changes and it's not already imported
  if (changeCount > 0 && !newContent.includes("from '../components/unified/Button'") && !newContent.includes("from '../../components/unified/Button'")) {
    // Calculate relative path to Button component
    const fileDir = path.dirname(filePath);
    const buttonPath = 'src/components/unified/Button';
    const relativePath = path.relative(fileDir, buttonPath).replace(/\\/g, '/');
    
    // Find the last import
    const importMatches = newContent.match(/^import[^;]+;?$/gm);
    if (importMatches) {
      const lastImport = importMatches[importMatches.length - 1];
      const insertPos = newContent.indexOf(lastImport) + lastImport.length;
      newContent = newContent.slice(0, insertPos) + 
        `\nimport { Button } from '${relativePath}'` +
        newContent.slice(insertPos);
    }
  }
  
  return { content: newContent, changeCount };
}

function migrateButtons(options = {}) {
  const {
    pattern = 'src/**/*.{jsx,tsx}',
    dryRun = true,
    verbose = false
  } = options;
  
  console.log('🔄 Starting button migration...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`Pattern: ${pattern}\n`);
  
  const files = glob.sync(pattern, {
    ignore: [
      'node_modules/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/unified/Button/**',
      'scripts/**',
      '**/*.migrated.*'
    ]
  });
  
  console.log(`Found ${files.length} files to process\n`);
  
  const results = [];
  let totalChanges = 0;
  
  files.forEach((filePath, index) => {
    const { content, changeCount } = processFile(filePath);
    
    if (changeCount > 0) {
      totalChanges += changeCount;
      results.push({ filePath, changeCount });
      
      if (verbose || changeCount > 5) {
        console.log(`✓ ${filePath} - ${changeCount} buttons migrated`);
      }
      
      if (!dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
      } else {
        // In dry run, save example files
        if (results.length <= 3) {
          const examplePath = filePath.replace(/\.(jsx|tsx)$/, '.migrated.$1');
          fs.writeFileSync(examplePath, content, 'utf8');
          console.log(`  → Example saved to: ${examplePath}`);
        }
      }
    }
    
    if ((index + 1) % 10 === 0) {
      process.stdout.write(`\rProcessed ${index + 1}/${files.length} files...`);
    }
  });
  
  console.log('\n\n📊 Migration Summary:');
  console.log(`- Files processed: ${files.length}`);
  console.log(`- Files with changes: ${results.length}`);
  console.log(`- Total buttons migrated: ${totalChanges}`);
  
  if (results.length > 0) {
    console.log('\n📝 Top files with most changes:');
    results
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, 10)
      .forEach(({ filePath, changeCount }) => {
        console.log(`  - ${filePath}: ${changeCount} buttons`);
      });
  }
  
  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No files were modified.');
    console.log('Run with --execute flag to apply changes.');
  }
  
  return results;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--execute'),
    verbose: args.includes('--verbose'),
    pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1]
  };
  
  migrateButtons(options);
}

module.exports = { migrateButtons };