const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;

let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

// Pattern to find button elements
const buttonPatterns = [
  'button',
  'Button',
  'btn',
  'Btn'
];

function migrateFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    let code = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Skip if already using UnifiedButton
    if (code.includes('UnifiedButton') || code.includes('unified/Button')) {
      skippedCount++;
      return;
    }
    
    // Parse the file
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    let needsImport = false;
    
    // Transform button elements
    traverse(ast, {
      JSXElement(path) {
        const elementName = path.node.openingElement.name.name;
        
        // Check if it's a button element
        if (elementName === 'button') {
          // Change to UnifiedButton
          path.node.openingElement.name.name = 'UnifiedButton';
          if (path.node.closingElement) {
            path.node.closingElement.name.name = 'UnifiedButton';
          }
          
          // Transform className to variant
          const attributes = path.node.openingElement.attributes;
          attributes.forEach(attr => {
            if (t.isJSXAttribute(attr) && attr.name.name === 'className') {
              const classValue = attr.value;
              if (t.isStringLiteral(classValue)) {
                const className = classValue.value.toLowerCase();
                
                // Determine variant based on className
                let variant = 'primary';
                if (className.includes('secondary') || className.includes('outline')) {
                  variant = 'secondary';
                } else if (className.includes('danger') || className.includes('delete')) {
                  variant = 'danger';
                } else if (className.includes('success')) {
                  variant = 'success';
                } else if (className.includes('ghost') || className.includes('text')) {
                  variant = 'ghost';
                }
                
                // Replace className with variant
                attr.name.name = 'variant';
                attr.value = t.stringLiteral(variant);
              }
            }
          });
          
          needsImport = true;
          hasChanges = true;
          migratedCount++;
        }
      },
      
      // Also handle Button components from other libraries
      ImportDeclaration(path) {
        const source = path.node.source.value;
        if (source === 'antd' || source === 'react-bootstrap' || source.includes('button')) {
          const specifiers = path.node.specifiers;
          specifiers.forEach((spec, index) => {
            if (spec.imported && spec.imported.name === 'Button') {
              // Remove Button import
              specifiers.splice(index, 1);
              needsImport = true;
              hasChanges = true;
            }
          });
          
          if (specifiers.length === 0) {
            path.remove();
          }
        }
      }
    });
    
    // Add UnifiedButton import if needed
    if (needsImport && hasChanges) {
      const relPath = path.relative(path.dirname(filePath), 
        path.join(process.cwd(), 'src/components/unified/Button'));
      const importPath = relPath.startsWith('.') ? relPath : './' + relPath;
      
      const importDeclaration = t.importDeclaration(
        [t.importSpecifier(t.identifier('UnifiedButton'), t.identifier('UnifiedButton'))],
        t.stringLiteral(importPath.replace(/\\/g, '/').replace('.jsx', ''))
      );
      
      // Find where to insert the import
      let importIndex = 0;
      for (let i = 0; i < ast.program.body.length; i++) {
        if (!t.isImportDeclaration(ast.program.body[i])) {
          importIndex = i;
          break;
        }
      }
      
      ast.program.body.splice(importIndex, 0, importDeclaration);
    }
    
    if (hasChanges) {
      // Generate code
      const output = generate(ast, {}, code);
      fs.writeFileSync(filePath, output.code);
      console.log(`✓ Migrated buttons in: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    errorCount++;
  }
}

function findJSXFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && 
          !file.includes('__tests__') && 
          !file.includes('unified') &&
          !file.includes('backup')) {
        findJSXFiles(filePath);
      }
    } else if ((file.endsWith('.jsx') || file.endsWith('.js')) && 
               !file.includes('.test.') && 
               !file.includes('backup')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('<button') || content.includes('Button')) {
        migrateFile(filePath);
      }
    }
  }
}

// Main execution
console.log('Completing button migration to UnifiedButton...\n');

findJSXFiles('src');

console.log('\n=== Migration Summary ===');
console.log(`Buttons migrated: ${migratedCount}`);
console.log(`Files skipped: ${skippedCount}`);
console.log(`Errors: ${errorCount}`);
console.log('\nButton consistency improvement complete!');