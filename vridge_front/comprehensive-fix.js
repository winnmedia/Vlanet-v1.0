#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixReactImports(content) {
  // Pattern to find all React imports
  const lines = content.split('\n');
  const firstLine = lines[0];
  
  // Check if first line has React import with duplicates
  if (firstLine.includes('from \'react\'') || firstLine.includes('from "react"')) {
    // Extract all hooks/components
    const hookPattern = /\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer|forwardRef|useImperativeHandle|memo|Fragment|Suspense|lazy)\b/g;
    const allHooks = [...firstLine.matchAll(hookPattern)].map(m => m[1]);
    
    // Remove duplicates
    const uniqueHooks = [...new Set(allHooks)];
    
    // Check if React is needed
    const hasReact = firstLine.includes('React,') || firstLine.includes('React ');
    
    // Rebuild import
    if (uniqueHooks.length > 0) {
      if (hasReact) {
        lines[0] = `import React, { ${uniqueHooks.join(', ')} } from 'react'`;
      } else {
        lines[0] = `import { ${uniqueHooks.join(', ')} } from 'react'`;
      }
    } else if (hasReact) {
      lines[0] = `import React from 'react'`;
    }
  }
  
  return lines.join('\n');
}

function fixDuplicateComponent(content, componentName) {
  // Remove duplicate component imports
  const regex = new RegExp(`import.*${componentName}.*from.*['"].*${componentName}.*['"]`, 'gi');
  const lines = content.split('\n');
  const seen = new Set();
  
  return lines.filter(line => {
    if (regex.test(line)) {
      const key = componentName.toLowerCase();
      if (seen.has(key)) {
        return false; // Skip duplicate
      }
      seen.add(key);
    }
    return true;
  }).join('\n');
}

function fixMissingImports(content, filePath) {
  // Add missing imports
  const fixes = {
    'utils/debug404': '../../utils/debug404'
  };
  
  for (const [wrong, correct] of Object.entries(fixes)) {
    content = content.replace(new RegExp(`from ['"]${wrong}['"]`, 'g'), `from '${correct}'`);
  }
  
  return content;
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Fix React imports
  content = fixReactImports(content);
  
  // Fix duplicate Button imports
  content = fixDuplicateComponent(content, 'Button');
  
  // Fix missing imports
  content = fixMissingImports(content, filePath);
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Find all JSX files
const files = glob.sync('**/*.{jsx,js}', {
  cwd: __dirname,
  ignore: ['node_modules/**', '.next/**', 'build/**', 'dist/**', 'comprehensive-fix.js']
});

let fixedCount = 0;
console.log(`Found ${files.length} files to check...`);

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (processFile(fullPath)) {
    fixedCount++;
  }
});

console.log(`\n✨ Fixed ${fixedCount} files`);

// Create missing debug404.js if it doesn't exist
const debug404Path = path.join(__dirname, 'src/utils/debug404.js');
if (!fs.existsSync(debug404Path)) {
  fs.mkdirSync(path.dirname(debug404Path), { recursive: true });
  fs.writeFileSync(debug404Path, `export function debug404(message) {
  console.warn('[404 Debug]:', message);
}

export default debug404;
`, 'utf8');
  console.log('✅ Created missing debug404.js');
}