#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 결과 저장
const importMap = new Map();
const styleUsage = new Map();

// SCSS 파일별 import 찾기
function findImportsForStyle(stylePath) {
  const fileName = path.basename(stylePath);
  const fileNameWithoutExt = fileName.replace('.scss', '');
  const moduleNameWithoutExt = fileNameWithoutExt.replace('.module', '');
  
  // 가능한 import 패턴들
  const patterns = [
    fileName,
    fileNameWithoutExt,
    moduleNameWithoutExt,
    `styles from '.*${fileName}'`,
    `styles from ".*${fileName}"`,
    `'.*${fileName}'`,
    `".*${fileName}"`,
    `\./${fileName}`,
    `../${fileName}`
  ];
  
  const imports = [];
  
  // 모든 소스 파일 검색
  const sourceFiles = glob.sync('src/**/*.{tsx,jsx,ts,js}', {
    ignore: ['**/node_modules/**', '**/scripts/**']
  });
  
  sourceFiles.forEach(sourceFile => {
    const content = fs.readFileSync(sourceFile, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        if (line.includes(pattern) && (line.includes('import') || line.includes('require'))) {
          imports.push({
            file: sourceFile,
            line: index + 1,
            content: line.trim(),
            pattern: pattern
          });
        }
      });
    });
    
    // CSS 모듈 사용 패턴 확인
    if (fileNameWithoutExt.includes('.module')) {
      const styleVarPattern = /styles\.\w+/g;
      const matches = content.match(styleVarPattern);
      if (matches && imports.length > 0) {
        styleUsage.set(stylePath, {
          imports: imports.length,
          usages: matches.length,
          classes: [...new Set(matches.map(m => m.replace('styles.', '')))]
        });
      }
    }
  });
  
  return imports;
}

// 상호 참조 맵 생성
function buildCrossReference() {
  const crossRef = {
    used: new Map(),      // 사용되는 스타일 파일
    unused: [],           // 사용되지 않는 스타일 파일
    maybeUnused: [],      // 확실하지 않은 파일
    duplicates: new Map() // 중복 import
  };
  
  const scssFiles = glob.sync('src/**/*.scss', {
    ignore: ['**/node_modules/**', '**/design-system/**']
  });
  
  console.log(`\n🔍 총 ${scssFiles.length}개의 SCSS 파일 분석 중...\n`);
  
  scssFiles.forEach(scssFile => {
    const imports = findImportsForStyle(scssFile);
    
    if (imports.length > 0) {
      crossRef.used.set(scssFile, imports);
      importMap.set(scssFile, imports);
    } else {
      // design-system 폴더의 파일들은 제외
      if (!scssFile.includes('design-system')) {
        crossRef.unused.push(scssFile);
      }
    }
  });
  
  return crossRef;
}

// 안전하게 삭제 가능한 파일 찾기
function findSafeToDelete(crossRef) {
  const safeToDelete = [];
  const maybeDelete = [];
  
  crossRef.unused.forEach(file => {
    const fileName = path.basename(file);
    
    // 확실히 안전한 패턴
    if (fileName.includes('Fix.scss') || 
        fileName.includes('Temp.scss') ||
        fileName.includes('Old.scss') ||
        fileName.includes('Backup.scss') ||
        fileName.includes('Copy.scss')) {
      safeToDelete.push(file);
    }
    // 추가 확인 필요
    else if (fileName.includes('Test.scss') ||
             fileName.includes('Demo.scss')) {
      maybeDelete.push(file);
    }
  });
  
  return { safeToDelete, maybeDelete };
}

// 중복 스타일 패턴 찾기
function findDuplicateStyles() {
  const duplicates = new Map();
  
  // 비슷한 이름의 파일들 그룹화
  const fileGroups = new Map();
  
  const scssFiles = glob.sync('src/**/*.scss', {
    ignore: ['**/node_modules/**']
  });
  
  scssFiles.forEach(file => {
    const baseName = path.basename(file)
      .replace(/Fix|New|Old|V\d+|Redesign|Enhanced|Improved/gi, '')
      .replace('.module', '')
      .replace('.scss', '');
    
    if (!fileGroups.has(baseName)) {
      fileGroups.set(baseName, []);
    }
    fileGroups.get(baseName).push(file);
  });
  
  // 2개 이상인 그룹만 중복으로 간주
  fileGroups.forEach((files, baseName) => {
    if (files.length > 1) {
      duplicates.set(baseName, files);
    }
  });
  
  return duplicates;
}

