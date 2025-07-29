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

console.log(`${colors.cyan}🔄 UnifiedButton 마이그레이션${colors.reset}\n`);

// 모든 JSX 파일 찾기
const files = glob.sync('src/**/*.{jsx,js}', {
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/*.test.js',
    '**/*.spec.js',
    '**/unified/**',
    '**/scripts/**'
  ]
});

console.log(`${colors.blue}📁 ${files.length}개 파일 검사 중...${colors.reset}\n`);

let totalMigrated = 0;
let filesModified = 0;
const migrationLog = [];

// 클래스명을 variant로 매핑
function mapClassToVariant(className) {
  const mappings = {
    'btn-primary': 'primary',
    'btn-secondary': 'secondary',
    'btn-danger': 'danger',
    'btn-outline': 'outline',
    'btn-ghost': 'ghost',
    'btn-link': 'link',
    'primary': 'primary',
    'secondary': 'secondary',
    'danger': 'danger',
    'error': 'danger',
    'cancel': 'secondary',
    'submit': 'primary',
    'delete': 'danger'
  };
  
  for (const [key, value] of Object.entries(mappings)) {
    if (className && className.includes(key)) {
      return value;
    }
  }
  return 'primary';
}

// 크기 매핑
function mapClassToSize(className) {
  if (!className) return 'medium';
  if (className.includes('small') || className.includes('sm')) return 'small';
  if (className.includes('large') || className.includes('lg')) return 'large';
  return 'medium';
}

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let importAdded = false;
    
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties', 'dynamicImport']
    });

    traverse(ast, {
      // Import 추가
      Program(path) {
        const body = path.node.body;
        const hasUnifiedButton = body.some(node => 
          t.isImportDeclaration(node) && 
          node.source.value.includes('UnifiedButton')
        );
        
        if (!hasUnifiedButton && modified) {
          const unifiedImport = t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier('UnifiedButton'))],
            t.stringLiteral('../../components/unified/UnifiedButton')
          );
          body.unshift(unifiedImport);
          importAdded = true;
        }
      },
      
      // button 태그 변환
      JSXElement(path) {
        const { node } = path;
        if (node.openingElement.name.name === 'button') {
          // UnifiedButton으로 변경
          node.openingElement.name.name = 'UnifiedButton';
          if (node.closingElement) {
            node.closingElement.name.name = 'UnifiedButton';
          }
          
          // className에서 variant와 size 추출
          const classNameAttr = node.openingElement.attributes.find(
            attr => t.isJSXAttribute(attr) && attr.name.name === 'className'
          );
          
          if (classNameAttr && t.isStringLiteral(classNameAttr.value)) {
            const className = classNameAttr.value.value;
            const variant = mapClassToVariant(className);
            const size = mapClassToSize(className);
            
            // variant 속성 추가
            if (variant !== 'primary') {
              node.openingElement.attributes.push(
                t.jsxAttribute(t.jsxIdentifier('variant'), t.stringLiteral(variant))
              );
            }
            
            // size 속성 추가
            if (size !== 'medium') {
              node.openingElement.attributes.push(
                t.jsxAttribute(t.jsxIdentifier('size'), t.stringLiteral(size))
              );
            }
            
            // 버튼 관련 클래스 제거
            const cleanedClassName = className
              .split(' ')
              .filter(cls => !cls.match(/btn|button|primary|secondary|danger|small|large|submit|cancel/))
              .join(' ')
              .trim();
            
            if (cleanedClassName) {
              classNameAttr.value.value = cleanedClassName;
            } else {
              // 빈 className은 제거
              const index = node.openingElement.attributes.indexOf(classNameAttr);
              node.openingElement.attributes.splice(index, 1);
            }
          }
          
          // disabled 속성 확인 및 수정
          const disabledAttr = node.openingElement.attributes.find(
            attr => t.isJSXAttribute(attr) && attr.name.name === 'disabled'
          );
          
          // loading 상태 처리 (data-loading 속성이 있으면)
          const loadingAttr = node.openingElement.attributes.find(
            attr => t.isJSXAttribute(attr) && attr.name.name === 'data-loading'
          );
          if (loadingAttr) {
            node.openingElement.attributes.push(
              t.jsxAttribute(t.jsxIdentifier('loading'), t.jsxExpressionContainer(t.booleanLiteral(true)))
            );
            // data-loading 제거
            const index = node.openingElement.attributes.indexOf(loadingAttr);
            node.openingElement.attributes.splice(index, 1);
          }
          
          modified = true;
          totalMigrated++;
          
          migrationLog.push({
            file: path.relative(process.cwd(), file),
            line: node.loc?.start.line,
            before: 'button',
            after: 'UnifiedButton'
          });
        }
        
        // Button 컴포넌트도 변환 (커스텀 Button 컴포넌트)
        if (node.openingElement.name.name === 'Button' && 
            !file.includes('UnifiedButton')) {
          // 이미 다른 Button 컴포넌트를 사용중이면 UnifiedButton으로 변경
          node.openingElement.name.name = 'UnifiedButton';
          if (node.closingElement) {
            node.closingElement.name.name = 'UnifiedButton';
          }
          
          modified = true;
          totalMigrated++;
        }
      }
    });

    if (modified) {
      // import 경로 조정 (상대 경로)
      if (importAdded) {
        traverse(ast, {
          ImportDeclaration(path) {
            if (path.node.source.value === '../../components/unified/UnifiedButton') {
              const depth = file.split('/').length - 2; // src 제외
              const prefix = '../'.repeat(depth - 1);
              path.node.source.value = prefix + 'components/unified/UnifiedButton';
            }
          }
        });
      }
      
      const output = generate(ast, {
        retainLines: true,
        concise: false
      });
      
      fs.writeFileSync(file, output.code);
      filesModified++;
      console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), file)}: ${migrationLog.filter(log => log.file === path.relative(process.cwd(), file)).length}개 변환됨`);
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} ${path.relative(process.cwd(), file)}: ${error.message}`);
  }
});

// 결과 출력
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ 완료!${colors.reset}`);
console.log(`  - 총 ${totalMigrated}개의 버튼 마이그레이션됨`);
console.log(`  - ${filesModified}개 파일 수정됨`);

// 마이그레이션 리포트 저장
const report = {
  timestamp: new Date().toISOString(),
  totalMigrated,
  filesModified,
  migrations: migrationLog
};

fs.writeFileSync('button-migration-report.json', JSON.stringify(report, null, 2));
console.log(`\n${colors.gray}상세 보고서가 button-migration-report.json에 저장되었습니다.${colors.reset}`);

console.log(`\n${colors.yellow}💡 다음 단계:${colors.reset}`);
console.log('  1. 변환된 파일들을 확인하세요');
console.log('  2. import 경로가 올바른지 확인하세요');
console.log('  3. 스타일이 제대로 적용되는지 테스트하세요');
console.log('  4. 필요한 경우 variant나 size를 조정하세요');