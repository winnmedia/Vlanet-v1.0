const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// 모든 페이지 목록 (라우팅 분석 기반)
const allPages = [
    { path: '/', name: '홈페이지', category: '기본' },
    { path: '/login', name: '로그인', category: '인증' },
    { path: '/signup', name: '회원가입', category: '인증' },
    { path: '/resetpw', name: '비밀번호 재설정', category: '인증' },
    { path: '/mypage', name: '마이페이지', category: '사용자' },
    { path: '/project/create', name: '프로젝트 생성', category: '프로젝트' },
    { path: '/project/1', name: '프로젝트 상세', category: '프로젝트' },
    { path: '/project/1/edit', name: '프로젝트 수정', category: '프로젝트' },
    { path: '/videoplanning', name: '영상 기획', category: 'CMS' },
    { path: '/calendar', name: '캘린더', category: 'CMS' },
    { path: '/cmshome', name: 'CMS 홈', category: 'CMS' },
    { path: '/feedback/1', name: '피드백', category: '피드백' },
    { path: '/feedbackall', name: '전체 피드백', category: '피드백' },
    { path: '/admin', name: '관리자 리다이렉트', category: '관리자' },
    { path: '/admindashboard', name: '관리자 대시보드', category: '관리자' },
    { path: '/emailmonitor', name: '이메일 모니터', category: '관리자' },
    { path: '/emailcheck', name: '이메일 확인', category: '기타' },
    { path: '/privacy', name: '개인정보처리방침', category: '정책' },
    { path: '/terms', name: '이용약관', category: '정책' },
    { path: '/invitation/test-token', name: '초대 수락', category: '기타' }
];

async function testPageDetailed(page) {
    try {
        const startTime = Date.now();
        const response = await axios.get(`${BASE_URL}${page.path}`, {
            headers: { 'Accept': 'text/html' },
            validateStatus: () => true,
            maxRedirects: 0,
            timeout: 5000
        });
        const loadTime = Date.now() - startTime;
        
        const html = response.data;
        const status = response.status;
        
        // 상세 체크
        const checks = {
            status: status,
            loadTime: loadTime,
            htmlSize: html.length,
            hasTitle: html.includes('<title>'),
            hasReactRoot: html.includes('__next'),
            hasError: html.includes('Error') || html.includes('error'),
            has500: html.includes('500'),
            has404: html.includes('404'),
            hasImages: html.includes('<img'),
            hasObjectObject: html.includes('[object Object]'),
            hasContent: html.length > 1000
        };
        
        // 상태 판정
        let pageStatus = 'UNKNOWN';
        let issues = [];
        
        if (status === 200) {
            if (checks.hasObjectObject) {
                pageStatus = 'PARTIAL';
                issues.push('이미지 렌더링 문제');
            } else if (checks.hasError || checks.has500) {
                pageStatus = 'ERROR';
                issues.push('페이지 내부 에러');
            } else if (!checks.hasContent) {
                pageStatus = 'EMPTY';
                issues.push('콘텐츠 부족');
            } else {
                pageStatus = 'OK';
            }
        } else if (status === 301 || status === 302) {
            pageStatus = 'REDIRECT';
            issues.push(`${status} 리다이렉트`);
        } else if (status === 404) {
            pageStatus = 'NOT_FOUND';
            issues.push('페이지 없음');
        } else if (status === 500) {
            pageStatus = 'SERVER_ERROR';
            issues.push('서버 에러');
        } else {
            pageStatus = 'ERROR';
            issues.push(`HTTP ${status}`);
        }
        
        return {
            ...page,
            status: status,
            pageStatus: pageStatus,
            loadTime: loadTime,
            issues: issues,
            checks: checks
        };
    } catch (error) {
        return {
            ...page,
            status: 'ERROR',
            pageStatus: 'ERROR',
            error: error.message,
            issues: ['접속 실패: ' + error.message]
        };
    }
}

