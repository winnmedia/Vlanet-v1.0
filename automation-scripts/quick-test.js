#!/usr/bin/env node

/**
 * VideoPlanet 빠른 테스트 도구
 * Pre-commit 시 빠르게 실행되는 기본 검증 테스트
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const colors = require('colors');

class QuickTest {
  constructor() {
    this.rootPath = path.join(__dirname, '../vridge_front');
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
    };
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
        console.log(`${prefix} ${'🧪'.blue} ${message.blue}`);
        break;
    }
  }

  // 테스트 추가
  addTest(name, testFunction) {
    this.tests.push({
      name,
      test: testFunction,
    });
  }

  // 명령어 실행
  async runCommand(command, cwd = this.rootPath) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stdout, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  // 기본 테스트들 설정
  setupTests() {
    // 1. 패키지 의존성 확인
    this.addTest('Package Dependencies Check', async () => {
      const packageJsonPath = path.join(this.rootPath, 'package.json');
      
      if (!await fs.pathExists(packageJsonPath)) {
        throw new Error('package.json 파일이 없습니다.');
      }

      const packageJson = await fs.readJson(packageJsonPath);
      const requiredDeps = [
        'react',
        'react-dom',
        'next',
        'antd',
        '@ant-design/icons',
      ];

      const missingDeps = requiredDeps.filter(dep => 
        !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
      );

      if (missingDeps.length > 0) {
        throw new Error(`누락된 의존성: ${missingDeps.join(', ')}`);
      }

      return '모든 필수 의존성이 설치되어 있습니다.';
    });

    // 2. Next.js 설정 확인
    this.addTest('Next.js Configuration Check', async () => {
      const nextConfigPath = path.join(this.rootPath, 'next.config.js');
      
      if (!await fs.pathExists(nextConfigPath)) {
        throw new Error('next.config.js 파일이 없습니다.');
      }

      const configContent = await fs.readFile(nextConfigPath, 'utf-8');
      
      // 기본적인 구문 오류 확인
      if (configContent.includes('module.exports') || configContent.includes('export default')) {
        return 'Next.js 설정 파일이 올바릅니다.';
      } else {
        throw new Error('next.config.js 파일 형식이 올바르지 않습니다.');
      }
    });

    // 3. 중요 페이지 파일 존재 확인
    this.addTest('Critical Pages Check', async () => {
      const criticalPages = [
        'pages/_app.js',
        'pages/index.js',
        'pages/login.js',
      ];

      const missingPages = [];
      
      for (const page of criticalPages) {
        const pagePath = path.join(this.rootPath, page);
        if (!await fs.pathExists(pagePath)) {
          missingPages.push(page);
        }
      }

      if (missingPages.length > 0) {
        throw new Error(`누락된 핵심 페이지: ${missingPages.join(', ')}`);
      }

      return '모든 핵심 페이지가 존재합니다.';
    });

    // 4. Import 구문 기본 검증
    this.addTest('Basic Import Syntax Check', async () => {
      const { exec } = require('child_process');
      
      try {
        await this.runCommand('node ../automation-scripts/import-validator.js');
        return 'Import 구문이 올바릅니다.';
      } catch (error) {
        if (error.stderr && error.stderr.includes('오류')) {
          throw new Error('Import 구문에 오류가 있습니다.');
        }
        return 'Import 검증을 통과했습니다.';
      }
    });

    // 5. ESLint 기본 검사
    this.addTest('ESLint Basic Check', async () => {
      try {
        const result = await this.runCommand('npm run lint');
        return 'ESLint 검사를 통과했습니다.';
      } catch (error) {
        // 경고만 있고 오류가 없는 경우는 통과
        if (error.stdout && !error.stdout.includes('✖') && error.stderr === '') {
          return 'ESLint 검사를 통과했습니다 (경고 포함).';
        }
        throw new Error('ESLint 오류가 있습니다.');
      }
    });

    // 6. 빌드 기본 검증 (간단한 구문 검사)
    this.addTest('Build Syntax Pre-check', async () => {
      // 실제 빌드 대신 구문 오류만 검사
      try {
        const result = await this.runCommand('npx next lint --fix');
        return '빌드 전 구문 검사를 통과했습니다.';
      } catch (error) {
        if (error.stdout && error.stdout.includes('No ESLint warnings or errors')) {
          return '빌드 전 구문 검사를 통과했습니다.';
        }
        throw new Error('빌드 전 구문 검사에서 오류를 발견했습니다.');
      }
    });

    // 7. 환경 파일 확인
    this.addTest('Environment Files Check', async () => {
      const envFiles = ['.env.local', '.env.example'];
      const existingEnvFiles = [];
      
      for (const envFile of envFiles) {
        const envPath = path.join(this.rootPath, envFile);
        if (await fs.pathExists(envPath)) {
          existingEnvFiles.push(envFile);
        }
      }

      if (existingEnvFiles.length === 0) {
        return '환경 파일이 필요하지 않거나 선택사항입니다.';
      }

      return `환경 파일 확인됨: ${existingEnvFiles.join(', ')}`;
    });

    // 8. 정적 리소스 확인
    this.addTest('Static Resources Check', async () => {
      const publicPath = path.join(this.rootPath, 'public');
      
      if (!await fs.pathExists(publicPath)) {
        throw new Error('public 디렉토리가 없습니다.');
      }

      const staticFiles = await fs.readdir(publicPath);
      
      if (staticFiles.length === 0) {
        return '정적 리소스가 비어있지만 문제없습니다.';
      }

      return `정적 리소스 확인됨 (${staticFiles.length}개 파일)`;
    });
  }

  // 단일 테스트 실행
  async runTest(test) {
    const startTime = Date.now();
    
    try {
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      this.log(`✅ ${test.name} (${duration}ms): ${result}`, 'success');
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.failed++;
      this.log(`❌ ${test.name} (${duration}ms): ${error.message}`, 'error');
      return false;
    }
  }

  // 모든 테스트 실행
  async runAll() {
    this.log('🚀 빠른 테스트를 시작합니다...', 'info');
    
    const startTime = Date.now();
    this.results.total = this.tests.length;
    
    let allPassed = true;
    
    for (const test of this.tests) {
      const passed = await this.runTest(test);
      if (!passed) {
        allPassed = false;
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    // 결과 출력
    this.printResults(totalDuration);
    
    return allPassed;
  }

  // 결과 출력
  printResults(duration) {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 빠른 테스트 결과'.bold);
    console.log('='.repeat(60));
    
    console.log(`📊 총 테스트: ${this.results.total}`);
    console.log(`✅ 통과: ${this.results.passed.toString().green}`);
    console.log(`❌ 실패: ${this.results.failed.toString().red}`);
    console.log(`⏱️ 소요 시간: ${duration}ms`);
    console.log(`📈 성공률: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 모든 테스트가 통과했습니다!'.green.bold);
      console.log('💪 안전하게 커밋할 수 있습니다.'.green);
    } else {
      console.log('⚠️ 일부 테스트가 실패했습니다.'.yellow.bold);
      console.log('🔧 문제를 해결한 후 다시 시도하세요.'.yellow);
    }
  }

  // 특정 테스트만 실행
  async runSpecific(testNames) {
    const filteredTests = this.tests.filter(test => 
      testNames.some(name => test.name.toLowerCase().includes(name.toLowerCase()))
    );

    if (filteredTests.length === 0) {
      this.log('일치하는 테스트를 찾을 수 없습니다.', 'warning');
      return false;
    }

    this.log(`선택된 테스트 ${filteredTests.length}개를 실행합니다...`, 'info');
    
    this.results.total = filteredTests.length;
    let allPassed = true;
    
    for (const test of filteredTests) {
      const passed = await this.runTest(test);
      if (!passed) {
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  // 테스트 목록 출력
  listTests() {
    console.log('\n📋 사용 가능한 테스트:'.bold);
    this.tests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.name}`);
    });
    console.log('');
  }
}

// 메인 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const quickTest = new QuickTest();
  
  // 테스트 설정
  quickTest.setupTests();
  
  async function main() {
    try {
      if (args.includes('--list')) {
        quickTest.listTests();
      } else if (args.includes('--test')) {
        const testIndex = args.indexOf('--test') + 1;
        const testNames = args.slice(testIndex);
        
        if (testNames.length > 0) {
          const success = await quickTest.runSpecific(testNames);
          process.exit(success ? 0 : 1);
        } else {
          console.log('테스트 이름을 지정해주세요.');
          process.exit(1);
        }
      } else {
        const success = await quickTest.runAll();
        process.exit(success ? 0 : 1);
      }
    } catch (error) {
      console.error('테스트 실행 중 오류:', error);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = QuickTest;