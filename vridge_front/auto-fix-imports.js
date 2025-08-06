#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define import fixes
const importFixes = {
  'react': {
    hooks: ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect'],
    checkPattern: /\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer|useLayoutEffect)\b/g
  },
  'antd': {
    components: ['Button', 'Input', 'Form', 'Modal', 'Select', 'Table', 'Card', 'Row', 'Col', 'Space', 
                 'Tooltip', 'Tag', 'Progress', 'Spin', 'message', 'notification', 'Popconfirm', 'Dropdown', 
                 'Menu', 'Avatar', 'Badge', 'Tabs', 'Upload', 'DatePicker', 'TimePicker', 'Checkbox', 
                 'Radio', 'Switch', 'Divider', 'Empty', 'Result', 'Alert', 'Drawer', 'Collapse', 
                 'Timeline', 'Steps', 'Carousel', 'Breadcrumb', 'Pagination', 'AutoComplete', 
                 'Cascader', 'InputNumber', 'Rate', 'Slider', 'TreeSelect', 'Transfer', 
                 'Typography', 'Skeleton', 'Statistic', 'Descriptions', 'List', 'Popover', 
                 'ConfigProvider', 'Layout', 'Grid', 'Affix', 'BackTop', 'Anchor'],
    checkPattern: /\b(Button|Input|Form|Modal|Select|Table|Card|Row|Col|Space|Tooltip|Tag|Progress|Spin|message|notification|Popconfirm|Dropdown|Menu|Avatar|Badge|Tabs|Upload|DatePicker|TimePicker|Checkbox|Radio|Switch|Divider|Empty|Result|Alert|Drawer|Collapse|Timeline|Steps|Carousel|Breadcrumb|Pagination|AutoComplete|Cascader|InputNumber|Rate|Slider|TreeSelect|Transfer|Typography|Skeleton|Statistic|Descriptions|List|Popover|ConfigProvider|Layout|Grid|Affix|BackTop|Anchor)\b(?![a-zA-Z])/g
  },
  '@ant-design/icons': {
    icons: ['UserOutlined', 'ProjectOutlined', 'TeamOutlined', 'FileTextOutlined', 'SettingOutlined',
            'DatabaseOutlined', 'MailOutlined', 'LineChartOutlined', 'ExportOutlined', 'SearchOutlined',
            'ReloadOutlined', 'DashboardOutlined', 'UsergroupAddOutlined', 'FolderOpenOutlined',
            'CommentOutlined', 'InfoCircleOutlined', 'PlusOutlined', 'DeleteOutlined', 'EyeOutlined',
            'EditOutlined', 'CalendarOutlined', 'FolderOutlined', 'CheckCircleOutlined',
            'ClockCircleOutlined', 'ExclamationCircleOutlined', 'FileAddOutlined', 'CloseCircleOutlined',
            'DownOutlined', 'UpOutlined', 'LeftOutlined', 'RightOutlined', 'CheckOutlined',
            'CloseOutlined', 'LoadingOutlined', 'QuestionCircleOutlined', 'WarningOutlined',
            'PaperClipOutlined', 'CopyOutlined', 'DownloadOutlined', 'CloudUploadOutlined',
            'SaveOutlined', 'ShareAltOutlined', 'LockOutlined', 'UnlockOutlined', 'HomeOutlined',
            'EnvironmentOutlined', 'PhoneOutlined', 'GlobalOutlined', 'StarOutlined',
            'HeartOutlined', 'MessageOutlined', 'BellOutlined', 'NotificationOutlined'],
    checkPattern: /\b(\w+(?:Outlined|Filled|TwoTone))\b/g
  }
};

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Skip if file is a test file or config file
    if (filePath.includes('.test.') || filePath.includes('.spec.') || 
        filePath.includes('config/') || filePath.includes('tests/')) {
      return { skipped: true, reason: 'Test or config file' };
    }
    
    // Find existing imports
    const existingImports = new Map();
    let lastImportIndex = -1;
    
    lines.forEach((line, index) => {
      const importMatch = line.match(/^import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        lastImportIndex = index;
        const [, namedImports, defaultImport, source] = importMatch;
        if (!existingImports.has(source)) {
          existingImports.set(source, {
            named: new Set(),
            default: null,
            lineIndex: index
          });
        }
        if (namedImports) {
          namedImports.split(',').forEach(imp => {
            existingImports.get(source).named.add(imp.trim());
          });
        }
        if (defaultImport) {
          existingImports.get(source).default = defaultImport.trim();
        }
      }
    });
    
    // Check for missing imports
    const missingImports = new Map();
    
    // Check React hooks
    const reactHookMatches = content.match(importFixes.react.checkPattern) || [];
    const uniqueReactHooks = [...new Set(reactHookMatches)];
    uniqueReactHooks.forEach(hook => {
      if (importFixes.react.hooks.includes(hook)) {
        const existingReact = existingImports.get('react');
        if (!existingReact || !existingReact.named.has(hook)) {
          if (!missingImports.has('react')) {
            missingImports.set('react', new Set());
          }
          missingImports.get('react').add(hook);
        }
      }
    });
    
    // Check Ant Design components
    const antdMatches = content.match(importFixes.antd.checkPattern) || [];
    const uniqueAntdComponents = [...new Set(antdMatches)];
    uniqueAntdComponents.forEach(component => {
      if (importFixes.antd.components.includes(component)) {
        const existingAntd = existingImports.get('antd');
        if (!existingAntd || !existingAntd.named.has(component)) {
          // Skip if it's in a comment
          const isInComment = lines.some(line => {
            const commentIndex = line.indexOf('//');
            if (commentIndex !== -1 && line.includes(component)) {
              return line.indexOf(component) > commentIndex;
            }
            return false;
          });
          
          if (!isInComment) {
            if (!missingImports.has('antd')) {
              missingImports.set('antd', new Set());
            }
            missingImports.get('antd').add(component);
          }
        }
      }
    });
    
    // Check Ant Design icons
    const iconMatches = content.match(importFixes['@ant-design/icons'].checkPattern) || [];
    const uniqueIcons = [...new Set(iconMatches)];
    uniqueIcons.forEach(icon => {
      if (importFixes['@ant-design/icons'].icons.includes(icon)) {
        const existingIcons = existingImports.get('@ant-design/icons');
        if (!existingIcons || !existingIcons.named.has(icon)) {
          // Skip if it's in a comment
          const isInComment = lines.some(line => {
            const commentIndex = line.indexOf('//');
            if (commentIndex !== -1 && line.includes(icon)) {
              return line.indexOf(icon) > commentIndex;
            }
            return false;
          });
          
          if (!isInComment) {
            if (!missingImports.has('@ant-design/icons')) {
              missingImports.set('@ant-design/icons', new Set());
            }
            missingImports.get('@ant-design/icons').add(icon);
          }
        }
      }
    });
    
    // If no missing imports, return
    if (missingImports.size === 0) {
      return { skipped: true, reason: 'No missing imports' };
    }
    
    // Build new import statements
    const newImports = [];
    
    // Update existing imports or create new ones
    missingImports.forEach((items, source) => {
      const existing = existingImports.get(source);
      if (existing) {
        // Update existing import
        const allNamed = new Set([...existing.named, ...items]);
        const importStatement = `import { ${[...allNamed].sort().join(', ')} } from '${source}'`;
        lines[existing.lineIndex] = importStatement;
      } else {
        // Create new import
        const importStatement = `import { ${[...items].sort().join(', ')} } from '${source}'`;
        newImports.push(importStatement);
      }
    });
    
    // Insert new imports after existing imports
    if (newImports.length > 0) {
      const insertIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
      lines.splice(insertIndex, 0, ...newImports);
    }
    
    // Write back to file
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf-8');
    
    return {
      fixed: true,
      missingImports: Array.from(missingImports.entries()).map(([source, items]) => ({
        source,
        items: [...items]
      }))
    };
    
  } catch (error) {
    return { error: error.message };
  }
}

