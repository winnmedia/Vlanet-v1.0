#!/usr/bin/env node

// Example migration script for a single file
// This demonstrates how to migrate VideoPlanning.jsx buttons

const fs = require('fs');
const path = require('path');

const filePath = 'src/page/Cms/VideoPlanning.jsx';

// Read file
const content = fs.readFileSync(filePath, 'utf8');

// Migration transformations
let newContent = content;

// 1. Replace button class names with Button component
const buttonMappings = [
  // Simple class-based buttons
  {
    from: /<button\s+className="cancel-custom-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="secondary"$1>$2</Button>'
  },
  {
    from: /<button\s+className="generate-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="primary"$1>$2</Button>'
  },
  {
    from: /<button\s+className="save-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="primary"$1>$2</Button>'
  },
  {
    from: /<button\s+className="new-planning-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="primary"$1>$2</Button>'
  },
  {
    from: /<button\s+className="delete-planning-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="danger"$1>$2</Button>'
  },
  {
    from: /<button\s+className="edit-story-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="secondary" size="sm"$1>$2</Button>'
  },
  {
    from: /<button\s+className="save-story-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="primary" size="sm"$1>$2</Button>'
  },
  {
    from: /<button\s+className="cancel-story-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="secondary" size="sm"$1>$2</Button>'
  },
  {
    from: /<button\s+className="back-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="ghost"$1>$2</Button>'
  },
  {
    from: /<button\s+className="export-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="primary"$1>$2</Button>'
  },
  {
    from: /<button\s+className="new-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="secondary"$1>$2</Button>'
  },
  {
    from: /<button\s+className="prev-step-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="secondary"$1>$2</Button>'
  },
  {
    from: /<button\s+className="complete-project-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="primary" size="lg"$1>$2</Button>'
  },
  {
    from: /<button\s+className="pdf-download-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="secondary"$1>$2</Button>'
  },
  // Icon buttons
  {
    from: /<button\s+className="remove-image-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="danger" size="sm"$1>$2</Button>'
  },
  {
    from: /<button\s+className="replace-video-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="secondary"$1>$2</Button>'
  },
  {
    from: /<button\s+className="delete-video-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="danger"$1>$2</Button>'
  },
  // Label styled as button
  {
    from: /<label\s+htmlFor="video-upload"\s+className="upload-btn">/g,
    to: '<Button variant="primary" as="label" htmlFor="video-upload">'
  },
  {
    from: /<button\s+className="upload-guide-btn"([^>]*)>(.*?)<\/button>/g,
    to: '<Button variant="ghost"$1>$2</Button>'
  }
];

// Apply transformations
buttonMappings.forEach(mapping => {
  newContent = newContent.replace(mapping.from, mapping.to);
});

// 2. Handle inline-styled buttons
// Example: The delete button with inline styles
newContent = newContent.replace(
  /<button\s+onClick=\{[^}]+\}\s+style=\{\s*\{[^}]+backgroundColor:\s*'#dc3545'[^}]+\}\s*\}[^>]*>(.*?)<\/button>/g,
  '<Button variant="danger" onClick={$1}>$2</Button>'
);

// 3. Add Button import if not exists
if (!newContent.includes("import { Button } from '../../components/unified/Button'")) {
  // Find the last import statement
  const lastImportMatch = newContent.match(/^import[^;]+;$/gm);
  if (lastImportMatch) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    const insertPos = newContent.indexOf(lastImport) + lastImport.length;
    newContent = newContent.slice(0, insertPos) + 
      "\nimport { Button } from '../../components/unified/Button'" +
      newContent.slice(insertPos);
  }
}

// 4. Generate report of changes
const originalButtons = (content.match(/<button[^>]*>/g) || []).length;
const migratedButtons = (newContent.match(/<Button[^>]*>/g) || []).length;

console.log(`Migration Report for ${filePath}:`);
console.log(`- Original buttons: ${originalButtons}`);
console.log(`- Migrated buttons: ${migratedButtons}`);
console.log(`- Success rate: ${Math.round(migratedButtons / originalButtons * 100)}%`);

// 5. Save the file (in dry-run mode, save with .migrated extension)
const outputPath = filePath.replace('.jsx', '.migrated.jsx');
fs.writeFileSync(outputPath, newContent, 'utf8');
console.log(`\nMigrated file saved to: ${outputPath}`);
console.log('\nReview the changes and manually handle any complex cases.');

// 6. List remaining manual work
const remainingButtons = newContent.match(/<button[^>]*>/g) || [];
if (remainingButtons.length > 0) {
  console.log('\n⚠️  Remaining buttons that need manual migration:');
  remainingButtons.forEach((button, index) => {
    const lineNumber = newContent.substring(0, newContent.indexOf(button)).split('\n').length;
    console.log(`  ${index + 1}. Line ~${lineNumber}: ${button.substring(0, 50)}...`);
  });
}