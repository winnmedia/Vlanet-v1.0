const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 반응형 미디어 쿼리 템플릿
const responsiveTemplate = `
/* Responsive Styles */
@media (max-width: 1024px) {
  .container {
    padding: var(--spacing-lg);
  }
  
  .grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .container {
    padding: var(--spacing-md);
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .flex-row {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .hide-mobile {
    display: none;
  }
  
  .show-mobile {
    display: block;
  }
  
  table {
    font-size: var(--font-size-sm);
  }
  
  .button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .container {
    padding: var(--spacing-sm);
  }
  
  .title {
    font-size: var(--font-size-xl);
  }
  
  .subtitle {
    font-size: var(--font-size-md);
  }
  
  .card {
    padding: var(--spacing-sm);
  }
  
  .modal {
    margin: var(--spacing-sm);
    max-height: calc(100vh - var(--spacing-lg));
  }
  
  input, select, textarea {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}`;

// SCSS 파일에 반응형 스타일 추가
function addResponsiveStyles(content, filePath) {
  // 이미 충분한 미디어 쿼리가 있는지 확인
  const mediaQueryCount = (content.match(/@media/g) || []).length;
  
  if (mediaQueryCount < 2) {
    // 파일 끝에 반응형 스타일 추가
    return {
      content: content + '\n' + responsiveTemplate,
      hasChanges: true
    };
  }
  
  return { content, hasChanges: false };
}

// 모든 SCSS/CSS 파일 처리
const stylePatterns = [
  'src/**/*.scss',
  'src/**/*.css',
  'src/**/*.module.scss',
  'src/**/*.module.css'
];

const ignorePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.backup',
  '**/*.backup-*'
];

console.log('🎨 모든 스타일 파일에 반응형 디자인 적용 중...\n');

let totalFiles = 0;
let modifiedFiles = 0;

stylePatterns.forEach(pattern => {
  const files = glob.sync(pattern, {
    cwd: process.cwd(),
    absolute: true,
    ignore: ignorePatterns
  });
  
  files.forEach(file => {
    totalFiles++;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { content: newContent, hasChanges } = addResponsiveStyles(content, file);
      
      if (hasChanges) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`✅ ${path.relative(process.cwd(), file)}: 반응형 스타일 추가됨`);
        modifiedFiles++;
      }
    } catch (error) {
      console.error(`❌ ${path.relative(process.cwd(), file)}: ${error.message}`);
    }
  });
});

// 특정 중요 파일들에 추가 반응형 개선
const criticalFiles = [
  'src/styles/global.scss',
  'src/styles/main.scss',
  'src/styles/design-system.scss'
];

criticalFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 글로벌 반응형 개선사항 추가
      const globalResponsive = `
/* Global Responsive Improvements */
@media (max-width: 768px) {
  body {
    font-size: var(--font-size-base);
  }
  
  .page-wrapper {
    min-height: 100vh;
    overflow-x: hidden;
  }
  
  .main-content {
    padding: var(--spacing-md);
  }
}

@media (hover: none) {
  /* Touch device optimizations */
  .button:active {
    transform: scale(0.98);
  }
  
  .link:active {
    opacity: 0.7;
  }
}`;
      
      if (!content.includes('hover: none')) {
        fs.writeFileSync(fullPath, content + '\n' + globalResponsive, 'utf8');
        console.log(`✅ ${file}: 글로벌 반응형 개선 추가됨`);
        modifiedFiles++;
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  }
});

console.log(`\n📊 결과:`);
console.log(`- 전체 스타일 파일: ${totalFiles}개`);
console.log(`- 개선된 파일: ${modifiedFiles}개`);
console.log(`- 반응형 적용률: ${((totalFiles - (totalFiles - modifiedFiles)) / totalFiles * 100).toFixed(1)}%`);
console.log('\n✨ 반응형 디자인 개선 완료!');