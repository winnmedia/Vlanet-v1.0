/**
 * VideoPlanet UI Test Validator
 * Q, the Gatekeeper of Truth - Browser-based Test Suite
 * 
 * 이 스크립트를 브라우저 콘솔에서 실행하여 UI 안정성을 검증합니다.
 */

const UITestValidator = {
  // 테스트 결과 저장
  results: {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  },

  // 1. 마이페이지 프로필 이미지 테스트
  testMyPageProfile: function() {
    console.log('🔍 마이페이지 프로필 이미지 테스트 시작...');
    
    // 프로필 아바타 확인
    const avatars = document.querySelectorAll('[data-testid="user-avatar"]');
    this.assert(avatars.length > 0, '프로필 아바타 존재 확인');
    
    // 메인 아바타 크기 확인 (150px)
    const mainAvatar = Array.from(avatars).find(a => 
      a.getAttribute('data-size') === '150'
    );
    this.assert(mainAvatar !== undefined, '메인 프로필 아바타 (150px) 확인');
    
    // 수정 버튼 확인
    const editBtn = document.querySelector('button:contains("수정")') || 
                   Array.from(document.querySelectorAll('button')).find(b => b.textContent === '수정');
    this.assert(editBtn !== null, '수정 버튼 존재 확인');
    
    // 레이아웃 안정성 체크
    if (mainAvatar) {
      const rect = mainAvatar.getBoundingClientRect();
      this.assert(rect.width === 150 && rect.height === 150, '아바타 크기 일관성');
    }
  },

  // 2. 피드백 그리드 레이아웃 테스트
  testFeedbackGrid: function() {
    console.log('🔍 피드백 그리드 레이아웃 테스트 시작...');
    
    // 그리드 컨테이너 확인
    const gridContainer = document.querySelector('.feedback-grid-container');
    this.assert(gridContainer !== null, '피드백 그리드 컨테이너 존재');
    
    if (gridContainer) {
      const grid = gridContainer.querySelector('.feedback-grid');
      this.assert(grid !== null, '피드백 그리드 존재');
      
      // 그리드 스타일 확인
      const gridStyle = window.getComputedStyle(grid);
      this.assert(gridStyle.display === 'grid', '그리드 디스플레이 설정');
      
      // 카드 확인
      const cards = grid.querySelectorAll('.feedback-card');
      console.log(`  피드백 카드 수: ${cards.length}`);
      
      // 카드 크기 일관성
      if (cards.length > 0) {
        const firstCardRect = cards[0].getBoundingClientRect();
        let sizeConsistent = true;
        
        cards.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          if (Math.abs(rect.width - firstCardRect.width) > 5) {
            sizeConsistent = false;
            console.warn(`  카드 ${index} 너비 불일치: ${rect.width}px vs ${firstCardRect.width}px`);
          }
        });
        
        this.assert(sizeConsistent, '카드 크기 일관성');
      }
    }
  },

  // 3. 반응형 테스트
  testResponsiveness: function() {
    console.log('🔍 반응형 디자인 테스트 시작...');
    
    const viewportWidth = window.innerWidth;
    console.log(`  현재 뷰포트 너비: ${viewportWidth}px`);
    
    // 그리드 컬럼 수 확인
    const grid = document.querySelector('.feedback-grid');
    if (grid) {
      const gridStyle = window.getComputedStyle(grid);
      const templateColumns = gridStyle.gridTemplateColumns;
      const columnCount = templateColumns.split(' ').length;
      
      if (viewportWidth < 768) {
        this.assert(columnCount === 1, '모바일: 1열 그리드');
      } else if (viewportWidth < 1024) {
        this.assert(columnCount >= 2 && columnCount <= 3, '태블릿: 2-3열 그리드');
      } else {
        this.assert(columnCount >= 3, '데스크톱: 3열 이상 그리드');
      }
    }
  },

  // 4. 버튼 인터랙션 테스트
  testButtonInteractions: function() {
    console.log('🔍 버튼 인터랙션 테스트 시작...');
    
    const actionButtons = document.querySelectorAll('.action-btn');
    this.assert(actionButtons.length > 0, '액션 버튼 존재');
    
    // 버튼 타입 확인
    const buttonTypes = ['like', 'dislike', 'needExplanation', 'reply', 'important'];
    buttonTypes.forEach(type => {
      const button = document.querySelector(`.action-btn.${type}`);
      this.assert(button !== null, `${type} 버튼 존재`);
    });
    
    // 호버 효과 확인 (CSS transition)
    if (actionButtons.length > 0) {
      const buttonStyle = window.getComputedStyle(actionButtons[0]);
      this.assert(
        buttonStyle.transition.includes('0.2s'),
        '버튼 트랜지션 효과 (0.2s)'
      );
    }
  },

  // 5. 성능 측정
  testPerformance: function() {
    console.log('🔍 성능 측정 시작...');
    
    // DOM 노드 수
    const totalNodes = document.querySelectorAll('*').length;
    console.log(`  총 DOM 노드 수: ${totalNodes}`);
    this.assert(totalNodes < 3000, 'DOM 노드 수 적정 (< 3000)');
    
    // 이미지 최적화
    const images = document.querySelectorAll('img');
    let oversizedImages = 0;
    
    images.forEach(img => {
      if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
        oversizedImages++;
        console.warn(`  대용량 이미지 발견: ${img.src}`);
      }
    });
    
    this.assert(oversizedImages === 0, '모든 이미지 최적화됨');
  },

  // 6. 접근성 테스트
  testAccessibility: function() {
    console.log('🔍 접근성 테스트 시작...');
    
    // 버튼 접근성
    const buttons = document.querySelectorAll('button');
    let buttonsWithoutText = 0;
    
    buttons.forEach(button => {
      if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
        buttonsWithoutText++;
      }
    });
    
    this.assert(buttonsWithoutText === 0, '모든 버튼에 텍스트 또는 aria-label');
    
    // 이미지 alt 텍스트
    const images = document.querySelectorAll('img');
    let imagesWithoutAlt = 0;
    
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        imagesWithoutAlt++;
      }
    });
    
    this.assert(imagesWithoutAlt === 0, '모든 이미지에 alt 속성');
  },

  // 테스트 assertion 헬퍼
  assert: function(condition, testName) {
    if (condition) {
      this.results.passed++;
      this.results.details.push({ test: testName, status: 'PASS' });
      console.log(`✅ ${testName}`);
    } else {
      this.results.failed++;
      this.results.details.push({ test: testName, status: 'FAIL' });
      console.error(`❌ ${testName}`);
    }
  },

  // 전체 테스트 실행
  runAllTests: function() {
    console.log('========================================');
    console.log('Q, THE GATEKEEPER OF TRUTH');
    console.log('UI VALIDATION TEST SUITE');
    console.log('========================================\n');
    
    // 현재 페이지 확인
    const currentPath = window.location.pathname;
    console.log(`현재 페이지: ${currentPath}\n`);
    
    // 테스트 실행
    try {
      if (currentPath.includes('mypage') || currentPath.includes('MyPage')) {
        this.testMyPageProfile();
      }
      
      if (document.querySelector('.feedback-grid-container')) {
        this.testFeedbackGrid();
      }
      
      this.testResponsiveness();
      this.testButtonInteractions();
      this.testPerformance();
      this.testAccessibility();
      
    } catch (error) {
      console.error('테스트 실행 중 오류:', error);
      this.results.failed++;
    }
    
    // 결과 출력
    this.printResults();
  },

  // 결과 출력
  printResults: function() {
    console.log('\n========================================');
    console.log('테스트 결과 요약');
    console.log('========================================');
    console.log(`✅ 통과: ${this.results.passed}`);
    console.log(`❌ 실패: ${this.results.failed}`);
    console.log(`⚠️  경고: ${this.results.warnings}`);
    console.log(`📊 성공률: ${(this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(2)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 모든 테스트 통과! ZERO DEFECTS ACHIEVED!');
    } else {
      console.log('\n⚠️  일부 테스트 실패. 즉시 수정 필요!');
    }
    
    // 상세 결과 테이블
    console.table(this.results.details);
  }
};

// 자동 실행
console.log('UI 테스트 검증기 로드 완료.');
console.log('실행하려면: UITestValidator.runAllTests()');

// 페이지 로드 완료 후 자동 실행 (옵션)
if (document.readyState === 'complete') {
  UITestValidator.runAllTests();
} else {
  window.addEventListener('load', () => {
    setTimeout(() => UITestValidator.runAllTests(), 1000);
  });
}