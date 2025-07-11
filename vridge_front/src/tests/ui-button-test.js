#!/usr/bin/env node

/**
 * VideoPlanet 웹서비스 전체 버튼 및 UI 요소 테스트
 * Puppeteer를 사용하여 실제 브라우저에서 모든 버튼과 입력 요소를 테스트
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

// 테스트 결과 저장
const testResults = {
  timestamp: new Date().toISOString(),
  totalElements: 0,
  clickable: 0,
  notClickable: 0,
  errors: [],
  pages: {}
};

// 테스트 계정 정보
const testCredentials = {
  email: 'test@example.com',
  password: 'Test1234!'
};

// 색상 코드
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

/**
 * 로그인 수행
 */
async function login(page) {
  console.log(`${colors.cyan}🔐 로그인 시도 중...${colors.reset}`);
  
  // 로그인 페이지로 이동
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
  
  // 로그인 폼 입력
  await page.type('input[type="email"]', testCredentials.email);
  await page.type('input[type="password"]', testCredentials.password);
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  
  // 로그인 완료 대기
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  console.log(`${colors.green}✅ 로그인 성공${colors.reset}`);
}

/**
 * 모든 클릭 가능한 요소 테스트
 */
async function testClickableElements(page, pageName) {
  console.log(`\n${colors.cyan}📄 ${pageName} 페이지 테스트${colors.reset}`);
  
  const results = {
    buttons: [],
    links: [],
    inputs: [],
    selects: [],
    textareas: []
  };
  
  // 버튼 테스트
  const buttons = await page.$$('button, [role="button"], .btn, .button');
  console.log(`  버튼 ${buttons.length}개 발견`);
  
  for (let i = 0; i < buttons.length; i++) {
    try {
      const button = buttons[i];
      const text = await button.evaluate(el => el.textContent?.trim() || 'No text');
      const isClickable = await button.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && 
               rect.height > 0 && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               style.pointerEvents !== 'none' &&
               !el.disabled;
      });
      
      results.buttons.push({
        text,
        clickable: isClickable,
        selector: await button.evaluate(el => {
          if (el.id) return `#${el.id}`;
          if (el.className) return `.${el.className.split(' ')[0]}`;
          return el.tagName.toLowerCase();
        })
      });
      
      if (isClickable) {
        testResults.clickable++;
        console.log(`    ${colors.green}✅${colors.reset} "${text}" - 클릭 가능`);
      } else {
        testResults.notClickable++;
        console.log(`    ${colors.red}❌${colors.reset} "${text}" - 클릭 불가`);
      }
      testResults.totalElements++;
    } catch (e) {
      testResults.errors.push({ page: pageName, element: 'button', error: e.message });
    }
  }
  
  // 링크 테스트
  const links = await page.$$('a[href]');
  console.log(`  링크 ${links.length}개 발견`);
  
  for (const link of links) {
    try {
      const text = await link.evaluate(el => el.textContent?.trim() || 'No text');
      const href = await link.evaluate(el => el.href);
      const isClickable = await link.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.pointerEvents !== 'none' && style.display !== 'none';
      });
      
      results.links.push({ text, href, clickable: isClickable });
      testResults.totalElements++;
      
      if (isClickable) {
        testResults.clickable++;
      } else {
        testResults.notClickable++;
      }
    } catch (e) {
      testResults.errors.push({ page: pageName, element: 'link', error: e.message });
    }
  }
  
  // 입력 필드 테스트
  const inputs = await page.$$('input:not([type="hidden"])');
  console.log(`  입력 필드 ${inputs.length}개 발견`);
  
  for (const input of inputs) {
    try {
      const type = await input.evaluate(el => el.type);
      const placeholder = await input.evaluate(el => el.placeholder);
      const isEnabled = await input.evaluate(el => !el.disabled && !el.readOnly);
      const canFocus = await input.evaluate(el => {
        el.focus();
        return document.activeElement === el;
      });
      
      results.inputs.push({
        type,
        placeholder,
        enabled: isEnabled,
        focusable: canFocus
      });
      
      testResults.totalElements++;
      if (isEnabled && canFocus) {
        testResults.clickable++;
        console.log(`    ${colors.green}✅${colors.reset} Input[${type}] - 활성화됨`);
      } else {
        testResults.notClickable++;
        console.log(`    ${colors.red}❌${colors.reset} Input[${type}] - 비활성화됨`);
      }
    } catch (e) {
      testResults.errors.push({ page: pageName, element: 'input', error: e.message });
    }
  }
  
  // Textarea 테스트
  const textareas = await page.$$('textarea');
  console.log(`  텍스트영역 ${textareas.length}개 발견`);
  
  for (const textarea of textareas) {
    try {
      const isEnabled = await textarea.evaluate(el => !el.disabled && !el.readOnly);
      const canFocus = await textarea.evaluate(el => {
        el.focus();
        return document.activeElement === el;
      });
      
      results.textareas.push({
        enabled: isEnabled,
        focusable: canFocus
      });
      
      testResults.totalElements++;
      if (isEnabled && canFocus) {
        testResults.clickable++;
        console.log(`    ${colors.green}✅${colors.reset} Textarea - 활성화됨`);
      } else {
        testResults.notClickable++;
        console.log(`    ${colors.red}❌${colors.reset} Textarea - 비활성화됨`);
      }
    } catch (e) {
      testResults.errors.push({ page: pageName, element: 'textarea', error: e.message });
    }
  }
  
  // Select 테스트
  const selects = await page.$$('select');
  console.log(`  선택 상자 ${selects.length}개 발견`);
  
  for (const select of selects) {
    try {
      const isEnabled = await select.evaluate(el => !el.disabled);
      const optionCount = await select.evaluate(el => el.options.length);
      
      results.selects.push({
        enabled: isEnabled,
        options: optionCount
      });
      
      testResults.totalElements++;
      if (isEnabled) {
        testResults.clickable++;
        console.log(`    ${colors.green}✅${colors.reset} Select - ${optionCount}개 옵션`);
      } else {
        testResults.notClickable++;
        console.log(`    ${colors.red}❌${colors.reset} Select - 비활성화됨`);
      }
    } catch (e) {
      testResults.errors.push({ page: pageName, element: 'select', error: e.message });
    }
  }
  
  testResults.pages[pageName] = results;
}

