const fs = require('fs');
const path = require('path');

console.log('🔍 Next.js 프로젝트 이미지 체크\n');

// 이미지 디렉토리 확인
const imageDirs = [
    'vridge-front-next/src/images',
    'vridge-front-next/public/images',
    'vridge-front-next/public'
];

console.log('📁 이미지 디렉토리 확인:');
imageDirs.forEach(dir => {
    const fullPath = path.join('/home/winnmedia/VideoPlanet', dir);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${dir} 존재`);
        
        // 디렉토리 내용 확인
        if (dir === 'vridge-front-next/src/images') {
            const subdirs = fs.readdirSync(fullPath);
            subdirs.forEach(subdir => {
                const subPath = path.join(fullPath, subdir);
                if (fs.statSync(subPath).isDirectory()) {
                    const files = fs.readdirSync(subPath);
                    console.log(`   └─ ${subdir}/: ${files.length}개 파일`);
                }
            });
        }
    } else {
        console.log(`❌ ${dir} 없음`);
    }
});

// 주요 이미지 파일 확인
console.log('\n🖼️ 주요 이미지 파일 확인:');
const importantImages = [
    'vridge-front-next/src/images/Common/w_logo02.svg',
    'vridge-front-next/src/images/Cms/profie_sample.png',
    'vridge-front-next/src/images/Home/bg02.png',
    'vridge-front-next/src/images/Home/icon01.svg'
];

importantImages.forEach(img => {
    const fullPath = path.join('/home/winnmedia/VideoPlanet', img);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`✅ ${path.basename(img)} (${(stats.size / 1024).toFixed(1)}KB)`);
    } else {
        console.log(`❌ ${path.basename(img)} 없음`);
    }
});

// public 폴더에 이미지 복사 필요 여부 확인
console.log('\n💡 제안사항:');
console.log('1. 정적 이미지는 public/images로 이동 권장');
console.log('2. Next.js Image 컴포넌트 사용 권장');
console.log('3. 현재 src/images 경로는 webpack이 처리해야 함');