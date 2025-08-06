#!/usr/bin/env node

/**
 * VideoPlanet 오류 모니터링 대시보드
 * 실시간으로 오류를 추적하고 패턴을 분석하는 완벽한 모니터링 시스템
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const url = require('url');
const colors = require('colors');
const chokidar = require('chokidar');

class ErrorMonitor {
  constructor() {
    this.rootPath = path.join(__dirname, '../');
    this.logPath = path.join(__dirname, 'logs');
    this.reportPath = path.join(__dirname, 'reports');
    this.port = 8081;
    
    this.errors = [];
    this.patterns = new Map();
    this.stats = {
      totalErrors: 0,
      fixedErrors: 0,
      activeErrors: 0,
      errorsByType: new Map(),
      errorsByFile: new Map(),
      errorsByTime: new Map(),
      startTime: Date.now(),
    };
    
    this.initializeDirectories();
    this.startFileWatcher();
    this.startWebServer();
  }

  // 디렉토리 초기화
  async initializeDirectories() {
    await fs.ensureDir(this.logPath);
    await fs.ensureDir(this.reportPath);
    
    this.log('📁 모니터링 디렉토리 초기화 완료', 'info');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    switch (type) {
      case 'error':
        console.log(`🚨 ${message}`.red);
        break;
      case 'warning':
        console.log(`⚠️ ${message}`.yellow);
        break;
      case 'success':
        console.log(`✅ ${message}`.green);
        break;
      case 'info':
      default:
        console.log(`📊 ${message}`.blue);
        break;
    }

    // 로그 파일에 저장
    const logFile = path.join(this.logPath, `monitor-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logEntry + '\n');
  }

  // 오류 추가
  addError(error) {
    const errorObj = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...error,
      status: 'active',
    };

    this.errors.push(errorObj);
    this.updateStats(errorObj);
    this.analyzePattern(errorObj);
    
    this.log(`새 오류 발견: ${error.message}`, 'error');
    
    // 심각한 오류인 경우 즉시 알림
    if (this.isCriticalError(errorObj)) {
      this.sendCriticalAlert(errorObj);
    }
    
    // 실시간 리포트 업데이트
    this.generateRealTimeReport();
    
    return errorObj.id;
  }

  // 통계 업데이트
  updateStats(error) {
    this.stats.totalErrors++;
    this.stats.activeErrors++;
    
    // 타입별 통계
    const type = error.type || 'UNKNOWN';
    this.stats.errorsByType.set(type, (this.stats.errorsByType.get(type) || 0) + 1);
    
    // 파일별 통계
    if (error.file) {
      const file = path.relative(this.rootPath, error.file);
      this.stats.errorsByFile.set(file, (this.stats.errorsByFile.get(file) || 0) + 1);
    }
    
    // 시간대별 통계
    const hour = new Date().getHours();
    this.stats.errorsByTime.set(hour, (this.stats.errorsByTime.get(hour) || 0) + 1);
  }

  // 패턴 분석
  analyzePattern(error) {
    const key = `${error.type}-${error.file ? path.basename(error.file) : 'unknown'}`;
    
    if (this.patterns.has(key)) {
      const pattern = this.patterns.get(key);
      pattern.count++;
      pattern.lastOccurrence = error.timestamp;
      pattern.errors.push(error.id);
      
      // 반복적인 오류 감지
      if (pattern.count >= 3 && !pattern.alerted) {
        this.log(`🔄 반복 오류 패턴 감지: ${key} (${pattern.count}회)`, 'warning');
        pattern.alerted = true;
        this.sendPatternAlert(pattern, key);
      }
    } else {
      this.patterns.set(key, {
        count: 1,
        firstOccurrence: error.timestamp,
        lastOccurrence: error.timestamp,
        errors: [error.id],
        alerted: false,
      });
    }
  }

  // 심각한 오류 판단
  isCriticalError(error) {
    const criticalTypes = [
      'MODULE_NOT_FOUND',
      'SYNTAX_ERROR',
      'BUILD_FAILURE',
      'SECURITY_VULNERABILITY',
    ];
    
    return criticalTypes.includes(error.type) || 
           error.severity === 'critical' ||
           error.message.toLowerCase().includes('cannot resolve');
  }

  // 심각한 오류 알림
  async sendCriticalAlert(error) {
    const alertMessage = `
🚨 CRITICAL ERROR DETECTED 🚨

Type: ${error.type}
File: ${error.file || 'Unknown'}
Message: ${error.message}
Time: ${error.timestamp}

This requires immediate attention!
    `;

    // 시스템 알림
    const notifyCommand = process.platform === 'darwin' 
      ? `osascript -e 'display notification "Critical Error Detected!" with title "VideoPlanet Monitor"'`
      : `notify-send "VideoPlanet Monitor" "Critical Error Detected!"`;
    
    exec(notifyCommand, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        // console.log('System notification failed:', err.message);
      }
    });

    // 이메일 알림 (설정된 경우)
    if (process.env.ALERT_EMAIL_USER && process.env.DEVELOPER_EMAIL) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.ALERT_EMAIL_USER,
            pass: process.env.ALERT_EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.ALERT_EMAIL_USER,
          to: process.env.DEVELOPER_EMAIL,
          subject: '🚨 VideoPlanet Critical Error Alert',
          text: alertMessage,
        });

        this.log('Critical error alert sent via email', 'info');
      } catch (emailError) {
        this.log(`Failed to send email alert: ${emailError.message}`, 'warning');
      }
    }
  }

  // 패턴 알림
  sendPatternAlert(pattern, patternKey) {
    const message = `Repeated error pattern detected: ${patternKey} (${pattern.count} occurrences)`;
    this.log(message, 'warning');
    
    // 로그 파일에도 기록
    const alertFile = path.join(this.logPath, 'pattern-alerts.log');
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(alertFile, logEntry);
  }

  // 오류 해결 표시
  resolveError(errorId, solution = '') {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.status = 'resolved';
      error.resolvedAt = new Date().toISOString();
      error.solution = solution;
      
      this.stats.activeErrors--;
      this.stats.fixedErrors++;
      
      this.log(`오류 해결됨: ${error.message}`, 'success');
      this.generateRealTimeReport();
    }
  }

  // 파일 감시 시작
  startFileWatcher() {
    const watchPaths = [
      path.join(this.rootPath, 'vridge_front/src/**/*.{js,jsx}'),
      path.join(this.rootPath, 'vridge_front/pages/**/*.{js,jsx}'),
      path.join(this.rootPath, 'vridge_back/**/*.py'),
    ];

    const watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules|\.next|__pycache__|\.git/,
      persistent: true,
    });

    watcher.on('change', (filePath) => {
      this.checkFileForErrors(filePath);
    });

    this.log('파일 감시 시작됨', 'info');
  }

  // 파일 오류 검사
  async checkFileForErrors(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const extension = path.extname(filePath);
      
      if (extension === '.js' || extension === '.jsx') {
        await this.checkJavaScriptErrors(filePath, content);
      } else if (extension === '.py') {
        await this.checkPythonErrors(filePath, content);
      }
    } catch (error) {
      this.addError({
        type: 'FILE_READ_ERROR',
        file: filePath,
        message: `파일 읽기 실패: ${error.message}`,
        severity: 'medium',
      });
    }
  }

  // JavaScript 오류 검사
  async checkJavaScriptErrors(filePath, content) {
    // 기본 구문 오류 검사
    try {
      new Function(content);
    } catch (syntaxError) {
      this.addError({
        type: 'SYNTAX_ERROR',
        file: filePath,
        message: `구문 오류: ${syntaxError.message}`,
        severity: 'critical',
        line: this.extractLineNumber(syntaxError.message),
      });
    }

    // Import 오류 검사
    const importRegex = /import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const moduleName = match[1];
      if (moduleName.startsWith('.') && !await this.moduleExists(filePath, moduleName)) {
        this.addError({
          type: 'MODULE_NOT_FOUND',
          file: filePath,
          message: `모듈을 찾을 수 없음: ${moduleName}`,
          severity: 'high',
          module: moduleName,
        });
      }
    }

    // 미사용 import 검사
    const unusedImports = this.findUnusedImports(content);
    unusedImports.forEach(unusedImport => {
      this.addError({
        type: 'UNUSED_IMPORT',
        file: filePath,
        message: `사용되지 않는 import: ${unusedImport}`,
        severity: 'low',
        identifier: unusedImport,
      });
    });
  }

  // Python 오류 검사
  async checkPythonErrors(filePath, content) {
    // Django 모델 검사
    if (content.includes('models.Model')) {
      const modelErrors = this.checkDjangoModel(content);
      modelErrors.forEach(error => {
        this.addError({
          ...error,
          file: filePath,
        });
      });
    }

    // Import 검사
    const importLines = content.split('\n').filter(line => 
      line.trim().startsWith('import ') || line.trim().startsWith('from ')
    );

    for (const importLine of importLines) {
      if (importLine.includes('from django') || importLine.includes('import django')) {
        // Django import 검사는 복잡하므로 기본적인 것만
        continue;
      }
    }
  }

  // 모듈 존재 확인
  async moduleExists(currentFile, moduleName) {
    if (!moduleName.startsWith('.')) return true; // 외부 패키지는 skip
    
    const currentDir = path.dirname(currentFile);
    const possiblePaths = [
      path.resolve(currentDir, moduleName + '.js'),
      path.resolve(currentDir, moduleName + '.jsx'),
      path.resolve(currentDir, moduleName, 'index.js'),
      path.resolve(currentDir, moduleName, 'index.jsx'),
    ];

    for (const possiblePath of possiblePaths) {
      if (await fs.pathExists(possiblePath)) {
        return true;
      }
    }

    return false;
  }

  // 미사용 import 찾기
  findUnusedImports(content) {
    const unused = [];
    const importRegex = /import\s+\{([^}]+)\}\s+from/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(imp => imp.trim());
      imports.forEach(importName => {
        const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
        const matches = content.match(usageRegex);
        if (!matches || matches.length <= 1) { // 1은 import 구문 자체
          unused.push(importName);
        }
      });
    }

    return unused;
  }

  // 줄 번호 추출
  extractLineNumber(errorMessage) {
    const match = errorMessage.match(/line (\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  // Django 모델 검사
  checkDjangoModel(content) {
    const errors = [];
    
    // 기본적인 모델 검증만 (복잡한 검사는 Django 자체에서 처리)
    if (content.includes('models.Model') && !content.includes('class ')) {
      errors.push({
        type: 'DJANGO_MODEL_ERROR',
        message: 'Django 모델 클래스 정의에 문제가 있습니다',
        severity: 'medium',
      });
    }

    return errors;
  }

  // 실시간 리포트 생성
  async generateRealTimeReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: {
        ...this.stats,
        uptime: Date.now() - this.stats.startTime,
        errorRate: this.stats.totalErrors / ((Date.now() - this.stats.startTime) / 1000 / 60), // 분당 오류율
      },
      activeErrors: this.errors.filter(e => e.status === 'active'),
      patterns: Array.from(this.patterns.entries()).map(([key, pattern]) => ({
        pattern: key,
        ...pattern,
      })),
      topErrorTypes: Array.from(this.stats.errorsByType.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topErrorFiles: Array.from(this.stats.errorsByFile.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    };

    const reportFile = path.join(this.reportPath, `realtime-${Date.now()}.json`);
    await fs.writeJson(reportFile, report, { spaces: 2 });
    
    // 최신 리포트로 심볼릭 링크 생성
    const latestReport = path.join(this.reportPath, 'latest.json');
    try {
      await fs.unlink(latestReport);
    } catch (e) {
      // 파일이 없어도 괜찮음
    }
    await fs.writeJson(latestReport, report, { spaces: 2 });
  }

  // 웹 서버 시작
  startWebServer() {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;

      // CORS 헤더
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (pathname === '/') {
        this.serveDashboard(res);
      } else if (pathname === '/api/stats') {
        this.serveStats(res);
      } else if (pathname === '/api/errors') {
        this.serveErrors(res);
      } else if (pathname === '/api/patterns') {
        this.servePatterns(res);
      } else if (pathname.startsWith('/api/resolve/')) {
        const errorId = parseInt(pathname.split('/')[3]);
        this.handleResolveError(req, res, errorId);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(this.port, () => {
      this.log(`📊 모니터링 대시보드가 시작되었습니다: http://localhost:${this.port}`, 'success');
    });
  }

  // 대시보드 HTML 서빙
  serveDashboard(res) {
    const html = this.generateDashboardHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  // 통계 API
  serveStats(res) {
    const stats = {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      errorRate: this.stats.totalErrors / ((Date.now() - this.stats.startTime) / 1000 / 60),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  }

  // 오류 목록 API
  serveErrors(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.errors));
  }

  // 패턴 API
  servePatterns(res) {
    const patterns = Array.from(this.patterns.entries()).map(([key, pattern]) => ({
      pattern: key,
      ...pattern,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(patterns));
  }

  // 오류 해결 처리
  handleResolveError(req, res, errorId) {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const { solution } = JSON.parse(body);
        this.resolveError(errorId, solution);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });
    } else {
      res.writeHead(405);
      res.end('Method Not Allowed');
    }
  }

  // 대시보드 HTML 생성
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 VideoPlanet Error Monitor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 0.9em; color: #666; margin-top: 5px; }
        .error-list { background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .error-item { padding: 15px; border-bottom: 1px solid #eee; }
        .error-item:last-child { border-bottom: none; }
        .error-type { display: inline-block; background: #ff6b6b; color: white; padding: 3px 8px; border-radius: 15px; font-size: 0.8em; margin-right: 10px; }
        .error-file { font-family: monospace; background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
        .resolve-btn { background: #51cf66; color: white; border: none; padding: 5px 15px; border-radius: 20px; cursor: pointer; margin-left: 10px; }
        .resolve-btn:hover { background: #40c057; }
        .critical { border-left: 4px solid #ff6b6b; }
        .warning { border-left: 4px solid #ffd43b; }
        .info { border-left: 4px solid #339af0; }
        .refresh-btn { position: fixed; bottom: 30px; right: 30px; background: #667eea; color: white; border: none; padding: 15px; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .patterns { margin-top: 30px; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .pattern-item { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .pattern-count { background: #ffd43b; color: #333; padding: 3px 8px; border-radius: 15px; font-size: 0.8em; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 VideoPlanet Error Monitor</h1>
            <p>실시간 오류 추적 및 분석 대시보드</p>
        </div>
        
        <div class="stats-grid" id="statsGrid">
            <!-- 통계 카드들이 여기에 동적으로 생성됩니다 -->
        </div>
        
        <div class="error-list" id="errorList">
            <h3 style="padding: 20px; background: #f8f9fa; margin: 0;">🚨 활성 오류</h3>
            <!-- 오류 목록이 여기에 동적으로 생성됩니다 -->
        </div>
        
        <div class="patterns" id="patterns">
            <h3>🔄 오류 패턴</h3>
            <!-- 패턴 분석이 여기에 동적으로 생성됩니다 -->
        </div>
    </div>
    
    <button class="refresh-btn" onclick="refreshData()">🔄</button>
    
    <script>
        async function loadStats() {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            const statsGrid = document.getElementById('statsGrid');
            statsGrid.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-number">\${stats.totalErrors}</div>
                    <div class="stat-label">총 오류 수</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number critical">\${stats.activeErrors}</div>
                    <div class="stat-label">활성 오류</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #51cf66">\${stats.fixedErrors}</div>
                    <div class="stat-label">해결된 오류</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #ffd43b">\${stats.errorRate.toFixed(2)}</div>
                    <div class="stat-label">분당 오류율</div>
                </div>
            \`;
        }
        
        async function loadErrors() {
            const response = await fetch('/api/errors');
            const errors = await response.json();
            const activeErrors = errors.filter(e => e.status === 'active');
            
            const errorList = document.getElementById('errorList');
            const errorItems = activeErrors.map(error => \`
                <div class="error-item \${error.severity || 'info'}">
                    <div>
                        <span class="error-type">\${error.type}</span>
                        <strong>\${error.message}</strong>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                        <span class="error-file">\${error.file ? error.file.split('/').pop() : 'Unknown'}</span>
                        <span style="margin-left: 10px;">\${new Date(error.timestamp).toLocaleString()}</span>
                        <button class="resolve-btn" onclick="resolveError(\${error.id})">해결</button>
                    </div>
                </div>
            \`).join('');
            
            errorList.innerHTML = '<h3 style="padding: 20px; background: #f8f9fa; margin: 0;">🚨 활성 오류</h3>' + errorItems;
        }
        
        async function loadPatterns() {
            const response = await fetch('/api/patterns');
            const patterns = await response.json();
            
            const patternsDiv = document.getElementById('patterns');
            const patternItems = patterns.map(pattern => \`
                <div class="pattern-item">
                    <span>\${pattern.pattern}</span>
                    <div>
                        <span class="pattern-count">\${pattern.count}회</span>
                        <span style="margin-left: 10px; font-size: 0.8em; color: #666;">
                            최근: \${new Date(pattern.lastOccurrence).toLocaleString()}
                        </span>
                    </div>
                </div>
            \`).join('');
            
            patternsDiv.innerHTML = '<h3>🔄 오류 패턴</h3>' + patternItems;
        }
        
        async function resolveError(errorId) {
            const solution = prompt('해결 방법을 입력하세요:');
            if (solution) {
                await fetch(\`/api/resolve/\${errorId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ solution })
                });
                refreshData();
            }
        }
        
        function refreshData() {
            loadStats();
            loadErrors();
            loadPatterns();
        }
        
        // 초기 로드
        refreshData();
        
        // 5초마다 자동 새로고침
        setInterval(refreshData, 5000);
    </script>
</body>
</html>
    `;
  }

  // 일일 리포트 생성
  async generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const todayErrors = this.errors.filter(error => 
      error.timestamp.startsWith(today)
    );

    const report = {
      date: today,
      summary: {
        totalErrors: todayErrors.length,
        resolvedErrors: todayErrors.filter(e => e.status === 'resolved').length,
        activeErrors: todayErrors.filter(e => e.status === 'active').length,
      },
      topErrorTypes: this.getTopErrorTypes(todayErrors),
      topErrorFiles: this.getTopErrorFiles(todayErrors),
      criticalErrors: todayErrors.filter(e => e.severity === 'critical'),
      patterns: this.getDailyPatterns(todayErrors),
      recommendations: this.generateRecommendations(todayErrors),
    };

    const reportFile = path.join(this.reportPath, `daily-${today}.json`);
    await fs.writeJson(reportFile, report, { spaces: 2 });

    this.log(`일일 리포트 생성 완료: ${reportFile}`, 'info');
    return report;
  }

  getTopErrorTypes(errors) {
    const types = new Map();
    errors.forEach(error => {
      const type = error.type || 'UNKNOWN';
      types.set(type, (types.get(type) || 0) + 1);
    });
    
    return Array.from(types.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  getTopErrorFiles(errors) {
    const files = new Map();
    errors.forEach(error => {
      if (error.file) {
        const file = path.relative(this.rootPath, error.file);
        files.set(file, (files.get(file) || 0) + 1);
      }
    });
    
    return Array.from(files.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  getDailyPatterns(errors) {
    // 간단한 패턴 분석
    const patterns = new Map();
    errors.forEach(error => {
      const key = `${error.type}-${error.file ? path.basename(error.file) : 'unknown'}`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    });
    
    return Array.from(patterns.entries())
      .filter(([key, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);
  }

  generateRecommendations(errors) {
    const recommendations = [];
    
    // 자주 발생하는 오류 타입별 권장사항
    const errorTypes = this.getTopErrorTypes(errors);
    errorTypes.forEach(([type, count]) => {
      switch (type) {
        case 'MODULE_NOT_FOUND':
          recommendations.push(`모듈 경로를 확인하고 import 구문을 점검하세요. (${count}회 발생)`);
          break;
        case 'UNUSED_IMPORT':
          recommendations.push(`사용하지 않는 import를 제거하여 코드를 정리하세요. (${count}회 발생)`);
          break;
        case 'SYNTAX_ERROR':
          recommendations.push(`구문 오류를 수정하고 ESLint를 실행하세요. (${count}회 발생)`);
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('좋습니다! 큰 문제가 발견되지 않았습니다.');
    }

    return recommendations;
  }
}

// 메인 실행
if (require.main === module) {
  const monitor = new ErrorMonitor();
  
  console.log(`
🎯 VideoPlanet Error Monitor v1.0.0

실시간으로 프로젝트의 오류를 모니터링합니다.

기능:
  ✅ 실시간 파일 감시 및 오류 검출
  ✅ 오류 패턴 분석
  ✅ 웹 대시보드 제공 (http://localhost:8081)
  ✅ 심각한 오류 즉시 알림
  ✅ 일일 리포트 자동 생성
  ✅ 이메일 알림 지원

Ctrl+C로 종료할 수 있습니다.
`.cyan);

  // 프로세스 종료 시 정리
  process.on('SIGINT', async () => {
    console.log('\n👋 Error Monitor를 종료합니다...');
    
    try {
      await monitor.generateDailyReport();
      console.log('✅ 최종 리포트 생성 완료');
    } catch (error) {
      console.log('⚠️ 최종 리포트 생성 실패:', error.message);
    }
    
    process.exit(0);
  });

  // 매일 자정에 일일 리포트 생성
  const scheduleDaily = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
      monitor.generateDailyReport();
      setInterval(() => monitor.generateDailyReport(), 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
  };
  
  scheduleDaily();
}

module.exports = ErrorMonitor;