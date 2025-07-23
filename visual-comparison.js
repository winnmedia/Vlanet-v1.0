const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 비교할 주요 페이지들
const pagesToCompare = [
    { path: '/', name: 'homepage' },
    { path: '/login', name: 'login' },
    { path: '/signup', name: 'signup' },
    { path: '/project/create', name: 'project-create' }
];

async function takeScreenshots() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // 스크린샷 저장 디렉토리 생성
    const screenshotDir = '/home/winnmedia/VideoPlanet/ui-screenshots';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // React 앱 (포트 3001이라고 가정)
    console.log('📸 원본 React 앱 스크린샷 캡처 중...');
    const reactPage = await browser.newPage();
    await reactPage.setViewport({ width: 1920, height: 1080 });
    
    for (const pageInfo of pagesToCompare) {
        try {
            await reactPage.goto(`http://localhost:3001${pageInfo.path}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            await reactPage.waitForTimeout(2000); // 렌더링 대기
            
            const reactPath = path.join(screenshotDir, `react-${pageInfo.name}.png`);
            await reactPage.screenshot({ path: reactPath, fullPage: true });
            console.log(`✅ React - ${pageInfo.name} 캡처 완료`);
        } catch (error) {
            console.log(`❌ React - ${pageInfo.name} 캡처 실패:`, error.message);
        }
    }

    // Next.js 앱 (포트 3000)
    console.log('\n📸 Next.js 앱 스크린샷 캡처 중...');
    const nextPage = await browser.newPage();
    await nextPage.setViewport({ width: 1920, height: 1080 });
    
    for (const pageInfo of pagesToCompare) {
        try {
            await nextPage.goto(`http://localhost:3000${pageInfo.path}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            await nextPage.waitForTimeout(2000); // 렌더링 대기
            
            const nextPath = path.join(screenshotDir, `nextjs-${pageInfo.name}.png`);
            await nextPage.screenshot({ path: nextPath, fullPage: true });
            console.log(`✅ Next.js - ${pageInfo.name} 캡처 완료`);
        } catch (error) {
            console.log(`❌ Next.js - ${pageInfo.name} 캡처 실패:`, error.message);
        }
    }

    await browser.close();
    
    console.log(`\n✅ 스크린샷이 ${screenshotDir}에 저장되었습니다.`);
    console.log('이미지 뷰어로 비교하여 UI/UX 차이점을 확인하세요.');
}

// HTML 구조 비교 (Puppeteer 없이)
async function compareHTMLStructure() {
    const axios = require('axios');
    
    console.log('\n🔍 HTML 구조 비교 분석...\n');
    
    for (const pageInfo of pagesToCompare) {
        console.log(`--- ${pageInfo.name} 페이지 ---`);
        
        try {
            // Next.js 페이지 HTML 가져오기
            const response = await axios.get(`http://localhost:3000${pageInfo.path}`);
            const html = response.data;
            
            // 주요 UI 요소 체크
            const checks = {
                hasHeader: html.includes('header') || html.includes('Header'),
                hasNav: html.includes('nav') || html.includes('Nav'),
                hasFooter: html.includes('footer') || html.includes('Footer'),
                hasSidebar: html.includes('sidebar') || html.includes('SideBar'),
                hasContainer: html.includes('container'),
                hasLogo: html.includes('logo'),
                hasButton: html.includes('button') || html.includes('btn'),
                hasForm: html.includes('form') || html.includes('Form')
            };
            
            console.log('UI 요소 존재 여부:');
            Object.entries(checks).forEach(([key, value]) => {
                console.log(`  ${key}: ${value ? '✅' : '❌'}`);
            });
            
            // CSS 클래스 분석
            const classMatches = html.match(/class="([^"]+)"/g) || [];
            const classes = new Set();
            classMatches.forEach(match => {
                const className = match.replace(/class="|"/g, '');
                className.split(' ').forEach(c => classes.add(c));
            });
            
            console.log(`\n총 CSS 클래스 수: ${classes.size}`);
            
            // 주요 레이아웃 클래스 확인
            const layoutClasses = ['container', 'wrapper', 'inner', 'flex', 'grid', 'row', 'col'];
            const foundLayoutClasses = layoutClasses.filter(c => classes.has(c));
            console.log(`레이아웃 클래스: ${foundLayoutClasses.join(', ') || '없음'}`);
            
            console.log('\n');
        } catch (error) {
            console.log(`❌ ${pageInfo.name} 분석 실패:`, error.message);
        }
    }
}

// Puppeteer가 설치되어 있는지 확인
try {
    require.resolve('puppeteer');
    console.log('🎯 시각적 비교를 위한 스크린샷 캡처를 시작합니다...\n');
    console.log('⚠️  주의: React 앱이 포트 3001에서 실행 중이어야 합니다.');
    console.log('⚠️  주의: Next.js 앱이 포트 3000에서 실행 중이어야 합니다.\n');
    
    takeScreenshots().catch(console.error);
} catch (e) {
    console.log('⚠️  Puppeteer가 설치되지 않았습니다.');
    console.log('시각적 비교 대신 HTML 구조 분석을 수행합니다.\n');
    
    compareHTMLStructure().catch(console.error);
}