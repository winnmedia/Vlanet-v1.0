const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 테스트 설정
const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');
const REPORT_PATH = path.join(__dirname, 'test-report.html');

// 테스트할 페이지 목록
const PAGES = [
    { path: '/', name: '홈페이지', expectedElements: ['header', 'main'] },
    { path: '/login', name: '로그인', expectedElements: ['form', 'input[type="email"]', 'input[type="password"]'] },
    { path: '/signup', name: '회원가입', expectedElements: ['form', 'input'] },
    { path: '/cmshome', name: 'CMS 홈', expectedElements: ['div'] },
    { path: '/project/create', name: '프로젝트 생성', expectedElements: ['form'] },
    { path: '/calendar', name: '캘린더', expectedElements: ['div'] },
    { path: '/admin', name: '관리자 대시보드', expectedElements: ['div'] }
];

// 스크린샷 디렉토리 생성
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 테스트 결과 저장
const testResults = [];

// 메인 테스트 함수
async function runTests() {
    console.log('🧪 브라우저 테스트 시작...\n');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // 뷰포트 설정
    await page.setViewport({ width: 1920, height: 1080 });

    // 콘솔 메시지 수집
    const consoleMessages = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                url: page.url()
            });
        }
    });

    // 페이지 에러 수집
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push({
            message: error.message,
            url: page.url()
        });
    });

    // 각 페이지 테스트
    for (const pageInfo of PAGES) {
        console.log(`📍 테스트 중: ${pageInfo.name} (${pageInfo.path})`);
        
        const result = {
            name: pageInfo.name,
            path: pageInfo.path,
            url: `${BASE_URL}${pageInfo.path}`,
            success: false,
            loadTime: 0,
            screenshot: '',
            errors: [],
            consoleErrors: [],
            missingElements: [],
            timestamp: new Date().toISOString()
        };

        try {
            const startTime = Date.now();
            
            // 페이지 로드
            const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            result.loadTime = Date.now() - startTime;
            result.statusCode = response.status();

            // 페이지 로드 성공 여부
            if (response.status() < 400) {
                result.success = true;
                console.log(`  ✅ 페이지 로드 성공 (${result.loadTime}ms)`);
            } else {
                result.success = false;
                result.errors.push(`HTTP ${response.status()} 에러`);
                console.log(`  ❌ HTTP ${response.status()} 에러`);
            }

            // 스크린샷 캡처
            const screenshotName = `${pageInfo.path.replace(/\//g, '-') || 'home'}.png`;
            const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            result.screenshot = screenshotName;
            console.log(`  📸 스크린샷 저장: ${screenshotName}`);

            // 예상 요소 확인
            for (const selector of pageInfo.expectedElements) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                } catch (e) {
                    result.missingElements.push(selector);
                    console.log(`  ⚠️  요소를 찾을 수 없음: ${selector}`);
                }
            }

            // 페이지 제목 수집
            result.title = await page.title();

            // 현재 페이지의 콘솔 에러 수집
            result.consoleErrors = consoleMessages.filter(msg => msg.url.includes(pageInfo.path));
            
            // 콘솔 메시지 초기화
            consoleMessages.length = 0;

        } catch (error) {
            result.success = false;
            result.errors.push(error.message);
            console.log(`  ❌ 에러 발생: ${error.message}`);
        }

        testResults.push(result);
        console.log('');
    }

    await browser.close();
    
    // HTML 리포트 생성
    generateHTMLReport();
    
    // 결과 요약 출력
    printSummary();
}