async function runDetailedPageTest() {
    console.log('🔍 VideoPlanet Next.js 전체 페이지 상세 테스트\n');
    console.log(`📋 총 ${allPages.length}개 페이지 테스트 시작...\n`);
    
    const results = [];
    const categories = {};
    
    // 카테고리별 그룹화
    for (const page of allPages) {
        process.stdout.write(`테스팅 ${page.name}... `);
        const result = await testPageDetailed(page);
        results.push(result);
        
        if (!categories[page.category]) {
            categories[page.category] = [];
        }
        categories[page.category].push(result);
        
        // 즉시 상태 출력
        if (result.pageStatus === 'OK') {
            console.log(`✅ 정상 (${result.loadTime}ms)`);
        } else if (result.pageStatus === 'PARTIAL') {
            console.log(`⚠️  부분적 문제`);
        } else {
            console.log(`❌ ${result.pageStatus}`);
        }
    }
    
    // 카테고리별 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 카테고리별 테스트 결과');
    console.log('='.repeat(60));
    
    for (const [category, pages] of Object.entries(categories)) {
        const okCount = pages.filter(p => p.pageStatus === 'OK').length;
        const totalCount = pages.length;
        const percentage = ((okCount / totalCount) * 100).toFixed(0);
        
        console.log(`\n📁 ${category} (${okCount}/${totalCount} - ${percentage}%)`);
        
        pages.forEach(page => {
            const statusIcon = 
                page.pageStatus === 'OK' ? '✅' :
                page.pageStatus === 'PARTIAL' ? '⚠️ ' :
                page.pageStatus === 'SERVER_ERROR' ? '🔴' :
                page.pageStatus === 'NOT_FOUND' ? '🚫' :
                '❌';
            
            console.log(`   ${statusIcon} ${page.name} (${page.path})`);
            if (page.issues.length > 0) {
                console.log(`      └─ ${page.issues.join(', ')}`);
            }
        });
    }
    
    // 전체 통계
    const stats = {
        ok: results.filter(r => r.pageStatus === 'OK').length,
        partial: results.filter(r => r.pageStatus === 'PARTIAL').length,
        serverError: results.filter(r => r.pageStatus === 'SERVER_ERROR').length,
        notFound: results.filter(r => r.pageStatus === 'NOT_FOUND').length,
        other: results.filter(r => !['OK', 'PARTIAL', 'SERVER_ERROR', 'NOT_FOUND'].includes(r.pageStatus)).length
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 전체 통계');
    console.log('='.repeat(60));
    console.log(`✅ 정상 작동: ${stats.ok}개 (${((stats.ok / results.length) * 100).toFixed(1)}%)`);
    console.log(`⚠️  부분 문제: ${stats.partial}개`);
    console.log(`🔴 서버 에러: ${stats.serverError}개`);
    console.log(`🚫 페이지 없음: ${stats.notFound}개`);
    console.log(`❌ 기타 오류: ${stats.other}개`);
    
    // 로딩 시간 분석
    const validResults = results.filter(r => r.loadTime);
    if (validResults.length > 0) {
        const avgLoadTime = validResults.reduce((sum, r) => sum + r.loadTime, 0) / validResults.length;
        const fastestPage = validResults.reduce((min, r) => r.loadTime < min.loadTime ? r : min);
        const slowestPage = validResults.reduce((max, r) => r.loadTime > max.loadTime ? r : max);
        
        console.log('\n⏱️  성능 분석:');
        console.log(`   평균 로딩 시간: ${avgLoadTime.toFixed(0)}ms`);
        console.log(`   가장 빠른 페이지: ${fastestPage.name} (${fastestPage.loadTime}ms)`);
        console.log(`   가장 느린 페이지: ${slowestPage.name} (${slowestPage.loadTime}ms)`);
    }
    
    // 상세 보고서 저장
    const report = {
        timestamp: new Date().toISOString(),
        summary: stats,
        categories: categories,
        details: results
    };
    
    fs.writeFileSync('page-test-detailed-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 상세 보고서가 page-test-detailed-report.json에 저장되었습니다.');
}

// 테스트 실행
runDetailedPageTest().catch(console.error);