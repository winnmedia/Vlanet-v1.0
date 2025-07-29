#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🧹 적극적인 Console 로그 제거기${colors.reset}\n`);

// 모든 JS/JSX 파일 찾기
const files = glob.sync('src/**/*.{js,jsx}', {
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/*.test.js',
    '**/*.spec.js',
    '**/*.test.jsx',
    '**/*.spec.jsx',
    '**/scripts/**'
  ]
});

console.log(`${colors.blue}📁 ${files.length}개 파일 검사 중...${colors.reset}\n`);

let totalRemoved = 0;
let filesModified = 0;
const errors = [];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // 파일에 console이 없으면 스킵
    if (!content.includes('console.')) {
      return;
    }

    let removed = 0;

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties', 'dynamicImport']
    });

    traverse(ast, {
      CallExpression(path) {
        const { node } = path;
        
        // console.* 호출 확인
        if (
          t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object, { name: 'console' })
        ) {
          const method = node.callee.property.name;
          
          // error와 warn은 유지
          if (method === 'error' || method === 'warn') {
            return;
          }
          
          // 나머지 console 메서드는 모두 제거
          if (['log', 'debug', 'info', 'trace', 'group', 'groupEnd', 'groupCollapsed'].includes(method)) {
            // 부모가 ExpressionStatement인 경우 전체 문장 제거
            if (path.parent.type === 'ExpressionStatement') {
              path.parentPath.remove();
            } else {
              // 표현식의 일부인 경우 undefined로 대체
              path.replaceWith(t.identifier('undefined'));
            }
            removed++;
          }
        }
      }
    });

    if (removed > 0) {
      const output = generate(ast, {
        retainLines: true,
        concise: false
      });

      fs.writeFileSync(file, output.code);
      totalRemoved += removed;
      filesModified++;
      
      console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), file)}: ${removed}개 제거됨`);
    }
  } catch (error) {
    errors.push({ file, error: error.message });
  }
});

// 결과 출력
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ 완료!${colors.reset}`);
console.log(`  - 총 ${totalRemoved}개의 console 로그 제거됨`);
console.log(`  - ${filesModified}개 파일 수정됨`);

if (errors.length > 0) {
  console.log(`\n${colors.red}⚠️ ${errors.length}개 파일에서 오류 발생:${colors.reset}`);
  errors.forEach(({ file, error }) => {
    console.log(`  - ${path.relative(process.cwd(), file)}: ${error}`);
  });
}

console.log(`\n${colors.yellow}💡 참고:${colors.reset}`);
console.log('  - console.error와 console.warn은 유지되었습니다');
console.log('  - 테스트 파일은 제외되었습니다');
console.log('  - 변경사항을 확인 후 커밋하세요');

// 요약 파일 생성
const summary = {
  timestamp: new Date().toISOString(),
  totalRemoved,
  filesModified,
  errors: errors.length,
  fileList: files.filter(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('console.');
    } catch {
      return false;
    }
  }).map(file => path.relative(process.cwd(), file))
};

fs.writeFileSync('console-removal-summary.json', JSON.stringify(summary, null, 2));
console.log(`\n${colors.gray}상세 보고서가 console-removal-summary.json에 저장되었습니다.${colors.reset}`);