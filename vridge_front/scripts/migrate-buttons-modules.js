#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common CSS module class mappings
const MODULE_CLASS_TO_VARIANT = {
  // Primary actions
  'newProjectBtn': 'primary',
  'submitBtn': 'primary',
  'saveBtn': 'primary',
  'acceptBtn': 'primary',
  'createBtn': 'primary',
  'confirmBtn': 'primary',
  'actionButton': 'primary',
  'primaryButton': 'primary',
  'mainButton': 'primary',
  
  // Secondary actions
  'cancelBtn': 'secondary',
  'closeBtn': 'secondary',
  'backBtn': 'secondary',
  'editBtn': 'secondary',
  'viewBtn': 'secondary',
  'secondaryButton': 'secondary',
  
  // Danger actions
  'deleteBtn': 'danger',
  'removeBtn': 'danger',
  'declineBtn': 'danger',
  'dangerButton': 'danger',
  
  // Ghost/Link actions
  'linkBtn': 'ghost',
  'ghostBtn': 'ghost',
  'textButton': 'ghost',
  'tab': 'ghost',
  
  // Special
  'iconButton': 'ghost',
  'infoButton': 'secondary',
  'controlButton': 'secondary'
};

function getVariantFromModuleClass(className) {
  if (!className) return 'primary';
  
  // Extract the class name from styles.className
  const match = className.match(/styles\.(\w+)/);
  if (match) {
    const moduleClass = match[1];
    return MODULE_CLASS_TO_VARIANT[moduleClass] || 'primary';
  }
  
  return 'primary';
}

function migrateModuleButton(match, tagStart, classNamePart, afterClass, content) {
  // Extract className
  let variant = 'primary';
  let additionalClasses = '';
  
  if (classNamePart.includes('styles.')) {
    variant = getVariantFromModuleClass(classNamePart);
    
    // Handle conditional classes
    if (classNamePart.includes('?')) {
      // For now, preserve the className for conditional styling
      additionalClasses = ` className={${classNamePart}}`;
    }
  }
  
  // Extract other attributes
  const allAttrs = afterClass;
  const attrs = [];
  
  // Extract onClick
  const onClickMatch = allAttrs.match(/onClick=\{([^}]+)\}/);
  if (onClickMatch) {
    attrs.push(`onClick={${onClickMatch[1]}}`);
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
  
  // Extract key
  const keyMatch = allAttrs.match(/key=\{([^}]+)\}/);
  if (keyMatch) {
    attrs.push(`key={${keyMatch[1]}}`);
  }
  
  // Build props
  const props = [];
  if (variant !== 'primary') {
    props.push(`variant="${variant}"`);
  }
  
  // Check if it's an icon-only button
  const hasIcon = content.includes('<svg') || content.includes('<Icon') || content.includes('<img');
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const hasText = textContent.length > 0;
  
  if (hasIcon && !hasText) {
    // Icon-only button
    const iconContent = content.trim();
    return `<Button ${[...props, ...attrs].join(' ')}${additionalClasses} icon={${iconContent}} />`;
  } else {
    // Regular button
    return `<Button ${[...props, ...attrs].join(' ')}${additionalClasses}>${content}</Button>`;
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let changeCount = 0;
  
  // Check if it already has unified Button import
  if (newContent.includes("from '../components/unified/Button'") || 
      newContent.includes("from '../../components/unified/Button'") ||
      newContent.includes("from '../../../components/unified/Button'")) {
    return { content: newContent, changeCount: 0 };
  }
  
  // Pattern to match buttons with CSS modules className
  const moduleButtonPattern = /<button\s+([^>]*?)className=\{([^}]+)\}([^>]*?)>(.*?)<\/button>/gs;
  
  newContent = newContent.replace(moduleButtonPattern, (match, beforeClass, className, afterClass, content) => {
    changeCount++;
    return migrateModuleButton(match, beforeClass, className, afterClass, content);
  });
  
  // Pattern to match simple buttons without className
  const simpleButtonPattern = /<button\s+([^>]*?)>(.*?)<\/button>/gs;
  
  newContent = newContent.replace(simpleButtonPattern, (match, attrs, content) => {
    if (!match.includes('className=')) {
      changeCount++;
      return `<Button ${attrs}>${content}</Button>`;
    }
    return match;
  });
  
  // Add Button import if we made changes
  if (changeCount > 0) {
    // Calculate relative path to Button component
    const fileDir = path.dirname(filePath);
    const buttonPath = path.join(process.cwd(), 'src/components/unified/Button');
    const relativePath = path.relative(fileDir, buttonPath).replace(/\\/g, '/');
    
    // Find the last import
    const importMatches = newContent.match(/^import[^;]+;?$/gm);
    if (importMatches) {
      const lastImport = importMatches[importMatches.length - 1];
      const insertPos = newContent.indexOf(lastImport) + lastImport.length;
      newContent = newContent.slice(0, insertPos) + 
        `\nimport { Button } from '${relativePath}';` +
        newContent.slice(insertPos);
    }
  }
  
  return { content: newContent, changeCount };
}

function migrateModuleButtons(options = {}) {
  const {
    pattern = 'src/**/*.{jsx,tsx}',
    dryRun = true,
    verbose = false
  } = options;
  
  console.log('🔄 Starting CSS Module button migration...\n');
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
  
  // Filter to only files that use CSS modules
  const moduleFiles = files.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('styles.') && content.includes('<button');
  });
  
  console.log(`Found ${moduleFiles.length} files with CSS modules and buttons\n`);
  
  const results = [];
  let totalChanges = 0;
  
  moduleFiles.forEach((filePath, index) => {
    const { content, changeCount } = processFile(filePath);
    
    if (changeCount > 0) {
      totalChanges += changeCount;
      results.push({ filePath, changeCount });
      
      console.log(`✓ ${filePath} - ${changeCount} buttons migrated`);
      
      if (!dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
      } else {
        // In dry run, save example files
        if (results.length <= 3) {
          const examplePath = filePath.replace(/\.(jsx|tsx)$/, '.modules-migrated.$1');
          fs.writeFileSync(examplePath, content, 'utf8');
          console.log(`  → Example saved to: ${examplePath}`);
        }
      }
    }
  });
  
  console.log('\n📊 Migration Summary:');
  console.log(`- Files processed: ${moduleFiles.length}`);
  console.log(`- Files with changes: ${results.length}`);
  console.log(`- Total buttons migrated: ${totalChanges}`);
  
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
    verbose: args.includes('--verbose')
  };
  
  migrateModuleButtons(options);
}

module.exports = { migrateModuleButtons };