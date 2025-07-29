const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🚀 대량 Input 마이그레이션 시작...\n');

// JSX/JS 파일 찾기
const jsxFiles = glob.sync('src/**/*.{js,jsx}', {
  cwd: '/home/winnmedia/VideoPlanet/vridge_front',
  absolute: true,
  ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/unified/**', '**/ui/**']
});

// 이미 마이그레이션된 파일들
const migratedFiles = new Set([
  'LoginMinimal.jsx',
  'Login.jsx',
  'Signup.jsx',
  'SignupWithEmail.jsx',
  'MyPage.jsx',
  'ResetPw.jsx',
  'VideoPlanning.jsx',
  'FeedbackInput.jsx',
  'ProjectInput.jsx',
  'InviteInput.jsx',
  'AuthEmail.jsx',
  'CmsHomeMinimal.v2.jsx',
  'FeedbackPlayer.jsx',
  'FrameworkManagement.jsx',
  'InvitationAccept.jsx',
  'VideoPlanningMinimal.jsx',
  'FeedbackManage.jsx',
  'FeedbackMessage.jsx',
  'Calendar.jsx'
]);

let totalMigrated = 0;
let fileCount = 0;

jsxFiles.forEach(filePath => {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 이미 마이그레이션된 파일 스킵
  if (migratedFiles.has(fileName)) {
    return;
  }
  
  // 통합 Input 컴포넌트를 이미 사용하고 있는지 확인
  const hasUnifiedInput = content.includes("from '../components/unified/Input'") ||
                         content.includes("from '../../components/unified/Input'") ||
                         content.includes("from '../../../components/unified/Input'");
  
  if (hasUnifiedInput) {
    return;
  }
  
  let migrated = 0;
  let newContent = content;
  
  // input 태그 찾기
  const inputPatterns = [
    /<input\s+type="text"([^>]*)\/>/g,
    /<input\s+type="email"([^>]*)\/>/g,
    /<input\s+type="password"([^>]*)\/>/g,
    /<input\s+type="number"([^>]*)\/>/g,
    /<input\s+type="tel"([^>]*)\/>/g,
    /<input\s+type="search"([^>]*)\/>/g,
    /<input\s+type="url"([^>]*)\/>/g,
    /<input\s+type="date"([^>]*)\/>/g,
    /<input\s+type="time"([^>]*)\/>/g,
    /<input\s+type="datetime-local"([^>]*)\/>/g,
  ];
  
  inputPatterns.forEach(pattern => {
    const matches = newContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // checkbox, radio, file은 제외
        if (match.includes('checkbox') || match.includes('radio') || match.includes('file')) {
          return;
        }
        
        const newTag = match.replace('<input', '<Input').replace('/>', '/>');
        newContent = newContent.replace(match, newTag);
        migrated++;
      });
    }
  });
  
  if (migrated > 0) {
    // Import 추가
    const importLines = newContent.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].startsWith('import')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      // 상대 경로 계산
      const relativeDepth = filePath.split('/src/')[1].split('/').length - 1;
      const importPath = '../'.repeat(relativeDepth) + 'components/unified/Input';
      
      importLines.splice(lastImportIndex + 1, 0, `import { Input } from '${importPath}'`);
      newContent = importLines.join('\n');
    }
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ ${path.relative('/home/winnmedia/VideoPlanet/vridge_front', filePath)}: ${migrated}개 input 마이그레이션`);
    totalMigrated += migrated;
    fileCount++;
  }
});

console.log(`\n🎉 대량 Input 마이그레이션 완료!`);
console.log(`- 총 ${fileCount}개 파일 수정`);
console.log(`- 총 ${totalMigrated}개 input 마이그레이션`);