const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 간단한 input 마이그레이션이 가능한 파일들
const targetFiles = [
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/ProjectCreate.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/ProjectEdit.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/InvitationAccept.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/Calendar.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/FeedbackPolling.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/VideoPlanningMinimal.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/tasks/Feedback/FeedbackManage.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/tasks/Feedback/FeedbackMessage.jsx',
];

let totalMigrated = 0;

targetFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  파일을 찾을 수 없음: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let migrated = 0;

  // Import 추가 확인
  const hasInputImport = content.includes("from '../components/unified/Input'") ||
                        content.includes("from '../../components/unified/Input'") ||
                        content.includes("from '../../../components/unified/Input'");

  if (!hasInputImport) {
    // React import 찾기
    const reactImportMatch = content.match(/import React[^;]+;?\n/);
    if (reactImportMatch) {
      const relativeDepth = filePath.split('/src/')[1].split('/').length - 1;
      const importPath = '../'.repeat(relativeDepth) + 'components/unified/Input';
      content = content.replace(
        reactImportMatch[0],
        reactImportMatch[0] + `import { Input } from '${importPath}'\n`
      );
    }
  }

  // 간단한 text input 패턴들
  const patterns = [
    // 기본 text input
    /<input\s+type="text"([^>]+)\/>/g,
    // 이메일 input
    /<input\s+type="email"([^>]+)\/>/g,
    // 전화번호 input
    /<input\s+type="tel"([^>]+)\/>/g,
    // 숫자 input
    /<input\s+type="number"([^>]+)\/>/g,
    // 검색 input
    /<input\s+type="search"([^>]+)\/>/g,
    // 비밀번호 input
    /<input\s+type="password"([^>]+)\/>/g,
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // file type은 제외
        if (match.includes('type="file"')) return;
        
        const newTag = match.replace('<input', '<Input').replace('/>', '/>');
        content = content.replace(match, newTag);
        migrated++;
      });
    }
  });

  if (migrated > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.basename(filePath)}: ${migrated}개 input 마이그레이션 완료`);
    totalMigrated += migrated;
  }
});

console.log(`\n🎉 총 ${totalMigrated}개 input 마이그레이션 완료!`);