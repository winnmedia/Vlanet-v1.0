const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// 테스트 설정
const BASE_URL = 'http://localhost:3002';
const REPORT_PATH = path.join(__dirname, 'test-report.html');

// 테스트할 페이지 목록
const PAGES = [
    { path: '/', name: '홈페이지' },
    { path: '/login', name: '로그인' },
    { path: '/signup', name: '회원가입' },
    { path: '/cmshome', name: 'CMS 홈' },
    { path: '/project/create', name: '프로젝트 생성' },
    { path: '/calendar', name: '캘린더' },
    { path: '/admin', name: '관리자 대시보드' }
];

// 테스트 결과 저장
const testResults = [];

// HTTP 요청 함수
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const req = protocol.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'VideoPlanet Browser Test',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const loadTime = Date.now() - startTime;
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    loadTime: loadTime
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// HTML 파싱 함수
function extractPageInfo(html) {
    const info = {
        title: '',
        hasForm: false,
        hasInputs: false,
        hasHeader: false,
        hasMain: false,
        scriptErrors: [],
        elements: []
    };

    // 제목 추출
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
        info.title = titleMatch[1];
    }

    // 요소 검사
    info.hasForm = /<form/i.test(html);
    info.hasInputs = /<input/i.test(html);
    info.hasHeader = /<header/i.test(html);
    info.hasMain = /<main/i.test(html);

    // 기본 요소 수집
    if (html.includes('<div')) info.elements.push('div');
    if (html.includes('<form')) info.elements.push('form');
    if (html.includes('<input')) info.elements.push('input');
    if (html.includes('<button')) info.elements.push('button');
    if (html.includes('<header')) info.elements.push('header');
    if (html.includes('<main')) info.elements.push('main');

    return info;
}

// 메인 테스트 함수
async function runTests() {
    console.log('🧪 HTTP 브라우저 테스트 시작...\n');

    // 각 페이지 테스트
    for (const pageInfo of PAGES) {
        console.log(`📍 테스트 중: ${pageInfo.name} (${pageInfo.path})`);
        
        const result = {
            name: pageInfo.name,
            path: pageInfo.path,
            url: `${BASE_URL}${pageInfo.path}`,
            success: false,
            loadTime: 0,
            statusCode: null,
            contentType: '',
            contentLength: 0,
            errors: [],
            pageInfo: {},
            timestamp: new Date().toISOString()
        };

        try {
            const response = await makeRequest(`${BASE_URL}${pageInfo.path}`);
            
            result.loadTime = response.loadTime;
            result.statusCode = response.statusCode;
            result.contentType = response.headers['content-type'] || '';
            result.contentLength = response.data.length;

            // 페이지 로드 성공 여부
            if (response.statusCode < 400) {
                result.success = true;
                console.log(`  ✅ 페이지 로드 성공 (${result.loadTime}ms, ${response.statusCode})`);
                
                // HTML 분석
                if (result.contentType.includes('text/html')) {
                    result.pageInfo = extractPageInfo(response.data);
                    console.log(`  📄 페이지 제목: ${result.pageInfo.title || 'N/A'}`);
                    console.log(`  📦 요소: ${result.pageInfo.elements.join(', ') || '없음'}`);
                }
            } else {
                result.success = false;
                result.errors.push(`HTTP ${response.statusCode} 에러`);
                console.log(`  ❌ HTTP ${response.statusCode} 에러`);
            }

        } catch (error) {
            result.success = false;
            result.errors.push(error.message);
            console.log(`  ❌ 에러 발생: ${error.message}`);
        }

        testResults.push(result);
        console.log('');
    }

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
    <title>VideoPlanet Next.js HTTP 테스트 리포트</title>
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
            min-width: 150px;
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
        .elements-list {
            background: #e8f4f8;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
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
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
        }
        .status-200 { background: #d4edda; color: #155724; }
        .status-300 { background: #cce5ff; color: #004085; }
        .status-400 { background: #f8d7da; color: #721c24; }
        .status-500 { background: #f8d7da; color: #721c24; }
        .status-error { background: #6c757d; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 VideoPlanet Next.js HTTP 테스트 리포트</h1>
        
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
                    <div class="stat-label">평균 응답 시간</div>
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
                                <span class="info-label">HTTP 상태:</span>
                                <span class="status-badge status-${result.statusCode ? Math.floor(result.statusCode/100) * 100 : 'error'}">
                                    ${result.statusCode || 'ERROR'}
                                </span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Content-Type:</span>
                                <span>${result.contentType || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">콘텐츠 크기:</span>
                                <span>${(result.contentLength / 1024).toFixed(2)} KB</span>
                            </div>
                            
                            ${result.pageInfo && result.pageInfo.title ? `
                                <div class="info-row">
                                    <span class="info-label">페이지 제목:</span>
                                    <span>${result.pageInfo.title}</span>
                                </div>
                            ` : ''}
                            
                            ${result.errors.length > 0 ? `
                                <div class="error-list">
                                    <strong>에러:</strong>
                                    ${result.errors.map(err => `<div class="error-item">• ${err}</div>`).join('')}
                                </div>
                            ` : ''}
                            
                            ${result.pageInfo && result.pageInfo.elements && result.pageInfo.elements.length > 0 ? `
                                <div class="elements-list">
                                    <strong>발견된 HTML 요소:</strong>
                                    <div>${result.pageInfo.elements.map(el => `<span style="display: inline-block; margin: 2px 5px; padding: 2px 8px; background: #007bff; color: white; border-radius: 3px; font-size: 0.85em;">${el}</span>`).join('')}</div>
                                </div>
                            ` : ''}
                        </div>
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
    console.log(`⏱️  평균 응답 시간: ${avgLoadTime}ms`);
    
    // 실패한 테스트 상세
    if (failCount > 0) {
        console.log('\n❌ 실패한 테스트:');
        testResults.filter(r => !r.success).forEach(result => {
            console.log(`  - ${result.name} (${result.path})`);
            result.errors.forEach(err => console.log(`    └─ ${err}`));
        });
    }
    
    // 상태 코드별 분류
    console.log('\n📈 HTTP 상태 코드 분포:');
    const statusCodes = {};
    testResults.forEach(result => {
        if (result.statusCode) {
            statusCodes[result.statusCode] = (statusCodes[result.statusCode] || 0) + 1;
        }
    });
    Object.entries(statusCodes).forEach(([code, count]) => {
        console.log(`  - ${code}: ${count}개`);
    });
    
    console.log('\n' + '='.repeat(60));
}

// 테스트 실행
runTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
});