// 메인 실행
async function main() {
  console.log('🎨 VideoPlanet 스타일 Import 분석 시작\n');
  
  const crossRef = buildCrossReference();
  const { safeToDelete, maybeDelete } = findSafeToDelete(crossRef);
  const duplicates = findDuplicateStyles();
  
  // 결과 출력
  console.log('📊 분석 결과\n');
  console.log('✅ 사용 중인 스타일 파일:', crossRef.used.size);
  console.log('❌ 사용되지 않는 스타일 파일:', crossRef.unused.length);
  console.log('🗑️  안전하게 삭제 가능:', safeToDelete.length);
  console.log('⚠️  추가 확인 필요:', maybeDelete.length);
  console.log('♻️  중복 스타일 그룹:', duplicates.size);
  
  // 상세 결과
  if (safeToDelete.length > 0) {
    console.log('\n🗑️  즉시 삭제 가능한 파일:');
    safeToDelete.forEach(file => {
      console.log(`  rm ${file}`);
    });
  }
  
  if (crossRef.unused.length > 0) {
    console.log('\n❌ 사용되지 않는 파일 (상위 10개):');
    crossRef.unused.slice(0, 10).forEach(file => {
      console.log(`  ${file}`);
    });
  }
  
  if (duplicates.size > 0) {
    console.log('\n♻️  중복 스타일 그룹 (통합 필요):');
    Array.from(duplicates.entries())
      .slice(0, 5)
      .forEach(([baseName, files]) => {
        console.log(`\n  ${baseName} (${files.length}개):`);
        files.forEach(file => {
          const isUsed = crossRef.used.has(file) ? '✓' : '✗';
          console.log(`    ${isUsed} ${file}`);
        });
      });
  }
  
  // CSS 모듈 사용 통계
  if (styleUsage.size > 0) {
    console.log('\n📈 CSS 모듈 사용 통계 (상위 5개):');
    Array.from(styleUsage.entries())
      .sort((a, b) => b[1].usages - a[1].usages)
      .slice(0, 5)
      .forEach(([file, usage]) => {
        console.log(`  ${path.basename(file)}: ${usage.usages}회 사용, ${usage.classes.length}개 클래스`);
      });
  }
  
  // 삭제 스크립트 생성
  if (safeToDelete.length > 0) {
    const deleteScript = `#!/bin/bash
# 안전하게 삭제 가능한 스타일 파일들
# 생성일: ${new Date().toISOString()}

echo "🗑️  ${safeToDelete.length}개 파일 삭제 시작..."

${safeToDelete.map(file => `rm "${file}"`).join('\n')}

echo "✅ 삭제 완료!"
`;
    
    fs.writeFileSync('scripts/delete-unused-styles.sh', deleteScript);
    console.log('\n✅ 삭제 스크립트 생성됨: scripts/delete-unused-styles.sh');
    console.log('   실행: bash scripts/delete-unused-styles.sh');
  }
  
  // 상세 리포트 생성
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: crossRef.used.size + crossRef.unused.length,
      used: crossRef.used.size,
      unused: crossRef.unused.length,
      safeToDelete: safeToDelete.length,
      needsReview: maybeDelete.length,
      duplicateGroups: duplicates.size
    },
    used: Array.from(crossRef.used.entries()).map(([file, imports]) => ({
      file,
      importCount: imports.length,
      importedBy: imports.map(i => i.file)
    })),
    unused: crossRef.unused,
    safeToDelete,
    maybeDelete,
    duplicates: Array.from(duplicates.entries()),
    styleUsage: Array.from(styleUsage.entries())
  };
  
  fs.writeFileSync('style-import-analysis.json', JSON.stringify(report, null, 2));
  console.log('\n📄 상세 리포트 생성됨: style-import-analysis.json');
}

// 실행
main().catch(console.error);