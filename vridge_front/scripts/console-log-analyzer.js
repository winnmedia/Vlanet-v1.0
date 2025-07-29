#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 콘솔 로그 분석 및 제거 도구
class ConsoleLogAnalyzer {
  constructor() {
    this.stats = {
      totalFiles: 0,
      totalLogs: 0,
      byType: {
        log: 0,
        error: 0,
        warn: 0,
        info: 0,
        debug: 0
      },
      byCategory: {
        debug: [],
        error: [],
        development: [],
        production: [],
        testing: []
      },
      removedCount: 0,
      keptCount: 0
    };
    
    // 제거하면 안 되는 패턴들
    this.keepPatterns = [
      // 프로덕션 에러 로깅
      /console\.error\s*\(\s*['"`]Production Error:/i,
      /console\.error\s*\(\s*['"`]Critical:/i,
      /console\.error\s*\(\s*['"`]Fatal:/i,
      
      // 보안 관련 로깅
      /console\.(error|warn)\s*\(\s*['"`]Security:/i,
      /console\.(error|warn)\s*\(\s*['"`]Unauthorized:/i,
      
      // 모니터링/분석 도구
      /console\.(log|info)\s*\(\s*['"`]Analytics:/i,
      /console\.(log|info)\s*\(\s*['"`]Monitoring:/i,
      
      // 설정 파일의 중요 로그
      /config.*console\.(log|info)/i,
      /setup.*console\.(log|info)/i,
      
      // 테스트 파일의 로그 (일부 유지)
      /\.test\.(js|jsx|ts|tsx).*console\.(log|error)/,
      /\.spec\.(js|jsx|ts|tsx).*console\.(log|error)/
    ];
    
    // 안전하게 제거할 수 있는 패턴들
    this.removePatterns = [
      // 개발 디버깅 로그
      /console\.log\s*\(\s*['"`]debug:/i,
      /console\.log\s*\(\s*['"`]test:/i,
      /console\.log\s*\(\s*['"`]check:/i,
      /console\.log\s*\(\s*['"`]here:/i,
      /console\.log\s*\(\s*['"`]todo:/i,
      /console\.log\s*\(\s*['"`]fixme:/i,
      
      // 임시 디버깅
      /console\.log\s*\(\s*(\w+)\s*\)/,
      /console\.log\s*\(\s*['"`]\d+['"`]\s*\)/,
      /console\.log\s*\(\s*['"`]---+['"`]\s*\)/,
      
      // 컴포넌트 렌더링 로그
      /console\.log\s*\(\s*['"`]render/i,
      /console\.log\s*\(\s*['"`]mounted/i,
      /console\.log\s*\(\s*['"`]unmounted/i,
      
      // 상태 변경 로그
      /console\.log\s*\(\s*['"`]state:/i,
      /console\.log\s*\(\s*['"`]props:/i,
      /console\.log\s*\(\s*['"`]data:/i
    ];
    
    // 파일 경로별 처리 규칙
    this.pathRules = {
      // 완전히 건드리지 않을 경로
      ignore: [
        'node_modules/',
        'build/',
        'dist/',
        '.next/',
        'coverage/',
        'scripts/console-log-',
        'docs/',
        '*.md'
      ],
      
      // 모든 콘솔 로그를 유지할 경로
      keep: [
        'logger.js',
        'monitoring.js',
        'errorHandler.js',
        'debug404.js',
        'analytics.js'
      ],
      
      // 신중히 검토할 경로
      review: [
        'config/',
        'utils/',
        'api/',
        'store/'
      ]
    };
  }
  
  analyze(directory = './src') {
    console.log('📊 콘솔 로그 분석 시작...\n');
    
    const files = glob.sync(`${directory}/**/*.{js,jsx,ts,tsx}`, {
      ignore: this.pathRules.ignore
    });
    
    files.forEach(file => {
      this.analyzeFile(file);
    });
    
    this.generateReport();
  }
  
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    
    // 파일 경로 규칙 확인
    const shouldKeepAll = this.pathRules.keep.some(pattern => 
      filePath.includes(pattern)
    );
    
    const needsReview = this.pathRules.review.some(pattern => 
      filePath.includes(pattern)
    );
    
    let fileHasConsole = false;
    const consoleLogInfo = [];
    
    lines.forEach((line, index) => {
      const consoleMatch = line.match(/console\.(log|error|warn|info|debug)/g);
      
      if (consoleMatch) {
        fileHasConsole = true;
        consoleMatch.forEach(match => {
          const type = match.split('.')[1];
          this.stats.byType[type]++;
          this.stats.totalLogs++;
          
          const logInfo = {
            file: filePath,
            line: index + 1,
            type: type,
            content: line.trim(),
            category: this.categorizeLog(line, filePath),
            shouldKeep: shouldKeepAll || this.shouldKeepLog(line, filePath),
            needsReview: needsReview
          };
          
          consoleLogInfo.push(logInfo);
          this.stats.byCategory[logInfo.category].push(logInfo);
        });
      }
    });
    
    if (fileHasConsole) {
      this.stats.totalFiles++;
    }
    
    return consoleLogInfo;
  }
  
  categorizeLog(line, filePath) {
    // 에러 처리
    if (line.includes('console.error') || line.includes('catch')) {
      return 'error';
    }
    
    // 테스트 코드
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      return 'testing';
    }
    
    // 개발 환경 전용
    if (line.includes('NODE_ENV') || line.includes('development')) {
      return 'development';
    }
    
    // 프로덕션 로깅
    if (this.keepPatterns.some(pattern => pattern.test(line))) {
      return 'production';
    }
    
    // 기본: 디버깅
    return 'debug';
  }
  
  shouldKeepLog(line, filePath) {
    // 유지해야 하는 패턴 확인
    if (this.keepPatterns.some(pattern => pattern.test(line))) {
      return true;
    }
    
    // 제거해야 하는 패턴 확인
    if (this.removePatterns.some(pattern => pattern.test(line))) {
      return false;
    }
    
    // 에러와 경고는 기본적으로 유지
    if (line.includes('console.error') || line.includes('console.warn')) {
      return true;
    }
    
    // 나머지는 제거
    return false;
  }
  
  generateReport() {
    const report = {
      summary: {
        totalFiles: this.stats.totalFiles,
        totalLogs: this.stats.totalLogs,
        distribution: this.stats.byType
      },
      analysis: {
        safeToRemove: this.stats.byCategory.debug.length + this.stats.byCategory.development.length,
        needsReview: this.stats.byCategory.error.length + this.stats.byCategory.production.length,
        inTestFiles: this.stats.byCategory.testing.length
      },
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
    
    // 리포트 저장
    fs.writeFileSync(
      'console-log-analysis-report.json',
      JSON.stringify(report, null, 2)
    );
    
    // 콘솔에 요약 출력
    this.printSummary(report);
    
    return report;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    // 우선순위 1: 디버깅 로그 제거
    if (this.stats.byCategory.debug.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Remove debug logs',
        count: this.stats.byCategory.debug.length,
        impact: 'Safe - These are development-only logs',
        command: 'npm run console:remove-debug'
      });
    }
    
    // 우선순위 2: 개발 환경 로그 조건부 처리
    if (this.stats.byCategory.development.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Wrap development logs with environment check',
        count: this.stats.byCategory.development.length,
        impact: 'Safe - Logs will only appear in development',
        command: 'npm run console:wrap-dev'
      });
    }
    
    // 우선순위 3: 에러 로그 검토
    if (this.stats.byCategory.error.length > 0) {
      recommendations.push({
        priority: 'LOW',
        action: 'Review error logs for proper error handling',
        count: this.stats.byCategory.error.length,
        impact: 'Requires manual review',
        command: 'npm run console:review-errors'
      });
    }
    
    // 우선순위 4: 로거 시스템 구현
    if (this.stats.totalLogs > 100) {
      recommendations.push({
        priority: 'STRATEGIC',
        action: 'Implement centralized logging system',
        description: 'Replace console methods with a proper logger',
        benefits: [
          'Environment-aware logging',
          'Log levels (debug, info, warn, error)',
          'Performance optimization',
          'Better error tracking'
        ]
      });
    }
    
    return recommendations;
  }
  
  printSummary(report) {
    console.log('\n📊 === 콘솔 로그 분석 결과 ===\n');
    
    console.log('📈 전체 통계:');
    console.log(`  - 총 파일 수: ${report.summary.totalFiles}`);
    console.log(`  - 총 로그 수: ${report.summary.totalLogs}`);
    console.log('\n📊 타입별 분포:');
    Object.entries(report.summary.distribution).forEach(([type, count]) => {
      const percentage = ((count / report.summary.totalLogs) * 100).toFixed(1);
      console.log(`  - console.${type}: ${count} (${percentage}%)`);
    });
    
    console.log('\n🎯 분석 결과:');
    console.log(`  - 안전하게 제거 가능: ${report.analysis.safeToRemove}개`);
    console.log(`  - 검토 필요: ${report.analysis.needsReview}개`);
    console.log(`  - 테스트 파일: ${report.analysis.inTestFiles}개`);
    
    console.log('\n💡 권장 사항:');
    report.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.action}`);
      if (rec.count) console.log(`   영향 범위: ${rec.count}개`);
      if (rec.impact) console.log(`   영향도: ${rec.impact}`);
      if (rec.command) console.log(`   실행 명령: ${rec.command}`);
    });
    
    console.log('\n✅ 분석 완료! 상세 리포트: console-log-analysis-report.json\n');
  }
  
  // 실제 제거 작업을 수행하는 메서드
  removeConsoleLogs(options = {}) {
    const {
      dryRun = true,
      categories = ['debug'],
      backup = true
    } = options;
    
    console.log(`\n🧹 콘솔 로그 제거 시작 (Dry Run: ${dryRun})...\n`);
    
    let removedCount = 0;
    let modifiedFiles = [];
    
    Object.entries(this.stats.byCategory).forEach(([category, logs]) => {
      if (!categories.includes(category)) return;
      
      const fileGroups = {};
      logs.forEach(log => {
        if (!log.shouldKeep) {
          if (!fileGroups[log.file]) {
            fileGroups[log.file] = [];
          }
          fileGroups[log.file].push(log);
        }
      });
      
      Object.entries(fileGroups).forEach(([filePath, fileLogs]) => {
        if (backup && !dryRun) {
          fs.copyFileSync(filePath, `${filePath}.console-backup`);
        }
        
        let content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        // 라인 번호를 역순으로 정렬하여 뒤에서부터 제거
        fileLogs.sort((a, b) => b.line - a.line);
        
        fileLogs.forEach(log => {
          const lineIndex = log.line - 1;
          if (lines[lineIndex] && lines[lineIndex].includes('console.')) {
            // 전체 라인이 콘솔 로그만 있는 경우 라인 제거
            if (lines[lineIndex].trim().startsWith('console.')) {
              lines.splice(lineIndex, 1);
              removedCount++;
            } else {
              // 콘솔 로그가 다른 코드와 함께 있는 경우 콘솔 부분만 제거
              lines[lineIndex] = lines[lineIndex].replace(/console\.\w+\([^;]*\);?/g, '');
              removedCount++;
            }
          }
        });
        
        if (!dryRun) {
          fs.writeFileSync(filePath, lines.join('\n'));
          modifiedFiles.push(filePath);
        }
      });
    });
    
    console.log(`\n✅ 제거 완료!`);
    console.log(`  - 제거된 로그: ${removedCount}개`);
    console.log(`  - 수정된 파일: ${modifiedFiles.length}개`);
    
    if (dryRun) {
      console.log('\n⚠️  Dry Run 모드입니다. 실제로 파일이 수정되지 않았습니다.');
      console.log('실제 제거를 원하시면 --no-dry-run 옵션을 사용하세요.');
    }
    
    return { removedCount, modifiedFiles };
  }
}

// CLI 실행
if (require.main === module) {
  const analyzer = new ConsoleLogAnalyzer();
  const args = process.argv.slice(2);
  
  if (args.includes('--remove')) {
    analyzer.analyze('./src');
    analyzer.removeConsoleLogs({
      dryRun: !args.includes('--no-dry-run'),
      categories: ['debug', 'development'],
      backup: true
    });
  } else if (args.includes('--remove-all')) {
    analyzer.analyze('./src');
    analyzer.removeConsoleLogs({
      dryRun: !args.includes('--no-dry-run'),
      categories: ['debug', 'development', 'testing'],
      backup: true
    });
  } else {
    analyzer.analyze('./src');
  }
}

module.exports = ConsoleLogAnalyzer;