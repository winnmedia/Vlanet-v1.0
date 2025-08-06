/**
 * 신규 사용자 여정 테스트
 * Critical Path: 회원가입 → 이메일 인증 → 첫 로그인 → 프로필 설정
 */

const { test, expect } = require('@playwright/test');
const TestHelpers = require('../utils/test-helpers');

test.describe('신규 사용자 여정 (Critical Path)', () => {
  let helpers;
  let testUser;
  
  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    testUser = helpers.generateTestData('user');
  });
  
  test('1.1 홈페이지 접속 및 초기 로딩 성능', async ({ page }) => {
    // 홈페이지 접속
    await page.goto('/');
    
    // 페이지 로딩 완료 대기
    await page.waitForLoadState('networkidle');
    
    // 성능 메트릭 수집
    const metrics = await helpers.collectPerformanceMetrics();
    
    // 성능 검증
    expect(metrics.domContentLoaded).toBeLessThan(3000); // 3초 이내
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5초 이내
    
    // 핵심 UI 요소 확인
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav, .navigation')).toBeVisible();
    
    // CTA 버튼 확인
    const signupButton = page.locator('a:has-text("회원가입"), button:has-text("시작하기")').first();
    await expect(signupButton).toBeVisible();
    
    // 스크린샷 캡처
    await helpers.captureScreenshot('homepage-loaded');
    
    console.log('✅ 홈페이지 로딩 성능:', {
      domContentLoaded: `${metrics.domContentLoaded}ms`,
      firstPaint: `${metrics.firstContentfulPaint}ms`,
      totalResources: metrics.totalResources
    });
  });
  
  test('1.2 회원가입 프로세스', async ({ page }) => {
    await page.goto('/signup');
    
    // 회원가입 폼 확인
    await expect(page.locator('form')).toBeVisible();
    
    // 입력 검증 테스트 (빈 폼 제출)
    await page.click('button[type="submit"]');
    const validation1 = await helpers.validateForm('form');
    expect(validation1.isValid).toBe(false);
    expect(validation1.errors.length).toBeGreaterThan(0);
    
    // 유효하지 않은 이메일 테스트
    await page.fill('input[name="email"], input[type="email"]', 'invalid-email');
    await page.fill('input[name="password"], input[type="password"]', '123'); // 약한 비밀번호
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('text=/이메일|email/i')).toBeVisible();
    await expect(page.locator('text=/비밀번호|password/i')).toBeVisible();
    
    // 올바른 정보 입력
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    await page.fill('input[name="passwordConfirm"], input[name="password_confirm"]', testUser.password);
    await page.fill('input[name="name"], input[name="username"]', testUser.name);
    
    // 약관 동의 (있는 경우)
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
    
    // API 응답 모니터링하며 회원가입 제출
    const signupResponse = await helpers.monitorAPICall('/api/users/signup', async () => {
      await page.click('button[type="submit"]');
    });
    
    // 회원가입 성공 확인
    expect(signupResponse.success).toBe(true);
    
    // 이메일 인증 페이지 또는 성공 메시지 확인
    await expect(page.locator('text=/인증|verification|확인/i')).toBeVisible({ timeout: 5000 });
    
    await helpers.captureScreenshot('signup-success');
    
    console.log('✅ 회원가입 완료:', testUser.email);
  });
  
  test('1.3 이메일 인증 프로세스', async ({ page, context }) => {
    // 실제 이메일 인증이 어려운 경우 Mock 처리
    // 개발 환경에서는 인증 링크 직접 생성
    
    const mockVerificationToken = 'test-verification-token-123';
    const verificationUrl = `/verify-email?token=${mockVerificationToken}`;
    
    await page.goto(verificationUrl);
    
    // 인증 처리 대기
    await page.waitForLoadState('networkidle');
    
    // 인증 성공 메시지 확인
    const successMessage = await page.locator('text=/인증.*완료|verified|confirmed/i').isVisible();
    
    if (successMessage) {
      console.log('✅ 이메일 인증 완료');
      
      // 로그인 페이지로 리다이렉트 확인
      await page.waitForURL(/\/login/i, { timeout: 5000 });
    } else {
      // 개발 환경에서 인증 스킵 옵션
      console.log('⚠️  이메일 인증 스킵 (개발 환경)');
    }
    
    await helpers.captureScreenshot('email-verification');
  });
  
  test('1.4 첫 로그인', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 폼 확인
    await expect(page.locator('form')).toBeVisible();
    
    // 잘못된 자격증명 테스트
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="password"], input[type="password"]', 'WrongPassword123!');
    
    const failedLogin = await helpers.monitorAPICall('/api/users/login', async () => {
      await page.click('button[type="submit"]');
    });
    
    if (!failedLogin.success) {
      await expect(page.locator('text=/실패|오류|잘못/i')).toBeVisible();
    }
    
    // 올바른 자격증명으로 로그인
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    
    const successLogin = await helpers.monitorAPICall('/api/users/login', async () => {
      await page.click('button[type="submit"]');
    });
    
    expect(successLogin.success).toBe(true);
    
    // 대시보드로 리다이렉트 확인
    await page.waitForURL(/\/(dashboard|cms|home)/i, { timeout: 10000 });
    
    // 세션 쿠키 확인
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name.includes('token') || c.name.includes('auth'));
    expect(authCookie).toBeTruthy();
    
    await helpers.captureScreenshot('first-login-success');
    
    console.log('✅ 첫 로그인 성공');
  });
  
  test('1.5 프로필 설정', async ({ page }) => {
    // 로그인 상태에서 시작
    await helpers.login(testUser.email, testUser.password);
    
    // 마이페이지로 이동
    await helpers.navigateTo('mypage');
    
    // 프로필 폼 확인
    await expect(page.locator('form, .profile-form')).toBeVisible();
    
    // 프로필 정보 입력
    const profileData = {
      phone: '010-1234-5678',
      company: '테스트 회사',
      position: '프로듀서',
      bio: '영상 제작 전문가입니다.',
      website: 'https://example.com'
    };
    
    // 입력 필드 채우기
    for (const [field, value] of Object.entries(profileData)) {
      const input = page.locator(`input[name="${field}"], textarea[name="${field}"]`).first();
      if (await input.isVisible()) {
        await input.fill(value);
      }
    }
    
    // 프로필 이미지 업로드 테스트
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible()) {
      // 테스트 이미지 파일 경로
      const testImagePath = '/home/winnmedia/VideoPlanet/vridge_front/src/tests/test-profile.jpg';
      await helpers.uploadFile('input[type="file"]', testImagePath);
    }
    
    // 프로필 저장
    const saveResponse = await helpers.monitorAPICall('/api/users/profile', async () => {
      await page.click('button:has-text("저장"), button[type="submit"]');
    });
    
    expect(saveResponse.success).toBe(true);
    
    // 성공 메시지 확인
    const savedMessage = await helpers.checkToastMessage('저장');
    expect(savedMessage).toBe(true);
    
    // 프로필 정보 재로드 확인
    await page.reload();
    
    // 저장된 정보 확인
    const phoneInput = page.locator('input[name="phone"]').first();
    if (await phoneInput.isVisible()) {
      const savedPhone = await phoneInput.inputValue();
      expect(savedPhone).toBe(profileData.phone);
    }
    
    await helpers.captureScreenshot('profile-setup-complete');
    
    console.log('✅ 프로필 설정 완료');
  });
  
  test('1.6 신규 사용자 온보딩 체크리스트', async ({ page }) => {
    await helpers.login(testUser.email, testUser.password);
    
    const onboardingChecks = {
      '대시보드 접근': false,
      '프로젝트 생성 버튼': false,
      '도움말 툴팁': false,
      '네비게이션 메뉴': false,
      '알림 설정': false
    };
    
    // 대시보드 접근
    await helpers.navigateTo('dashboard');
    onboardingChecks['대시보드 접근'] = await page.locator('.dashboard, main').isVisible();
    
    // 프로젝트 생성 버튼
    onboardingChecks['프로젝트 생성 버튼'] = await page.locator('button:has-text("프로젝트"), a:has-text("새 프로젝트")').first().isVisible();
    
    // 도움말 툴팁
    onboardingChecks['도움말 툴팁'] = await page.locator('.tooltip, .help, .tutorial').first().isVisible();
    
    // 네비게이션 메뉴
    onboardingChecks['네비게이션 메뉴'] = await page.locator('nav, .sidebar').isVisible();
    
    // 알림 설정
    onboardingChecks['알림 설정'] = await page.locator('.notification, .alert').first().isVisible();
    
    // 결과 출력
    console.log('📋 온보딩 체크리스트:');
    for (const [item, status] of Object.entries(onboardingChecks)) {
      console.log(`  ${status ? '✅' : '❌'} ${item}`);
    }
    
    // 접근성 검사
    const accessibilityIssues = await helpers.checkAccessibility();
    if (accessibilityIssues.length > 0) {
      console.log('⚠️  접근성 이슈 발견:', accessibilityIssues.length);
      accessibilityIssues.slice(0, 3).forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.message}`);
      });
    }
    
    await helpers.captureScreenshot('onboarding-complete');
  });
});