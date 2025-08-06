/**
 * VideoPlanet E2E Test Configuration
 * Grace - QA Lead Strategy
 * 
 * 포괄적인 사용자 여정 테스트를 위한 Playwright 설정
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '../scenarios',
  fullyParallel: false, // 순차적 테스트 실행
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html'],
    ['json', { outputFile: '../reports/test-results.json' }],
    ['list'],
    ['junit', { outputFile: '../reports/junit.xml' }]
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    // 테스트 환경 변수
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // 로컬 스토리지 및 쿠키 유지
        storageState: process.env.STORAGE ? '../auth/storageState.json' : undefined,
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'mobile',
      use: { 
        ...devices['iPhone 14'],
      },
    },
  ],

  webServer: [
    {
      command: 'cd /home/winnmedia/VideoPlanet/vridge_front && npm run dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'cd /home/winnmedia/VideoPlanet/vridge_back && python manage.py runserver',
      port: 8000,
      reuseExistingServer: true,
      timeout: 120000,
    }
  ],
  
  // 테스트 타임아웃 설정
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  
  // 글로벌 설정
  globalSetup: require.resolve('./global-setup.js'),
  globalTeardown: require.resolve('./global-teardown.js'),
});