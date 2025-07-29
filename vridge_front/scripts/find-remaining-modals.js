const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 모달 관련 패턴 검색
const modalPatterns = [
  // Ant Design Modal
  /import\s+{\s*Modal\s*}\s+from\s+['"]antd['"]/g,
  /<Modal\s+/g,
  // 커스텀 모달 패턴
  /className=['"][^'"]*modal[^'"]*['"]/g,
  /showModal|setShowModal|isModalOpen|setIsModalOpen/g,
  // 모달 관련 상태
  /modalVisible|setModalVisible|modalOpen|setModalOpen/g
];

function searchModals() {
  const patterns = [
    'src/**/*.jsx',
    'src/**/*.js',
    'pages/**/*.jsx',
    'pages/**/*.js'
  ];
  
  const results = [];
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      cwd: path.join(__dirname, '..'),
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.js', '**/*.spec.js', '**/unified/**']
    });
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      let hasModal = false;
      const matches = [];
      
      modalPatterns.forEach(pattern => {
        const fileMatches = content.match(pattern);
        if (fileMatches) {
          hasModal = true;
          matches.push(...fileMatches);
        }
      });
      
      if (hasModal) {
        // UnifiedModal 사용 여부 확인
        const hasUnifiedModal = /import.*UnifiedModal/.test(content);
        
        results.push({
          file: path.relative(process.cwd(), file),
          matches: [...new Set(matches)],
          hasUnifiedModal
        });
      }
    });
  });
  
  return results;
}

// 실행
console.log('🔍 남은 모달 패턴 검색중...\n');

const modalFiles = searchModals();

if (modalFiles.length === 0) {
  console.log('✅ 모든 모달이 UnifiedModal로 마이그레이션되었습니다!');
} else {
  console.log(`📊 모달 사용 파일: ${modalFiles.length}개\n`);
  
  // UnifiedModal 미사용 파일
  const withoutUnified = modalFiles.filter(f => !f.hasUnifiedModal);
  if (withoutUnified.length > 0) {
    console.log('❌ UnifiedModal 미사용 파일:');
    withoutUnified.forEach(file => {
      console.log(`  - ${file.file}`);
      console.log(`    매치: ${file.matches.slice(0, 3).join(', ')}${file.matches.length > 3 ? '...' : ''}`);
    });
  }
  
  // UnifiedModal 사용 중이지만 다른 모달 패턴도 있는 파일
  const mixedUsage = modalFiles.filter(f => f.hasUnifiedModal);
  if (mixedUsage.length > 0) {
    console.log('\n⚠️  UnifiedModal과 다른 모달 패턴이 혼재된 파일:');
    mixedUsage.forEach(file => {
      console.log(`  - ${file.file}`);
    });
  }
}