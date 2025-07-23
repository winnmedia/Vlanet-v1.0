const fs = require('fs');
const path = require('path');

const pagesDir = '/home/winnmedia/VideoPlanet/vridge-front-next/pages';
let fixedCount = 0;

const ssrCode = `
// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}`;

function addSSRProps(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 이미 getServerSideProps가 있는지 확인
    if (content.includes('getServerSideProps')) {
        return false;
    }
    
    // _app.js, _document.js, 404.js는 제외
    const fileName = path.basename(filePath);
    if (fileName === '_app.js' || fileName === '_document.js' || fileName === '404.js') {
        return false;
    }
    
    // 파일 끝에 getServerSideProps 추가
    const newContent = content.trimEnd() + '\n' + ssrCode + '\n';
    fs.writeFileSync(filePath, newContent);
    
    console.log(`✅ 수정됨: ${path.relative(pagesDir, filePath)}`);
    fixedCount++;
    return true;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.js')) {
            addSSRProps(filePath);
        }
    });
}

console.log('🔧 pages 파일에 getServerSideProps 추가 시작\\n');

processDirectory(pagesDir);

console.log(`\\n📊 수정 결과:`);
console.log(`수정된 파일 수: ${fixedCount}`);

if (fixedCount > 0) {
    console.log('\\n✅ getServerSideProps가 추가되었습니다.');
}