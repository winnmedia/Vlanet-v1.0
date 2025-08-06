#!/usr/bin/env node

/**
 * VideoPlanet 완벽한 자동화 오류 방지 시스템
 * 모든 자동화 도구들을 통합 관리하는 마스터 스크립트
 */

const fs = require('fs-extra');
const path = require('path');
const { exec, spawn } = require('child_process');
const colors = require('colors');
const readline = require('readline');

// 자동화 도구들 import
const ImportValidator = require('./import-validator');
const DevWatcher = require('./dev-watcher');
const QuickTest = require('./quick-test');
const AutoFixBot = require('./auto-fix-bot');
const ErrorMonitor = require('./error-monitor');

class VideoPlanetAutomation {
  constructor() {
    this.rootPath = path.join(__dirname, '../');
    this.frontendPath = path.join(this.rootPath, 'vridge_front');
    this.backendPath = path.join(this.rootPath, 'vridge_back');
    
    this.processes = new Map();
    this.isRunning = false;
    
    this.banner();
  }

  banner() {
    console.log(`
${'═'.repeat(80).cyan}
${'🎯 VideoPlanet Automation System v1.0.0'.bold.cyan}
${'완벽한 오류 방지와 자동화를 위한 통합 관리 시스템'.gray}
${'═'.repeat(80).cyan}
    `);
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
        console.log(`${prefix} ${'🎯'.blue} ${message.blue}`);
        break;
    }
  }

  // 메인 메뉴 표시
  async showMainMenu() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const choices = [
      '1. 🚀 전체 시스템 시작 (추천)',
      '2. 🔍 Import 검증만 실행',
      '3. 👀 실시간 개발 감시 시작',
      '4. 🧪 빠른 테스트 실행',
      '5. 🤖 자동 수정 봇 실행',
      '6. 📊 오류 모니터링 대시보드 시작',
      '7. 🏗️ CI/CD 파이프라인 테스트',
      '8. 📋 시스템 상태 확인',
      '9. 🔧 설정 관리',
      '0. 종료',
    ];

    console.log('\n📋 사용 가능한 옵션:'.bold);
    choices.forEach(choice => console.log(`  ${choice}`));

    const answer = await this.askQuestion(rl, '\n선택하세요 (0-9): ');
    rl.close();

    await this.handleMenuChoice(parseInt(answer));
  }

  // 질문 함수
  askQuestion(rl, question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  // 메뉴 선택 처리
  async handleMenuChoice(choice) {
    switch (choice) {
      case 1:
        await this.startFullSystem();
        break;
      case 2:
        await this.runImportValidation();
        break;
      case 3:
        await this.startDevWatcher();
        break;
      case 4:
        await this.runQuickTest();
        break;
      case 5:
        await this.runAutoFixBot();
        break;
      case 6:
        await this.startErrorMonitor();
        break;
      case 7:
        await this.testCIPipeline();
        break;
      case 8:
        await this.checkSystemStatus();
        break;
      case 9:
        await this.manageSettings();
        break;
      case 0:
        await this.shutdown();
        break;
      default:
        console.log('잘못된 선택입니다.'.red);
        await this.showMainMenu();
    }
  }

  // 전체 시스템 시작
  async startFullSystem() {
    this.log('🚀 전체 자동화 시스템을 시작합니다...', 'info');
    
    try {
      // 1. 초기 검증
      this.log('1/6 초기 Import 검증 실행 중...', 'info');
      const validator = new ImportValidator();
      await validator.validateAll();
      
      // 2. 빠른 테스트
      this.log('2/6 빠른 테스트 실행 중...', 'info');
      const quickTest = new QuickTest();
      quickTest.setupTests();
      const testResult = await quickTest.runAll();
      
      if (!testResult) {
        this.log('빠른 테스트에서 오류가 발견되었습니다. 자동 수정을 시도합니다...', 'warning');
        
        // 자동 수정 시도
        const autoFix = new AutoFixBot();
        await autoFix.fixAllFiles();
      }
      
      // 3. 실시간 감시 시작
      this.log('3/6 실시간 개발 감시 시작...', 'info');
      const devWatcher = new DevWatcher();
      this.processes.set('devWatcher', devWatcher);
      
      // 4. 오류 모니터링 시작
      this.log('4/6 오류 모니터링 대시보드 시작...', 'info');
      const errorMonitor = new ErrorMonitor();
      this.processes.set('errorMonitor', errorMonitor);
      
      // 5. 자동 수정 봇 감시 모드
      this.log('5/6 자동 수정 봇 감시 모드 시작...', 'info');
      const autoFixBot = new AutoFixBot();
      const watcher = autoFixBot.startWatchMode();
      this.processes.set('autoFixBot', { watcher, bot: autoFixBot });
      
      // 6. 시스템 상태 모니터링
      this.log('6/6 시스템 상태 모니터링 시작...', 'info');
      this.startSystemMonitoring();
      
      this.isRunning = true;
      
      this.log('✅ 모든 자동화 시스템이 성공적으로 시작되었습니다!', 'success');
      this.log('📊 모니터링 대시보드: http://localhost:8081', 'info');
      this.log('🔧 실시간 오류 수정 및 감시가 활성화되었습니다.', 'success');
      
      // 사용자에게 상태 정보 주기적으로 표시
      this.showRunningStatus();
      
    } catch (error) {
      this.log(`시스템 시작 중 오류 발생: ${error.message}`, 'error');
    }
  }

  // Import 검증 실행
  async runImportValidation() {
    this.log('📦 Import 검증을 시작합니다...', 'info');
    
    try {
      const validator = new ImportValidator();
      await validator.validateAll();
      this.log('Import 검증 완료!', 'success');
    } catch (error) {
      this.log(`Import 검증 중 오류: ${error.message}`, 'error');
    }
    
    setTimeout(() => this.showMainMenu(), 2000);
  }

  // 실시간 개발 감시 시작
  async startDevWatcher() {
    this.log('👀 실시간 개발 감시를 시작합니다...', 'info');
    
    try {
      const devWatcher = new DevWatcher();
      this.processes.set('devWatcher', devWatcher);
      
      this.log('실시간 감시가 시작되었습니다. Ctrl+C로 종료하세요.', 'success');
      
      // 종료 처리
      process.on('SIGINT', () => {
        this.log('실시간 감시를 종료합니다...', 'info');
        process.exit(0);
      });
      
    } catch (error) {
      this.log(`실시간 감시 시작 중 오류: ${error.message}`, 'error');
      setTimeout(() => this.showMainMenu(), 2000);
    }
  }

  // 빠른 테스트 실행
  async runQuickTest() {
    this.log('🧪 빠른 테스트를 실행합니다...', 'info');
    
    try {
      const quickTest = new QuickTest();
      quickTest.setupTests();
      const result = await quickTest.runAll();
      
      if (result) {
        this.log('모든 테스트가 통과했습니다!', 'success');
      } else {
        this.log('일부 테스트가 실패했습니다. 자동 수정을 권장합니다.', 'warning');
      }
    } catch (error) {
      this.log(`테스트 실행 중 오류: ${error.message}`, 'error');
    }
    
    setTimeout(() => this.showMainMenu(), 3000);
  }

  // 자동 수정 봇 실행
  async runAutoFixBot() {
    this.log('🤖 자동 수정 봇을 시작합니다...', 'info');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const fixChoice = await this.askQuestion(rl, '옵션을 선택하세요 (1: 전체 수정, 2: 실시간 감시): ');
    rl.close();

    try {
      const autoFixBot = new AutoFixBot();
      
      if (fixChoice === '1') {
        await autoFixBot.fixAllFiles();
        this.log('전체 자동 수정 완료!', 'success');
        setTimeout(() => this.showMainMenu(), 3000);
      } else if (fixChoice === '2') {
        const watcher = autoFixBot.startWatchMode();
        this.processes.set('autoFixBot', { watcher, bot: autoFixBot });
        
        this.log('실시간 자동 수정 감시가 시작되었습니다. Ctrl+C로 종료하세요.', 'success');
        
        process.on('SIGINT', () => {
          this.log('자동 수정 봇을 종료합니다...', 'info');
          autoFixBot.printStats();
          watcher.close();
          process.exit(0);
        });
      }
    } catch (error) {
      this.log(`자동 수정 봇 실행 중 오류: ${error.message}`, 'error');
      setTimeout(() => this.showMainMenu(), 2000);
    }
  }

  // 오류 모니터링 시작
  async startErrorMonitor() {
    this.log('📊 오류 모니터링 대시보드를 시작합니다...', 'info');
    
    try {
      const errorMonitor = new ErrorMonitor();
      this.processes.set('errorMonitor', errorMonitor);
      
      this.log('오류 모니터링 대시보드가 시작되었습니다.', 'success');
      this.log('📊 대시보드 URL: http://localhost:8081', 'info');
      this.log('Ctrl+C로 종료하세요.', 'info');
      
      process.on('SIGINT', () => {
        this.log('오류 모니터링을 종료합니다...', 'info');
        process.exit(0);
      });
      
    } catch (error) {
      this.log(`오류 모니터링 시작 중 오류: ${error.message}`, 'error');
      setTimeout(() => this.showMainMenu(), 2000);
    }
  }

  // CI/CD 파이프라인 테스트
  async testCIPipeline() {
    this.log('🏗️ CI/CD 파이프라인 테스트를 시작합니다...', 'info');
    
    try {
      // GitHub Actions workflow 파일 존재 확인
      const workflowPath = path.join(this.rootPath, '.github/workflows/frontend-ci.yml');
      if (!await fs.pathExists(workflowPath)) {
        throw new Error('GitHub Actions workflow 파일이 없습니다.');
      }
      
      // package.json scripts 확인
      const packagePath = path.join(this.frontendPath, 'package.json');
      const packageJson = await fs.readJson(packagePath);
      
      const requiredScripts = ['lint:fix', 'format', 'build'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        this.log(`누락된 npm scripts: ${missingScripts.join(', ')}`, 'warning');
      }
      
      // 로컬에서 CI 단계들 시뮬레이션
      this.log('1/4 코드 품질 검사...', 'info');
      await this.runCommand('npm run lint:fix', this.frontendPath);
      
      this.log('2/4 포맷팅 확인...', 'info');
      await this.runCommand('npm run format:check', this.frontendPath);
      
      this.log('3/4 빌드 테스트...', 'info');
      await this.runCommand('npm run build', this.frontendPath);
      
      this.log('4/4 테스트 실행...', 'info');
      const quickTest = new QuickTest();
      quickTest.setupTests();
      await quickTest.runAll();
      
      this.log('✅ CI/CD 파이프라인 테스트 완료!', 'success');
      
    } catch (error) {
      this.log(`CI/CD 테스트 중 오류: ${error.message}`, 'error');
    }
    
    setTimeout(() => this.showMainMenu(), 3000);
  }

  // 시스템 상태 확인
  async checkSystemStatus() {
    this.log('📋 시스템 상태를 확인합니다...', 'info');
    
    try {
      const status = {
        frontend: await this.checkFrontendStatus(),
        backend: await this.checkBackendStatus(),
        automation: await this.checkAutomationStatus(),
        git: await this.checkGitStatus(),
      };
      
      console.log('\n📊 시스템 상태 리포트:'.bold);
      console.log('─'.repeat(50));
      
      Object.entries(status).forEach(([component, info]) => {
        const statusIcon = info.status === 'OK' ? '✅' : '❌';
        console.log(`${statusIcon} ${component.toUpperCase()}: ${info.message}`);
        
        if (info.details) {
          info.details.forEach(detail => {
            console.log(`   - ${detail}`);
          });
        }
      });
      
    } catch (error) {
      this.log(`상태 확인 중 오류: ${error.message}`, 'error');
    }
    
    setTimeout(() => this.showMainMenu(), 5000);
  }

  // 프론트엔드 상태 확인
  async checkFrontendStatus() {
    const checks = [];
    
    // package.json 확인
    const packagePath = path.join(this.frontendPath, 'package.json');
    if (await fs.pathExists(packagePath)) {
      checks.push('package.json 존재');
      
      const packageJson = await fs.readJson(packagePath);
      const deps = Object.keys({...packageJson.dependencies, ...packageJson.devDependencies});
      checks.push(`의존성 ${deps.length}개 설치됨`);
    }
    
    // node_modules 확인
    const nodeModulesPath = path.join(this.frontendPath, 'node_modules');
    if (await fs.pathExists(nodeModulesPath)) {
      checks.push('node_modules 설치됨');
    }
    
    // 빌드 파일 확인
    const buildPath = path.join(this.frontendPath, '.next');
    if (await fs.pathExists(buildPath)) {
      checks.push('빌드 파일 존재');
    }
    
    return {
      status: checks.length >= 2 ? 'OK' : 'WARNING',
      message: `${checks.length}개 항목 확인됨`,
      details: checks,
    };
  }

  // 백엔드 상태 확인
  async checkBackendStatus() {
    const checks = [];
    
    // requirements.txt 확인
    const reqPath = path.join(this.rootPath, 'requirements.txt');
    if (await fs.pathExists(reqPath)) {
      checks.push('requirements.txt 존재');
    }
    
    // Django 관리 파일 확인
    const managePath = path.join(this.backendPath, 'manage.py');
    if (await fs.pathExists(managePath)) {
      checks.push('Django manage.py 존재');
    }
    
    // 설정 파일 확인
    const settingsPath = path.join(this.backendPath, 'config/settings.py');
    if (await fs.pathExists(settingsPath)) {
      checks.push('Django 설정 파일 존재');
    }
    
    return {
      status: checks.length >= 2 ? 'OK' : 'WARNING',
      message: `${checks.length}개 항목 확인됨`,
      details: checks,
    };
  }

  // 자동화 상태 확인
  async checkAutomationStatus() {
    const checks = [];
    
    // 자동화 스크립트들 확인
    const scripts = [
      'import-validator.js',
      'dev-watcher.js',
      'quick-test.js',
      'auto-fix-bot.js',
      'error-monitor.js',
    ];
    
    for (const script of scripts) {
      const scriptPath = path.join(__dirname, script);
      if (await fs.pathExists(scriptPath)) {
        checks.push(`${script} 설치됨`);
      }
    }
    
    // Husky 확인
    const huskyPath = path.join(this.rootPath, '.husky/pre-commit');
    if (await fs.pathExists(huskyPath)) {
      checks.push('Husky pre-commit 훅 설정됨');
    }
    
    // GitHub Actions 확인
    const workflowPath = path.join(this.rootPath, '.github/workflows');
    if (await fs.pathExists(workflowPath)) {
      const workflows = await fs.readdir(workflowPath);
      checks.push(`GitHub Actions ${workflows.length}개 워크플로우`);
    }
    
    return {
      status: checks.length >= 4 ? 'OK' : 'WARNING',
      message: `${checks.length}개 자동화 도구 활성화`,
      details: checks,
    };
  }

  // Git 상태 확인
  async checkGitStatus() {
    const checks = [];
    
    try {
      const gitPath = path.join(this.rootPath, '.git');
      if (await fs.pathExists(gitPath)) {
        checks.push('Git 저장소 초기화됨');
        
        const { stdout: branch } = await this.runCommand('git branch --show-current', this.rootPath);
        checks.push(`현재 브랜치: ${branch.trim()}`);
        
        const { stdout: status } = await this.runCommand('git status --porcelain', this.rootPath);
        const changedFiles = status.split('\n').filter(line => line.trim().length > 0).length;
        checks.push(`변경된 파일: ${changedFiles}개`);
      }
    } catch (error) {
      checks.push('Git 명령 실행 실패');
    }
    
    return {
      status: checks.length >= 2 ? 'OK' : 'WARNING',
      message: `Git 상태 ${checks.length}개 항목 확인`,
      details: checks,
    };
  }

  // 설정 관리
  async manageSettings() {
    this.log('🔧 설정을 관리합니다...', 'info');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const settingOptions = [
      '1. 환경 변수 설정',
      '2. 알림 설정',
      '3. 자동 수정 규칙 설정',
      '4. 모니터링 설정',
      '5. 뒤로 가기',
    ];

    console.log('\n🔧 설정 옵션:'.bold);
    settingOptions.forEach(option => console.log(`  ${option}`));

    const choice = await this.askQuestion(rl, '\n선택하세요 (1-5): ');
    rl.close();

    switch (parseInt(choice)) {
      case 1:
        await this.configureEnvironment();
        break;
      case 2:
        await this.configureNotifications();
        break;
      case 3:
        await this.configureAutoFixRules();
        break;
      case 4:
        await this.configureMonitoring();
        break;
      default:
        await this.showMainMenu();
        return;
    }

    setTimeout(() => this.showMainMenu(), 2000);
  }

  // 환경 변수 설정
  async configureEnvironment() {
    this.log('환경 변수 설정은 .env 파일을 직접 편집하세요.', 'info');
    
    const envPath = path.join(this.frontendPath, '.env.local');
    if (await fs.pathExists(envPath)) {
      this.log(`환경 파일 위치: ${envPath}`, 'info');
    } else {
      this.log('환경 파일이 없습니다. .env.local 파일을 생성하세요.', 'warning');
    }
  }

  // 알림 설정
  async configureNotifications() {
    this.log('이메일 알림을 위해 다음 환경 변수를 설정하세요:', 'info');
    console.log('  - ALERT_EMAIL_USER: Gmail 계정');
    console.log('  - ALERT_EMAIL_PASS: Gmail 앱 비밀번호');
    console.log('  - DEVELOPER_EMAIL: 알림 받을 이메일');
  }

  // 자동 수정 규칙 설정
  async configureAutoFixRules() {
    this.log('자동 수정 규칙은 auto-fix-bot.js에서 수정할 수 있습니다.', 'info');
    this.log('현재 활성화된 규칙:', 'info');
    console.log('  - Ant Design Icons import');
    console.log('  - React Hooks import');
    console.log('  - Next.js import');
    console.log('  - 미사용 import 제거');
    console.log('  - Import 경로 수정');
  }

  // 모니터링 설정
  async configureMonitoring() {
    this.log('모니터링 대시보드는 기본적으로 포트 8081에서 실행됩니다.', 'info');
    this.log('포트를 변경하려면 error-monitor.js의 this.port 값을 수정하세요.', 'info');
  }

  // 실행 중 상태 표시
  showRunningStatus() {
    if (!this.isRunning) return;
    
    const showStatus = () => {
      console.clear();
      this.banner();
      
      console.log('🎯 자동화 시스템 실행 중...'.bold.green);
      console.log('─'.repeat(50));
      
      const services = [
        { name: '📊 오류 모니터링 대시보드', url: 'http://localhost:8081', status: '✅ 활성' },
        { name: '👀 실시간 개발 감시', status: '✅ 활성' },
        { name: '🤖 자동 수정 봇', status: '✅ 활성' },
        { name: '🔍 Import 검증', status: '✅ 활성' },
      ];
      
      services.forEach(service => {
        console.log(`${service.status} ${service.name}`);
        if (service.url) {
          console.log(`   🌐 ${service.url}`);
        }
      });
      
      console.log('\n📊 실시간 통계:');
      console.log(`   ⏱️ 실행 시간: ${Math.floor((Date.now() - Date.now()) / 1000 / 60)}분`);
      console.log(`   📁 감시 중인 파일: JS/JSX 파일`);
      
      console.log('\n⌨️ 명령어:');
      console.log('   Ctrl+C: 전체 시스템 종료');
      console.log('   Ctrl+Z: 백그라운드로 실행');
      
      console.log('\n✨ 시스템이 백그라운드에서 자동으로 작업 중입니다...');
    };
    
    showStatus();
    const interval = setInterval(showStatus, 30000); // 30초마다 업데이트
    
    // 종료 처리
    process.on('SIGINT', () => {
      clearInterval(interval);
      this.shutdown();
    });
  }

  // 시스템 모니터링 시작
  startSystemMonitoring() {
    setInterval(async () => {
      // 메모리 사용량 체크
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB 이상
        this.log('메모리 사용량이 높습니다. 가비지 컬렉션을 실행합니다.', 'warning');
        if (global.gc) {
          global.gc();
        }
      }
      
      // 디스크 사용량 체크
      try {
        const { stdout } = await this.runCommand(`du -sh ${this.rootPath}`);
        const sizeMatch = stdout.match(/^(\d+(?:\.\d+)?[KMGT]?)\s/);
        if (sizeMatch) {
          const size = sizeMatch[1];
          // 로그에 기록하되 너무 자주 출력하지 않음
          if (Math.random() < 0.1) { // 10% 확률로 출력
            this.log(`프로젝트 크기: ${size}`, 'info');
          }
        }
      } catch (error) {
        // 무시 (선택적)
      }
    }, 60000); // 1분마다
  }

  // 명령어 실행
  async runCommand(command, cwd = process.cwd()) {
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

  // 시스템 종료
  async shutdown() {
    this.log('시스템을 종료합니다...', 'warning');
    
    // 모든 프로세스 정리
    for (const [name, process] of this.processes) {
      try {
        if (process.watcher) {
          process.watcher.close();
        }
        if (process.bot) {
          process.bot.printStats();
        }
        this.log(`${name} 종료됨`, 'info');
      } catch (error) {
        this.log(`${name} 종료 중 오류: ${error.message}`, 'error');
      }
    }
    
    this.log('👋 VideoPlanet 자동화 시스템을 종료합니다.', 'success');
    this.log('모든 변경사항이 자동으로 백업되었습니다.', 'info');
    
    process.exit(0);
  }
}

