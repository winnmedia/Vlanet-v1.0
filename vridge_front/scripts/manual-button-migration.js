#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Manual button migration helper
 * This script helps identify buttons that need manual migration
 * due to complex className patterns or other edge cases
 */

function analyzeCSSModuleButtons() {
  console.log('🔍 Analyzing CSS Module Buttons for Manual Migration...\n');
  
  // Files that need CSS module button migration
  const targetFiles = [
    'src/page/Cms/CmsHomeMinimal.jsx',
    'src/page/Cms/CmsHomeMinimal.v2.jsx',
    'src/components/ProjectPhaseBoard.jsx',
    'src/components/ProjectScheduleSection.jsx',
    'src/design-system/pages/Feedback/FeedbackComponents.tsx',
    'src/tasks/Feedback/FeedbackMore.jsx',
    'src/components/ToggleButton.jsx',
    'src/components/SideBar.jsx'
  ];
  
  const report = [];
  
  targetFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const buttons = [];
    
    lines.forEach((line, index) => {
      if (line.includes('<button')) {
        // Find the full button by looking ahead
        let buttonContent = line;
        let endIndex = index;
        let openTags = 1;
        
        // If button doesn't close on same line, find closing tag
        if (!line.includes('</button>')) {
          for (let i = index + 1; i < lines.length && openTags > 0; i++) {
            buttonContent += '\n' + lines[i];
            if (lines[i].includes('<button')) openTags++;
            if (lines[i].includes('</button>')) {
              openTags--;
              endIndex = i;
            }
          }
        }
        
        buttons.push({
          lineNumber: index + 1,
          endLine: endIndex + 1,
          content: buttonContent.trim()
        });
      }
    });
    
    if (buttons.length > 0) {
      report.push({
        file: filePath,
        buttons: buttons
      });
    }
  });
  
  // Generate migration instructions
  console.log('📝 Manual Migration Instructions:\n');
  
  report.forEach(({ file, buttons }) => {
    console.log(`\n📄 ${file} (${buttons.length} buttons)`);
    console.log('─'.repeat(60));
    
    buttons.forEach((button, idx) => {
      console.log(`\nButton ${idx + 1} (line ${button.lineNumber}-${button.endLine}):`);
      
      // Analyze the button
      const classMatch = button.content.match(/className=\{([^}]+)\}/);
      let variant = 'primary';
      let className = '';
      
      if (classMatch) {
        className = classMatch[1];
        
        // Determine variant
        if (className.includes('newProjectBtn') || className.includes('submitBtn') || 
            className.includes('saveBtn') || className.includes('acceptBtn')) {
          variant = 'primary';
        } else if (className.includes('cancelBtn') || className.includes('closeBtn') ||
                   className.includes('editBtn') || className.includes('viewBtn')) {
          variant = 'secondary';
        } else if (className.includes('deleteBtn') || className.includes('removeBtn') ||
                   className.includes('declineBtn')) {
          variant = 'danger';
        } else if (className.includes('tab') || className.includes('ghost')) {
          variant = 'ghost';
        }
      }
      
      console.log(`Original: ${button.content.substring(0, 100)}...`);
      console.log(`Suggested variant: "${variant}"`);
      console.log(`Action: Replace <button with <Button and add variant="${variant}"`);
      
      // Special handling for complex className
      if (className.includes('?') || className.includes('${')) {
        console.log(`⚠️  Complex className detected - needs manual review`);
        console.log(`   Keep the className for conditional styling`);
      }
    });
  });
  
  // Save detailed report
  fs.writeFileSync(
    'manual-button-migration-guide.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n\n✅ Detailed report saved to manual-button-migration-guide.json');
  console.log('\n📌 Next Steps:');
  console.log('1. Add import { Button } from relative path to unified/Button');
  console.log('2. Replace <button> tags with <Button>');
  console.log('3. Add appropriate variant prop');
  console.log('4. Keep complex className for conditional styling');
  console.log('5. Test thoroughly after migration');
}

analyzeCSSModuleButtons();