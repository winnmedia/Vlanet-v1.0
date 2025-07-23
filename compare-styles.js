const fs = require('fs');
const path = require('path');

console.log('🎨 CSS/SCSS 파일 비교 분석\n');

// 원본 React 프로젝트 스타일 파일들
const reactStylesDir = '/home/winnmedia/VideoPlanet/vridge_front/src/css';
const nextStylesDir = '/home/winnmedia/VideoPlanet/vridge-front-next/src/css';

function getStyleFiles(dir) {
    const files = [];
    
    function walkDir(currentDir) {
        const items = fs.readdirSync(currentDir);
        items.forEach(item => {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else if (item.endsWith('.css') || item.endsWith('.scss')) {
                files.push(path.relative(dir, fullPath));
            }
        });
    }
    
    walkDir(dir);
    return files;
}

// 스타일 파일 목록 가져오기
const reactStyles = getStyleFiles(reactStylesDir);
const nextStyles = getStyleFiles(nextStylesDir);

console.log('📁 원본 React 스타일 파일 수:', reactStyles.length);
console.log('📁 Next.js 스타일 파일 수:', nextStyles.length);

// 누락된 스타일 파일 찾기
const missingInNext = reactStyles.filter(file => !nextStyles.includes(file));
const extraInNext = nextStyles.filter(file => !reactStyles.includes(file));

if (missingInNext.length > 0) {
    console.log('\n❌ Next.js에 누락된 스타일 파일:');
    missingInNext.forEach(file => console.log(`   - ${file}`));
}

if (extraInNext.length > 0) {
    console.log('\n➕ Next.js에만 있는 스타일 파일:');
    extraInNext.forEach(file => console.log(`   - ${file}`));
}

// 주요 스타일 파일 크기 비교
console.log('\n📏 주요 스타일 파일 크기 비교:');
const mainStyles = ['global.scss', 'Home.scss', 'Login.scss', 'PageTemplate.scss'];

mainStyles.forEach(styleName => {
    const reactFile = reactStyles.find(f => f.includes(styleName));
    const nextFile = nextStyles.find(f => f.includes(styleName));
    
    if (reactFile && nextFile) {
        const reactPath = path.join(reactStylesDir, reactFile);
        const nextPath = path.join(nextStylesDir, nextFile);
        
        if (fs.existsSync(reactPath) && fs.existsSync(nextPath)) {
            const reactSize = fs.statSync(reactPath).size;
            const nextSize = fs.statSync(nextPath).size;
            const diff = nextSize - reactSize;
            
            console.log(`\n   ${styleName}:`);
            console.log(`   React: ${reactSize} bytes`);
            console.log(`   Next:  ${nextSize} bytes`);
            console.log(`   차이:  ${diff > 0 ? '+' : ''}${diff} bytes`);
            
            if (Math.abs(diff) > 100) {
                console.log(`   ⚠️  크기 차이가 큽니다!`);
            }
        }
    }
});

// CSS import 순서 확인
console.log('\n📋 CSS Import 순서 확인:');

// _app.js에서 import 순서 확인
const appJsPath = '/home/winnmedia/VideoPlanet/vridge-front-next/pages/_app.js';
if (fs.existsSync(appJsPath)) {
    const appContent = fs.readFileSync(appJsPath, 'utf8');
    const cssImports = appContent.match(/import\s+['"].*\.(css|scss)['"];?/g) || [];
    
    console.log('Next.js _app.js의 CSS import 순서:');
    cssImports.forEach((imp, idx) => {
        console.log(`   ${idx + 1}. ${imp}`);
    });
}

// 원본 React의 index.js 확인
const reactIndexPath = '/home/winnmedia/VideoPlanet/vridge_front/src/index.js';
if (fs.existsSync(reactIndexPath)) {
    const indexContent = fs.readFileSync(reactIndexPath, 'utf8');
    const cssImports = indexContent.match(/import\s+['"].*\.(css|scss)['"];?/g) || [];
    
    console.log('\n원본 React index.js의 CSS import 순서:');
    cssImports.forEach((imp, idx) => {
        console.log(`   ${idx + 1}. ${imp}`);
    });
}

console.log('\n💡 권장사항:');
console.log('1. 누락된 스타일 파일들을 Next.js 프로젝트에 복사');
console.log('2. CSS import 순서를 원본과 동일하게 맞춤');
console.log('3. 크기 차이가 큰 파일들의 내용 비교 필요');