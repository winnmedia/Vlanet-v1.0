/**
 * Global Setup for VideoPlanet E2E Tests
 * 테스트 시작 전 환경 준비
 */

const { chromium } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

async function globalSetup(config) {
  console.log('🚀 VideoPlanet E2E 테스트 환경 준비 시작');
  
  // 테스트 리포트 디렉토리 생성
  const reportsDir = path.join(__dirname, '../reports');
  const screenshotsDir = path.join(__dirname, '../screenshots');
  const videosDir = path.join(__dirname, '../videos');
  
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.mkdir(screenshotsDir, { recursive: true });
  await fs.mkdir(videosDir, { recursive: true });
  
  // 테스트 데이터 준비
  const testData = {
    users: {
      admin: {
        email: 'ceo@winnmedia.co.kr',
        password: 'Qwerasdf!234'
      },
      newUser: {
        email: `test_${Date.now()}@videoplanet.test`,
        password: 'Test1234!@#$',
        name: '테스트 사용자'
      }
    },
    projects: {
      sample: {
        name: `테스트 프로젝트 ${new Date().toISOString().split('T')[0]}`,
        description: 'E2E 테스트용 프로젝트',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    },
    apiEndpoints: {
      backend: process.env.BACKEND_URL || 'http://localhost:8000',
      frontend: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  };
  
  // 테스트 데이터 저장
  await fs.writeFile(
    path.join(__dirname, '../config/test-data.json'),
    JSON.stringify(testData, null, 2)
  );
  
  // 인증 상태 저장 (기존 사용자 로그인)
  if (process.env.SAVE_AUTH) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(`${testData.apiEndpoints.frontend}/login`);
      await page.fill('input[name="email"]', testData.users.admin.email);
      await page.fill('input[name="password"]', testData.users.admin.password);
      await page.click('button[type="submit"]');
      
      // 로그인 성공 대기
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      // 스토리지 상태 저장
      await context.storageState({ path: path.join(__dirname, '../auth/storageState.json') });
      console.log('✅ 인증 상태 저장 완료');
    } catch (error) {
      console.error('❌ 인증 상태 저장 실패:', error.message);
    } finally {
      await browser.close();
    }
  }
  
  // 테스트 환경 정보 출력
  console.log('📊 테스트 환경 정보:');
  console.log(`  - Frontend URL: ${testData.apiEndpoints.frontend}`);
  console.log(`  - Backend URL: ${testData.apiEndpoints.backend}`);
  console.log(`  - 테스트 사용자: ${testData.users.admin.email}`);
  console.log(`  - 테스트 데이터: ${path.join(__dirname, '../config/test-data.json')}`);
  console.log('✅ 테스트 환경 준비 완료\n');
  
  return async () => {
    // Teardown 함수 (필요시)
  };
}

module.exports = globalSetup;