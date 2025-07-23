const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// 테스트 설정
const BASE_URL = 'http://localhost:3002';
const OUTPUT_DIR = path.join(__dirname, 'test-outputs');
const DETAILED_REPORT_PATH = path.join(__dirname, 'detailed-test-report.html');

// 테스트할 페이지 목록
const PAGES = [
    { 
        path: '/', 
        name: '홈페이지',
        expectedTexts: ['VideoPlanet', '영상 제작'],
        expectedElements: ['button', 'nav']
    },
    { 
        path: '/login', 
        name: '로그인',
        expectedTexts: ['로그인', '이메일', '비밀번호'],
        expectedElements: ['form', 'input[type="email"]', 'input[type="password"]', 'button']
    },
    { 
        path: '/signup', 
        name: '회원가입',
        expectedTexts: ['회원가입', '이메일', '비밀번호', '이름'],
        expectedElements: ['form', 'input', 'button']
    },
    { 
        path: '/cmshome', 
        name: 'CMS 홈',
        expectedTexts: ['프로젝트', '관리'],
        expectedElements: ['div', 'button']
    },
    { 
        path: '/project/create', 
        name: '프로젝트 생성',
        expectedTexts: ['프로젝트', '생성', '제목'],
        expectedElements: ['form', 'input', 'button']
    },
    { 
        path: '/calendar', 
        name: '캘린더',
        expectedTexts: ['캘린더', '일정'],
        expectedElements: ['div']
    },
    { 
        path: '/admin', 
        name: '관리자 대시보드',
        expectedTexts: ['관리자', '대시보드'],
        expectedElements: ['div', 'nav']
    }
];

// 출력 디렉토리 생성
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// HTML 내용 분석
function analyzeHTML(html) {
    const analysis = {
        hasReactRoot: false,
        hasNextData: false,
        isHydrated: false,
        scripts: [],
        stylesheets: [],
        images: [],
        forms: [],
        inputs: [],
        buttons: [],
        links: [],
        texts: [],
        errors: []
    };

    // React/Next.js 관련 체크
    analysis.hasReactRoot = html.includes('id="__next"') || html.includes('id="root"');
    analysis.hasNextData = html.includes('__NEXT_DATA__');
    analysis.isHydrated = html.includes('_next/static');

    // 스크립트 태그 수집
    const scriptMatches = html.match(/<script[^>]*src="([^"]+)"/g) || [];
    analysis.scripts = scriptMatches.map(tag => {
        const srcMatch = tag.match(/src="([^"]+)"/);
        return srcMatch ? srcMatch[1] : '';
    }).filter(Boolean);

    // 스타일시트 수집
    const styleMatches = html.match(/<link[^>]*href="([^"]+\.css[^"]*)"/g) || [];
    analysis.stylesheets = styleMatches.map(tag => {
        const hrefMatch = tag.match(/href="([^"]+)"/);
        return hrefMatch ? hrefMatch[1] : '';
    }).filter(Boolean);

    // 이미지 수집
    const imgMatches = html.match(/<img[^>]*src="([^"]+)"/g) || [];
    analysis.images = imgMatches.map(tag => {
        const srcMatch = tag.match(/src="([^"]+)"/);
        return srcMatch ? srcMatch[1] : '';
    }).filter(Boolean);

    // 폼 요소 수집
    analysis.forms = (html.match(/<form/g) || []).length;
    analysis.inputs = (html.match(/<input/g) || []).length;
    analysis.buttons = (html.match(/<button/g) || []).length;
    analysis.links = (html.match(/<a[^>]*href/g) || []).length;

    // 주요 텍스트 추출 (태그 제거)
    const textContent = html.replace(/<script[^>]*>.*?<\/script>/gs, '')
                           .replace(/<style[^>]*>.*?<\/style>/gs, '')
                           .replace(/<[^>]+>/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();
    
    // 50자 이상의 텍스트 블록 추출
    const words = textContent.split(' ').filter(word => word.length > 2);
    analysis.texts = words.slice(0, 50); // 처음 50개 단어만

    // 에러 메시지 체크
    const errorPatterns = [
        /error/i,
        /failed/i,
        /exception/i,
        /not found/i,
        /404/i,
        /500/i
    ];
    
    errorPatterns.forEach(pattern => {
        if (pattern.test(html)) {
            analysis.errors.push(`패턴 발견: ${pattern.source}`);
        }
    });

    return analysis;
}

