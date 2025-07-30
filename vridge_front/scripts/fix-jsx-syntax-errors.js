const fs = require('fs');
const path = require('path');
const glob = require('glob');

// JSX 구문 오류 패턴을 수정하는 함수
function fixJSXSyntaxErrors(content, filePath) {
  let fixed = content;
  let changeCount = 0;

  // 패턴 1: onClick={() = aria-label="Click"> {...} 형태
  const pattern1 = /onClick=\{?\(?\)\s*=\s*aria-label="[^"]*"[^>]*>/g;
  if (pattern1.test(fixed)) {
    fixed = fixed.replace(/onClick=\{?\(?\)\s*=\s*aria-label="[^"]*"[^>]*>\s*\{([^}]+)\}/g, 'onClick={() => {$1}}');
    changeCount++;
  }

  // 패턴 2: onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> {...}
  const pattern2 = /onKeyDown=\{?\(e\)\s*=>\s*e\.key\s*===\s*'Enter'\s*&&\s*\(\)\s*=\s*aria-label="[^"]*"[^>]*>/g;
  if (pattern2.test(fixed)) {
    fixed = fixed.replace(
      /onKeyDown=\{?\(e\)\s*=>\s*e\.key\s*===\s*'Enter'\s*&&\s*\(\)\s*=\s*aria-label="[^"]*"[^>]*>\s*\{([^}]+)\}/g,
      'onKeyDown={(e) => { if (e.key === \'Enter\') {$1} }}'
    );
    changeCount++;
  }

  // 패턴 3: onClick={() = aria-label="Click" type="button"> {...}
  fixed = fixed.replace(
    /onClick=\{?\(?\)\s*=\s*aria-label="[^"]*"\s*type="[^"]*">\s*([^}]+)\}/g,
    (match, code) => {
      changeCount++;
      return `onClick={() => ${code.trim()}} type="button" aria-label="클릭"`;
    }
  );

  // 패턴 4: onKeyDown={(e) => e.key === 'Enter' && () => {...}}
  fixed = fixed.replace(
    /onKeyDown=\{?\(e\)\s*=>\s*e\.key\s*===\s*['"]Enter['"]\s*&&\s*\(\)\s*=>\s*\{([^}]+)\}/g,
    'onKeyDown={(e) => { if (e.key === \'Enter\') {$1} }}'
  );

  // 패턴 5: onClick/onKeyDown과 aria-label이 잘못 결합된 경우
  fixed = fixed.replace(
    /(onClick|onKeyDown)=\{([^}]+)\}\s*aria-label="[^"]*"/g,
    '$1={$2} aria-label="클릭"'
  );

  // 패턴 6: 이중 화살표 함수 수정
  fixed = fixed.replace(
    /onKeyDown=\{?\(e\)\s*=>\s*e\.key\s*===\s*['"]Enter['"]\s*&&\s*\(e\)\s*=>/g,
    'onKeyDown={(e) => { if (e.key === \'Enter\')'
  );

  // 패턴 7: frameborder -> frameBorder, allowfullscreen -> allowFullScreen
  fixed = fixed.replace(/frameborder=/g, 'frameBorder=');
  fixed = fixed.replace(/allowfullscreen/g, 'allowFullScreen');

  if (changeCount > 0) {
    console.log(`Fixed ${changeCount} JSX syntax errors in ${filePath}`);
  }

  return { content: fixed, changed: changeCount > 0 };
}

// 파일 처리
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: fixed, changed } = fixJSXSyntaxErrors(content, filePath);
    
    if (changed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// 메인 실행
async function main() {
  console.log('Fixing JSX syntax errors...');
  
  const patterns = [
    'src/**/*.jsx',
    'src/**/*.js',
    'components/**/*.jsx',
    'pages/**/*.jsx',
    'pages/**/*.js'
  ];

  let totalFixed = 0;
  
  for (const pattern of patterns) {
    const files = glob.sync(pattern, { 
      cwd: '/home/winnmedia/VideoPlanet/vridge_front',
      absolute: true,
      ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/*.test.js', '**/*.spec.js']
    });

    for (const file of files) {
      if (processFile(file)) {
        totalFixed++;
      }
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main().catch(console.error);