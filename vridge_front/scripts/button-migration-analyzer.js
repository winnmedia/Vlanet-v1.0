#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Analyze button patterns in the codebase
class ButtonMigrationAnalyzer {
  constructor() {
    this.patterns = {
      nativeButtons: [],
      antdButtons: [],
      customButtons: [],
      buttonClasses: new Set(),
      inlineStyles: [],
      iconButtons: []
    };
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const filePatterns = {
      path: filePath,
      buttons: []
    };

    // Pattern 1: Native HTML buttons
    const nativeButtonRegex = /<button\s+([^>]*?)>(.*?)<\/button>/gs;
    let match;
    while ((match = nativeButtonRegex.exec(content)) !== null) {
      const [fullMatch, attrs, children] = match;
      const button = {
        type: 'native',
        attrs: this.parseAttributes(attrs),
        children: children.trim(),
        line: content.substring(0, match.index).split('\n').length
      };
      
      filePatterns.buttons.push(button);
      
      // Collect class names
      if (button.attrs.className && typeof button.attrs.className === 'string') {
        button.attrs.className.split(' ').forEach(cls => {
          if (cls.includes('btn') || cls.includes('button')) {
            this.patterns.buttonClasses.add(cls);
          }
        });
      }
      
      // Check for inline styles
      if (button.attrs.style) {
        this.patterns.inlineStyles.push({
          file: filePath,
          line: button.line,
          style: button.attrs.style
        });
      }
      
      // Check for icon buttons
      if (button.children.includes('<svg') || button.children.includes('<img')) {
        this.patterns.iconButtons.push({
          file: filePath,
          line: button.line,
          hasText: button.children.replace(/<[^>]*>/g, '').trim().length > 0
        });
      }
    }

    // Pattern 2: Antd Button usage
    const antdButtonRegex = /<Button\s+([^>]*?)>(.*?)<\/Button>/gs;
    while ((match = antdButtonRegex.exec(content)) !== null) {
      const [fullMatch, attrs, children] = match;
      filePatterns.buttons.push({
        type: 'antd',
        attrs: this.parseAttributes(attrs),
        children: children.trim(),
        line: content.substring(0, match.index).split('\n').length
      });
    }

    // Pattern 3: Custom button components
    const customButtonRegex = /<(MinimalButton|ToggleButton|FeedbackButton)\s+([^>]*?)>(.*?)<\/\1>/gs;
    while ((match = customButtonRegex.exec(content)) !== null) {
      const [fullMatch, componentName, attrs, children] = match;
      filePatterns.buttons.push({
        type: 'custom',
        component: componentName,
        attrs: this.parseAttributes(attrs),
        children: children.trim(),
        line: content.substring(0, match.index).split('\n').length
      });
    }

    if (filePatterns.buttons.length > 0) {
      this.patterns.nativeButtons.push(filePatterns);
    }

    return filePatterns;
  }

  parseAttributes(attrString) {
    const attrs = {};
    const attrRegex = /(\w+)(?:=(?:["']([^"']*?)["']|{([^}]*?)}))?/g;
    let match;
    
    while ((match = attrRegex.exec(attrString)) !== null) {
      const [, name, stringValue, jsValue] = match;
      attrs[name] = stringValue || jsValue || true;
    }
    
