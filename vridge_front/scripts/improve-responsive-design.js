const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 반응형 미디어 쿼리 추가
const responsiveStyles = `
@media (max-width: 768px) {
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  
  .container {
    padding: var(--spacing-md);
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .flex-row {
    flex-direction: column;
  }
  
  .hide-mobile {
    display: none;
  }
}

@media (max-width: 480px) {
  padding: var(--spacing-xs);
  
  .container {
    padding: var(--spacing-sm);
  }
  
  .button {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
`;

// SCSS 파일에 반응형 스타일 추가
function addResponsiveStyles(content, filePath) {
  // 이미 미디어 쿼리가 있는지 확인
  const hasMediaQuery = /@media\s*\([^)]*max-width|min-width[^)]*\)/.test(content);
  
  if (!hasMediaQuery) {
    // 파일 끝에 반응형 스타일 추가
    return content + '\n' + responsiveStyles;
  }
  
  return content;
}

// 컴포넌트에 반응형 클래스 추가
function addResponsiveClasses(content) {
  let modified = content;
  
  // grid 레이아웃에 반응형 클래스 추가
  modified = modified.replace(
    /className=["']([^"']*\bgrid\b[^"']*)["']/g,
    'className="$1 responsive-grid"'
  );
  
  // flex 레이아웃에 반응형 클래스 추가
  modified = modified.replace(
    /className=["']([^"']*\bflex-row\b[^"']*)["']/g,
    'className="$1 responsive-flex"'
  );
  
  // 컨테이너에 반응형 패딩 추가
  modified = modified.replace(
    /className=["']([^"']*\bcontainer\b[^"']*)["']/g,
    'className="$1 responsive-container"'
  );
  
  return modified;
}

// 파일 처리
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    let newContent = content;
    let hasChanges = false;
    
    if (ext === '.scss' || ext === '.css') {
      const updatedContent = addResponsiveStyles(content, filePath);
      if (updatedContent !== content) {
        newContent = updatedContent;
        hasChanges = true;
      }
    } else if (ext === '.jsx' || ext === '.js') {
      const updatedContent = addResponsiveClasses(content);
      if (updatedContent !== content) {
        newContent = updatedContent;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: 반응형 개선됨`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// 특정 컴포넌트에 반응형 개선이 필요한 파일들
const targetFiles = [
  'src/page/Cms/ProjectCreate.jsx',
  'src/page/Cms/ProjectEdit.jsx',
  'src/page/Cms/VideoPlanning.jsx',
  'src/page/Cms/Calendar.jsx',
  'src/page/Cms/CmsHome.jsx',
  'src/page/User/MyPage.jsx',
  'src/components/ProjectDashboard.jsx',
  'src/components/SideBar.jsx',
  'src/components/Header.jsx',
  'src/components/Navigation/EnhancedSidebar.jsx'
];

console.log('🔍 반응형 디자인 개선 중...\n');

let improvedCount = 0;

// 타겟 파일들 처리
targetFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (processFile(fullPath)) {
      improvedCount++;
    }
    
    // 관련 SCSS 파일도 처리
    const scssPath = fullPath.replace(/\.jsx?$/, '.scss');
    if (fs.existsSync(scssPath)) {
      if (processFile(scssPath)) {
        improvedCount++;
      }
    }
    
    const moduleScssPath = fullPath.replace(/\.jsx?$/, '.module.scss');
    if (fs.existsSync(moduleScssPath)) {
      if (processFile(moduleScssPath)) {
        improvedCount++;
      }
    }
  }
});

console.log(`\n📊 총 ${improvedCount}개 파일 개선됨`);
console.log('✨ 반응형 디자인 개선 완료!');