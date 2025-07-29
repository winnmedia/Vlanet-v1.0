const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;

let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

const filesToProcess = [];

function collectFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('__tests__') && !file.includes('unified')) {
        collectFiles(filePath);
      }
    } else if ((file.endsWith('.jsx') || file.endsWith('.js')) && !file.includes('.test.') && !file.includes('backup')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('Modal') && 
          !content.includes('UnifiedModal') && 
          (content.includes('antd') || content.includes('react-modal') || content.includes('isOpen'))) {
        filesToProcess.push(filePath);
      }
    }
  }
}

function transformFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    let code = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Parse the file
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    let hasUnifiedModalImport = false;
    let antdModalImported = false;
    let reactModalImported = false;
    
    // First pass: check imports
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === '../components/unified/UnifiedModal' ||
            path.node.source.value === '../../components/unified/UnifiedModal' ||
            path.node.source.value === '../../../components/unified/UnifiedModal') {
          hasUnifiedModalImport = true;
        }
        
        if (path.node.source.value === 'antd') {
          const modalSpecifier = path.node.specifiers.find(spec => 
            spec.imported && spec.imported.name === 'Modal'
          );
          if (modalSpecifier) {
            antdModalImported = true;
            // Remove Modal from antd imports
            path.node.specifiers = path.node.specifiers.filter(spec => 
              !(spec.imported && spec.imported.name === 'Modal')
            );
            if (path.node.specifiers.length === 0) {
              path.remove();
            }
            hasChanges = true;
          }
        }
        
        if (path.node.source.value === 'react-modal') {
          reactModalImported = true;
          path.remove();
          hasChanges = true;
        }
      }
    });
    
    // Add UnifiedModal import if needed
    if (!hasUnifiedModalImport && (antdModalImported || reactModalImported)) {
      const relPath = path.relative(path.dirname(filePath), 
        path.join(process.cwd(), 'src/components/unified/UnifiedModal'));
      const importPath = relPath.startsWith('.') ? relPath : './' + relPath;
      
      const importDeclaration = t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier('UnifiedModal'))],
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
      hasChanges = true;
    }
    
    // Transform Modal usage
    traverse(ast, {
      JSXElement(path) {
        if (path.node.openingElement.name.name === 'Modal') {
          path.node.openingElement.name.name = 'UnifiedModal';
          if (path.node.closingElement) {
            path.node.closingElement.name.name = 'UnifiedModal';
          }
          
          // Transform props
          const attributes = path.node.openingElement.attributes;
          
          // Map common props
          attributes.forEach(attr => {
            if (t.isJSXAttribute(attr)) {
              const name = attr.name.name;
              
              // Antd Modal prop mappings
              if (name === 'visible') {
                attr.name.name = 'isOpen';
              } else if (name === 'onCancel') {
                attr.name.name = 'onClose';
              } else if (name === 'width') {
                // Convert to size
                const value = attr.value;
                if (t.isJSXExpressionContainer(value)) {
                  const expr = value.expression;
                  if (t.isNumericLiteral(expr)) {
                    if (expr.value <= 400) {
                      attr.name.name = 'size';
                      attr.value = t.stringLiteral('small');
                    } else if (expr.value <= 600) {
                      attr.name.name = 'size';
                      attr.value = t.stringLiteral('medium');
                    } else {
                      attr.name.name = 'size';
                      attr.value = t.stringLiteral('large');
                    }
                  }
                }
              } else if (name === 'footer') {
                // Keep footer as is
              } else if (name === 'okText' || name === 'cancelText' || name === 'onOk') {
                // These need to be handled in children or footer
              }
            }
          });
          
          hasChanges = true;
          migratedCount++;
        }
      }
    });
    
    if (hasChanges) {
      // Generate code
      const output = generate(ast, {}, code);
      fs.writeFileSync(filePath, output.code);
      console.log(`✓ Migrated: ${filePath}`);
    } else {
      skippedCount++;
    }
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    errorCount++;
  }
}

// Main execution
console.log('Starting Modal migration...\n');

collectFiles('src');

console.log(`Found ${filesToProcess.length} files to process\n`);

filesToProcess.forEach(transformFile);

console.log('\n=== Migration Summary ===');
console.log(`Total files processed: ${filesToProcess.length}`);
console.log(`Modals migrated: ${migratedCount}`);
console.log(`Files skipped: ${skippedCount}`);
console.log(`Errors: ${errorCount}`);
console.log(`\nModal consistency improved!`);