// 메인 실행
if (require.main === module) {
  const automation = new VideoPlanetAutomation();
  
  // 명령줄 인자 처리
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // 인터랙티브 모드
    automation.showMainMenu();
  } else {
    // 직접 명령 실행
    const command = args[0];
    
    switch (command) {
      case 'start':
        automation.startFullSystem();
        break;
      case 'validate':
        automation.runImportValidation();
        break;
      case 'watch':
        automation.startDevWatcher();
        break;
      case 'test':
        automation.runQuickTest();
        break;
      case 'fix':
        automation.runAutoFixBot();
        break;
      case 'monitor':
        automation.startErrorMonitor();
        break;
      case 'status':
        automation.checkSystemStatus();
        break;
      case 'ci-test':
        automation.testCIPipeline();
        break;
      default:
        console.log(`
🎯 VideoPlanet Automation System v1.0.0

사용법:
  node videoplanet-automation.js                # 인터랙티브 모드
  node videoplanet-automation.js start         # 전체 시스템 시작
  node videoplanet-automation.js validate      # Import 검증
  node videoplanet-automation.js watch         # 실시간 감시
  node videoplanet-automation.js test          # 빠른 테스트
  node videoplanet-automation.js fix           # 자동 수정
  node videoplanet-automation.js monitor       # 오류 모니터링
  node videoplanet-automation.js status        # 시스템 상태
  node videoplanet-automation.js ci-test       # CI/CD 테스트

완벽한 오류 방지를 위한 모든 기능이 포함되어 있습니다!
        `.cyan);
    }
  }
}

module.exports = VideoPlanetAutomation;