#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define commonly used imports patterns
const commonPatterns = {
  antdIcons: {
    pattern: /(\w+(?:Outlined|Filled|TwoTone))/g,
    importFrom: '@ant-design/icons',
    exclude: ['Component', 'React', 'Fragment', 'default', 'export', 'import', 'from', 'const', 'let', 'var', 'function', 'class']
  },
  reactHooks: {
    pattern: /\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer|useLayoutEffect)\b/g,
    importFrom: 'react',
    exclude: []
  },
  antdComponents: {
    pattern: /\b(Button|Input|Form|Modal|Select|Table|Card|Row|Col|Space|Tooltip|Tag|Progress|Spin|message|notification|Popconfirm|Dropdown|Menu|Avatar|Badge|Tabs|Upload|DatePicker|TimePicker|Checkbox|Radio|Switch|Divider|Empty|Result|Alert|Drawer|Collapse|Timeline|Steps|Carousel|Breadcrumb|Pagination|AutoComplete|Cascader|InputNumber|Rate|Slider|TreeSelect|Transfer|Typography|Skeleton|Statistic|Descriptions|List|Popover|ConfigProvider|Layout|Grid|Affix|BackTop|Anchor)\b(?![a-zA-Z])/g,
    importFrom: 'antd',
    exclude: []
  },
  nextRouter: {
    pattern: /\b(useRouter|usePathname|useSearchParams|useParams)\b/g,
    importFrom: 'next/',
    exclude: []
  }
};

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  // Extract all imports
  const imports = new Map();
  lines.forEach((line, index) => {
    const importMatch = line.match(/^import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const [, namedImports, defaultImport, source] = importMatch;
      if (!imports.has(source)) {
        imports.set(source, new Set());
      }
      if (namedImports) {
        namedImports.split(',').forEach(imp => {
          imports.get(source).add(imp.trim());
        });
      }
      if (defaultImport) {
        imports.get(source).add(defaultImport.trim());
      }
    }
  });
  
  // Check for missing imports
  Object.entries(commonPatterns).forEach(([category, config]) => {
    const matches = content.match(config.pattern) || [];
    const uniqueMatches = [...new Set(matches)];
    
    uniqueMatches.forEach(match => {
      if (config.exclude.includes(match)) return;
      
      // Check if it's in a comment or string
      const isInComment = lines.some(line => {
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1 && line.includes(match)) {
          return line.indexOf(match) > commentIndex;
        }
        return false;
      });
      
      if (isInComment) return;
      
      // Check if it's imported
      let isImported = false;
      
      if (category === 'antdIcons') {
        isImported = imports.has('@ant-design/icons') && imports.get('@ant-design/icons').has(match);
      } else if (category === 'reactHooks') {
        isImported = imports.has('react') && imports.get('react').has(match);
      } else if (category === 'antdComponents') {
        isImported = imports.has('antd') && imports.get('antd').has(match);
      } else if (category === 'nextRouter') {
        const nextImports = Array.from(imports.keys()).filter(key => key.startsWith('next/'));
        isImported = nextImports.some(key => imports.get(key).has(match));
      }
      
      if (!isImported) {
        // Find line number where it's used
        const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
        issues.push({
          type: category,
          symbol: match,
          importFrom: config.importFrom,
          lineNumber
        });
      }
    });
  });
  
  return issues;
}

function scanDirectory(dir, pattern = /\.(jsx?|tsx?)$/) {
  const results = [];
  
  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'build' && file !== 'dist') {
        scan(fullPath);
      } else if (stat.isFile() && pattern.test(file)) {
        results.push(fullPath);
      }
    });
  }
  
  scan(dir);
  return results;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const filesToCheck = scanDirectory(srcDir);

console.log(`\n🔍 Checking ${filesToCheck.length} files for import issues...\n`);

const allIssues = new Map();

filesToCheck.forEach(file => {
  const issues = checkFile(file);
  if (issues.length > 0) {
    allIssues.set(file, issues);
  }
});

if (allIssues.size === 0) {
  console.log('✅ No import issues found!\n');
} else {
  console.log(`⚠️  Found import issues in ${allIssues.size} files:\n`);
  
  // Group by type of issue
  const issuesByType = {
    antdIcons: [],
    reactHooks: [],
    antdComponents: [],
    nextRouter: []
  };
  
  allIssues.forEach((issues, file) => {
    issues.forEach(issue => {
      issuesByType[issue.type].push({
        ...issue,
        file: path.relative(process.cwd(), file)
      });
    });
  });
  
  // Print issues by type
  Object.entries(issuesByType).forEach(([type, issues]) => {
    if (issues.length > 0) {
      console.log(`\n📦 ${type} (${issues.length} issues):`);
      console.log('─'.repeat(50));
      
      issues.forEach(issue => {
        console.log(`  📄 ${issue.file}:${issue.lineNumber}`);
        console.log(`     Missing: ${issue.symbol}`);
        console.log(`     Import from: ${issue.importFrom}`);
      });
    }
  });
  
  // Generate fix suggestions
  console.log('\n\n🔧 Suggested Fixes:');
  console.log('─'.repeat(50));
  
  allIssues.forEach((issues, file) => {
    console.log(`\n📄 ${path.relative(process.cwd(), file)}:`);
    
    const iconImports = issues.filter(i => i.type === 'antdIcons').map(i => i.symbol);
    const antdImports = issues.filter(i => i.type === 'antdComponents').map(i => i.symbol);
    const reactImports = issues.filter(i => i.type === 'reactHooks').map(i => i.symbol);
    
    if (iconImports.length > 0) {
      console.log(`   Add: import { ${iconImports.join(', ')} } from '@ant-design/icons';`);
    }
    if (antdImports.length > 0) {
      console.log(`   Add: import { ${antdImports.join(', ')} } from 'antd';`);
    }
    if (reactImports.length > 0) {
      console.log(`   Add to React import: ${reactImports.join(', ')}`);
    }
  });
}

console.log('\n');