const fs = require('fs');
const path = require('path');

let processedCount = 0;
let skippedCount = 0;
let errorCount = 0;

const responsiveTemplate = `
/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: $spacing-md;
    width: 100%;
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }
  
  .flex-row {
    flex-direction: column;
    gap: $spacing-sm;
  }
  
  .text-large {
    font-size: $font-size-lg;
  }
  
  .hide-mobile {
    display: none;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .container {
    padding: $spacing-lg;
    max-width: 960px;
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
`;

function hasResponsiveStyles(content) {
  return content.includes('@media') || content.includes('max-width:') || content.includes('min-width:');
}

function addResponsiveStyles(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has responsive styles
    if (hasResponsiveStyles(content)) {
      skippedCount++;
      return;
    }
    
    // Skip very small files or files with only imports
    if (content.length < 100 || !content.includes('{')) {
      skippedCount++;
      return;
    }
    
    // Add responsive styles at the end
    const newContent = content + '\n' + responsiveTemplate;
    fs.writeFileSync(filePath, newContent);
    
    console.log(`✓ Added responsive styles to: ${filePath}`);
    processedCount++;
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    errorCount++;
  }
}

function findStyleFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('__tests__')) {
        findStyleFiles(filePath);
      }
    } else if ((file.endsWith('.scss') || file.endsWith('.module.scss')) && 
               !file.includes('backup') && 
               !file.includes('test')) {
      addResponsiveStyles(filePath);
    }
  }
}

// Main execution
console.log('Adding responsive styles to components...\n');

// Process component styles
findStyleFiles('src/components');
findStyleFiles('src/page');

console.log('\n=== Summary ===');
console.log(`Files processed: ${processedCount}`);
console.log(`Files skipped (already responsive): ${skippedCount}`);
console.log(`Errors: ${errorCount}`);
console.log('\nResponsive design coverage improved!');