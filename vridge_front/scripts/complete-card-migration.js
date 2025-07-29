const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;

let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

function migrateFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    let code = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Skip if already using UnifiedCard
    if (code.includes('UnifiedCard')) {
      skippedCount++;
      return;
    }
    
    // Parse the file
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    let needsImport = false;
    
    // Find card-like patterns
    traverse(ast, {
      JSXElement(path) {
        const elementName = path.node.openingElement.name.name;
        const attributes = path.node.openingElement.attributes;
        
        // Check for div elements with card-like classNames
        if (elementName === 'div') {
          const classNameAttr = attributes.find(attr => 
            t.isJSXAttribute(attr) && attr.name.name === 'className'
          );
          
          if (classNameAttr && t.isStringLiteral(classNameAttr.value)) {
            const className = classNameAttr.value.value.toLowerCase();
            
            // Check if it's a card pattern
            if (className.includes('card') || 
                className.includes('panel') || 
                className.includes('box') ||
                className.includes('item-container')) {
              
              // Convert to UnifiedCard
              path.node.openingElement.name.name = 'UnifiedCard';
              if (path.node.closingElement) {
                path.node.closingElement.name.name = 'UnifiedCard';
              }
              
              // Determine variant
              let variant = 'default';
              if (className.includes('elevated') || className.includes('shadow')) {
                variant = 'elevated';
              } else if (className.includes('outline') || className.includes('border')) {
                variant = 'outlined';
              }
              
              // Replace className with variant
              classNameAttr.name.name = 'variant';
              classNameAttr.value = t.stringLiteral(variant);
              
              // Add onClick if there's a click handler
              const onClickAttr = attributes.find(attr => 
                t.isJSXAttribute(attr) && attr.name.name === 'onClick'
              );
              
              if (onClickAttr) {
                // Add clickable prop
                attributes.push(
                  t.jsxAttribute(t.jsxIdentifier('clickable'))
                );
              }
              
              needsImport = true;
              hasChanges = true;
              migratedCount++;
            }
          }
        }
        
        // Also check for Card components from libraries
        if (elementName === 'Card' || elementName === 'Panel') {
          path.node.openingElement.name.name = 'UnifiedCard';
          if (path.node.closingElement) {
            path.node.closingElement.name.name = 'UnifiedCard';
          }
          
          needsImport = true;
          hasChanges = true;
          migratedCount++;
        }
      },
      
      // Remove Card imports from other libraries
      ImportDeclaration(path) {
        const source = path.node.source.value;
        if (source === 'antd' || source === 'react-bootstrap') {
          const specifiers = path.node.specifiers;
          let modified = false;
          
          path.node.specifiers = specifiers.filter(spec => {
            if (spec.imported && (spec.imported.name === 'Card' || spec.imported.name === 'Panel')) {
              modified = true;
              return false;
            }
            return true;
          });
          
          if (modified && path.node.specifiers.length === 0) {
            path.remove();
          }
          
          if (modified) {
            needsImport = true;
            hasChanges = true;
          }
        }
      }
    });
    
    // Add UnifiedCard import if needed
    if (needsImport && hasChanges) {
      const relPath = path.relative(path.dirname(filePath), 
        path.join(process.cwd(), 'src/components/unified/UnifiedCard'));
      const importPath = relPath.startsWith('.') ? relPath : './' + relPath;
      
      const importDeclaration = t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier('UnifiedCard'))],
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
      console.log(`✓ Migrated ${migratedCount} cards in: ${filePath}`);
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
      if (content.includes('card') || 
          content.includes('Card') || 
          content.includes('panel') || 
          content.includes('Panel')) {
        migrateFile(filePath);
      }
    }
  }
}

// Main execution
console.log('Completing card migration to UnifiedCard...\n');

findFiles('src');

console.log('\n=== Migration Summary ===');
console.log(`Cards migrated: ${migratedCount}`);
console.log(`Files skipped: ${skippedCount}`);
console.log(`Errors: ${errorCount}`);
console.log('\nCard consistency improvement complete!');