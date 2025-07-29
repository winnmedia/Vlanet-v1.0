const fs = require('fs');
const path = require('path');

let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

// Input patterns to replace
const inputPatterns = [
  // Native input elements
  /<input\s+([^>]*?)\/>/g,
  /<input\s+([^>]*?)>\s*<\/input>/g,
  // Input components
  /<Input\s+([^>]*?)\/>/g,
  /<Input\s+([^>]*?)>\s*<\/Input>/g,
  // TextInput components
  /<TextInput\s+([^>]*?)\/>/g,
  /<TextInput\s+([^>]*?)>\s*<\/TextInput>/g,
];

function extractAttributes(attrString) {
  const attrs = {};
  const regex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|{([^}]*)}|(\S+)))?/g;
  let match;
  
  while ((match = regex.exec(attrString)) !== null) {
    const key = match[1];
    const value = match[2] || match[3] || match[4] || match[5] || true;
    attrs[key] = value;
  }
  
  return attrs;
}

function convertToUnifiedInput(attrs) {
  const newAttrs = {};
  
  // Direct mappings
  if (attrs.placeholder) newAttrs.placeholder = attrs.placeholder;
  if (attrs.value) newAttrs.value = attrs.value;
  if (attrs.onChange) newAttrs.onChange = attrs.onChange;
  if (attrs.disabled) newAttrs.disabled = attrs.disabled;
  if (attrs.required) newAttrs.required = attrs.required;
  if (attrs.name) newAttrs.name = attrs.name;
  if (attrs.id) newAttrs.id = attrs.id;
  
  // Type conversion
  if (attrs.type) {
    if (attrs.type === 'password' || attrs.type === 'email' || attrs.type === 'number') {
      newAttrs.type = attrs.type;
    }
  }
  
  // Size mapping
  if (attrs.size || attrs.className) {
    const classStr = attrs.className || '';
    if (classStr.includes('large') || attrs.size === 'large') {
      newAttrs.size = 'large';
    } else if (classStr.includes('small') || attrs.size === 'small') {
      newAttrs.size = 'small';
    }
  }
  
  // Error state
  if (attrs.error || attrs.isError || (attrs.className && attrs.className.includes('error'))) {
    newAttrs.error = true;
  }
  
  return newAttrs;
}

function migrateFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileHasChanges = false;
    
    // Skip if already using UnifiedInput
    if (content.includes('UnifiedInput')) {
      skippedCount++;
      return;
    }
    
    // Replace all input patterns
    inputPatterns.forEach(pattern => {
      content = content.replace(pattern, (match, attrs) => {
        const attributes = extractAttributes(attrs);
        const unifiedAttrs = convertToUnifiedInput(attributes);
        
        // Build new UnifiedInput tag
        let newTag = '<UnifiedInput';
        Object.entries(unifiedAttrs).forEach(([key, value]) => {
          if (value === true) {
            newTag += ` ${key}`;
          } else if (typeof value === 'string' && !value.includes('{')) {
            newTag += ` ${key}="${value}"`;
          } else {
            newTag += ` ${key}={${value}}`;
          }
        });
        newTag += ' />';
        
        fileHasChanges = true;
        migratedCount++;
        return newTag;
      });
    });
    
    // Add import if changes were made
    if (fileHasChanges) {
      // Check if import already exists
      if (!content.includes('UnifiedInput')) {
        // Find the right place to add import
        const importMatch = content.match(/import.*from\s+['"][^'"]+['"]/);
        if (importMatch) {
          const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
          const relPath = path.relative(path.dirname(filePath), 
            path.join(process.cwd(), 'src/components/unified/UnifiedInput'));
          const importPath = relPath.startsWith('.') ? relPath : './' + relPath;
          const importStatement = `\nimport { UnifiedInput } from '${importPath.replace(/\\/g, '/').replace('.jsx', '')}'`;
          
          content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
        }
      }
      
      // Remove old Input imports
      content = content.replace(/import\s+{\s*Input\s*}\s+from\s+['"]antd['"]\s*;?\s*\n?/g, '');
      content = content.replace(/import\s+Input\s+from\s+['"][^'"]+['"]\s*;?\s*\n?/g, '');
      
      fs.writeFileSync(filePath, content);
      console.log(`✓ Migrated ${migratedCount} inputs in: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    errorCount++;
  }
}

function findFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && 
          !file.includes('__tests__') && 
          !file.includes('unified') &&
          !file.includes('backup')) {
        findFiles(filePath);
      }
    } else if ((file.endsWith('.jsx') || file.endsWith('.js')) && 
               !file.includes('.test.') && 
               !file.includes('backup')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('<input') || content.includes('<Input') || content.includes('Input>')) {
        migrateFile(filePath);
      }
    }
  }
}

// Main execution
console.log('Completing input migration to UnifiedInput...\n');

findFiles('src');

console.log('\n=== Migration Summary ===');
console.log(`Inputs migrated: ${migratedCount}`);
console.log(`Files skipped: ${skippedCount}`);
console.log(`Errors: ${errorCount}`);
console.log('\nInput consistency improvement complete!');