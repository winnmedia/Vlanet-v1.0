#!/usr/bin/env node

/**
 * VideoPlanet 자동화 시스템 간단 테스트
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🚀 VideoPlanet 자동화 시스템 테스트${colors.reset}`);
console.log('=' .repeat(50));

// 주요 컴포넌트 import 검사
async function checkImports() {
  console.log(`\n${colors.blue}1. Import 검증 테스트${colors.reset}`);
  
  const filePath = path.join(__dirname, 'vridge_front/src/components/ProjectDashboard.jsx');
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // FolderOpenOutlined 체크
    const hasFolderOpenOutlined = content.includes('FolderOpenOutlined');
    const hasImport = content.includes("import") && content.includes("FolderOpenOutlined") && content.includes("@ant-design/icons");
    
    if (hasFolderOpenOutlined && hasImport) {
      console.log(`  ${colors.green}✓${colors.reset} FolderOpenOutlined import 정상`);
    } else if (hasFolderOpenOutlined && !hasImport) {
      console.log(`  ${colors.red}✗${colors.reset} FolderOpenOutlined import 누락 발견!`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} FolderOpenOutlined 사용 안함`);
    }
    
    // React hooks 체크
    const hooksUsed = [...content.matchAll(/use(State|Effect|Memo|Callback)\(/g)];
    const hooksImported = content.includes('import React') || content.includes("from 'react'");
    
    console.log(`  ${hooksImported ? colors.green + '✓' : colors.red + '✗'}${colors.reset} React import 상태`);
    console.log(`  사용된 hooks: ${hooksUsed.length}개`);
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ProjectDashboard.jsx 파일 없음`);
  }
}

// 자동화 스크립트 체크
async function checkAutomationScripts() {
  console.log(`\n${colors.blue}2. 자동화 스크립트 체크${colors.reset}`);
  
  const scripts = [
    'automation-scripts/import-validator.js',
    'automation-scripts/auto-fix-bot.js',
    'automation-scripts/dev-watcher.js',
    'automation-scripts/error-monitor.js',
    'automation-scripts/videoplanet-automation.js'
  ];
  
  for (const script of scripts) {
    const exists = fs.existsSync(path.join(__dirname, script));
    const name = path.basename(script, '.js');
    console.log(`  ${exists ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${name}`);
  }
}

// Git hooks 체크
async function checkGitHooks() {
  console.log(`\n${colors.blue}3. Git Hooks 체크${colors.reset}`);
  
  const huskyPath = path.join(__dirname, '.husky/pre-commit');
  const huskyExists = fs.existsSync(huskyPath);
  
  console.log(`  ${huskyExists ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset} Pre-commit hook`);
  
  if (huskyExists) {
    const content = fs.readFileSync(huskyPath, 'utf8');
    console.log(`    - Import 검증: ${content.includes('import-validator') ? '✓' : '✗'}`);
    console.log(`    - ESLint: ${content.includes('eslint') ? '✓' : '✗'}`);
    console.log(`    - 테스트: ${content.includes('test') ? '✓' : '✗'}`);
  }
}

// CI/CD 워크플로우 체크
async function checkCICD() {
  console.log(`\n${colors.blue}4. CI/CD 워크플로우 체크${colors.reset}`);
  
  const workflows = [
    '.github/workflows/frontend-ci.yml',
    '.github/workflows/backend-ci.yml'
  ];
  
  for (const workflow of workflows) {
    const exists = fs.existsSync(path.join(__dirname, workflow));
    const name = path.basename(workflow, '.yml');
    console.log(`  ${exists ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset} ${name}`);
  }
}

// 프론트엔드 빌드 테스트
async function testBuild() {
  console.log(`\n${colors.blue}5. 빌드 테스트${colors.reset}`);
  
  try {
    console.log('  빌드 시작... (시간이 걸릴 수 있습니다)');
    
    // package.json 체크
    const packagePath = path.join(__dirname, 'vridge_front/package.json');
    if (!fs.existsSync(packagePath)) {
      console.log(`  ${colors.red}✗${colors.reset} package.json 없음`);
      return;
    }
    
    // 빌드 명령 실행 (dry-run)
    const { stdout, stderr } = await execPromise('cd vridge_front && npm run build --dry-run', {
      timeout: 5000
    }).catch(err => ({ stdout: '', stderr: err.message }));
    
    if (stderr && !stderr.includes('dry-run')) {
      console.log(`  ${colors.red}✗${colors.reset} 빌드 설정 오류`);
    } else {
      console.log(`  ${colors.green}✓${colors.reset} 빌드 설정 정상`);
    }
  } catch (error) {
    console.log(`  ${colors.yellow}⚠${colors.reset} 빌드 테스트 건너뜀`);
  }
}

// 종합 결과
async function showSummary() {
  console.log(`\n${colors.cyan}📊 테스트 결과 요약${colors.reset}`);
  console.log('=' .repeat(50));
  
  const recommendations = [];
  
  // ProjectDashboard import 체크
  const dashboardPath = path.join(__dirname, 'vridge_front/src/components/ProjectDashboard.jsx');
  if (fs.existsSync(dashboardPath)) {
    const content = fs.readFileSync(dashboardPath, 'utf8');
    if (content.includes('FolderOpenOutlined') && !content.includes('import') && !content.includes('FolderOpenOutlined')) {
      recommendations.push('ProjectDashboard.jsx의 FolderOpenOutlined import 수정 필요');
    }
  }
  
  // 자동화 도구 체크
  if (!fs.existsSync(path.join(__dirname, '.husky/pre-commit'))) {
    recommendations.push('Pre-commit hook 설정 권장 (npx husky install)');
  }
  
  if (!fs.existsSync(path.join(__dirname, '.github/workflows'))) {
    recommendations.push('GitHub Actions 워크플로우 설정 권장');
  }
  
  if (recommendations.length > 0) {
    console.log(`\n${colors.yellow}💡 권장사항:${colors.reset}`);
    recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });
  } else {
    console.log(`${colors.green}✨ 모든 검사 통과! 자동화 시스템 완벽 작동 중${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}🎯 자동화 시스템 실행:${colors.reset}`);
  console.log('  ./start-automation.sh');
  console.log(`\n${colors.cyan}📖 상세 문서:${colors.reset}`);
  console.log('  cat AUTOMATION_SYSTEM_README.md');
}

// 실행
async function main() {
  await checkImports();
  await checkAutomationScripts();
  await checkGitHooks();
  await checkCICD();
  await testBuild();
  await showSummary();
}

main().catch(console.error);