const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const srcDir = path.join(__dirname, '../src');
const componentsToMigrate = [];
const migratedFiles = [];

// 파일에서 컴포넌트 마이그레이션
function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let ast;
  
  try {
    ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties']
    });
  } catch (e) {
    console.log(`  ❌ 파싱 실패: ${filePath}`);
    return;
  }

  // Import 추가 필요 여부 체크
  const importsNeeded = {
    UnifiedButton: false,
    UnifiedInput: false,
    UnifiedCard: false,
    UnifiedModal: false
  };

  const existingImports = {
    UnifiedButton: false,
    UnifiedInput: false,
    UnifiedCard: false,
    UnifiedModal: false
  };

  // 기존 import 체크
  traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (source.includes('unified/UnifiedButton')) {
        existingImports.UnifiedButton = true;
      }
      if (source.includes('unified/UnifiedInput')) {
        existingImports.UnifiedInput = true;
      }
      if (source.includes('unified/UnifiedCard')) {
        existingImports.UnifiedCard = true;
      }
      if (source.includes('unified/UnifiedModal')) {
        existingImports.UnifiedModal = true;
      }
    }
  });

  // 컴포넌트 변환
  traverse(ast, {
    JSXElement(path) {
      const elementName = path.node.openingElement.name;
      
      // button -> UnifiedButton
      if (elementName.name === 'button') {
        const attrs = path.node.openingElement.attributes;
        const hasType = attrs.some(attr => 
          attr.type === 'JSXAttribute' && attr.name.name === 'type'
        );
        
        // UnifiedButton으로 변경
        path.node.openingElement.name.name = 'UnifiedButton';
        if (path.node.closingElement) {
          path.node.closingElement.name.name = 'UnifiedButton';
        }
        
        // type 속성 추가 (없는 경우)
        if (!hasType) {
          attrs.push(t.jsxAttribute(
            t.jsxIdentifier('type'),
            t.stringLiteral('button')
          ));
        }
        
        importsNeeded.UnifiedButton = true;
        modified = true;
        componentsToMigrate.push({ file: filePath, type: 'button -> UnifiedButton' });
      }
      
      // input -> UnifiedInput
      else if (elementName.name === 'input') {
        const attrs = path.node.openingElement.attributes;
        const typeAttr = attrs.find(attr => 
          attr.type === 'JSXAttribute' && attr.name.name === 'type'
        );
        
        // checkbox와 radio는 제외
        if (typeAttr && typeAttr.value && 
            (typeAttr.value.value === 'checkbox' || typeAttr.value.value === 'radio')) {
          return;
        }
        
        // UnifiedInput으로 변경
        path.node.openingElement.name.name = 'UnifiedInput';
        path.node.openingElement.selfClosing = true;
        path.node.closingElement = null;
        
        importsNeeded.UnifiedInput = true;
        modified = true;
        componentsToMigrate.push({ file: filePath, type: 'input -> UnifiedInput' });
      }
      
      // MinimalCard -> UnifiedCard
      else if (elementName.name === 'MinimalCard') {
        path.node.openingElement.name.name = 'UnifiedCard';
        if (path.node.closingElement) {
          path.node.closingElement.name.name = 'UnifiedCard';
        }
        
        importsNeeded.UnifiedCard = true;
        modified = true;
        componentsToMigrate.push({ file: filePath, type: 'MinimalCard -> UnifiedCard' });
      }
      
      // Modal -> UnifiedModal
      else if (elementName.name === 'Modal' && !elementName.name.includes('Unified')) {
        path.node.openingElement.name.name = 'UnifiedModal';
        if (path.node.closingElement) {
          path.node.closingElement.name.name = 'UnifiedModal';
        }
        
        importsNeeded.UnifiedModal = true;
        modified = true;
        componentsToMigrate.push({ file: filePath, type: 'Modal -> UnifiedModal' });
      }
    }
  });

  if (modified) {
    // 필요한 import 추가
    const importStatements = [];
    
    Object.keys(importsNeeded).forEach(comp => {
      if (importsNeeded[comp] && !existingImports[comp]) {
        const importPath = filePath.includes('components/unified') 
          ? `./${comp}` 
          : filePath.includes('components')
            ? `./unified/${comp}`
            : `../components/unified/${comp}`;
            
        importStatements.push(
          t.importDeclaration(
            [t.importSpecifier(t.identifier(comp), t.identifier(comp))],
            t.stringLiteral(importPath)
          )
        );
      }
    });

    // 기존 import 제거
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        if ((source.includes('MinimalCard') && importsNeeded.UnifiedCard) ||
            (source.includes('/Modal') && importsNeeded.UnifiedModal) ||
            (source.includes('/Button') && importsNeeded.UnifiedButton) ||
            (source.includes('/Input') && importsNeeded.UnifiedInput)) {
          path.remove();
        }
      }
    });

    // 새 import 추가
    if (importStatements.length > 0) {
      const lastImportIndex = ast.program.body.findIndex(node => 
        node.type !== 'ImportDeclaration'
      );
      ast.program.body.splice(lastImportIndex, 0, ...importStatements);
    }

    // 코드 생성 및 저장
    const { code } = generate(ast, { 
      retainLines: true,
      retainFunctionParens: true
    });
    
    fs.writeFileSync(filePath, code);
    migratedFiles.push(filePath);
    console.log(`  ✅ 마이그레이션 완료: ${path.relative(srcDir, filePath)}`);
  }
}

// 디렉토리 순회
function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('unified')) {
      walkDirectory(filePath);
    } else if (file.endsWith('.jsx') && !file.includes('.test.') && !file.includes('.spec.')) {
      console.log(`🔍 검사 중: ${path.relative(srcDir, filePath)}`);
      migrateFile(filePath);
    }
  });
}

console.log('🚀 컴포넌트 마이그레이션 시작...\n');
walkDirectory(srcDir);

// 결과 출력
console.log('\n📊 마이그레이션 결과:');
console.log(`✅ 마이그레이션된 파일: ${migratedFiles.length}개`);
console.log(`📝 총 변경사항: ${componentsToMigrate.length}개`);

// 타입별 집계
const typeCounts = {};
componentsToMigrate.forEach(item => {
  typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
});

console.log('\n📈 타입별 변경사항:');
Object.entries(typeCounts).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count}개`);
});