function scanAndFix(dir) {
  const results = [];
  
  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && 
          file !== 'node_modules' && file !== 'build' && file !== 'dist') {
        scan(fullPath);
      } else if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.js'))) {
        const result = fixImportsInFile(fullPath);
        if (!result.skipped) {
          results.push({
            file: path.relative(process.cwd(), fullPath),
            ...result
          });
        }
      }
    });
  }
  
  scan(dir);
  return results;
}

// Main execution
console.log('\n🔧 Auto-fixing import issues...\n');

const srcDir = path.join(__dirname, 'src');
const results = scanAndFix(srcDir);

// Report results
const fixed = results.filter(r => r.fixed);
const errors = results.filter(r => r.error);

if (fixed.length > 0) {
  console.log(`✅ Fixed ${fixed.length} files:\n`);
  fixed.forEach(result => {
    console.log(`  📄 ${result.file}`);
    result.missingImports.forEach(imp => {
      console.log(`     Added from ${imp.source}: ${imp.items.join(', ')}`);
    });
  });
}

if (errors.length > 0) {
  console.log(`\n❌ Errors in ${errors.length} files:\n`);
  errors.forEach(result => {
    console.log(`  📄 ${result.file}: ${result.error}`);
  });
}

if (fixed.length === 0 && errors.length === 0) {
  console.log('✨ No import issues found or all were skipped!\n');
}

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixed.length} files`);
console.log(`   Errors: ${errors.length} files`);
console.log(`   Total processed: ${results.length} files\n`);