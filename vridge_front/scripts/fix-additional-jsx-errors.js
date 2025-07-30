const fs = require('fs');
const path = require('path');

// JSX 오류 패턴과 수정 함수들
const patterns = [
  // onClick/onKeyDown 결합 오류 패턴
  {
    name: 'onClick-onKeyDown 결합 오류',
    regex: /onClick=\{([^}]+)\}\s+onKeyDown=\{[^}]*e\.key\s*===\s*['"]Enter['"]\s*&&\s*\(\)\s*=>\s*([^}]+)\}/g,
    fix: (match, onClick, onKeyDown) => {
      return `onClick={${onClick}}\n                onKeyDown={(e) => { if (e.key === 'Enter') ${onKeyDown} }}`;
    }
  },
  // aria-label 잘못된 위치
  {
    name: 'aria-label 잘못된 위치',
    regex: /onClick=\{[^}]+\}\s*=\s*aria-label=["'][^"']+["']/g,
    fix: (match) => {
      const onClick = match.match(/onClick=\{([^}]+)\}/)[0];
      const ariaLabel = match.match(/aria-label=["'][^"']+["']/)[0];
      return `${onClick}\n                ${ariaLabel}`;
    }
  },
  // onChange 구문 오류
  {
    name: 'onChange 구문 오류',
    regex: /onChange=\{[^}]*\}\s*=\s*aria-label=["'][^"']+["']\s*>/g,
    fix: (match) => {
      const onChange = match.match(/onChange=\{[^}]+\}/)[0];
      const ariaLabel = match.match(/aria-label=["'][^"']+["']/)[0];
      return `${onChange}\n              ${ariaLabel}\n            />`;
    }
  },
  // 이중 화살표 함수 오류
  {
    name: '이중 화살표 함수',
    regex: /onKeyDown=\{[^}]*e\.key\s*===\s*['"]Enter['"]\s*&&\s*\(e\)\s*=>/g,
    fix: (match) => {
      return match.replace(/&&\s*\(e\)\s*=>/, '&&');
    }
  },
  // input 태그 self-closing 오류
  {
    name: 'input 태그 self-closing',
    regex: /<input([^>]+)=\s*aria-label=["'][^"']+["']\s*\/>/g,
    fix: (match) => {
      const attrs = match.match(/<input([^>]+)=/)[1];
      const ariaLabel = match.match(/aria-label=["'][^"']+["']/)[0];
      return `<input${attrs} ${ariaLabel} />`;
    }
  }
];

// 파일 처리 함수
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changeLog = [];

    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          const fixed = pattern.fix(match);
          if (fixed !== match) {
            content = content.replace(match, fixed);
            modified = true;
            changeLog.push(`  - ${pattern.name}: 수정됨`);
          }
        });
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath}`);
      changeLog.forEach(log => console.log(log));
    }

    return modified;
  } catch (error) {
    console.error(`❌ 오류 발생 ${filePath}: ${error.message}`);
    return false;
  }
}

// 특정 파일들 처리
const targetFiles = [
  'src/page/User/Login.jsx',
  'src/components/OptimizedImage.jsx',
  'src/tasks/Project/ProcessDateEnhanced.jsx',
  'src/page/User/MyPage.jsx',
  'src/tasks/Feedback/FeedbackMore.jsx'
];

console.log('JSX 구문 오류 수정 시작...\n');

let totalFixed = 0;
targetFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (processFile(fullPath)) {
      totalFixed++;
    }
  } else {
    console.log(`⚠️  파일을 찾을 수 없음: ${file}`);
  }
});

// 추가로 전체 프로젝트에서 오류 패턴 검색
console.log('\n전체 프로젝트에서 추가 오류 검색 중...\n');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'build' && file !== 'dist') {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const allJsxFiles = findFiles(process.cwd());
let additionalFixed = 0;

allJsxFiles.forEach(file => {
  if (!targetFiles.some(target => file.endsWith(target))) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let hasError = false;
      
      patterns.forEach(pattern => {
        if (pattern.regex.test(content)) {
          hasError = true;
        }
      });
      
      if (hasError && processFile(file)) {
        additionalFixed++;
      }
    } catch (error) {
      // 무시
    }
  }
});

console.log(`\n✅ 수정 완료!`);
console.log(`   - 대상 파일 중 수정됨: ${totalFixed}개`);
console.log(`   - 추가로 발견하여 수정됨: ${additionalFixed}개`);
console.log(`   - 총 수정된 파일: ${totalFixed + additionalFixed}개`);