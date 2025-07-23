#!/usr/bin/env node

/**
 * VideoPlanet UI 체크리스트 생성기
 * 모든 페이지의 버튼과 UI 요소를 체계적으로 확인할 수 있는 체크리스트 생성
 */

const fs = require('fs');

// 색상 코드
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

// UI 체크리스트
const uiChecklist = {
  '1. 로그인 페이지 (/Login)': {
    description: '사용자 인증을 위한 로그인 페이지',
    elements: [
      { type: 'input', name: '이메일 입력 필드', test: '클릭하여 이메일 입력 가능' },
      { type: 'input', name: '비밀번호 입력 필드', test: '클릭하여 비밀번호 입력 가능' },
      { type: 'button', name: '로그인 버튼', test: '클릭하여 로그인 시도' },
      { type: 'link', name: '회원가입 링크', test: '클릭하여 회원가입 페이지로 이동' },
      { type: 'link', name: '비밀번호 찾기 링크', test: '클릭하여 비밀번호 재설정 페이지로 이동' }
    ]
  },
  
  '2. 회원가입 페이지 (/Signup)': {
    description: '새로운 사용자 등록',
    elements: [
      { type: 'input', name: '이메일 입력 필드', test: '클릭하여 이메일 입력 가능' },
      { type: 'button', name: '이메일 중복 확인 버튼', test: '클릭하여 이메일 중복 체크' },
      { type: 'input', name: '비밀번호 입력 필드', test: '클릭하여 비밀번호 입력 가능' },
      { type: 'input', name: '비밀번호 확인 필드', test: '클릭하여 비밀번호 재입력 가능' },
      { type: 'input', name: '닉네임 입력 필드', test: '클릭하여 닉네임 입력 가능' },
      { type: 'button', name: '회원가입 버튼', test: '모든 정보 입력 후 클릭하여 가입 완료' }
    ]
  },
  
  '3. CMS 홈 (/CmsHome)': {
    description: '로그인 후 메인 대시보드',
    elements: [
      { type: 'button', name: '사이드바 토글 버튼', test: '클릭하여 사이드바 열기/닫기' },
      { type: 'link', name: '프로젝트 생성 버튼', test: '클릭하여 새 프로젝트 생성 페이지로 이동' },
      { type: 'link', name: '영상 기획 메뉴', test: '클릭하여 영상 기획 페이지로 이동' },
      { type: 'link', name: '전체 일정 메뉴', test: '클릭하여 캘린더 페이지로 이동' },
      { type: 'link', name: '마이페이지 메뉴', test: '클릭하여 마이페이지로 이동' },
      { type: 'button', name: '로그아웃 버튼', test: '클릭하여 로그아웃' }
    ]
  },
  
  '4. 프로젝트 생성 (/ProjectCreate)': {
    description: '새로운 프로젝트 생성',
    elements: [
      { type: 'input', name: '프로젝트명 입력 필드', test: '클릭하여 프로젝트명 입력 가능' },
      { type: 'input', name: '담당자 입력 필드', test: '클릭하여 담당자명 입력 가능' },
      { type: 'input', name: '고객사 입력 필드', test: '클릭하여 고객사명 입력 가능' },
      { type: 'textarea', name: '프로젝트 설명 필드', test: '클릭하여 설명 입력 가능' },
      { type: 'button', name: '색상 선택 버튼', test: '클릭하여 프로젝트 색상 선택' },
      { type: 'button', name: '멤버 추가 버튼', test: '클릭하여 팀 멤버 추가' },
      { type: 'button', name: '프로세스 추가 버튼', test: '클릭하여 프로세스 단계 추가' },
      { type: 'button', name: '생성 버튼', test: '모든 정보 입력 후 클릭하여 프로젝트 생성' },
      { type: 'button', name: '취소 버튼', test: '클릭하여 생성 취소 및 이전 페이지로 이동' }
    ]
  },
  
  '5. 피드백 페이지 (/Feedback/:id)': {
    description: '영상 피드백 및 코멘트 관리',
    elements: [
      { type: 'button', name: '영상 업로드 버튼', test: '클릭하여 영상 파일 선택 및 업로드' },
      { type: 'button', name: '재생 버튼', test: '클릭하여 영상 재생/일시정지' },
      { type: 'button', name: '10초 뒤로 버튼', test: '클릭하여 10초 뒤로 이동' },
      { type: 'button', name: '10초 앞으로 버튼', test: '클릭하여 10초 앞으로 이동' },
      { type: 'button', name: '재생 속도 버튼', test: '클릭하여 재생 속도 변경' },
      { type: 'button', name: '전체화면 버튼', test: '클릭하여 전체화면 모드 전환' },
      { type: 'textarea', name: '피드백 입력 필드', test: '클릭하여 피드백 내용 입력 가능' },
      { type: 'button', name: '피드백 등록 버튼', test: '피드백 입력 후 클릭하여 등록' },
      { type: 'button', name: 'AI 선생님 버튼', test: '클릭하여 AI 분석 모달 열기' },
      { type: 'button', name: '프로젝트 정보 토글', test: '클릭하여 프로젝트 정보 표시/숨김' },
      { type: 'select', name: '피드백 타입 선택', test: '클릭하여 피드백 타입 선택' },
      { type: 'button', name: '파일 첨부 버튼', test: '클릭하여 참고 파일 첨부' }
    ]
  },
  
  '6. 마이페이지 (/MyPage)': {
    description: '사용자 프로필 및 설정',
    elements: [
      { type: 'input', name: '닉네임 변경 필드', test: '클릭하여 닉네임 수정 가능' },
      { type: 'button', name: '닉네임 변경 버튼', test: '새 닉네임 입력 후 클릭하여 변경' },
      { type: 'input', name: '현재 비밀번호 필드', test: '클릭하여 현재 비밀번호 입력' },
      { type: 'input', name: '새 비밀번호 필드', test: '클릭하여 새 비밀번호 입력' },
      { type: 'input', name: '비밀번호 확인 필드', test: '클릭하여 새 비밀번호 재입력' },
      { type: 'button', name: '비밀번호 변경 버튼', test: '모든 비밀번호 입력 후 클릭하여 변경' },
      { type: 'button', name: '회원 탈퇴 버튼', test: '클릭하여 회원 탈퇴 프로세스 시작' }
    ]
  },
  
  '7. 영상 기획 (/VideoPlanning)': {
    description: 'AI 기반 영상 기획 도구',
    elements: [
      { type: 'textarea', name: '프롬프트 입력 필드', test: '클릭하여 영상 기획 프롬프트 입력' },
      { type: 'button', name: '기획안 생성 버튼', test: '프롬프트 입력 후 클릭하여 AI 기획안 생성' },
      { type: 'button', name: '템플릿 선택 버튼', test: '클릭하여 기획 템플릿 선택' },
      { type: 'button', name: '저장 버튼', test: '클릭하여 기획안 저장' },
      { type: 'button', name: '내보내기 버튼', test: '클릭하여 기획안 내보내기' },
      { type: 'select', name: 'AI 모델 선택', test: '클릭하여 사용할 AI 모델 선택' }
    ]
  },
  
  '8. 전체 일정 (/Calendar)': {
    description: '프로젝트 일정 관리',
    elements: [
      { type: 'button', name: '이전 달 버튼', test: '클릭하여 이전 달로 이동' },
      { type: 'button', name: '다음 달 버튼', test: '클릭하여 다음 달로 이동' },
      { type: 'button', name: '오늘 버튼', test: '클릭하여 오늘 날짜로 이동' },
      { type: 'button', name: '보기 모드 전환', test: '클릭하여 월/주/일 보기 전환' },
      { type: 'button', name: '일정 추가 버튼', test: '클릭하여 새 일정 추가' },
      { type: 'clickable', name: '일정 항목', test: '클릭하여 일정 상세 보기/편집' }
    ]
  }
};

