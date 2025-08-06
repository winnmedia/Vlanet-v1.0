const fs = require('fs');
const path = require('path');

// Feedback.jsx 파일 읽기
const filePath = path.join(__dirname, '../page/Cms/Feedback.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('🔍 Feedback.jsx 중복 코드 분석\n');
console.log(`총 라인 수: ${lines.length}줄\n`);

// 주요 패턴 찾기
const patterns = {
  returns: [],
  tabNavigations: [],
  projectInfos: [],
  videoPlayers: [],
  modals: []
};

// return 문 찾기
lines.forEach((line, index) => {
  if (line.trim() === 'return (') {
    patterns.returns.push({ line: index + 1, content: line.trim() });
  }
  
  // 탭 네비게이션 관련
  if (line.includes('tabButton') || line.includes('tab_menu')) {
    patterns.tabNavigations.push({ line: index + 1, content: line.trim() });
  }
  
  // 프로젝트 정보 표시
  if (line.includes('current_project.name') || line.includes('프로젝트 정보')) {
    patterns.projectInfos.push({ line: index + 1, content: line.trim() });
  }
  
  // 비디오 플레이어
  if (line.includes('EnhancedVideoPlayer') || line.includes('VideoUploadGuide')) {
    patterns.videoPlayers.push({ line: index + 1, content: line.trim() });
  }
  
  // 모달
  if (line.includes('showTeacherModal') || line.includes('ai-teacher-modal')) {
    patterns.modals.push({ line: index + 1, content: line.trim() });
  }
});

// 결과 출력
console.log('📌 주요 구조 요소:\n');

console.log(`1. Return 문 (${patterns.returns.length}개):`);
patterns.returns.forEach(item => {
  console.log(`   - ${item.line}줄: ${item.content}`);
});

console.log(`\n2. 탭 네비게이션 (${patterns.tabNavigations.length}개):`);
patterns.tabNavigations.forEach(item => {
  console.log(`   - ${item.line}줄: ${item.content.substring(0, 60)}...`);
});

console.log(`\n3. 프로젝트 정보 표시 (${patterns.projectInfos.length}개):`);
patterns.projectInfos.forEach(item => {
  console.log(`   - ${item.line}줄: ${item.content.substring(0, 60)}...`);
});

console.log(`\n4. 비디오 플레이어 관련 (${patterns.videoPlayers.length}개):`);
patterns.videoPlayers.forEach(item => {
  console.log(`   - ${item.line}줄: ${item.content.substring(0, 60)}...`);
});

// 중복 가능성 분석
console.log('\n⚠️  중복 가능성 높은 부분:\n');

// 두 개의 메인 return이 있는지 확인
const mainReturns = patterns.returns.filter(r => r.line > 1000);
if (mainReturns.length > 1) {
  console.log('❌ 메인 컴포넌트 return이 여러 개 발견됨:');
  mainReturns.forEach(r => console.log(`   - ${r.line}줄`));
}

// 탭 네비게이션이 중복되는지 확인
const tabButtons = patterns.tabNavigations.filter(t => t.content.includes('tabButton'));
if (tabButtons.length > 3) {
  console.log('\n❌ 탭 버튼이 여러 곳에서 렌더링됨:');
  tabButtons.forEach(t => console.log(`   - ${t.line}줄`));
}

// 권장사항
console.log('\n💡 권장사항:\n');
console.log('1. 1287줄의 로딩 상태 return과 1302줄의 메인 return을 통합');
console.log('2. 탭 네비게이션 중복 제거 (1875줄과 2147줄)');
console.log('3. 프로젝트 정보 표시 부분 통합');
console.log('4. aside 태그가 두 번 사용되는 것으로 보임 - 하나로 통합 필요');

// 파일 크기 정보
const fileSizeKB = Math.round(Buffer.byteLength(content, 'utf8') / 1024);
console.log(`\n📊 파일 정보:`);
console.log(`   - 파일 크기: ${fileSizeKB}KB`);
console.log(`   - 예상 절감 가능: 약 30-40% (중복 제거 시)`);