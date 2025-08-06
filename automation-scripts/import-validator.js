#!/usr/bin/env node

/**
 * VideoPlanet Import 검증 도구
 * FolderOpenOutlined 같은 런타임 오류를 방지하는 완벽한 자동화 시스템
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const colors = require('colors');

// 설정
const config = {
  rootPath: path.join(__dirname, '../vridge_front'),
  patterns: [
    'src/**/*.{js,jsx}',
    'pages/**/*.{js,jsx}',
    'components/**/*.{js,jsx}',
  ],
  knownPackages: {
    // Ant Design
    'antd': ['Button', 'Input', 'Modal', 'Table', 'Form', 'Select', 'DatePicker', 'Upload', 'Spin'],
    '@ant-design/icons': ['FolderOpenOutlined', 'UserOutlined', 'SettingOutlined', 'DeleteOutlined', 'EditOutlined', 'PlusOutlined'],
    
    // React
    'react': ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'createContext', 'useContext'],
    'react-dom': ['render', 'createPortal'],
    
    // Next.js
    'next/router': ['useRouter', 'withRouter'],
    'next/link': ['Link'],
    'next/head': ['Head'],
    'next/image': ['Image'],
    'next/script': ['Script'],
    
    // Redux
    'react-redux': ['useSelector', 'useDispatch', 'Provider', 'connect'],
    '@reduxjs/toolkit': ['createSlice', 'configureStore', 'createAsyncThunk'],
    
    // 기타 라이브러리
    'axios': ['axios'],
    'moment': ['moment'],
    'classnames': ['classnames', 'cn'],
    'lodash': ['_'],
  },
  ignorePaths: [
    'node_modules/',
    '.next/',
    'dist/',
    'build/',
    'out/',
    '.git/',
  ],
};

class ImportValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixedImports = [];
    this.checkedFiles = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;
    
    switch (type) {
      case 'error':
        console.log(`${prefix} ${'❌'.red} ${message.red}`);
        break;
      case 'warning':
        console.log(`${prefix} ${'⚠️'.yellow} ${message.yellow}`);
        break;
      case 'success':
        console.log(`${prefix} ${'✅'.green} ${message.green}`);
        break;
      case 'info':
      default:
        console.log(`${prefix} ${'ℹ️'.blue} ${message.blue}`);
        break;
    }
  }

  // 파일에서 import 구문 추출
  extractImports(content) {
    const imports = [];
    
    // ES6 import 구문 정규식
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    
    // require 구문 정규식
    const requireRegex = /(?:const|let|var)\s+(?:\{[^}]*\}|\w+)\s*=\s*require\(['"`]([^'"`]+)['"`]\)/g;
    
    let match;
    
    // ES6 imports
    while ((match = importRegex.exec(content)) !== null) {
      const fullImport = match[0];
      const moduleName = match[1];
      
      // import 구문에서 사용하는 식별자들 추출
      const identifiers = this.extractIdentifiersFromImport(fullImport);
      
      imports.push({
        type: 'es6',
        module: moduleName,
        identifiers,
        raw: fullImport,
      });
    }
    
    // CommonJS requires
    while ((match = requireRegex.exec(content)) !== null) {
      const fullRequire = match[0];
      const moduleName = match[1];
      
      imports.push({
        type: 'commonjs',
        module: moduleName,
        identifiers: [],
        raw: fullRequire,
      });
    }
    
    return imports;
  }

  // import 구문에서 식별자 추출
  extractIdentifiersFromImport(importStatement) {
    const identifiers = [];
    
    // 기본 import (import Something from 'module')
    const defaultImportMatch = importStatement.match(/import\s+(\w+)\s+from/);
    if (defaultImportMatch) {
      identifiers.push(defaultImportMatch[1]);
    }
    
    // Named imports (import { A, B, C } from 'module')
    const namedImportsMatch = importStatement.match(/import\s+\{([^}]+)\}\s+from/);
    if (namedImportsMatch) {
      const namedImports = namedImportsMatch[1]
        .split(',')
        .map(item => item.trim().split(' as ')[0].trim())
        .filter(item => item.length > 0);
      identifiers.push(...namedImports);
    }
    
    // Namespace import (import * as Something from 'module')
    const namespaceImportMatch = importStatement.match(/import\s+\*\s+as\s+(\w+)\s+from/);
    if (namespaceImportMatch) {
      identifiers.push(namespaceImportMatch[1]);
    }
    
    return identifiers;
  }

  // 파일에서 사용되는 식별자들 찾기
  findUsedIdentifiers(content) {
    const used = new Set();
    
    // JSX 컴포넌트 사용 (< ComponentName >)
    const jsxComponentRegex = /<(\w+)(?:\s|>)/g;
    let match;
    while ((match = jsxComponentRegex.exec(content)) !== null) {
      used.add(match[1]);
    }
    
    // 함수/변수 호출 (functionName(), variableName)
    const identifierRegex = /\b([A-Z][a-zA-Z0-9]*)\b/g;
    while ((match = identifierRegex.exec(content)) !== null) {
      used.add(match[1]);
    }
    
    return Array.from(used);
  }

  // 파일 검증
  async validateFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const imports = this.extractImports(content);
      const usedIdentifiers = this.findUsedIdentifiers(content);
      
      let hasErrors = false;
      let fixedContent = content;
      
      // 각 import 검증
      for (const importInfo of imports) {
        // 모듈이 존재하는지 확인
        if (!this.isValidModule(importInfo.module, filePath)) {
          this.errors.push({
            file: filePath,
            type: 'MODULE_NOT_FOUND',
            message: `모듈 '${importInfo.module}'을 찾을 수 없습니다.`,
            import: importInfo.raw,
          });
          hasErrors = true;
          continue;
        }
        
        // import한 식별자가 실제로 사용되는지 확인
        for (const identifier of importInfo.identifiers) {
          if (!usedIdentifiers.includes(identifier)) {
            this.warnings.push({
              file: filePath,
              type: 'UNUSED_IMPORT',
              message: `'${identifier}'가 import되었지만 사용되지 않습니다.`,
              identifier,
            });
          }
        }
        
        // 알려진 패키지의 export 검증
        if (config.knownPackages[importInfo.module]) {
          const validExports = config.knownPackages[importInfo.module];
          for (const identifier of importInfo.identifiers) {
            if (!validExports.includes(identifier)) {
              this.errors.push({
                file: filePath,
                type: 'INVALID_EXPORT',
                message: `'${importInfo.module}'에서 '${identifier}'를 export하지 않습니다.`,
                identifier,
                validExports,
              });
              hasErrors = true;
            }
          }
        }
      }
      
      // 사용되는 식별자 중 import되지 않은 것들 찾기
      for (const identifier of usedIdentifiers) {
        const isImported = imports.some(imp => imp.identifiers.includes(identifier));
        if (!isImported && this.mightNeedImport(identifier)) {
          const suggestedImport = this.suggestImport(identifier);
          if (suggestedImport) {
            this.errors.push({
              file: filePath,
              type: 'MISSING_IMPORT',
              message: `'${identifier}'가 사용되었지만 import되지 않았습니다.`,
              suggestion: suggestedImport,
              identifier,
            });
            hasErrors = true;
            
            // 자동으로 import 추가
            const importStatement = `import { ${identifier} } from '${suggestedImport}';\n`;
            if (!content.includes(importStatement.trim())) {
              // 첫 번째 import 뒤에 추가
              const firstImportIndex = content.indexOf('import ');
              if (firstImportIndex !== -1) {
                const nextLineIndex = content.indexOf('\n', firstImportIndex);
                if (nextLineIndex !== -1) {
                  fixedContent = fixedContent.slice(0, nextLineIndex + 1) + 
                               importStatement + 
                               fixedContent.slice(nextLineIndex + 1);
                  
                  this.fixedImports.push({
                    file: filePath,
                    added: importStatement.trim(),
                  });
                }
              } else {
                // import가 없으면 파일 맨 위에 추가
                fixedContent = importStatement + '\n' + fixedContent;
                this.fixedImports.push({
                  file: filePath,
                  added: importStatement.trim(),
                });
              }
            }
          }
        }
      }
      
      // 수정된 내용이 있으면 파일에 쓰기
      if (fixedContent !== content) {
        await fs.writeFile(filePath, fixedContent, 'utf-8');
        this.log(`자동 수정됨: ${filePath}`, 'success');
      }
      
      this.checkedFiles++;
      return !hasErrors;
      
    } catch (error) {
      this.errors.push({
        file: filePath,
        type: 'FILE_READ_ERROR',
        message: `파일 읽기 오류: ${error.message}`,
      });
      return false;
    }
  }

  // 모듈이 유효한지 확인
  isValidModule(moduleName, currentFilePath) {
    // 상대 경로인 경우
    if (moduleName.startsWith('.')) {
      const fullPath = path.resolve(path.dirname(currentFilePath), moduleName);
      const possibleExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
      
      // 정확한 파일 경로 확인
      for (const ext of possibleExtensions) {
        if (fs.existsSync(fullPath + ext)) {
          return true;
        }
      }
      
      // index 파일 확인
      if (fs.existsSync(path.join(fullPath, 'index.js')) ||
          fs.existsSync(path.join(fullPath, 'index.jsx'))) {
        return true;
      }
      
      return false;
    }
    
    // node_modules 패키지인 경우
    try {
      require.resolve(moduleName, { paths: [path.dirname(currentFilePath)] });
      return true;
    } catch {
      return false;
    }
  }

  // import가 필요할 가능성이 있는 식별자인지 확인
  mightNeedImport(identifier) {
    // 대문자로 시작하는 식별자 (컴포넌트 또는 클래스)
    if (identifier[0] >= 'A' && identifier[0] <= 'Z') {
      return true;
    }
    
    // 알려진 함수들
    const knownFunctions = ['useState', 'useEffect', 'useCallback', 'useMemo', 'axios'];
    return knownFunctions.includes(identifier);
  }

  // import 제안
  suggestImport(identifier) {
    for (const [module, exports] of Object.entries(config.knownPackages)) {
      if (exports.includes(identifier)) {
        return module;
      }
    }
    return null;
  }

  // 모든 파일 검증
  async validateAll() {
    this.log('📦 Import 검증을 시작합니다...', 'info');
    
    const allFiles = [];
    
    // 모든 패턴의 파일들 수집
    for (const pattern of config.patterns) {
      const files = glob.sync(pattern, { 
        cwd: config.rootPath,
        ignore: config.ignorePaths.map(p => p + '**'),
      });
      
      allFiles.push(...files.map(f => path.join(config.rootPath, f)));
    }
    
    this.log(`총 ${allFiles.length}개 파일을 검사합니다.`, 'info');
    
    let validFiles = 0;
    
    for (const file of allFiles) {
      const isValid = await this.validateFile(file);
      if (isValid) {
        validFiles++;
      }
    }
    
    // 결과 출력
    this.printResults(validFiles, allFiles.length);
    
    // 오류가 있으면 프로세스 종료
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }

  // 결과 출력
  printResults(validFiles, totalFiles) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Import 검증 결과'.bold);
    console.log('='.repeat(60));
    
    console.log(`📁 총 파일: ${totalFiles}`);
    console.log(`✅ 유효한 파일: ${validFiles.toString().green}`);
    console.log(`❌ 오류 파일: ${(totalFiles - validFiles).toString().red}`);
    console.log(`⚠️ 경고: ${this.warnings.length.toString().yellow}`);
    console.log(`🔧 자동 수정: ${this.fixedImports.length.toString().blue}`);
    
    if (this.fixedImports.length > 0) {
      console.log('\n🔧 자동 수정된 Import:');
      this.fixedImports.forEach(fix => {
        console.log(`  ✓ ${fix.file}: ${fix.added.green}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ 경고:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning.file}: ${warning.message.yellow}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ 오류:');
      this.errors.forEach(error => {
        console.log(`  ${error.file}: ${error.message.red}`);
        if (error.suggestion) {
          console.log(`    💡 제안: import { ${error.identifier} } from '${error.suggestion}';`.cyan);
        }
        if (error.validExports) {
          console.log(`    📋 유효한 exports: ${error.validExports.join(', ').cyan}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('🎉 모든 Import가 올바릅니다!'.green.bold);
    } else {
      console.log(`❌ ${this.errors.length}개의 오류를 해결해야 합니다.`.red.bold);
    }
  }
}

// 메인 실행
if (require.main === module) {
  const validator = new ImportValidator();
  validator.validateAll().catch(error => {
    console.error('❌ 검증 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = ImportValidator;