#!/usr/bin/env node

/**
 * VideoPlanet 실시간 개발 모니터링 도구
 * 파일 변경을 감시하고 자동으로 검증 및 수정 실행
 */

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const colors = require('colors');
const ImportValidator = require('./import-validator');

class DevWatcher {
  constructor() {
    this.rootPath = path.join(__dirname, '../vridge_front');
    this.isProcessing = false;
    this.validator = new ImportValidator();
    this.lastCheck = Date.now();
    this.errorCount = 0;
    this.fixCount = 0;
    
    this.initializeWatcher();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;
    
    switch (type) {
      case 'error':
        console.log(`${prefix} ${'🚨'.red} ${message.red}`);
        break;
      case 'warning':
        console.log(`${prefix} ${'⚠️'.yellow} ${message.yellow}`);
        break;
      case 'success':
        console.log(`${prefix} ${'✅'.green} ${message.green}`);
        break;
      case 'info':
      default:
        console.log(`${prefix} ${'👀'.blue} ${message.blue}`);
        break;
    }
  }

  // 알림 전송 (시스템 알림)
  sendNotification(title, message, type = 'info') {
    // Linux/macOS 시스템 알림
    const notifyCommand = process.platform === 'darwin' 
      ? `osascript -e 'display notification "${message}" with title "${title}"'`
      : `notify-send "${title}" "${message}"`;
    
    exec(notifyCommand, (error) => {
      if (error && process.env.NODE_ENV === 'development') {
        // console.log('시스템 알림 실패:', error.message);
      }
    });
  }

