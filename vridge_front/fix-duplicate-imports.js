#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 중복 import를 수정하는 함수
function fixDuplicateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 패턴 1: React import 중복
  const reactPattern1 = /import React,\s*{([^}]+)}\s*from\s*['"]react['"]\s*[\r\n]+.*?import\s*{([^}]+)}\s*from\s*['"]react['"]/gs;
  const reactPattern2 = /import\s*{([^}]+)}\s*from\s*['"]react['"]\s*[\r\n]+.*?import React,\s*{([^}]+)}\s*from\s*['"]react['"]/gs;
  const reactPattern3 = /import\s*{([^}]+)}\s*from\s*['"]react['"]\s*[\r\n]+.*?import\s*{([^}]+)}\s*from\s*['"]react['"]/gs;
  
  // React import 중복 처리
  if (reactPattern1.test(content)) {
    content = content.replace(reactPattern1, (match, group1, group2) => {
      const imports1 = group1.split(',').map(s => s.trim());
      const imports2 = group2.split(',').map(s => s.trim());
      const allImports = [...new Set([...imports1, ...imports2])];
      return `import React, { ${allImports.join(', ')} } from 'react'`;
    });
    modified = true;
  }
  
  if (reactPattern2.test(content)) {
    content = content.replace(reactPattern2, (match, group1, group2) => {
      const imports1 = group1.split(',').map(s => s.trim());
      const imports2 = group2.split(',').map(s => s.trim());
      const allImports = [...new Set([...imports1, ...imports2])];
      return `import React, { ${allImports.join(', ')} } from 'react'`;
    });
    modified = true;
  }
  
  if (reactPattern3.test(content)) {
    content = content.replace(reactPattern3, (match, group1, group2) => {
      const imports1 = group1.split(',').map(s => s.trim());
      const imports2 = group2.split(',').map(s => s.trim());
      const allImports = [...new Set([...imports1, ...imports2])];
      const hasReact = content.includes('React.') || content.includes('<') || content.includes('JSX');
      if (hasReact && !content.includes('import React')) {
        return `import React, { ${allImports.join(', ')} } from 'react'`;
      } else {
        return `import { ${allImports.join(', ')} } from 'react'`;
      }
    });
    modified = true;
  }
  
  // 패턴 2: ant-design/icons 중복
  const iconsPattern = /@ant-design\/icons['"]\s*[\r\n]+.*?import\s*{([^}]+)}\s*from\s*['"]@ant-design\/icons/gs;
  if (iconsPattern.test(content)) {
    content = content.replace(iconsPattern, (match) => {
      const allMatches = [...match.matchAll(/{\s*([^}]+)\s*}/g)];
      const allIcons = allMatches.flatMap(m => m[1].split(',').map(s => s.trim()));
      const uniqueIcons = [...new Set(allIcons)];
      return `} from '@ant-design/icons'`;
    });
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// 특정 파일들 수정
const filesToFix = [
  'src/components/ProjectScheduleSection.jsx',
  'src/components/SideBar.jsx',
  'src/components/Toast/ToastContainer.jsx',
  'src/components/WorkflowEngine/WorkflowProgress.jsx',
  'src/page/Admin/AdminDashboard.jsx'
];

let fixedCount = 0;

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    if (fixDuplicateImports(fullPath)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✨ Fixed ${fixedCount} files with duplicate imports`);