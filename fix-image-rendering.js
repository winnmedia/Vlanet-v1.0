const fs = require('fs');
const path = require('path');

const srcDir = '/home/winnmedia/VideoPlanet/vridge-front-next/src';
let fixedCount = 0;
let totalFiles = 0;

// 이미지 import 패턴 찾기
const imageImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+\.(png|jpg|jpeg|svg|gif))['"];?/g;
// img 태그에서 이미지 사용 패턴 찾기
const imgTagRegex = /<img\s+([^>]*?)src={([^}]+)}([^>]*?)\/>/g;

function fixImageInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // import된 이미지 변수명 수집
    const importedImages = new Set();
    let match;
    while ((match = imageImportRegex.exec(content)) !== null) {
        importedImages.add(match[1]);
    }
    
    // img 태그에서 src 속성 수정
    content = content.replace(imgTagRegex, (fullMatch, before, srcContent, after) => {
        const varName = srcContent.trim();
        
        // import된 이미지 변수인 경우
        if (importedImages.has(varName)) {
            modified = true;
            // .src 속성이 이미 있는지 확인
            if (!srcContent.includes('.src')) {
                return `<img ${before}src={${varName}.src || ${varName}}${after}/>`;
            }
        }
        
        return fullMatch;
    });
    
    // Image 컴포넌트 사용 패턴도 수정 (src prop)
    const imageComponentRegex = /<Image\s+([^>]*?)src={([^}]+)}([^>]*?)\/>/g;
    content = content.replace(imageComponentRegex, (fullMatch, before, srcContent, after) => {
        const varName = srcContent.trim();
        
        if (importedImages.has(varName)) {
            modified = true;
            if (!srcContent.includes('.src')) {
                return `<Image ${before}src={${varName}.src || ${varName}}${after}/>`;
            }
        }
        
        return fullMatch;
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content);
        fixedCount++;
        console.log(`✅ 수정됨: ${path.relative(srcDir, filePath)}`);
    }
    
    return modified;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // node_modules 제외
            if (file !== 'node_modules' && file !== '.next') {
                walkDir(filePath);
            }
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            totalFiles++;
            fixImageInFile(filePath);
        }
    });
}

console.log('🔧 Next.js 이미지 렌더링 문제 자동 수정 시작\\n');

// src 디렉토리 처리
walkDir(srcDir);

// pages 디렉토리도 처리
const pagesDir = '/home/winnmedia/VideoPlanet/vridge-front-next/pages';
if (fs.existsSync(pagesDir)) {
    walkDir(pagesDir);
}

console.log(`\\n📊 수정 결과:`);
console.log(`총 파일 수: ${totalFiles}`);
console.log(`수정된 파일 수: ${fixedCount}`);

if (fixedCount > 0) {
    console.log('\\n✅ 이미지 렌더링 문제가 수정되었습니다.');
    console.log('서버를 재시작하여 변경사항을 적용하세요.');
} else {
    console.log('\\n💡 수정할 이미지 렌더링 문제가 없습니다.');
}