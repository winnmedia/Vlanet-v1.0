#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// 안전한 콘솔 로그 제거 도구
class SafeConsoleRemover {
  constructor() {
    this.stats = {
      analyzed: 0,
      removed: 0,
      wrapped: 0,
      kept: 0,
      errors: 0
    };
    
    // 프로덕션에서 유지해야 하는 로그 패턴
    this.productionPatterns = [
      // 에러 관련
      /error|Error|ERROR/,
      /exception|Exception/,
      /critical|Critical/,
      /fatal|Fatal/,
      
      // 보안 관련
      /security|Security/,
      /unauthorized|Unauthorized/,
      /forbidden|Forbidden/,
      
      // 모니터링/분석
      /analytics|Analytics/,
      /monitoring|Monitoring/,
      /metric|Metric/,
      /performance|Performance/,
      
      // 중요 이벤트
      /payment|Payment/,
      /transaction|Transaction/,
      /subscription|Subscription/
    ];
    
    // 개발 환경에서만 필요한 로그 패턴
    this.developmentPatterns = [
      /debug|Debug|DEBUG/,
      /test|Test|TEST/,
      /todo|TODO/,
      /fixme|FIXME/,
      /temp|Temp|TEMP/,
      /check|Check/,
      /here|Here/,
      /render|Render/,
      /mount|Mount/,
      /state|State/,
      /props|Props/
    ];
  }
  
  processFiles(srcDir = './src', options = {}) {
    console.log('🔍 콘솔 로그 처리 시작...\n');
    
    const files = glob.sync(`${srcDir}/**/*.{js,jsx,ts,tsx}`, {
      ignore: [
        '**/node_modules/**',
        '**/build/**',
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}'
      ]
    });
    
    files.forEach(file => {
      try {
        this.processFile(file, options);
      } catch (error) {
        console.error(`❌ 파일 처리 중 오류: ${file}`);
        console.error(error.message);
        this.stats.errors++;
      }
    });
    
    this.printReport();
  }
  
  processFile(filePath, options) {
    const {
      mode = 'analyze', // 'analyze', 'remove', 'wrap'
      backup = true,
      dryRun = true
    } = options;
    
    const code = fs.readFileSync(filePath, 'utf-8');
    
    // Babel AST 파싱
    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'dynamicImport',
          'classProperties',
          'optionalChaining',
          'nullishCoalescingOperator'
        ]
      });
    } catch (parseError) {
      console.warn(`⚠️  파싱 실패: ${filePath}`);
      return;
    }
    
    let modified = false;
    const fileName = path.basename(filePath);
    const isUtilFile = filePath.includes('/utils/') || filePath.includes('/util/');
    const isConfigFile = filePath.includes('/config/');
    const isApiFile = filePath.includes('/api/');
    
    this.stats.analyzed++;
    
    traverse(ast, {
      CallExpression: (nodePath) => {
        const { node } = nodePath;
        
        // console.* 호출 확인
        if (
          t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object, { name: 'console' })
        ) {
          const method = node.callee.property.name;
          const args = node.arguments;
          
          // 로그 내용 분석
          const logContent = this.extractLogContent(args);
          const decision = this.makeDecision(method, logContent, {
            fileName,
            filePath,
            isUtilFile,
            isConfigFile,
            isApiFile
          });
          
          if (mode === 'analyze') {
            console.log(`📍 ${filePath}:${node.loc?.start.line || '?'}`);
            console.log(`   ${method}: ${logContent.substring(0, 50)}...`);
            console.log(`   결정: ${decision}\n`);
          }
          
          // 처리 실행
          if (!dryRun) {
            switch (decision) {
              case 'remove':
                if (mode === 'remove' || mode === 'wrap') {
                  this.removeConsoleLog(nodePath);
                  modified = true;
                  this.stats.removed++;
                }
                break;
                
              case 'wrap':
                if (mode === 'wrap') {
                  this.wrapWithEnvCheck(nodePath);
                  modified = true;
                  this.stats.wrapped++;
                }
                break;
                
              case 'keep':
                this.stats.kept++;
                break;
            }
          }
        }
      }
    });
    
    // 수정된 경우 파일 저장
    if (modified && !dryRun) {
      if (backup) {
        fs.copyFileSync(filePath, `${filePath}.backup-console`);
      }
      
      const { code: newCode } = generate(ast, {
        retainLines: true,
        concise: false
      });
      
      fs.writeFileSync(filePath, newCode);
      console.log(`✅ 수정됨: ${filePath}`);
    }
  }
  
  extractLogContent(args) {
    if (args.length === 0) return '';
    
    const firstArg = args[0];
    
    // 문자열 리터럴
    if (t.isStringLiteral(firstArg)) {
      return firstArg.value;
    }
    
    // 템플릿 리터럴
    if (t.isTemplateLiteral(firstArg)) {
      return firstArg.quasis.map(q => q.value.raw).join('');
    }
    
    // 변수나 표현식
    return '[expression]';
  }
  
  makeDecision(method, content, context) {
    const { fileName, isUtilFile, isConfigFile, isApiFile } = context;
    
    // 1. 에러와 경고는 기본적으로 유지
    if (method === 'error' || method === 'warn') {
      // 하지만 개발용 에러는 wrap
      if (this.isDevelopmentLog(content)) {
        return 'wrap';
      }
      return 'keep';
    }
    
    // 2. 유틸리티, 설정, API 파일의 로그는 신중히 처리
    if (isUtilFile || isConfigFile || isApiFile) {
      // 중요 로그는 유지
      if (this.isProductionLog(content)) {
        return 'keep';
      }
      // 나머지는 환경 체크로 감싸기
      return 'wrap';
    }
    
    // 3. 프로덕션 로그 패턴 확인
    if (this.isProductionLog(content)) {
      return 'keep';
    }
    
    // 4. 개발 로그 패턴 확인
    if (this.isDevelopmentLog(content)) {
      return 'remove';
    }
    
    // 5. 정보성 로그는 환경 체크로 감싸기
    if (method === 'info' || method === 'log') {
      // 짧은 디버깅 로그는 제거
      if (content.length < 20 || content === '[expression]') {
        return 'remove';
      }
      return 'wrap';
    }
    
    // 6. 기본값: 제거
    return 'remove';
  }
  
  isProductionLog(content) {
    return this.productionPatterns.some(pattern => pattern.test(content));
  }
  
  isDevelopmentLog(content) {
    return this.developmentPatterns.some(pattern => pattern.test(content));
  }
  
  removeConsoleLog(nodePath) {
    const parent = nodePath.parent;
    
    // 표현식문인 경우 전체 문장 제거
    if (t.isExpressionStatement(parent)) {
      nodePath.parentPath.remove();
    } else {
      // 다른 표현식의 일부인 경우 undefined로 대체
      nodePath.replaceWith(t.identifier('undefined'));
    }
  }
  
  wrapWithEnvCheck(nodePath) {
    const envCheck = t.binaryExpression(
      '!==',
      t.memberExpression(
        t.memberExpression(
          t.identifier('process'),
          t.identifier('env')
        ),
        t.identifier('NODE_ENV')
      ),
      t.stringLiteral('production')
    );
    
    const wrappedCall = t.logicalExpression(
      '&&',
      envCheck,
      nodePath.node
    );
    
    nodePath.replaceWith(wrappedCall);
  }
  
  printReport() {
    console.log('\n📊 === 처리 결과 ===\n');
    console.log(`📁 분석된 파일: ${this.stats.analyzed}개`);
    console.log(`🗑️  제거된 로그: ${this.stats.removed}개`);
    console.log(`🔒 환경 체크 추가: ${this.stats.wrapped}개`);
    console.log(`✅ 유지된 로그: ${this.stats.kept}개`);
    console.log(`❌ 오류 발생: ${this.stats.errors}개`);
    
    const totalLogs = this.stats.removed + this.stats.wrapped + this.stats.kept;
    if (totalLogs > 0) {
      console.log('\n📈 비율 분석:');
      console.log(`  - 제거: ${((this.stats.removed / totalLogs) * 100).toFixed(1)}%`);
      console.log(`  - 조건부: ${((this.stats.wrapped / totalLogs) * 100).toFixed(1)}%`);
      console.log(`  - 유지: ${((this.stats.kept / totalLogs) * 100).toFixed(1)}%`);
    }
  }
}

