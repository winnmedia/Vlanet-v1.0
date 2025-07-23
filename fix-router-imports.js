const fs = require('fs');
const path = require('path');

const srcDir = '/home/winnmedia/VideoPlanet/vridge-front-next/src';
let fixedCount = 0;
const fixedFiles = [];

function calculateRelativePath(fromFile, toFile) {
  const from = path.dirname(fromFile);
  const to = toFile;
  let relativePath = path.relative(from, to).replace(/\\/g, '/');
  
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath.replace(/\.js$/, '');
}

function fixRouterImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modified = false;
  
  const nextNavigationPath = '/home/winnmedia/VideoPlanet/vridge-front-next/src/util/nextNavigation.js';
  const relativePath = calculateRelativePath(filePath, nextNavigationPath);
  
  // Pattern 1: import { useNavigate } from 'react-router-dom'
  content = content.replace(
    /import\s*{\s*useNavigate\s*}\s*from\s*['"]react-router-dom['"]/g,
    `import { useRouter } from '${relativePath}'`
  );
  
  // Pattern 2: import { useParams } from 'react-router-dom'
  content = content.replace(
    /import\s*{\s*useParams\s*}\s*from\s*['"]react-router-dom['"]/g,
    `import { useParams } from '${relativePath}'`
  );
  
  // Pattern 3: import { useLocation } from 'react-router-dom'
  content = content.replace(
    /import\s*{\s*useLocation\s*}\s*from\s*['"]react-router-dom['"]/g,
    `import { useRouter } from '${relativePath}'`
  );
  
  // Pattern 4: Multiple imports from react-router-dom
  content = content.replace(
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"]react-router-dom['"]/g,
    (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const hasUseRouter = importList.some(i => ['useNavigate', 'useLocation', 'useParams'].includes(i));
      
      if (hasUseRouter) {
        const nextImports = [];
        if (importList.includes('useNavigate')) {
          nextImports.push('useRouter');
        }
        if (importList.includes('useLocation')) {
          if (!nextImports.includes('useRouter')) {
            nextImports.push('useRouter');
          }
        }
        if (importList.includes('useParams')) {
          nextImports.push('useParams');
        }
        
        // Other imports that we don't handle
        const otherImports = importList.filter(i => 
          !['useNavigate', 'useLocation', 'useParams'].includes(i)
        );
        
        if (otherImports.length > 0) {
          console.log(`⚠️  Unhandled imports in ${path.basename(filePath)}: ${otherImports.join(', ')}`);
        }
        
        return `import { ${[...new Set(nextImports)].join(', ')} } from '${relativePath}'`;
      }
      
      return match;
    }
  );
  
  // Replace useNavigate usage
  if (content.includes('useNavigate')) {
    content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\)/g, 'const { navigate } = useRouter()');
    content = content.replace(/const\s+nav\s*=\s*useNavigate\(\)/g, 'const { navigate: nav } = useRouter()');
  }
  
  // Replace useLocation usage
  if (content.includes('useLocation()') && !content.includes('useLocation().pathname')) {
    content = content.replace(/const\s+location\s*=\s*useLocation\(\)/g, 'const router = useRouter()');
    content = content.replace(/location\.pathname/g, 'router.pathname');
    content = content.replace(/location\.search/g, 'router.query');
    content = content.replace(/location\.state/g, 'router.query'); // Note: state handling is different in Next.js
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    fixedCount++;
    fixedFiles.push(path.relative(srcDir, filePath));
    console.log(`✅ 수정됨: ${path.relative(srcDir, filePath)}`);
    modified = true;
  }
  
  return modified;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walkDir(filePath);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fixRouterImports(filePath);
    }
  });
}

console.log('🔧 React Router import 자동 수정 시작\\n');

walkDir(srcDir);

console.log(`\\n📊 수정 결과:`);
console.log(`수정된 파일 수: ${fixedCount}`);

if (fixedCount > 0) {
  console.log('\\n✅ 수정된 파일 목록:');
  fixedFiles.forEach(file => console.log(`   - ${file}`));
  console.log('\\n🔄 서버를 재시작하여 변경사항을 적용하세요.');
} else {
  console.log('\\n💡 수정할 React Router import가 없습니다.');
}