// 메인 테스트 함수
async function runDetailedTests() {
    console.log('🔍 상세 UI 테스트 시작...\n');
    
    const testResults = [];

    for (const pageInfo of PAGES) {
        console.log(`📍 테스트 중: ${pageInfo.name} (${pageInfo.path})`);
        
        const result = {
            name: pageInfo.name,
            path: pageInfo.path,
            url: `${BASE_URL}${pageInfo.path}`,
            success: false,
            htmlSize: 0,
            analysis: {},
            foundTexts: [],
            missingTexts: [],
            foundElements: [],
            missingElements: [],
            errors: [],
            timestamp: new Date().toISOString()
        };

        try {
            // curl을 사용하여 페이지 다운로드
            const outputFile = path.join(OUTPUT_DIR, `${pageInfo.path.replace(/\//g, '-') || 'home'}.html`);
            const curlCommand = `curl -s -o "${outputFile}" -w "%{http_code}" "${BASE_URL}${pageInfo.path}"`;
            
            const { stdout: statusCode } = await execPromise(curlCommand);
            result.statusCode = parseInt(statusCode);
            
            if (result.statusCode === 200) {
                result.success = true;
                const htmlContent = fs.readFileSync(outputFile, 'utf-8');
                result.htmlSize = htmlContent.length;
                result.analysis = analyzeHTML(htmlContent);
                
                console.log(`  ✅ 페이지 로드 성공 (${(result.htmlSize / 1024).toFixed(2)} KB)`);
                console.log(`  📱 React 앱: ${result.analysis.hasReactRoot ? 'Yes' : 'No'}`);
                console.log(`  🚀 Next.js: ${result.analysis.hasNextData ? 'Yes' : 'No'}`);
                console.log(`  📦 리소스: ${result.analysis.scripts.length} scripts, ${result.analysis.stylesheets.length} styles`);
                
                // 예상 텍스트 확인
                pageInfo.expectedTexts.forEach(text => {
                    if (htmlContent.toLowerCase().includes(text.toLowerCase())) {
                        result.foundTexts.push(text);
                    } else {
                        result.missingTexts.push(text);
                    }
                });
                
                // 예상 요소 확인
                pageInfo.expectedElements.forEach(element => {
                    if (htmlContent.includes(`<${element.split('[')[0]}`)) {
                        result.foundElements.push(element);
                    } else {
                        result.missingElements.push(element);
                    }
                });
                
                if (result.missingTexts.length > 0) {
                    console.log(`  ⚠️  찾을 수 없는 텍스트: ${result.missingTexts.join(', ')}`);
                }
                if (result.missingElements.length > 0) {
                    console.log(`  ⚠️  찾을 수 없는 요소: ${result.missingElements.join(', ')}`);
                }
                
            } else {
                result.errors.push(`HTTP ${result.statusCode} 에러`);
                console.log(`  ❌ HTTP ${result.statusCode} 에러`);
            }

        } catch (error) {
            result.success = false;
            result.errors.push(error.message);
            console.log(`  ❌ 에러 발생: ${error.message}`);
        }

        testResults.push(result);
        console.log('');
    }

    // 상세 HTML 리포트 생성
    generateDetailedHTMLReport(testResults);
    
    // 결과 요약 출력
    printDetailedSummary(testResults);
}