// 단계별 실행 스크립트
class ConsoleCleanupOrchestrator {
  constructor() {
    this.remover = new SafeConsoleRemover();
  }
  
  async runPhased() {
    console.log('🚀 단계별 콘솔 로그 정리 시작\n');
    
    // 1단계: 분석
    console.log('📊 1단계: 전체 분석');
    this.remover.processFiles('./src', {
      mode: 'analyze',
      dryRun: true
    });
    
    // 사용자 확인
    console.log('\n계속 진행하시겠습니까? (y/n)');
    const answer = await this.getUserInput();
    
    if (answer !== 'y') {
      console.log('❌ 취소되었습니다.');
      return;
    }
    
    // 2단계: 개발 로그 제거
    console.log('\n🧹 2단계: 개발 로그 제거');
    this.remover.stats = { analyzed: 0, removed: 0, wrapped: 0, kept: 0, errors: 0 };
    this.remover.processFiles('./src', {
      mode: 'remove',
      dryRun: false,
      backup: true
    });
    
    // 3단계: 조건부 로그 처리
    console.log('\n🔒 3단계: 조건부 로그 처리');
    this.remover.stats = { analyzed: 0, removed: 0, wrapped: 0, kept: 0, errors: 0 };
    this.remover.processFiles('./src', {
      mode: 'wrap',
      dryRun: false,
      backup: false
    });
    
    console.log('\n✅ 모든 작업이 완료되었습니다!');
  }
  
  getUserInput() {
    return new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim().toLowerCase());
      });
    });
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
사용법: node safe-console-remover.js [옵션]

옵션:
  --analyze    : 분석만 수행 (기본값)
  --remove     : 불필요한 로그 제거
  --wrap       : 개발 환경 체크 추가
  --phased     : 단계별 실행
  --no-dry-run : 실제 파일 수정
  --no-backup  : 백업 생성 안 함
    `);
    process.exit(0);
  }
  
  if (args.includes('--phased')) {
    const orchestrator = new ConsoleCleanupOrchestrator();
    orchestrator.runPhased();
  } else {
    const remover = new SafeConsoleRemover();
    const options = {
      mode: args.includes('--remove') ? 'remove' : 
            args.includes('--wrap') ? 'wrap' : 'analyze',
      dryRun: !args.includes('--no-dry-run'),
      backup: !args.includes('--no-backup')
    };
    
    remover.processFiles('./src', options);
  }
}

module.exports = { SafeConsoleRemover, ConsoleCleanupOrchestrator };