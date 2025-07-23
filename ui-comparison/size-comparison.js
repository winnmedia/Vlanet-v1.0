const fs = require('fs');
const path = require('path');

console.log('📏 이미지 및 객체 사이즈 비교 분석\n');

// 주요 사이즈 정의
const standardSizes = {
  logos: {
    'header_logo': { width: '140px', location: 'Home header' },
    'auth_logo': { width: '120px', location: 'Login/Auth pages' },
    'auth_center_logo': { width: '170px', location: 'Auth center' },
    'mobile_logo': { width: '100px', location: 'Mobile view' },
  },
  images: {
    'visual_image': { width: '100%', maxWidth: '600px', location: 'Home visual' },
    'tool_image': { width: '100%', maxWidth: '400px', location: 'Tool section' },
    'icon': { width: '60px', height: '60px', location: 'Feature icons' },
    'emoji': { width: '40px', height: '40px', location: 'Emoji icons' },
    'profile': { width: '40px', height: '40px', location: 'Profile avatar' }
  },
  components: {
    'header': { height: '60px' },
    'sidebar': { width: '260px' },
    'card': { minHeight: '200px', padding: '24px' },
    'button': { height: '44px', padding: '12px 24px' },
    'input': { height: '44px', padding: '0 16px' }
  }
};

// SCSS 파일에서 사이즈 관련 속성 추출
function extractSizes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const sizes = {};
    
    // width 추출
    const widthMatches = content.match(/width:\s*(\d+px|[\d.]+%|auto)/g) || [];
    sizes.widths = widthMatches.map(m => m.replace('width:', '').trim());
    
    // height 추출
    const heightMatches = content.match(/height:\s*(\d+px|[\d.]+%|auto)/g) || [];
    sizes.heights = heightMatches.map(m => m.replace('height:', '').trim());
    
    // max-width 추출
    const maxWidthMatches = content.match(/max-width:\s*(\d+px|[\d.]+%)/g) || [];
    sizes.maxWidths = maxWidthMatches.map(m => m.replace('max-width:', '').trim());
    
    // padding 추출
    const paddingMatches = content.match(/padding:\s*[^;]+/g) || [];
    sizes.paddings = paddingMatches.map(m => m.replace('padding:', '').trim());
    
    return sizes;
  } catch (error) {
    return null;
  }
}

// 주요 컴포넌트별 사이즈 확인
console.log('🎯 표준 사이즈 가이드:\n');

console.log('1. 로고 사이즈:');
Object.entries(standardSizes.logos).forEach(([key, value]) => {
  console.log(`   - ${key}: ${value.width} (${value.location})`);
});

console.log('\n2. 이미지 사이즈:');
Object.entries(standardSizes.images).forEach(([key, value]) => {
  const size = value.width + (value.height ? ` x ${value.height}` : '');
  const maxWidth = value.maxWidth ? ` (max: ${value.maxWidth})` : '';
  console.log(`   - ${key}: ${size}${maxWidth} (${value.location})`);
});

console.log('\n3. 컴포넌트 사이즈:');
Object.entries(standardSizes.components).forEach(([key, value]) => {
  const props = Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ');
  console.log(`   - ${key}: ${props}`);
});

// 실제 이미지 파일 사이즈 확인
console.log('\n\n📁 실제 이미지 파일 확인:\n');

const imageDirs = [
  '/home/winnmedia/VideoPlanet/vridge-front-next/public/images',
  '/home/winnmedia/VideoPlanet/vridge-front-next/src/images'
];

imageDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`디렉토리: ${dir}`);
    
    const checkImageSizes = (dirPath, prefix = '') => {
      const items = fs.readdirSync(dirPath);
      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          checkImageSizes(fullPath, prefix + '  ');
        } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(item)) {
          const sizeKB = (stat.size / 1024).toFixed(2);
          console.log(`${prefix}- ${item}: ${sizeKB} KB`);
        }
      });
    };
    
    checkImageSizes(dir, '  ');
    console.log('');
  }
});

// 사이즈 검증 체크리스트
console.log('✅ 사이즈 검증 체크리스트:\n');

const checklist = [
  '로고 사이즈가 페이지별로 일치하는가?',
  '이미지가 원본 크기대로 표시되는가?',
  '반응형에서 이미지가 적절히 조절되는가?',
  '아이콘 크기가 일관되게 유지되는가?',
  '프로필 이미지가 정사각형으로 표시되는가?',
  '카드 컴포넌트의 최소 높이가 유지되는가?',
  '버튼과 입력 필드 높이가 44px로 통일되었는가?',
  '헤더 높이가 60px로 고정되어 있는가?',
  '사이드바 너비가 260px로 고정되어 있는가?',
  'max-width 제한이 적절히 적용되는가?'
];

checklist.forEach((item, index) => {
  console.log(`${index + 1}. [ ] ${item}`);
});

// 개발자 도구 검증 스크립트
console.log('\n\n🔧 브라우저에서 실행할 검증 스크립트:\n');

const verificationScript = `
// 로고 사이즈 확인
const logos = document.querySelectorAll('.logo img, img[src*="logo"]');
console.log('=== 로고 사이즈 ===');
logos.forEach(logo => {
  const computed = window.getComputedStyle(logo);
  console.log({
    src: logo.src.split('/').pop(),
    width: computed.width,
    height: computed.height,
    naturalWidth: logo.naturalWidth + 'px',
    naturalHeight: logo.naturalHeight + 'px'
  });
});

// 이미지 사이즈 확인
const images = document.querySelectorAll('img:not([src*="logo"])');
console.log('\\n=== 이미지 사이즈 ===');
Array.from(images).slice(0, 10).forEach(img => {
  const computed = window.getComputedStyle(img);
  console.log({
    src: img.src.split('/').pop(),
    displaySize: computed.width + ' x ' + computed.height,
    naturalSize: img.naturalWidth + ' x ' + img.naturalHeight,
    objectFit: computed.objectFit
  });
});

// 주요 컴포넌트 사이즈 확인
console.log('\\n=== 컴포넌트 사이즈 ===');
const components = {
  header: document.querySelector('header, #header'),
  sidebar: document.querySelector('.SideBar, .sidebar'),
  button: document.querySelector('button, .btn, .submit'),
  input: document.querySelector('input[type="text"]'),
  card: document.querySelector('.card, .project_card')
};

Object.entries(components).forEach(([name, el]) => {
  if (el) {
    const computed = window.getComputedStyle(el);
    console.log(name, {
      width: computed.width,
      height: computed.height,
      padding: computed.padding
    });
  }
});
`;

console.log('```javascript');
console.log(verificationScript);
console.log('```');

// 권장사항
console.log('\n\n💡 권장사항:\n');
console.log('1. 모든 이미지에 명시적인 width/height 속성 설정');
console.log('2. SVG 로고는 viewBox를 사용하여 반응형 대응');
console.log('3. 큰 이미지는 next/image 컴포넌트 사용');
console.log('4. aspect-ratio CSS 속성으로 비율 유지');
console.log('5. object-fit: cover/contain으로 이미지 왜곡 방지');