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
  
  // Also check for bracket notation
  const bracketMatch = className.match(/styles\['([^']+)'\]/);
  if (bracketMatch) {
    const moduleClass = bracketMatch[1];
    return MODULE_CLASS_TO_VARIANT[moduleClass] || 'primary';
  }
  
  return 'primary';
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
  
  // More comprehensive button pattern that handles multi-line buttons
  const buttonRegex = /<button(\s+[^>]*?)>([\s\S]*?)<\/button>/gi;
  
  newContent = newContent.replace(buttonRegex, (match, attributes, content) => {
    changeCount++;
    
    // Extract className if it exists
    let variant = 'primary';
    let remainingAttrs = attributes;
    
    const classMatch = attributes.match(/className=\{([^}]+)\}/);
    if (classMatch) {
      variant = getVariantFromModuleClass(classMatch[1]);
      // Remove className from attributes
      remainingAttrs = attributes.replace(/className=\{[^}]+\}/, '');
    }
    
    // Check if it's an icon-only button
    const hasIcon = content.includes('<svg') || content.includes('<Icon') || content.includes('<img');
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const hasText = textContent.length > 0 && textContent !== ' ';
    
    // Build the Button component
    let buttonProps = remainingAttrs.trim();
    if (variant !== 'primary') {
      buttonProps = `variant="${variant}" ${buttonProps}`;
    }
    
    if (hasIcon && !hasText) {
      // Icon-only button - need to be careful with the icon prop
      return `<Button ${buttonProps} icon={${content.trim()}} />`;
    } else {
      // Regular button
      return `<Button ${buttonProps}>${content}</Button>`;
    }
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
    } else {
      // No imports found, add at the beginning
      newContent = `import { Button } from '${relativePath}';\n\n` + newContent;
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
  
  console.log('🔄 Starting CSS Module button migration (fixed)...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`Pattern: ${pattern}\n`);
  
  const files = glob.sync(pattern, {
    ignore: [
      'node_modules/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/unified/Button/**',
      'scripts/**',
      '**/*.migrated.*',
      '**/*.modules-migrated.*'
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
        // In dry run, save first 3 examples
        if (results.length <= 3) {
          const examplePath = filePath.replace(/\.(jsx|tsx)$/, '.fixed-migrated.$1');
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