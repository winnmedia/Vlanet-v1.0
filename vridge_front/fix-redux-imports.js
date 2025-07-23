const fs = require('fs');
const path = require('path');

// Redux import를 수정하는 함수
function fixReduxImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 잘못된 redux/project import 패턴
  const patterns = [
    { 
      from: /from\s+['"]redux\/project['"]/g,
      to: "from '../redux/project'"
    },
    { 
      from: /from\s+['"]redux\/project['"]/g,
      to: "from '../../redux/project'"
    }
  ];
  
  // 파일 경로에 따라 적절한 상대 경로 계산
  const relativePathToRedux = path.relative(path.dirname(filePath), path.join(__dirname, 'src/redux'));
  const correctImport = `from '${relativePathToRedux}/project'`.replace(/\\/g, '/');
  
  if (content.includes("from 'redux/project'") || content.includes('from "redux/project"')) {
    content = content.replace(/from\s+['"]redux\/project['"]/g, correctImport);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed redux imports in: ${filePath}`);
  }
  
  return modified;
}

// 재귀적으로 파일 탐색
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.js'))) {
      fixReduxImports(fullPath);
    }
  });
}

// src 디렉토리 처리
console.log('🔍 Fixing redux imports...');
processDirectory('./src');
console.log('✨ Redux import fix complete!');