// 상세 HTML 리포트 생성
function generateDetailedHTMLReport(testResults) {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VideoPlanet Next.js 상세 UI 테스트 리포트</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 1400px;
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
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .summary h2 {
            color: #333;
            margin-bottom: 20px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid transparent;
            transition: all 0.3s;
        }
        .stat:hover {
            border-color: #1631F8;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(22, 49, 248, 0.1);
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #1631F8;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .test-results {
            display: grid;
            gap: 25px;
        }
        .test-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: all 0.3s;
        }
        .test-card:hover {
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .test-header {
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #f0f0f0;
            background: linear-gradient(to right, #f8f9fa, #ffffff);
        }
        .test-status {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 1.3em;
            font-weight: bold;
        }
        .status-success {
            color: #28a745;
        }
        .status-failed {
            color: #dc3545;
        }
        .test-body {
            padding: 25px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #1631F8;
        }
        .info-section h3 {
            color: #1631F8;
            font-size: 1.1em;
            margin-bottom: 10px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #555;
        }
        .info-value {
            color: #333;
            text-align: right;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            margin: 2px;
        }
        .badge-success {
            background: #d4edda;
            color: #155724;
        }
        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }
        .badge-danger {
            background: #f8d7da;
            color: #721c24;
        }
        .badge-info {
            background: #d1ecf1;
            color: #0c5460;
        }
        .element-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        .resource-list {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        .resource-item {
            font-family: monospace;
            font-size: 0.85em;
            color: #0066cc;
            margin: 5px 0;
            word-break: break-all;
        }
        .error-section {
            background: #fee;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border-left: 4px solid #dc3545;
        }
        .warning-section {
            background: #fff8e1;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border-left: 4px solid #ffc107;
        }
        .timestamp {
            text-align: center;
            color: #666;
            margin-top: 40px;
            font-size: 0.9em;
        }
        .progress-bar {
            width: 100%;
            height: 25px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin-top: 15px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .tech-stack {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        .tech-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 VideoPlanet Next.js 상세 UI 테스트 리포트</h1>
        
        <div class="summary">
            <h2>테스트 요약</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${testResults.length}</div>
                    <div class="stat-label">전체 페이지</div>
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
                    <div class="stat-value">${testResults.filter(r => r.analysis && r.analysis.hasReactRoot).length}</div>
                    <div class="stat-label">React 앱</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${testResults.filter(r => r.analysis && r.analysis.hasNextData).length}</div>
                    <div class="stat-label">Next.js SSR</div>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(testResults.filter(r => r.success).length / testResults.length * 100)}%">
                    ${Math.round(testResults.filter(r => r.success).length / testResults.length * 100)}%
                </div>
            </div>
        </div>

        <div class="test-results">
            ${testResults.map(result => `
                <div class="test-card">
                    <div class="test-header">
                        <div class="test-status ${result.success ? 'status-success' : 'status-failed'}">
                            ${result.success ? '✅' : '❌'} ${result.name}
                        </div>
                        <div>
                            <span class="badge ${result.success ? 'badge-success' : 'badge-danger'}">
                                HTTP ${result.statusCode || 'ERROR'}
                            </span>
                            ${result.htmlSize ? `<span class="badge badge-info">${(result.htmlSize / 1024).toFixed(2)} KB</span>` : ''}
                        </div>
                    </div>
                    <div class="test-body">
                        <div class="info-grid">
                            <div class="info-section">
                                <h3>📊 기본 정보</h3>
                                <div class="info-row">
                                    <span class="info-label">URL:</span>
                                    <span class="info-value">${result.path}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">상태:</span>
                                    <span class="info-value">${result.success ? '성공' : '실패'}</span>
                                </div>
                                ${result.analysis ? `
                                    <div class="info-row">
                                        <span class="info-label">React 앱:</span>
                                        <span class="info-value">${result.analysis.hasReactRoot ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Next.js:</span>
                                        <span class="info-value">${result.analysis.hasNextData ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${result.analysis ? `
                                <div class="info-section">
                                    <h3>🎨 UI 요소</h3>
                                    <div class="info-row">
                                        <span class="info-label">폼:</span>
                                        <span class="info-value">${result.analysis.forms || 0}개</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">입력 필드:</span>
                                        <span class="info-value">${result.analysis.inputs || 0}개</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">버튼:</span>
                                        <span class="info-value">${result.analysis.buttons || 0}개</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">링크:</span>
                                        <span class="info-value">${result.analysis.links || 0}개</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${result.foundTexts && result.foundTexts.length > 0 ? `
                            <div class="info-section">
                                <h3>✅ 발견된 텍스트</h3>
                                <div class="element-list">
                                    ${result.foundTexts.map(text => `<span class="badge badge-success">${text}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${result.missingTexts && result.missingTexts.length > 0 ? `
                            <div class="warning-section">
                                <h3>⚠️ 찾을 수 없는 텍스트</h3>
                                <div class="element-list">
                                    ${result.missingTexts.map(text => `<span class="badge badge-warning">${text}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${result.foundElements && result.foundElements.length > 0 ? `
                            <div class="info-section">
                                <h3>✅ 발견된 HTML 요소</h3>
                                <div class="element-list">
                                    ${result.foundElements.map(el => `<span class="badge badge-info">&lt;${el}&gt;</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${result.missingElements && result.missingElements.length > 0 ? `
                            <div class="warning-section">
                                <h3>⚠️ 찾을 수 없는 요소</h3>
                                <div class="element-list">
                                    ${result.missingElements.map(el => `<span class="badge badge-warning">&lt;${el}&gt;</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${result.analysis && result.analysis.scripts && result.analysis.scripts.length > 0 ? `
                            <div class="resource-list">
                                <h3>📦 로드된 스크립트 (${result.analysis.scripts.length}개)</h3>
                                ${result.analysis.scripts.slice(0, 5).map(script => 
                                    `<div class="resource-item">${script}</div>`
                                ).join('')}
                                ${result.analysis.scripts.length > 5 ? `<div class="resource-item">... 그 외 ${result.analysis.scripts.length - 5}개</div>` : ''}
                            </div>
                        ` : ''}
                        
                        ${result.errors && result.errors.length > 0 ? `
                            <div class="error-section">
                                <h3>❌ 에러</h3>
                                ${result.errors.map(err => `<div>• ${err}</div>`).join('')}
                            </div>
                        ` : ''}
                        
                        ${result.analysis && (result.analysis.hasReactRoot || result.analysis.hasNextData) ? `
                            <div class="tech-stack">
                                ${result.analysis.hasReactRoot ? '<span class="tech-badge">React</span>' : ''}
                                ${result.analysis.hasNextData ? '<span class="tech-badge">Next.js</span>' : ''}
                                ${result.analysis.isHydrated ? '<span class="tech-badge">Hydrated</span>' : ''}
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

    fs.writeFileSync(DETAILED_REPORT_PATH, html);
    console.log(`\n📄 상세 HTML 리포트가 생성되었습니다: ${DETAILED_REPORT_PATH}`);
}

// 상세 결과 요약 출력
function printDetailedSummary(testResults) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 상세 테스트 결과 요약');
    console.log('='.repeat(70));
    
    const successCount = testResults.filter(r => r.success).length;
    const failCount = testResults.filter(r => !r.success).length;
    const reactApps = testResults.filter(r => r.analysis && r.analysis.hasReactRoot).length;
    const nextjsApps = testResults.filter(r => r.analysis && r.analysis.hasNextData).length;
    
    console.log(`✅ 성공: ${successCount}/${testResults.length}`);
    console.log(`❌ 실패: ${failCount}/${testResults.length}`);
    console.log(`⚛️  React 앱: ${reactApps}개`);
    console.log(`🚀 Next.js SSR: ${nextjsApps}개`);
    
    // UI 요소 통계
    console.log('\n📊 UI 요소 통계:');
    testResults.filter(r => r.analysis).forEach(result => {
        if (result.analysis.forms > 0 || result.analysis.inputs > 0) {
            console.log(`  - ${result.name}: ${result.analysis.forms}개 폼, ${result.analysis.inputs}개 입력, ${result.analysis.buttons}개 버튼`);
        }
    });
    
    // 텍스트 누락 페이지
    const pagesWithMissingText = testResults.filter(r => r.missingTexts && r.missingTexts.length > 0);
    if (pagesWithMissingText.length > 0) {
        console.log('\n⚠️  예상 텍스트가 누락된 페이지:');
        pagesWithMissingText.forEach(result => {
            console.log(`  - ${result.name}: ${result.missingTexts.join(', ')}`);
        });
    }
    
    console.log('\n' + '='.repeat(70));
}

// 테스트 실행
runDetailedTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
});