    return attrs;
  }

  generateMigrationMap() {
    const classToVariant = new Map();
    const classToSize = new Map();
    
    // Analyze collected classes
    const variantPatterns = {
      primary: ['btn-primary', 'save-btn', 'submit-btn', 'generate-btn', 'export-btn', 'upload-btn'],
      secondary: ['btn-secondary', 'cancel-btn', 'edit-btn', 'back-btn', 'download-btn'],
      danger: ['btn-danger', 'delete-btn', 'remove-btn'],
      success: ['btn-success', 'accept-btn', 'confirm-btn'],
      warning: ['btn-warning'],
      ghost: ['btn-ghost', 'btn-outline'],
      link: ['btn-link']
    };
    
    const sizePatterns = {
      xs: ['btn-xs'],
      sm: ['btn-sm', 'small'],
      md: ['btn-md', 'medium'],
      lg: ['btn-lg', 'large'],
      xl: ['btn-xl']
    };
    
    for (const [variant, patterns] of Object.entries(variantPatterns)) {
      patterns.forEach(pattern => {
        this.patterns.buttonClasses.forEach(cls => {
          if (cls.includes(pattern)) {
            classToVariant.set(cls, variant);
          }
        });
      });
    }
    
    for (const [size, patterns] of Object.entries(sizePatterns)) {
      patterns.forEach(pattern => {
        this.patterns.buttonClasses.forEach(cls => {
          if (cls.includes(pattern)) {
            classToSize.set(cls, size);
          }
        });
      });
    }
    
    return { classToVariant, classToSize };
  }

  generateReport() {
    const { classToVariant, classToSize } = this.generateMigrationMap();
    
    const report = {
      summary: {
        totalFiles: this.patterns.nativeButtons.length,
        totalButtons: this.patterns.nativeButtons.reduce((sum, file) => sum + file.buttons.length, 0),
        uniqueClasses: this.patterns.buttonClasses.size,
        filesWithInlineStyles: this.patterns.inlineStyles.length,
        iconButtons: this.patterns.iconButtons.length
      },
      classMapping: {
        variants: Object.fromEntries(classToVariant),
        sizes: Object.fromEntries(classToSize)
      },
      inlineStyles: this.patterns.inlineStyles,
      iconButtons: this.patterns.iconButtons,
      buttonClasses: Array.from(this.patterns.buttonClasses).sort(),
      fileDetails: this.patterns.nativeButtons.map(file => ({
        path: file.path,
        buttonCount: file.buttons.length,
        types: file.buttons.map(b => b.type)
      }))
    };
    
    return report;
  }
}

// Create migration examples
function generateMigrationExamples(report) {
  const examples = [];
  
  // Example 1: Simple button with class
  examples.push({
    title: 'Simple button with class',
    before: '<button className="save-btn">Save</button>',
    after: '<Button variant="primary">Save</Button>'
  });
  
  // Example 2: Button with onClick
  examples.push({
    title: 'Button with onClick handler',
    before: '<button className="cancel-btn" onClick={handleCancel}>Cancel</button>',
    after: '<Button variant="secondary" onClick={handleCancel}>Cancel</Button>'
  });
  
  // Example 3: Icon button
  examples.push({
    title: 'Icon-only button',
    before: '<button className="delete-btn"><DeleteIcon /></button>',
    after: '<Button variant="danger" icon={<DeleteIcon />} />'
  });
  
  // Example 4: Full width button
  examples.push({
    title: 'Full width button',
    before: '<button className="btn-primary full-width">Submit</button>',
    after: '<Button fullWidth>Submit</Button>'
  });
  
  // Example 5: Disabled button
  examples.push({
    title: 'Disabled button',
    before: '<button className="btn-secondary" disabled>Not Available</button>',
    after: '<Button variant="secondary" disabled>Not Available</Button>'
  });
  
  return examples;
}

// Main execution
async function analyze(options = {}) {
  const {
    pattern = 'src/**/*.{js,jsx,ts,tsx}',
    outputPath = 'button-migration-analysis.json'
  } = options;
  
  console.log('🔍 Analyzing button usage patterns...\n');
  
  const analyzer = new ButtonMigrationAnalyzer();
  const files = glob.sync(pattern, {
    ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*', '**/unified/Button/**', 'scripts/**']
  });
  
  console.log(`Found ${files.length} files to analyze\n`);
  
  let processedCount = 0;
  for (const file of files) {
    analyzer.analyzeFile(file);
    processedCount++;
    if (processedCount % 10 === 0) {
      process.stdout.write(`\rProcessed ${processedCount}/${files.length} files`);
    }
  }
  
  console.log(`\n\n✅ Analysis complete!\n`);
  
  const report = analyzer.generateReport();
  const examples = generateMigrationExamples(report);
  
  const fullReport = {
    ...report,
    migrationExamples: examples,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(fullReport, null, 2));
  
  console.log('📊 Summary:');
  console.log(`- Total files with buttons: ${report.summary.totalFiles}`);
  console.log(`- Total buttons found: ${report.summary.totalButtons}`);
  console.log(`- Unique button classes: ${report.summary.uniqueClasses}`);
  console.log(`- Files with inline styles: ${report.summary.filesWithInlineStyles}`);
  console.log(`- Icon buttons: ${report.summary.iconButtons}\n`);
  
  console.log(`📄 Full report saved to: ${outputPath}`);
  
  return fullReport;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1],
    outputPath: args.find(arg => arg.startsWith('--output='))?.split('=')[1]
  };
  
  analyze(options).catch(console.error);
}

module.exports = { analyze };