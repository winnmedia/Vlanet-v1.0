const fs = require('fs');
const path = require('path');

const srcDir = '/home/winnmedia/VideoPlanet/vridge-front-next/src';
let fixedCount = 0;
let totalFiles = 0;
const fixedFiles = [];

function fixImageInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 모든 img 태그에서 src={변수명} 패턴 찾기 (더 간단한 패턴)
    // 이미지 import 확인을 위한 패턴
    const hasImageImport = /import\s+\w+\s+from\s+['"].*\.(png|jpg|jpeg|svg|gif)['"];?/g.test(content);
    
    if (hasImageImport) {
        // img 태그 수정 - src={변수}를 src={변수.src || 변수}로
        content = content.replace(
            /<img\s+([^>]*?)src=\{([a-zA-Z_]\w*)\}([^>]*?)\/>/g,
            (match, before, varName, after) => {
                // 이미 .src가 있거나 표현식이 복잡한 경우는 건너뜀
                if (varName.includes('.') || varName.includes('(') || varName.includes('[')) {
                    return match;
                }
                return `<img ${before}src={${varName}.src || ${varName}}${after}/>`;
            }
        );
        
        // self-closing이 아닌 img 태그도 처리
        content = content.replace(
            /<img\s+([^>]*?)src=\{([a-zA-Z_]\w*)\}([^>]*?)>/g,
            (match, before, varName, after) => {
                // 이미 .src가 있거나 표현식이 복잡한 경우는 건너뜀
                if (varName.includes('.') || varName.includes('(') || varName.includes('[')) {
                    return match;
                }
                return `<img ${before}src={${varName}.src || ${varName}}${after}>`;
            }
        );
        
        // PageTemplate의 profile 이미지도 처리
        content = content.replace(
            /src:\s*([a-zA-Z_]\w*),/g,
            (match, varName) => {
                // images 폴더에서 import된 것으로 보이는 경우만
                if (content.includes(`import ${varName} from`) && 
                    content.includes(`from 'images/`) || content.includes(`from "images/`)) {
                    return `src: ${varName}.src || ${varName},`;
                }
                return match;
            }
        );
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        fixedCount++;
        fixedFiles.push(path.relative(srcDir, filePath));
        console.log(`✅ 수정됨: ${path.relative(srcDir, filePath)}`);
        return true;
    }
    
    return false;
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

console.log('🔧 Next.js 이미지 렌더링 문제 포괄적 수정 시작\\n');

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
    console.log('\\n✅ 수정된 파일 목록:');
    fixedFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\\n🔄 서버를 재시작하여 변경사항을 적용하세요.');
} else {
    console.log('\\n💡 추가로 수정할 이미지 렌더링 문제가 없습니다.');
}