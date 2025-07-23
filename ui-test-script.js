const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// 테스트할 주요 페이지 목록
const pagesToTest = [
    { path: '/', name: '홈페이지' },
    { path: '/login', name: '로그인' },
    { path: '/signup', name: '회원가입' },
    { path: '/mypage', name: '마이페이지' },
    { path: '/project/create', name: '프로젝트 생성' },
    { path: '/videoplanning', name: '영상 기획' },
    { path: '/calendar', name: '캘린더' },
    { path: '/cmshome', name: 'CMS 홈' },
    { path: '/feedbackall', name: '전체 피드백' },
    { path: '/admin', name: '관리자' },
    { path: '/privacy', name: '개인정보처리방침' },
    { path: '/terms', name: '이용약관' }
];

async function testPage(page) {
    try {
        const response = await axios.get(`${BASE_URL}${page.path}`, {
            headers: { 'Accept': 'text/html' },
            validateStatus: () => true,
            maxRedirects: 0
        });
        
        const html = response.data;
        const status = response.status;
        
        // 주요 UI 요소 체크
        const checks = {
            hasImages: html.includes('<img'),
            hasObjectObject: html.includes('[object Object]'),
            hasLogo: html.includes('logo') || html.includes('Logo'),
            hasButton: html.includes('button') || html.includes('btn'),
            hasForm: html.includes('<form') || html.includes('Form'),
            hasNavigation: html.includes('nav') || html.includes('Nav'),
            hasContent: html.length > 1000,
            status: status
        };
        
        return {
            page: page.name,
            path: page.path,
            status: status,
            checks: checks,
            issues: []
        };
    } catch (error) {
        return {
            page: page.name,
            path: page.path,
            status: 'ERROR',
            error: error.message
        };
    }
}

async function runUITests() {
    console.log('🎨 VideoPlanet Next.js UI/UX 테스트 시작\\n');
    console.log('📋 테스트 대상: ' + pagesToTest.length + '개 페이지\\n');
    
    const results = [];
    
    for (const page of pagesToTest) {
        console.log(`테스팅 ${page.name}...`);
        const result = await testPage(page);
        results.push(result);
        
        // 문제점 분석
        if (result.checks) {
            if (result.checks.hasObjectObject) {
                result.issues.push('이미지가 [object Object]로 렌더링됨');
            }
            if (!result.checks.hasContent) {
                result.issues.push('콘텐츠가 부족함 (1KB 미만)');
            }
            if (result.status >= 400) {
                result.issues.push(`HTTP ${result.status} 에러`);
            }
            if (result.status === 302 || result.status === 301) {
                result.issues.push('리다이렉트 발생');
            }
        }
    }
    
    // 결과 출력
    console.log('\\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(60));
    
    // 정상 페이지
    const successPages = results.filter(r => r.status === 200 && (!r.issues || r.issues.length === 0));
    console.log(`\\n✅ 정상 페이지 (${successPages.length}개):`);
    successPages.forEach(r => console.log(`   - ${r.page} (${r.path})`));
    
    // 이미지 문제 페이지
    const imageIssues = results.filter(r => r.issues && r.issues.includes('이미지가 [object Object]로 렌더링됨'));
    console.log(`\\n🖼️ 이미지 문제 페이지 (${imageIssues.length}개):`);
    imageIssues.forEach(r => console.log(`   - ${r.page} (${r.path})`));
    
    // 접근 불가 페이지
    const errorPages = results.filter(r => r.status >= 400 || r.status === 'ERROR');
    console.log(`\\n❌ 접근 불가 페이지 (${errorPages.length}개):`);
    errorPages.forEach(r => console.log(`   - ${r.page} (${r.path}) - ${r.status}`));
    
    // 리다이렉트 페이지
    const redirectPages = results.filter(r => r.status === 301 || r.status === 302);
    console.log(`\\n🔄 리다이렉트 페이지 (${redirectPages.length}개):`);
    redirectPages.forEach(r => console.log(`   - ${r.page} (${r.path})`));
    
    // 상세 보고서 저장
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: results.length,
            success: successPages.length,
            imageIssues: imageIssues.length,
            errors: errorPages.length,
            redirects: redirectPages.length
        },
        details: results
    };
    
    fs.writeFileSync('ui-test-report.json', JSON.stringify(report, null, 2));
    console.log('\\n📄 상세 보고서가 ui-test-report.json에 저장되었습니다.');
    
    // 주요 권장사항
    console.log('\\n💡 권장사항:');
    if (imageIssues.length > 0) {
        console.log('1. 이미지 렌더링 문제 해결 필요 (image.src 속성 사용)');
    }
    if (errorPages.length > 0) {
        console.log('2. 접근 불가 페이지 점검 필요');
    }
    console.log('3. 브라우저에서 직접 각 페이지의 스타일과 레이아웃 확인 권장');
}

// 테스트 실행
runUITests().catch(console.error);