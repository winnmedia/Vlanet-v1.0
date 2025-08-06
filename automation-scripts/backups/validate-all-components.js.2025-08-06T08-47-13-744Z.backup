#!/usr/bin/env node
/**
 * VideoPlanet 전체 컴포넌트 검증
 * 모든 페이지와 컴포넌트의 import 및 렌더링 검증
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  frontend: 'http://localhost:3000',
  backend: 'http://localhost:8000',
  testUser: {
    email: 'ceo@winnmedia.co.kr',
    password: 'Qwerasdf!234'
  }
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 테스트 결과
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  importIssues: [],
  recommendations: []
};

// 테스트 함수
async function test(name, fn) {
  results.total++;
  process.stdout.write(`  ${name}... `);
  
  try {
    const result = await fn();
    if (result === true) {
      results.passed++;
      console.log(`${colors.green}✓${colors.reset}`);
    } else if (result === 'warning') {
      console.log(`${colors.yellow}⚠${colors.reset}`);
    } else {
      results.failed++;
      console.log(`${colors.red}✗${colors.reset}`);
    }
    return result;
  } catch (error) {
    results.failed++;
    results.errors.push({ test: name, error: error.message });
    console.log(`${colors.red}✗ (${error.message})${colors.reset}`);
    return false;
  }
}

// 컴포넌트 Import 검증
function validateComponentImports(filePath) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, errors: ['File not found'] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const warnings = [];

  // 1. React import 확인
  if (!content.includes('import React') && !content.includes("from 'react'")) {
    errors.push('Missing React import');
  }

  // 2. 사용된 Hook 확인
  const hookPattern = /use(State|Effect|Memo|Callback|Ref|Context|Reducer|LayoutEffect)\(/g;
  const usedHooks = [...new Set([...content.matchAll(hookPattern)].map(m => m[1]))];
  
  for (const hook of usedHooks) {
    const hookName = `use${hook}`;
    const importRegex = new RegExp(`import.*{[^}]*${hookName}[^}]*}.*from ['"]react['"]`);
    if (!importRegex.test(content)) {
      errors.push(`Missing import for ${hookName}`);
    }
  }

  // 3. Ant Design 컴포넌트 확인
  const antdComponents = [
    'Button', 'Input', 'Form', 'Select', 'DatePicker', 'TimePicker',
    'Upload', 'Modal', 'Drawer', 'Table', 'List', 'Card', 'Col', 'Row',
    'Layout', 'Menu', 'Breadcrumb', 'Dropdown', 'Steps', 'Tabs', 'Tag',
    'Alert', 'Message', 'Notification', 'Progress', 'Spin', 'Skeleton',
    'Avatar', 'Badge', 'Carousel', 'Collapse', 'Comment', 'Descriptions',
    'Empty', 'Result', 'Statistic', 'Timeline', 'Tooltip', 'Typography',
    'Divider', 'Space', 'ConfigProvider', 'Popconfirm', 'Popover', 'Rate',
    'Slider', 'Switch', 'Transfer', 'Tree', 'TreeSelect', 'Checkbox', 'Radio'
  ];

  for (const comp of antdComponents) {
    const usageRegex = new RegExp(`<${comp}[\\s>]`, 'g');
    if (usageRegex.test(content)) {
      const importRegex = new RegExp(`import.*{[^}]*${comp}[^}]*}.*from ['"]antd['"]`);
      if (!importRegex.test(content)) {
        errors.push(`Missing import for Ant Design ${comp}`);
      }
    }
  }

  // 4. Ant Design Icons 확인
  const iconPattern = /([A-Z][a-zA-Z]+)(Outlined|Filled|TwoTone)\s*(?=[/>}])/g;
  const usedIcons = [...new Set([...content.matchAll(iconPattern)].map(m => m[0]))];
  
  for (const icon of usedIcons) {
    const importRegex = new RegExp(`import.*{[^}]*${icon}[^}]*}.*from ['"]@ant-design/icons['"]`);
    if (!importRegex.test(content)) {
      errors.push(`Missing import for icon ${icon}`);
    }
  }

  // 5. 로컬 컴포넌트 import 확인
  const localComponentPattern = /<([A-Z][a-zA-Z]+)\s/g;
  const usedComponents = [...new Set([...content.matchAll(localComponentPattern)].map(m => m[1]))];
  
  const htmlTags = ['Header', 'Footer', 'Main', 'Section', 'Article', 'Nav', 'Aside'];
  const antdComponentsList = antdComponents;
  
  for (const comp of usedComponents) {
    if (htmlTags.includes(comp) || antdComponentsList.includes(comp)) continue;
    
    const importRegex = new RegExp(`import.*${comp}.*from`);
    if (!importRegex.test(content)) {
      warnings.push(`Possible missing import for component ${comp}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// 메인 테스트
async function runTests() {
  console.log(`${colors.cyan}🚀 VideoPlanet 컴포넌트 검증${colors.reset}`);
  console.log('================================\n');

  // 1. 백엔드 API 테스트
  console.log(`${colors.blue}1. 백엔드 API 상태${colors.reset}`);
  
  await test('헬스체크', async () => {
    try {
      const res = await fetch(`${CONFIG.backend}/api/health/`);
      return res.status === 200;
    } catch (e) {
      return false;
    }
  });

  await test('인증 시스템', async () => {
    try {
      const res = await fetch(`${CONFIG.backend}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: CONFIG.testUser.email,
          password: CONFIG.testUser.password
        })
      });
      return res.status === 200;
    } catch (e) {
      return false;
    }
  });

  // 2. 프론트엔드 서버 상태
  console.log(`\n${colors.blue}2. 프론트엔드 서버${colors.reset}`);
  
  await test('개발 서버 실행 중', async () => {
    try {
      const res = await fetch(CONFIG.frontend);
      return res.status === 200;
    } catch (e) {
      console.log(`\n  ${colors.yellow}⚠ 프론트엔드 서버가 실행되지 않았습니다.${colors.reset}`);
      console.log(`  ${colors.yellow}  npm run dev 실행 후 다시 테스트하세요.${colors.reset}`);
      return false;
    }
  });

  // 3. 주요 페이지 컴포넌트 검증
  console.log(`\n${colors.blue}3. 페이지 컴포넌트 Import 검증${colors.reset}`);
  
  const pageComponents = [
    { path: 'src/page/Cms/CmsHome.jsx', name: 'CMS 홈' },
    { path: 'src/page/Cms/Feedback.jsx', name: '피드백' },
    { path: 'src/page/Cms/VideoPlanning.jsx', name: '영상 기획' },
    { path: 'src/page/Cms/ProjectCreate.jsx', name: '프로젝트 생성' },
    { path: 'src/page/User/MyPage.jsx', name: '마이페이지' },
    { path: 'src/page/Admin/AdminDashboard.jsx', name: '관리자 대시보드' }
  ];

  for (const page of pageComponents) {
    await test(page.name, () => {
      const filePath = path.join('/home/winnmedia/VideoPlanet/vridge_front', page.path);
      const validation = validateComponentImports(filePath);
      
      if (!validation.valid) {
        results.importIssues.push({
          file: page.path,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
      
      return validation.valid;
    });
  }

  // 4. 공통 컴포넌트 검증
  console.log(`\n${colors.blue}4. 공통 컴포넌트 Import 검증${colors.reset}`);
  
  const commonComponents = [
    { path: 'src/components/ProjectDashboard.jsx', name: 'ProjectDashboard' },
    { path: 'src/components/ProjectForm.jsx', name: 'ProjectForm' },
    { path: 'src/components/ErrorBoundary.jsx', name: 'ErrorBoundary' },
    { path: 'src/components/LoadingSpinner.jsx', name: 'LoadingSpinner' },
    { path: 'src/components/Header.jsx', name: 'Header' },
    { path: 'src/components/SideBar.jsx', name: 'SideBar' }
  ];

  for (const comp of commonComponents) {
    await test(comp.name, () => {
      const filePath = path.join('/home/winnmedia/VideoPlanet/vridge_front', comp.path);
      const validation = validateComponentImports(filePath);
      
      if (!validation.valid) {
        results.importIssues.push({
          file: comp.path,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
      
      return validation.valid;
    });
  }

  // 5. 중요 기능 컴포넌트 검증
  console.log(`\n${colors.blue}5. 핵심 기능 컴포넌트${colors.reset}`);
  
  const featureComponents = [
    { path: 'src/components/EnhancedVideoPlayer/EnhancedVideoPlayer.jsx', name: '비디오 플레이어' },
    { path: 'src/components/DrawingCanvas.jsx', name: '드로잉 캔버스' },
    { path: 'src/tasks/Feedback/FeedbackInput.jsx', name: '피드백 입력' },
    { path: 'src/tasks/Feedback/FeedbackManage.jsx', name: '피드백 관리' }
  ];

  for (const feature of featureComponents) {
    await test(feature.name, () => {
      const filePath = path.join('/home/winnmedia/VideoPlanet/vridge_front', feature.path);
      
      if (!fs.existsSync(filePath)) {
        return 'warning';
      }
      
      const validation = validateComponentImports(filePath);
      
      if (!validation.valid) {
        results.importIssues.push({
          file: feature.path,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
      
      return validation.valid;
    });
  }

  // 결과 분석 및 권장사항 생성
  if (results.importIssues.length > 0) {
    results.recommendations.push('Import 문제 자동 수정 스크립트 실행 필요');
    results.recommendations.push('ESLint import 플러그인 설정 권장');
    results.recommendations.push('VS Code 자동 import 설정 활성화');
  }

  // 결과 출력
  console.log('\n================================');
  console.log(`${colors.cyan}📊 검증 결과${colors.reset}`);
  console.log('================================');
  console.log(`총 테스트: ${results.total}`);
  console.log(`${colors.green}✅ 통과: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ 실패: ${results.failed}${colors.reset}`);
  
  if (results.importIssues.length > 0) {
    console.log(`\n${colors.yellow}📝 Import 문제 상세:${colors.reset}`);
    
    results.importIssues.forEach((issue, index) => {
      console.log(`\n  ${index + 1}. ${issue.file}`);
      
      if (issue.errors.length > 0) {
        console.log(`     ${colors.red}오류:${colors.reset}`);
        issue.errors.forEach(err => {
          console.log(`       - ${err}`);
        });
      }
      
      if (issue.warnings && issue.warnings.length > 0) {
        console.log(`     ${colors.yellow}경고:${colors.reset}`);
        issue.warnings.forEach(warn => {
          console.log(`       - ${warn}`);
        });
      }
    });
  }

  // 수정 스크립트 생성
  if (results.importIssues.length > 0) {
    console.log(`\n${colors.cyan}🔧 자동 수정 스크립트 생성 중...${colors.reset}`);
    
    const fixScript = generateFixScript(results.importIssues);
    const fixPath = path.join('/home/winnmedia/VideoPlanet/vridge_front/src/tests', 'auto-fix-imports.sh');
    
    fs.writeFileSync(fixPath, fixScript);
    fs.chmodSync(fixPath, '755');
    
    console.log(`✅ 수정 스크립트 생성됨: ${fixPath}`);
    console.log(`   실행: bash ${fixPath}`);
  }

  if (results.recommendations.length > 0) {
    console.log(`\n${colors.yellow}💡 권장사항:${colors.reset}`);
    results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  if (results.failed === 0 && results.importIssues.length === 0) {
    console.log(`\n${colors.green}✨ 모든 컴포넌트 검증 통과!${colors.reset}`);
    console.log(`${colors.green}   FolderOpenOutlined 같은 오류가 발생하지 않습니다.${colors.reset}`);
  }

  // 종료 코드
  process.exit(results.failed > 0 ? 1 : 0);
}

// Import 수정 스크립트 생성
function generateFixScript(issues) {
  let script = `#!/bin/bash
# VideoPlanet Import 자동 수정 스크립트
# 생성일: ${new Date().toISOString()}

echo "🔧 Import 문제 자동 수정 시작..."
`;

  const fixes = new Map();
  
  for (const issue of issues) {
    const filePath = `/home/winnmedia/VideoPlanet/vridge_front/${issue.file}`;
    
    if (!fixes.has(filePath)) {
      fixes.set(filePath, []);
    }
    
    for (const error of issue.errors) {
      if (error.includes('Missing import for use')) {
        const hook = error.match(/use\w+/)[0];
        fixes.get(filePath).push({
          type: 'react-hook',
          import: hook
        });
      } else if (error.includes('Missing import for Ant Design')) {
        const comp = error.match(/Ant Design (\w+)/)[1];
        fixes.get(filePath).push({
          type: 'antd',
          import: comp
        });
      } else if (error.includes('Missing import for icon')) {
        const icon = error.match(/icon (\w+)/)[1];
        fixes.get(filePath).push({
          type: 'antd-icon',
          import: icon
        });
      }
    }
  }

  for (const [file, imports] of fixes) {
    script += `
echo "수정 중: ${file}"
`;
    
    // React hooks
    const hooks = imports.filter(i => i.type === 'react-hook').map(i => i.import);
    if (hooks.length > 0) {
      script += `sed -i "s/import React/import React, { ${hooks.join(', ')} }/" "${file}"\n`;
    }
    
    // Ant Design components
    const antdComps = imports.filter(i => i.type === 'antd').map(i => i.import);
    if (antdComps.length > 0) {
      script += `sed -i "1i import { ${antdComps.join(', ')} } from 'antd';" "${file}"\n`;
    }
    
    // Ant Design icons
    const icons = imports.filter(i => i.type === 'antd-icon').map(i => i.import);
    if (icons.length > 0) {
      script += `sed -i "1i import { ${icons.join(', ')} } from '@ant-design/icons'
import { FolderOpenOutlined } from '@ant-design/icons';;" "${file}"\n`;
    }
  }

  script += `
echo "✅ Import 수정 완료!"
echo "📝 수정된 파일 수: ${fixes.size}"
`;

  return script;
}

// 실행
runTests().catch(console.error);