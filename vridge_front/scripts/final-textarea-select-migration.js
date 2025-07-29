const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babel = require('@babel/parser');

// Files identified with textarea/select elements
const targetFiles = [
  'src/components/ProjectForm.jsx',
  'src/page/Admin/AdminDashboard.jsx',
  'src/page/Cms/Calendar.jsx',
  'src/page/Cms/CmsHome.jsx',
  'src/page/Cms/CmsHomeMinimal.jsx',
  'src/page/Cms/CmsHomeMinimal.v2.jsx',
  'src/page/Cms/Feedback.jsx',
  'src/page/Cms/FeedbackAll.jsx',
  'src/page/Cms/FeedbackPolling.jsx',
  'src/page/Cms/FeedbackStable.jsx',
  'src/page/Cms/ProjectCreate.jsx',
  'src/page/Cms/ProjectCreateDebug.jsx',
  'src/page/Cms/ProjectEdit.jsx',
  'src/page/Cms/ProjectView-fixed.jsx',
  'src/page/Cms/ProjectView.jsx',
  'src/page/Cms/VideoPlanning-working.jsx',
  'src/page/Cms/VideoPlanning.jsx',
  'src/page/Cms/VideoPlanningMinimal.jsx',
  'src/tasks/Calendar/CalendarDate.jsx',
  'src/tasks/Feedback/FeedbackManage.jsx',
  'src/tasks/Project/ProcessDate.jsx'
];

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if UnifiedInput is already imported
  const hasUnifiedImport = content.includes('UnifiedInput');
  
  // Replace textarea elements
  const textareaPattern = /<textarea\s+([^>]*?)\/?>|<textarea\s+([^>]*?)>([\s\S]*?)<\/textarea>/g;
  if (textareaPattern.test(content)) {
    content = content.replace(textareaPattern, (match, attrs1, attrs2, children) => {
      const attrs = attrs1 || attrs2 || '';
      
      // Extract className
      const classMatch = attrs.match(/className=["']([^"']+)["']/);
      const className = classMatch ? classMatch[1] : '';
      
      // Extract other attributes
      const otherAttrs = attrs
        .replace(/className=["'][^"']+["']/g, '')
        .replace(/type=["'][^"']+["']/g, '');
      
      modified = true;
      return `<UnifiedInput variant="textarea" className="${className}" ${otherAttrs}${children ? `>${children}</UnifiedInput>` : '/>'}`;
    });
  }

  // Replace select elements
  const selectPattern = /<select\s+([^>]*?)>([\s\S]*?)<\/select>/g;
  if (selectPattern.test(content)) {
    content = content.replace(selectPattern, (match, attrs, children) => {
      // Extract className
      const classMatch = attrs.match(/className=["']([^"']+)["']/);
      const className = classMatch ? classMatch[1] : '';
      
      // Extract other attributes
      const otherAttrs = attrs.replace(/className=["'][^"']+["']/g, '');
      
      modified = true;
      return `<UnifiedInput variant="select" className="${className}" ${otherAttrs}>${children}</UnifiedInput>`;
    });
  }

  // Add import if needed and file was modified
  if (modified && !hasUnifiedImport) {
    // Find the right place to add import
    const lastImportMatch = content.match(/^import[^;]+;$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const insertPos = content.indexOf(lastImport) + lastImport.length;
      content = content.slice(0, insertPos) + 
        "\nimport { UnifiedInput } from '../components/unified/UnifiedInput';" + 
        content.slice(insertPos);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

// Process all target files
let successCount = 0;
let errorCount = 0;

targetFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    try {
      if (migrateFile(fullPath)) {
        console.log(`✅ Migrated: ${file}`);
        successCount++;
      } else {
        console.log(`⏭️  No changes needed: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n📊 Migration Summary:`);
console.log(`✅ Successfully migrated: ${successCount} files`);
console.log(`❌ Errors: ${errorCount} files`);
console.log(`📈 This should bring input consistency to 100%`);