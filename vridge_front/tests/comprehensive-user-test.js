/**
 * VideoPlanet 포괄적 사용자 테스트
 * 7개 카테고리 전체 기능 검증
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class VideoPlanetUserTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            auth: { tests: [], passed: 0, failed: 0 },
            project: { tests: [], passed: 0, failed: 0 },
            calendar: { tests: [], passed: 0, failed: 0 },
            feedback: { tests: [], passed: 0, failed: 0 },
            planning: { tests: [], passed: 0, failed: 0 },
            collaboration: { tests: [], passed: 0, failed: 0 },
            navigation: { tests: [], passed: 0, failed: 0 }
        };
        this.startTime = Date.now();
    }

    async initialize() {
        console.log('🚀 VideoPlanet 포괄적 사용자 테스트 시작');
        this.browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1366, height: 768 }
        });
        this.page = await this.browser.newPage();
        
        // 페이지 로딩 대기 설정
        this.page.setDefaultTimeout(30000);
        this.page.setDefaultNavigationTimeout(30000);
    }

    async addTestResult(category, testName, passed, details = '', screenshot = false) {
        const result = {
            name: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString(),
            screenshot: screenshot ? `${category}_${testName.replace(/\s+/g, '_')}.png` : null
        };

        this.testResults[category].tests.push(result);
        if (passed) {
            this.testResults[category].passed++;
        } else {
            this.testResults[category].failed++;
        }

        const status = passed ? '✅' : '❌';
        console.log(`${status} [${category.toUpperCase()}] ${testName}: ${details}`);

        if (screenshot) {
            try {
                await this.page.screenshot({
                    path: path.join(__dirname, 'screenshots', result.screenshot),
                    fullPage: true
                });
            } catch (e) {
                console.log('스크린샷 저장 실패:', e.message);
            }
        }
    }

    async waitForElement(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (e) {
            return false;
        }
    }

    async testAuthenticationSystem() {
        console.log('\n🔐 1. 인증 시스템 테스트 시작');
        
        try {
            // 홈페이지 접속
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            await this.addTestResult('auth', '홈페이지 접속', true, '정상 로딩');

            // 회원가입 페이지 접근
            const signupExists = await this.waitForElement('a[href*="signup"], button:contains("회원가입")');
            if (signupExists) {
                await this.page.click('a[href*="signup"], button:contains("회원가입")');
                await this.addTestResult('auth', '회원가입 페이지 접근', true, '회원가입 버튼 클릭 성공');
            } else {
                await this.addTestResult('auth', '회원가입 페이지 접근', false, '회원가입 버튼을 찾을 수 없음');
            }

            // 로그인 페이지 접근
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            const loginExists = await this.waitForElement('a[href*="login"], button:contains("로그인")');
            if (loginExists) {
                await this.page.click('a[href*="login"], button:contains("로그인")');
                await this.addTestResult('auth', '로그인 페이지 접근', true, '로그인 버튼 클릭 성공');
            } else {
                await this.addTestResult('auth', '로그인 페이지 접근', false, '로그인 버튼을 찾을 수 없음');
            }

            // 로그인 폼 테스트
            const emailInput = await this.waitForElement('input[type="email"], input[name="email"]');
            const passwordInput = await this.waitForElement('input[type="password"], input[name="password"]');
            
            if (emailInput && passwordInput) {
                await this.page.type('input[type="email"], input[name="email"]', 'test@example.com');
                await this.page.type('input[type="password"], input[name="password"]', 'testpassword');
                await this.addTestResult('auth', '로그인 폼 입력', true, '이메일과 비밀번호 입력 완료');
            } else {
                await this.addTestResult('auth', '로그인 폼 입력', false, '로그인 폼 요소를 찾을 수 없음');
            }

        } catch (error) {
            await this.addTestResult('auth', '인증 시스템 전체', false, `오류: ${error.message}`, true);
        }
    }

    async testProjectManagement() {
        console.log('\n📂 2. 프로젝트 관리 테스트 시작');
        
        try {
            // 프로젝트 페이지 접근
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            
            const projectLink = await this.waitForElement('a[href*="project"], button:contains("프로젝트")');
            if (projectLink) {
                await this.page.click('a[href*="project"], button:contains("프로젝트")');
                await this.addTestResult('project', '프로젝트 페이지 접근', true, '프로젝트 메뉴 클릭 성공');
            } else {
                await this.addTestResult('project', '프로젝트 페이지 접근', false, '프로젝트 메뉴를 찾을 수 없음');
            }

            // 프로젝트 생성 버튼 확인
            const createBtn = await this.waitForElement('button:contains("생성"), button:contains("추가"), a:contains("새 프로젝트")');
            if (createBtn) {
                await this.addTestResult('project', '프로젝트 생성 버튼 확인', true, '생성 버튼 발견');
            } else {
                await this.addTestResult('project', '프로젝트 생성 버튼 확인', false, '생성 버튼을 찾을 수 없음');
            }

            // 프로젝트 목록 확인
            const projectList = await this.waitForElement('.project-list, .ant-list, table');
            if (projectList) {
                await this.addTestResult('project', '프로젝트 목록 확인', true, '프로젝트 목록 컴포넌트 발견');
            } else {
                await this.addTestResult('project', '프로젝트 목록 확인', false, '프로젝트 목록을 찾을 수 없음');
            }

        } catch (error) {
            await this.addTestResult('project', '프로젝트 관리 전체', false, `오류: ${error.message}`, true);
        }
    }

    async testCalendarManagement() {
        console.log('\n📅 3. 일정 관리 테스트 시작');
        
        try {
            // 캘린더 페이지 접근
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            
            const calendarLink = await this.waitForElement('a[href*="calendar"], button:contains("캘린더")');
            if (calendarLink) {
                await this.page.click('a[href*="calendar"], button:contains("캘린더")');
                await this.addTestResult('calendar', '캘린더 페이지 접근', true, '캘린더 메뉴 클릭 성공');
            } else {
                await this.addTestResult('calendar', '캘린더 페이지 접근', false, '캘린더 메뉴를 찾을 수 없음');
            }

            // 캘린더 컴포넌트 확인
            const calendarComponent = await this.waitForElement('.calendar, .ant-calendar, .react-calendar');
            if (calendarComponent) {
                await this.addTestResult('calendar', '캘린더 컴포넌트 확인', true, '캘린더 컴포넌트 렌더링 확인');
            } else {
                await this.addTestResult('calendar', '캘린더 컴포넌트 확인', false, '캘린더 컴포넌트를 찾을 수 없음');
            }

        } catch (error) {
            await this.addTestResult('calendar', '일정 관리 전체', false, `오류: ${error.message}`, true);
        }
    }

    async testFeedbackSystem() {
        console.log('\n💬 4. 피드백 시스템 테스트 시작');
        
        try {
            // 피드백 페이지 접근
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            
            const feedbackLink = await this.waitForElement('a[href*="feedback"], button:contains("피드백")');
            if (feedbackLink) {
                await this.page.click('a[href*="feedback"], button:contains("피드백")');
                await this.addTestResult('feedback', '피드백 페이지 접근', true, '피드백 메뉴 클릭 성공');
            } else {
                await this.addTestResult('feedback', '피드백 페이지 접근', false, '피드백 메뉴를 찾을 수 없음');
            }

            // 파일 업로드 컴포넌트 확인
            const uploadComponent = await this.waitForElement('input[type="file"], .ant-upload, .upload-area');
            if (uploadComponent) {
                await this.addTestResult('feedback', '파일 업로드 컴포넌트 확인', true, '업로드 컴포넌트 발견');
            } else {
                await this.addTestResult('feedback', '파일 업로드 컴포넌트 확인', false, '업로드 컴포넌트를 찾을 수 없음');
            }

            // 피드백 목록 확인
            const feedbackList = await this.waitForElement('.feedback-list, .ant-list, .comment-list');
            if (feedbackList) {
                await this.addTestResult('feedback', '피드백 목록 확인', true, '피드백 목록 컴포넌트 발견');
            } else {
                await this.addTestResult('feedback', '피드백 목록 확인', false, '피드백 목록을 찾을 수 없음');
            }

        } catch (error) {
            await this.addTestResult('feedback', '피드백 시스템 전체', false, `오류: ${error.message}`, true);
        }
    }

    async testVideoPlanningAI() {
        console.log('\n🎬 5. 영상 기획 AI 테스트 시작');
        
        try {
            // 영상 기획 페이지 접근
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            
            const planningLink = await this.waitForElement('a[href*="planning"], button:contains("기획")');
            if (planningLink) {
                await this.page.click('a[href*="planning"], button:contains("기획")');
                await this.addTestResult('planning', '영상 기획 페이지 접근', true, '기획 메뉴 클릭 성공');
            } else {
                await this.addTestResult('planning', '영상 기획 페이지 접근', false, '기획 메뉴를 찾을 수 없음');
            }

            // AI 입력 폼 확인
            const aiInputForm = await this.waitForElement('textarea, input[placeholder*="기획"], .ai-input');
            if (aiInputForm) {
                await this.addTestResult('planning', 'AI 입력 폼 확인', true, 'AI 입력 영역 발견');
            } else {
                await this.addTestResult('planning', 'AI 입력 폼 확인', false, 'AI 입력 영역을 찾을 수 없음');
            }

            // 생성 버튼 확인
            const generateBtn = await this.waitForElement('button:contains("생성"), button:contains("AI")');
            if (generateBtn) {
                await this.addTestResult('planning', 'AI 생성 버튼 확인', true, 'AI 생성 버튼 발견');
            } else {
                await this.addTestResult('planning', 'AI 생성 버튼 확인', false, 'AI 생성 버튼을 찾을 수 없음');
            }

        } catch (error) {
            await this.addTestResult('planning', '영상 기획 AI 전체', false, `오류: ${error.message}`, true);
        }
    }

    async testCollaborationFeatures() {
        console.log('\n👥 6. 협업 기능 테스트 시작');
        
        try {
            // 팀 관리 페이지 접근
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            
            const teamLink = await this.waitForElement('a[href*="team"], button:contains("팀"), a[href*="member"]');
            if (teamLink) {
                await this.page.click('a[href*="team"], button:contains("팀"), a[href*="member"]');
                await this.addTestResult('collaboration', '팀 관리 페이지 접근', true, '팀 메뉴 클릭 성공');
            } else {
                await this.addTestResult('collaboration', '팀 관리 페이지 접근', false, '팀 메뉴를 찾을 수 없음');
            }

            // 초대 기능 확인
            const inviteBtn = await this.waitForElement('button:contains("초대"), button:contains("추가")');
            if (inviteBtn) {
                await this.addTestResult('collaboration', '팀원 초대 기능 확인', true, '초대 버튼 발견');
            } else {
                await this.addTestResult('collaboration', '팀원 초대 기능 확인', false, '초대 버튼을 찾을 수 없음');
            }

        } catch (error) {
            await this.addTestResult('collaboration', '협업 기능 전체', false, `오류: ${error.message}`, true);
        }
    }

    async testNavigation() {
        console.log('\n🧭 7. 네비게이션 테스트 시작');
        
        try {
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

            // 메인 네비게이션 메뉴 확인
            const mainNav = await this.waitForElement('nav, .ant-menu, .navigation');
            if (mainNav) {
                await this.addTestResult('navigation', '메인 네비게이션 확인', true, '네비게이션 메뉴 발견');
            } else {
                await this.addTestResult('navigation', '메인 네비게이션 확인', false, '네비게이션 메뉴를 찾을 수 없음');
            }

            // 로고/홈 링크 확인
            const homeLink = await this.waitForElement('a[href="/"], .logo, img[alt*="logo"]');
            if (homeLink) {
                await this.addTestResult('navigation', '홈 링크 확인', true, '홈 링크 발견');
            } else {
                await this.addTestResult('navigation', '홈 링크 확인', false, '홈 링크를 찾을 수 없음');
            }

            // 페이지 제목 확인
            const title = await this.page.title();
            if (title && title.toLowerCase().includes('video')) {
                await this.addTestResult('navigation', '페이지 제목 확인', true, `제목: ${title}`);
            } else {
                await this.addTestResult('navigation', '페이지 제목 확인', false, `예상과 다른 제목: ${title}`);
            }

            // 반응형 메뉴 확인 (모바일)
            await this.page.setViewport({ width: 768, height: 1024 });
            await this.page.reload({ waitUntil: 'networkidle2' });
            
            const mobileMenu = await this.waitForElement('.mobile-menu, .ant-drawer, .hamburger');
            if (mobileMenu) {
                await this.addTestResult('navigation', '반응형 메뉴 확인', true, '모바일 메뉴 발견');
            } else {
                await this.addTestResult('navigation', '반응형 메뉴 확인', false, '모바일 메뉴를 찾을 수 없음');
            }

        } catch (error) {
            await this.addTestResult('navigation', '네비게이션 전체', false, `오류: ${error.message}`, true);
        }
    }

    async generateReport() {
        const endTime = Date.now();
        const duration = Math.round((endTime - this.startTime) / 1000);
        
        const report = {
            metadata: {
                testDate: new Date().toISOString(),
                duration: `${duration}초`,
                environment: {
                    frontend: 'http://localhost:3000',
                    backend: 'http://localhost:8000'
                }
            },
            summary: {
                categories: Object.keys(this.testResults).length,
                totalTests: Object.values(this.testResults).reduce((sum, cat) => sum + cat.tests.length, 0),
                totalPassed: Object.values(this.testResults).reduce((sum, cat) => sum + cat.passed, 0),
                totalFailed: Object.values(this.testResults).reduce((sum, cat) => sum + cat.failed, 0)
            },
            results: this.testResults
        };

        // 성공률 계산
        report.summary.successRate = Math.round((report.summary.totalPassed / report.summary.totalTests) * 100);

        // 보고서 파일 저장
        const reportPath = path.join(__dirname, 'comprehensive-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('\n📊 테스트 결과 요약:');
        console.log('='.repeat(50));
        console.log(`총 카테고리: ${report.summary.categories}개`);
        console.log(`총 테스트: ${report.summary.totalTests}개`);
        console.log(`성공: ${report.summary.totalPassed}개`);
        console.log(`실패: ${report.summary.totalFailed}개`);
        console.log(`성공률: ${report.summary.successRate}%`);
        console.log(`소요 시간: ${report.metadata.duration}`);
        console.log('='.repeat(50));

        // 카테고리별 상세 결과
        for (const [category, result] of Object.entries(this.testResults)) {
            const categoryRate = result.tests.length > 0 ? Math.round((result.passed / result.tests.length) * 100) : 0;
            console.log(`\n${category.toUpperCase()}: ${result.passed}/${result.tests.length} (${categoryRate}%)`);
            
            result.tests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`  ${status} ${test.name}: ${test.details}`);
            });
        }

        console.log(`\n📁 상세 보고서: ${reportPath}`);
        return report;
    }

    async runAllTests() {
        try {
            await this.initialize();

            // 스크린샷 디렉토리 생성
            const screenshotDir = path.join(__dirname, 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }

            // 모든 테스트 실행
            await this.testAuthenticationSystem();
            await this.testProjectManagement();
            await this.testCalendarManagement();
            await this.testFeedbackSystem();
            await this.testVideoPlanningAI();
            await this.testCollaborationFeatures();
            await this.testNavigation();

            // 보고서 생성
            const report = await this.generateReport();

            return report;
        } catch (error) {
            console.error('테스트 실행 중 오류:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// 테스트 실행
async function main() {
    const tester = new VideoPlanetUserTest();
    try {
        const report = await tester.runAllTests();
        console.log('\n🎉 모든 테스트 완료!');
        
        // 결과에 따른 권장사항 출력
        if (report.summary.successRate < 70) {
            console.log('\n⚠️ 주의: 성공률이 70% 미만입니다. 주요 기능 점검이 필요합니다.');
        } else if (report.summary.successRate < 90) {
            console.log('\n✨ 양호: 대부분의 기능이 정상 작동하나 일부 개선이 필요합니다.');
        } else {
            console.log('\n🌟 우수: 모든 주요 기능이 정상 작동합니다!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('테스트 실패:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = VideoPlanetUserTest;