  // 이메일 알림 전송 (중요한 오류 시)
  async sendEmailAlert(errors) {
    if (errors.length === 0) return;
    
    const nodemailer = require('nodemailer');
    
    // 개발환경에서만 이메일 알림
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.ALERT_EMAIL_USER,
          pass: process.env.ALERT_EMAIL_PASS,
        },
      });

      const errorSummary = errors.map(err => 
        `${err.file}: ${err.message}`
      ).join('\n');

      await transporter.sendMail({
        from: process.env.ALERT_EMAIL_USER,
        to: process.env.DEVELOPER_EMAIL,
        subject: `🚨 VideoPlanet 개발 오류 알림 (${errors.length}개)`,
        text: `
VideoPlanet 개발 중 다음 오류들이 발생했습니다:

${errorSummary}

시간: ${new Date().toLocaleString()}
        `,
      });

      this.log('개발자에게 이메일 알림을 전송했습니다.', 'info');
    } catch (error) {
      // this.log(`이메일 알림 실패: ${error.message}`, 'warning');
    }
  }

  // 파일 검증
  async validateFile(filePath) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      this.log(`파일 변경 감지: ${path.relative(this.rootPath, filePath)}`, 'info');
      
      // Import 검증
      const isValid = await this.validator.validateFile(filePath);
      
      if (isValid) {
        this.log('✅ 검증 통과', 'success');
        this.sendNotification('VideoPlanet', '파일 검증 통과', 'success');
      } else {
        const errors = this.validator.errors.filter(err => err.file === filePath);
        this.errorCount += errors.length;
        
        this.log(`❌ ${errors.length}개 오류 발견`, 'error');
        this.sendNotification('VideoPlanet 오류', `${errors.length}개 오류 발견`, 'error');
        
        // 심각한 오류가 많으면 이메일 알림
        if (errors.length >= 3) {
          await this.sendEmailAlert(errors);
        }
      }

      // 자동 수정된 경우
      const fixes = this.validator.fixedImports.filter(fix => fix.file === filePath);
      if (fixes.length > 0) {
        this.fixCount += fixes.length;
        this.log(`🔧 ${fixes.length}개 자동 수정 완료`, 'success');
        this.sendNotification('VideoPlanet 자동 수정', `${fixes.length}개 수정 완료`);
      }

    } catch (error) {
      this.log(`검증 중 오류: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  // ESLint 실행
  async runESLint(filePath) {
    return new Promise((resolve) => {
      const relativePath = path.relative(this.rootPath, filePath);
      const command = `cd ${this.rootPath} && npx eslint --fix "${relativePath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.log(`ESLint 오류: ${stderr}`, 'error');
        } else {
          this.log('ESLint 자동 수정 완료', 'success');
        }
        resolve(!error);
      });
    });
  }

  // Prettier 실행
  async runPrettier(filePath) {
    return new Promise((resolve) => {
      const relativePath = path.relative(this.rootPath, filePath);
      const command = `cd ${this.rootPath} && npx prettier --write "${relativePath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.log(`Prettier 오류: ${stderr}`, 'error');
        } else {
          this.log('Prettier 포맷팅 완료', 'success');
        }
        resolve(!error);
      });
    });
  }

  // 종합 처리
  async processFile(filePath) {
    const now = Date.now();
    
    // 너무 자주 실행되지 않도록 제한 (1초 간격)
    if (now - this.lastCheck < 1000) {
      return;
    }
    this.lastCheck = now;

    // 무시할 파일들 필터링
    const relativePath = path.relative(this.rootPath, filePath);
    const ignorePaths = [
      'node_modules/',
      '.next/',
      'dist/',
      'build/',
      '.git/',
    ];

    if (ignorePaths.some(ignore => relativePath.startsWith(ignore))) {
      return;
    }

    // JavaScript/JSX 파일만 처리
    if (!/\.(js|jsx)$/.test(filePath)) {
      return;
    }

    this.log(`\n${'='.repeat(50)}`, 'info');
    this.log(`파일 처리 시작: ${relativePath}`, 'info');

    // 1. Import 검증 및 자동 수정
    await this.validateFile(filePath);

    // 2. ESLint 실행
    await this.runESLint(filePath);

    // 3. Prettier 실행
    await this.runPrettier(filePath);

    this.log('파일 처리 완료', 'success');
    this.log(`${'='.repeat(50)}\n`, 'info');
  }

  // 통계 출력
  printStats() {
    console.log('\n📊 실시간 모니터링 통계:'.bold);
    console.log(`- 총 오류 수: ${this.errorCount.toString().red}`);
    console.log(`- 자동 수정 수: ${this.fixCount.toString().green}`);
    console.log(`- 마지막 체크: ${new Date(this.lastCheck).toLocaleTimeString()}`);
  }

  // Watcher 초기화
  initializeWatcher() {
    const watchPaths = [
      path.join(this.rootPath, 'src/**/*.{js,jsx}'),
      path.join(this.rootPath, 'pages/**/*.{js,jsx}'),
      path.join(this.rootPath, 'components/**/*.{js,jsx}'),
    ];

    const watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules|\.next|dist|build|\.git/,
      persistent: true,
      ignoreInitial: true,
    });

    watcher
      .on('change', (filePath) => this.processFile(filePath))
      .on('add', (filePath) => this.processFile(filePath))
      .on('ready', () => {
        this.log('👀 실시간 파일 감시가 시작되었습니다!', 'success');
        this.log(`감시 중인 경로: ${watchPaths.length}개 패턴`, 'info');
        this.sendNotification('VideoPlanet Dev Watcher', '실시간 모니터링 시작');
      })
      .on('error', (error) => {
        this.log(`Watcher 오류: ${error}`, 'error');
      });

    // 주기적으로 통계 출력 (5분마다)
    setInterval(() => {
      this.printStats();
    }, 5 * 60 * 1000);

    // 프로세스 종료 시 정리
    process.on('SIGINT', () => {
      this.log('\n👋 Dev Watcher를 종료합니다...', 'info');
      this.printStats();
      watcher.close();
      process.exit(0);
    });

    return watcher;
  }

  // 프로젝트 전체 스캔
  async scanAll() {
    this.log('🔍 프로젝트 전체 스캔을 시작합니다...', 'info');
    
    try {
      await this.validator.validateAll();
      this.log('✅ 전체 스캔 완료', 'success');
      this.sendNotification('VideoPlanet', '전체 프로젝트 스캔 완료');
    } catch (error) {
      this.log(`전체 스캔 중 오류: ${error.message}`, 'error');
    }
  }
}

// CLI 명령어 처리
if (require.main === module) {
  const args = process.argv.slice(2);
  const watcher = new DevWatcher();

  if (args.includes('--scan')) {
    watcher.scanAll();
  } else {
    console.log(`
🎯 VideoPlanet Dev Watcher v1.0.0

실시간으로 파일 변경을 감시하고 자동으로 오류를 수정합니다.

사용법:
  node dev-watcher.js          # 실시간 감시 시작
  node dev-watcher.js --scan   # 프로젝트 전체 스캔

기능:
  ✅ Import 구문 자동 검증 및 수정
  ✅ ESLint 자동 실행 및 수정
  ✅ Prettier 자동 포맷팅
  ✅ 실시간 오류 알림
  ✅ 시스템 알림 (macOS/Linux)
  ✅ 이메일 알림 (중요한 오류 시)

Ctrl+C로 종료할 수 있습니다.
`.cyan);
  }
}

module.exports = DevWatcher;