// HTML 리포트 생성
function generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VideoPlanet Next.js 브라우저 테스트 리포트</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #1631F8;
            margin-bottom: 30px;
            text-align: center;
            font-size: 2.5em;
        }
        .summary {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .summary h2 {
            color: #333;
            margin-bottom: 15px;
        }
        .stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        .stat {
            flex: 1;
            min-width: 200px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #1631F8;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .test-results {
            display: grid;
            gap: 20px;
        }
        .test-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .test-header {
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #eee;
        }
        .test-status {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 1.2em;
            font-weight: bold;
        }
        .status-success {
            color: #28a745;
        }
        .status-failed {
            color: #dc3545;
        }
        .test-time {
            color: #666;
            font-size: 0.9em;
        }
        .test-body {
            padding: 20px;
        }
        .test-info {
            display: grid;
            gap: 15px;
        }
        .info-row {
            display: flex;
            gap: 10px;
        }
        .info-label {
            font-weight: bold;
            min-width: 120px;
            color: #666;
        }
        .error-list {
            background: #fee;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .error-item {
            color: #dc3545;
            margin: 5px 0;
        }
        .warning-list {
            background: #fff8e1;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .warning-item {
            color: #f57c00;
            margin: 5px 0;
        }
        .screenshot {
            margin-top: 20px;
            text-align: center;
        }
        .screenshot img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
            cursor: pointer;
            transition: transform 0.3s;
        }
        .screenshot img:hover {
            transform: scale(1.02);
        }
        .timestamp {
            text-align: center;
            color: #666;
            margin-top: 30px;
            font-size: 0.9em;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 10px;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 VideoPlanet Next.js 브라우저 테스트 리포트</h1>
        
        <div class="summary">
            <h2>테스트 요약</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${testResults.length}</div>
                    <div class="stat-label">전체 테스트</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${testResults.filter(r => r.success).length}</div>
                    <div class="stat-label">성공</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${testResults.filter(r => !r.success).length}</div>
                    <div class="stat-label">실패</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round(testResults.reduce((sum, r) => sum + r.loadTime, 0) / testResults.length)}ms</div>
                    <div class="stat-label">평균 로딩 시간</div>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(testResults.filter(r => r.success).length / testResults.length * 100)}%"></div>
            </div>
        </div>

        <div class="test-results">
            ${testResults.map(result => `
                <div class="test-card">
                    <div class="test-header">
                        <div class="test-status ${result.success ? 'status-success' : 'status-failed'}">
                            ${result.success ? '✅' : '❌'} ${result.name}
                        </div>
                        <div class="test-time">
                            ${result.loadTime}ms
                        </div>
                    </div>
                    <div class="test-body">
                        <div class="test-info">
                            <div class="info-row">
                                <span class="info-label">URL:</span>
                                <span>${result.url}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">페이지 제목:</span>
                                <span>${result.title || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">HTTP 상태:</span>
                                <span>${result.statusCode || 'N/A'}</span>
                            </div>
                            
                            ${result.errors.length > 0 ? `
                                <div class="error-list">
                                    <strong>에러:</strong>
                                    ${result.errors.map(err => `<div class="error-item">• ${err}</div>`).join('')}
                                </div>
                            ` : ''}
                            
                            ${result.consoleErrors.length > 0 ? `
                                <div class="error-list">
                                    <strong>콘솔 에러:</strong>
                                    ${result.consoleErrors.map(err => `<div class="error-item">• ${err.text}</div>`).join('')}
                                </div>
                            ` : ''}
                            
                            ${result.missingElements.length > 0 ? `
                                <div class="warning-list">
                                    <strong>찾을 수 없는 요소:</strong>
                                    ${result.missingElements.map(el => `<div class="warning-item">• ${el}</div>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        ${result.screenshot ? `
                            <div class="screenshot">
                                <h3>스크린샷</h3>
                                <img src="test-screenshots/${result.screenshot}" alt="${result.name} 스크린샷" onclick="window.open(this.src, '_blank')">
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            테스트 실행 시간: ${new Date().toLocaleString('ko-KR')}
        </div>
    </div>
</body>
</html>
    `;

    fs.writeFileSync(REPORT_PATH, html);
    console.log(`\n📄 HTML 리포트가 생성되었습니다: ${REPORT_PATH}`);
}

// 결과 요약 출력
function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(60));
    
    const successCount = testResults.filter(r => r.success).length;
    const failCount = testResults.filter(r => !r.success).length;
    const avgLoadTime = Math.round(testResults.reduce((sum, r) => sum + r.loadTime, 0) / testResults.length);
    
    console.log(`✅ 성공: ${successCount}/${testResults.length}`);
    console.log(`❌ 실패: ${failCount}/${testResults.length}`);
    console.log(`⏱️  평균 로딩 시간: ${avgLoadTime}ms`);
    
    // 실패한 테스트 상세
    if (failCount > 0) {
        console.log('\n❌ 실패한 테스트:');
        testResults.filter(r => !r.success).forEach(result => {
            console.log(`  - ${result.name} (${result.path})`);
            result.errors.forEach(err => console.log(`    └─ ${err}`));
        });
    }
    
    // 콘솔 에러가 있는 페이지
    const pagesWithConsoleErrors = testResults.filter(r => r.consoleErrors.length > 0);
    if (pagesWithConsoleErrors.length > 0) {
        console.log('\n⚠️  콘솔 에러가 있는 페이지:');
        pagesWithConsoleErrors.forEach(result => {
            console.log(`  - ${result.name}: ${result.consoleErrors.length}개 에러`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
}

// 테스트 실행
runTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
});