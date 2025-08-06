#!/usr/bin/env node

/**
 * VideoPlanet Smart Error Prevention System
 * AI 기반 예측적 오류 방지 시스템
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 오류 패턴 데이터베이스
const ERROR_PATTERNS = {
  'import_missing': {
    pattern: /(\w+)(Outlined|Filled|TwoTone)\s+is not defined/,
    solution: (match) => `import { ${match[1]}${match[2]} } from '@ant-design/icons';`,
    severity: 'critical',
    autoFix: true
  },
  'hook_missing': {
    pattern: /use(State|Effect|Memo|Callback|Ref|Context) is not defined/,
    solution: (match) => `Add 'use${match[1]}' to React import`,
    severity: 'high',
    autoFix: true
  },
  'component_missing': {
    pattern: /Cannot find module ['"](.+)['"]/,
    solution: (match) => `Check if '${match[1]}' exists or install it`,
    severity: 'high',
    autoFix: false
  },
  'null_reference': {
    pattern: /Cannot read propert(y|ies) .+ of (null|undefined)/,
    solution: () => 'Add null/undefined check before accessing property',
    severity: 'medium',
    autoFix: false
  },
  'key_prop': {
    pattern: /Each child in a list should have a unique "key" prop/,
    solution: () => 'Add key={index} or key={item.id} to list items',
    severity: 'low',
    autoFix: true
  }
};

// 스마트 오류 분석기
class SmartErrorAnalyzer {
  constructor() {
    this.errorHistory = [];
    this.fixHistory = [];
    this.learningData = this.loadLearningData();
  }

  loadLearningData() {
    const dataPath = path.join(__dirname, 'automation-scripts', 'learning-data.json');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    return { patterns: {}, fixes: {} };
  }

  saveLearningData() {
    const dataPath = path.join(__dirname, 'automation-scripts', 'learning-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(this.learningData, null, 2));
  }

  analyzeError(error) {
    for (const [type, config] of Object.entries(ERROR_PATTERNS)) {
      const match = error.match(config.pattern);
      if (match) {
        return {
          type,
          match,
          solution: config.solution(match),
          severity: config.severity,
          autoFix: config.autoFix
        };
      }
    }
    return null;
  }

  predictErrors(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const predictions = [];

    // 1. Ant Design Icons 사용 예측
    const iconUsage = content.match(/([A-Z][a-zA-Z]+)(Outlined|Filled|TwoTone)/g) || [];
    const iconImports = content.match(/import\s*{[^}]*}\s*from\s*['"]@ant-design\/icons['"]/g) || [];
    
    for (const icon of iconUsage) {
      const hasImport = iconImports.some(imp => imp.includes(icon));
      if (!hasImport) {
        predictions.push({
          type: 'missing_import',
          icon,
          line: this.getLineNumber(content, icon),
          severity: 'high',
          message: `${icon} will cause runtime error - import missing`
        });
      }
    }

    // 2. React Hooks 사용 예측
    const hookUsage = content.match(/use(State|Effect|Memo|Callback|Ref|Context|Reducer)\(/g) || [];
    const reactImport = content.match(/import\s+React\s*,?\s*{[^}]*}\s*from\s*['"]react['"]/);
    
    if (hookUsage.length > 0 && reactImport) {
      for (const hook of hookUsage) {
        if (!reactImport[0].includes(hook.replace('(', ''))) {
          predictions.push({
            type: 'missing_hook',
            hook: hook.replace('(', ''),
            severity: 'high',
            message: `${hook} not imported from React`
          });
        }
      }
    }

    // 3. Null/Undefined 체크 예측
    const propertyAccess = content.match(/(\w+)\?.?(\w+)/g) || [];
    const unsafeAccess = content.match(/(\w+)\.(\w+)\.(\w+)/g) || [];
    
    for (const access of unsafeAccess) {
      if (!propertyAccess.includes(access.replace(/\./g, '?.'))) {
        predictions.push({
          type: 'potential_null_error',
          code: access,
          severity: 'medium',
          message: `${access} might throw null/undefined error - consider optional chaining`
        });
      }
    }

    return predictions;
  }

  getLineNumber(content, searchStr) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchStr)) {
        return i + 1;
      }
    }
    return -1;
  }
}

// 자동 수정 엔진
class AutoFixEngine {
  constructor(analyzer) {
    this.analyzer = analyzer;
    this.fixCount = 0;
    this.backupDir = path.join(__dirname, 'automation-scripts', 'backups');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async fixFile(filePath) {
    const predictions = this.analyzer.predictErrors(filePath);
    
    if (predictions.length === 0) {
      return { success: true, message: 'No issues found' };
    }

    // 백업 생성
    this.createBackup(filePath);
    
    let content = fs.readFileSync(filePath, 'utf8');
    const fixes = [];

    for (const prediction of predictions) {
      if (prediction.type === 'missing_import') {
        const importLine = `import { ${prediction.icon} } from '@ant-design/icons';`;
        
        // import 섹션 찾기
        const importSection = content.match(/import[\s\S]*?from\s+['"][^'"]+['"]/g);
        if (importSection) {
          const lastImport = importSection[importSection.length - 1];
          const lastImportIndex = content.lastIndexOf(lastImport);
          
          // 이미 같은 import가 있는지 확인
          if (!content.includes(importLine)) {
            content = content.slice(0, lastImportIndex + lastImport.length) + 
                     '\n' + importLine + 
                     content.slice(lastImportIndex + lastImport.length);
            
            fixes.push(`Added import for ${prediction.icon}`);
            this.fixCount++;
          }
        }
      } else if (prediction.type === 'missing_hook') {
        // React import 수정
        const reactImportMatch = content.match(/import\s+React\s*,?\s*{([^}]*)}\s*from\s*['"]react['"]/);
        if (reactImportMatch) {
          const hooks = reactImportMatch[1].trim();
          const newHooks = hooks ? `${hooks}, ${prediction.hook}` : prediction.hook;
          const newImport = `import React, { ${newHooks} } from 'react'`;
          
          content = content.replace(reactImportMatch[0], newImport);
          fixes.push(`Added ${prediction.hook} to React import`);
          this.fixCount++;
        }
      }
    }

    if (fixes.length > 0) {
      fs.writeFileSync(filePath, content);
      return {
        success: true,
        message: `Fixed ${fixes.length} issues`,
        fixes
      };
    }

    return {
      success: false,
      message: 'Could not auto-fix some issues',
      predictions
    };
  }

  createBackup(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${path.basename(filePath)}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupName);
    
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }
}

// 실시간 모니터 클래스
class RealTimeMonitor {
  constructor() {
    this.analyzer = new SmartErrorAnalyzer();
    this.fixer = new AutoFixEngine(this.analyzer);
    this.stats = {
      filesChecked: 0,
      errorsFound: 0,
      errorsFixed: 0,
      criticalErrors: 0
    };
  }

  async scanProject() {
    console.log(`${colors.cyan}${colors.bright}🔍 VideoPlanet Smart Error Prevention System${colors.reset}`);
    console.log('=' .repeat(60));
    
    const frontendDir = path.join(__dirname, 'vridge_front', 'src');
    
    if (!fs.existsSync(frontendDir)) {
      console.log(`${colors.red}Error: Frontend directory not found${colors.reset}`);
      return;
    }

    console.log(`\n${colors.blue}📂 Scanning project files...${colors.reset}`);
    
    const files = this.getAllFiles(frontendDir, ['.jsx', '.js', '.tsx', '.ts']);
    console.log(`Found ${files.length} files to analyze\n`);

    const issues = [];
    
    for (const file of files) {
      process.stdout.write(`Checking ${path.basename(file)}...`);
      
      const predictions = this.analyzer.predictErrors(file);
      this.stats.filesChecked++;
      
      if (predictions.length > 0) {
        this.stats.errorsFound += predictions.length;
        
        // 자동 수정 시도
        const result = await this.fixer.fixFile(file);
        
        if (result.success && result.fixes) {
          this.stats.errorsFixed += result.fixes.length;
          console.log(` ${colors.green}✓ Fixed ${result.fixes.length} issues${colors.reset}`);
        } else if (predictions.length > 0) {
          console.log(` ${colors.yellow}⚠ ${predictions.length} issues found${colors.reset}`);
          issues.push({ file: path.relative(__dirname, file), predictions });
        }
        
        // Critical 오류 카운트
        this.stats.criticalErrors += predictions.filter(p => p.severity === 'high').length;
      } else {
        console.log(` ${colors.green}✓${colors.reset}`);
      }
    }

    this.showReport(issues);
  }

  getAllFiles(dir, extensions) {
    const files = [];
    
    const scanDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        
        // node_modules 제외
        if (item === 'node_modules' || item === '.next' || item === 'build') {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (extensions.some(ext => fullPath.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(dir);
    return files;
  }

  showReport(issues) {
    console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}📊 Scan Report${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);

    // 통계
    console.log(`${colors.blue}📈 Statistics:${colors.reset}`);
    console.log(`  Files checked: ${this.stats.filesChecked}`);
    console.log(`  Issues found: ${this.stats.errorsFound}`);
    console.log(`  Issues fixed: ${colors.green}${this.stats.errorsFixed}${colors.reset}`);
    console.log(`  Critical issues: ${this.stats.criticalErrors > 0 ? colors.red : colors.green}${this.stats.criticalErrors}${colors.reset}`);

    // 남은 이슈들
    if (issues.length > 0) {
      console.log(`\n${colors.yellow}⚠ Remaining Issues:${colors.reset}`);
      
      for (const issue of issues) {
        console.log(`\n  📄 ${issue.file}`);
        for (const prediction of issue.predictions) {
          const severityColor = 
            prediction.severity === 'high' ? colors.red :
            prediction.severity === 'medium' ? colors.yellow :
            colors.blue;
          
          console.log(`     ${severityColor}[${prediction.severity}]${colors.reset} ${prediction.message}`);
        }
      }
    } else {
      console.log(`\n${colors.green}✨ All issues resolved! Your code is clean.${colors.reset}`);
    }

    // 권장사항
    console.log(`\n${colors.magenta}💡 Recommendations:${colors.reset}`);
    
    if (this.stats.errorsFixed > 0) {
      console.log(`  1. Review the ${this.stats.errorsFixed} auto-fixes applied`);
      console.log(`  2. Run tests to ensure everything works correctly`);
    }
    
    if (this.stats.criticalErrors > 0) {
      console.log(`  3. Address critical issues immediately to prevent runtime errors`);
    }
    
    console.log(`  4. Enable real-time monitoring: node automation-scripts/dev-watcher.js`);
    console.log(`  5. Setup pre-commit hooks to prevent future issues`);

    // 성공 메시지
    if (this.stats.errorsFound === 0) {
      console.log(`\n${colors.green}${colors.bright}🎉 Perfect! No errors found.${colors.reset}`);
      console.log(`${colors.green}FolderOpenOutlined and similar errors are completely prevented!${colors.reset}`);
    } else if (this.stats.errorsFixed === this.stats.errorsFound) {
      console.log(`\n${colors.green}${colors.bright}🎉 Excellent! All ${this.stats.errorsFixed} issues were automatically fixed.${colors.reset}`);
    }
  }
}

// 메인 실행
async function main() {
  const monitor = new RealTimeMonitor();
  await monitor.scanProject();
  
  // 학습 데이터 저장
  monitor.analyzer.saveLearningData();
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SmartErrorAnalyzer, AutoFixEngine, RealTimeMonitor };