// 체크리스트 실행
function generateUIChecklist() {
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}📋 VideoPlanet UI 요소 체크리스트${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`\n이 체크리스트를 사용하여 모든 버튼과 UI 요소가 정상적으로 작동하는지 확인하세요.\n`);
  
  let totalElements = 0;
  const checklistMarkdown = [];
  
  checklistMarkdown.push('# VideoPlanet UI 체크리스트\n');
  checklistMarkdown.push(`생성일: ${new Date().toLocaleString('ko-KR')}\n`);
  
  Object.entries(uiChecklist).forEach(([pageName, pageInfo]) => {
    console.log(`\n${colors.magenta}${pageName}${colors.reset}`);
    console.log(`${colors.yellow}${pageInfo.description}${colors.reset}`);
    console.log('-'.repeat(60));
    
    checklistMarkdown.push(`\n## ${pageName}`);
    checklistMarkdown.push(`> ${pageInfo.description}\n`);
    
    pageInfo.elements.forEach((element, idx) => {
      totalElements++;
      const checkBox = '[ ]';
      const elementInfo = `${element.type.toUpperCase()} - ${element.name}`;
      
      console.log(`${checkBox} ${colors.green}${elementInfo}${colors.reset}`);
      console.log(`    └─ 테스트: ${element.test}`);
      
      checklistMarkdown.push(`- [ ] **${elementInfo}**`);
      checklistMarkdown.push(`  - 테스트: ${element.test}`);
    });
    
    checklistMarkdown.push('');
  });
  
  // 추가 체크 항목
  console.log(`\n${colors.magenta}9. 공통 UI 요소${colors.reset}`);
  console.log(`${colors.yellow}모든 페이지에서 확인해야 할 공통 요소${colors.reset}`);
  console.log('-'.repeat(60));
  
  const commonElements = [
    { name: '반응형 레이아웃', test: '모바일/태블릿/데스크톱에서 정상 표시' },
    { name: '로딩 스피너', test: '데이터 로딩 중 표시되고 완료 후 사라짐' },
    { name: '에러 메시지', test: '에러 발생 시 명확한 메시지 표시' },
    { name: '성공 메시지', test: '작업 완료 시 성공 메시지 표시' },
    { name: '모달 닫기 버튼', test: '모든 모달의 X 버튼이 작동' },
    { name: '드롭다운 메뉴', test: '클릭하여 옵션 표시 및 선택 가능' },
    { name: '툴팁', test: '호버 시 도움말 툴팁 표시' },
    { name: '키보드 네비게이션', test: 'Tab 키로 모든 요소 접근 가능' },
    { name: '포커스 표시', test: '포커스된 요소가 시각적으로 구분됨' },
    { name: 'ESC 키 처리', test: 'ESC 키로 모달/드롭다운 닫기' }
  ];
  
  checklistMarkdown.push('\n## 9. 공통 UI 요소');
  checklistMarkdown.push('> 모든 페이지에서 확인해야 할 공통 요소\n');
  
  commonElements.forEach(element => {
    totalElements++;
    console.log(`[ ] ${colors.green}${element.name}${colors.reset}`);
    console.log(`    └─ 테스트: ${element.test}`);
    
    checklistMarkdown.push(`- [ ] **${element.name}**`);
    checklistMarkdown.push(`  - 테스트: ${element.test}`);
  });
  
  // CSS 관련 체크 항목
  console.log(`\n${colors.magenta}10. CSS 및 스타일 체크${colors.reset}`);
  console.log(`${colors.yellow}InputActivationFix.scss 적용 확인${colors.reset}`);
  console.log('-'.repeat(60));
  
  const cssChecks = [
    'pointer-events: auto가 모든 입력 요소에 적용됨',
    'z-index 충돌로 인한 클릭 불가 문제 없음',
    '비활성화된 요소는 시각적으로 구분됨 (opacity: 0.6)',
    '포커스 시 파란색 아웃라인 표시 (2px solid #1631F8)',
    '버튼 호버 효과 정상 작동',
    '모달 오버레이가 다른 요소를 가리지 않음'
  ];
  
  checklistMarkdown.push('\n## 10. CSS 및 스타일 체크');
  checklistMarkdown.push('> InputActivationFix.scss 적용 확인\n');
  
  cssChecks.forEach(check => {
    console.log(`[ ] ${colors.green}${check}${colors.reset}`);
    checklistMarkdown.push(`- [ ] ${check}`);
  });
  
  // 결과 요약
  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}📊 체크리스트 요약${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`\n총 확인 항목: ${totalElements + cssChecks.length}개`);
  console.log(`- 페이지별 요소: ${totalElements}개`);
  console.log(`- CSS 체크 항목: ${cssChecks.length}개`);
  
  // 체크리스트 파일 저장
  const filename = `ui-checklist-${Date.now()}.md`;
  fs.writeFileSync(filename, checklistMarkdown.join('\n'));
  console.log(`\n📄 체크리스트가 ${colors.green}${filename}${colors.reset} 파일로 저장되었습니다.`);
  
  // 테스트 방법 안내
  console.log(`\n${colors.yellow}🔍 테스트 방법:${colors.reset}`);
  console.log('1. 프론트엔드 서버 실행: npm start');
  console.log('2. 브라우저에서 http://localhost:3000 접속');
  console.log('3. 각 페이지를 방문하여 체크리스트의 모든 항목 확인');
  console.log('4. 문제 발견 시 InputActivationFix.scss 확인');
  console.log('5. 브라우저 개발자 도구에서 요소의 pointer-events 속성 확인');
  
  console.log(`\n${colors.red}⚠️  특히 주의할 점:${colors.reset}`);
  console.log('- 피드백 페이지의 입력 필드와 버튼이 모두 클릭 가능한지 확인');
  console.log('- 비디오 플레이어 컨트롤이 플레이어 아래에 정상 표시되는지 확인');
  console.log('- 모달이 열렸을 때 배경의 요소가 클릭되지 않는지 확인');
  console.log('- 드롭다운 메뉴가 다른 요소 위에 정상적으로 표시되는지 확인');
}

// 실행
generateUIChecklist();