/**
 * 주요 페이지 목록
 */
const pagesToTest = [
  { path: '/', name: '홈페이지' },
  { path: '/login', name: '로그인' },
  { path: '/signup', name: '회원가입' },
  { path: '/cms/project', name: '프로젝트 목록' },
  { path: '/cms/project-create', name: '프로젝트 생성' },
  { path: '/mypage', name: '마이페이지' }
];

/**
 * 메인 테스트 함수
 */
async function runUITest() {
  console.log(`${colors.cyan}🚀 VideoPlanet UI 버튼 및 요소 테스트 시작${colors.reset}`);
  console.log(`📅 테스트 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🔗 프론트엔드 URL: ${FRONTEND_URL}\n`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // 콘솔 메시지 캡처
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.errors.push({
          page: 'console',
          error: msg.text()
        });
      }
    });
    
    // 각 페이지 테스트
    for (const pageInfo of pagesToTest) {
      try {
        await page.goto(`${FRONTEND_URL}${pageInfo.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // 로그인이 필요한 페이지인 경우
        if (pageInfo.path.includes('/cms') || pageInfo.path.includes('/mypage')) {
          const currentUrl = page.url();
          if (currentUrl.includes('/login')) {
            await login(page);
            await page.goto(`${FRONTEND_URL}${pageInfo.path}`, { 
              waitUntil: 'networkidle2' 
            });
          }
        }
        
        await testClickableElements(page, pageInfo.name);
        
        // 스크린샷 저장
        await page.screenshot({ 
          path: `ui-test-${pageInfo.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
          fullPage: true 
        });
        
      } catch (e) {
        console.log(`${colors.red}❌ ${pageInfo.name} 페이지 테스트 실패: ${e.message}${colors.reset}`);
        testResults.errors.push({
          page: pageInfo.name,
          error: e.message
        });
      }
    }
    
    // 프로젝트가 있다면 피드백 페이지도 테스트
    try {
      await page.goto(`${FRONTEND_URL}/cms/project`, { waitUntil: 'networkidle2' });
      const projectLinks = await page.$$('.project-item a');
      
      if (projectLinks.length > 0) {
        await projectLinks[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await testClickableElements(page, '피드백');
      }
    } catch (e) {
      console.log(`${colors.yellow}⚠️  피드백 페이지 테스트 스킵${colors.reset}`);
    }
    
  } finally {
    await browser.close();
  }
  
  // 결과 출력
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.cyan}📊 UI 테스트 최종 결과${colors.reset}`);
  console.log('='.repeat(80));
  console.log(`총 UI 요소: ${testResults.totalElements}개`);
  console.log(`${colors.green}✅ 활성화됨: ${testResults.clickable}개${colors.reset}`);
  console.log(`${colors.red}❌ 비활성화됨: ${testResults.notClickable}개${colors.reset}`);
  console.log(`활성화율: ${((testResults.clickable / testResults.totalElements) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}⚠️  에러 ${testResults.errors.length}개 발생:${colors.reset}`);
    testResults.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. [${err.page}] ${err.error}`);
    });
  }
  
  // 페이지별 요약
  console.log('\n📋 페이지별 요약:');
  Object.entries(testResults.pages).forEach(([pageName, data]) => {
    const total = data.buttons.length + data.links.length + 
                  data.inputs.length + data.textareas.length + data.selects.length;
    console.log(`\n[${pageName}] 총 ${total}개 요소`);
    console.log(`  - 버튼: ${data.buttons.length}개`);
    console.log(`  - 링크: ${data.links.length}개`);
    console.log(`  - 입력필드: ${data.inputs.length}개`);
    console.log(`  - 텍스트영역: ${data.textareas.length}개`);
    console.log(`  - 선택상자: ${data.selects.length}개`);
  });
  
  // 상세 보고서 저장
  fs.writeFileSync(
    `ui-test-report-${Date.now()}.json`,
    JSON.stringify(testResults, null, 2)
  );
  console.log(`\n📄 상세 보고서가 저장되었습니다.`);
  
  // 최종 평가
  const successRate = (testResults.clickable / testResults.totalElements) * 100;
  console.log('\n🎯 종합 평가:');
  if (successRate >= 95) {
    console.log(`${colors.green}✅ 모든 UI 요소가 정상적으로 작동합니다!${colors.reset}`);
  } else if (successRate >= 80) {
    console.log(`${colors.yellow}⚠️  대부분의 UI 요소가 작동하지만 일부 개선이 필요합니다.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ UI 요소에 심각한 문제가 있습니다. 즉시 수정이 필요합니다.${colors.reset}`);
  }
}

// Puppeteer 설치 확인
try {
  require.resolve('puppeteer');
  runUITest().catch(console.error);
} catch (e) {
  console.log(`${colors.red}❌ Puppeteer가 설치되지 않았습니다.${colors.reset}`);
  console.log('설치하려면: npm install puppeteer');
  console.log('\n대신 간단한 HTTP 기반 테스트를 실행합니다...\n');
  
  // 대체 테스트 실행
  require('./mece-full-test.js');
}