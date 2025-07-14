// 피드백 페이지 스타일 적용 확인 스크립트
// 브라우저 콘솔에서 실행

(function() {
    console.log('=== 피드백 페이지 스타일 확인 ===');
    
    // 1. 버튼 컨테이너 확인
    const container = document.querySelector('.feedback-button-container');
    if (container) {
        console.log('✅ feedback-button-container 클래스 발견');
        const containerStyles = window.getComputedStyle(container);
        console.log('Container display:', containerStyles.display);
        console.log('Container gap:', containerStyles.gap);
    } else {
        console.log('❌ feedback-button-container 클래스를 찾을 수 없음');
        
        // 대신 인라인 스타일 확인
        const divs = document.querySelectorAll('div[style*="display: flex"]');
        console.log(`인라인 스타일을 가진 div 수: ${divs.length}`);
    }
    
    // 2. 버튼 클래스 확인
    const primaryButtons = document.querySelectorAll('.feedback-button-primary');
    const dangerButtons = document.querySelectorAll('.feedback-button-danger');
    
    console.log(`\nfeedback-button-primary 버튼 수: ${primaryButtons.length}`);
    console.log(`feedback-button-danger 버튼 수: ${dangerButtons.length}`);
    
    // 3. 버튼 스타일 확인
    if (primaryButtons.length > 0) {
        const btnStyles = window.getComputedStyle(primaryButtons[0]);
        console.log('\n첫 번째 파란색 버튼 스타일:');
        console.log('Background:', btnStyles.background);
        console.log('Color:', btnStyles.color);
        console.log('Padding:', btnStyles.padding);
    }
    
    // 4. CSS 파일 로드 확인
    const styleSheets = Array.from(document.styleSheets);
    const feedbackStyles = styleSheets.filter(sheet => {
        try {
            return sheet.href && (
                sheet.href.includes('FeedbackButtons') || 
                sheet.href.includes('FeedbackUnified')
            );
        } catch(e) {
            return false;
        }
    });
    
    console.log('\n피드백 관련 CSS 파일:');
    feedbackStyles.forEach(sheet => {
        console.log('- ' + sheet.href);
    });
    
    // 5. 인라인 스타일 버튼 찾기
    const inlineStyleButtons = document.querySelectorAll('button[style*="background"]');
    console.log(`\n인라인 스타일을 가진 버튼 수: ${inlineStyleButtons.length}`);
    
    if (inlineStyleButtons.length > 0) {
        console.log('⚠️  아직 인라인 스타일을 사용하는 버튼이 있습니다!');
        inlineStyleButtons.forEach((btn, idx) => {
            console.log(`버튼 ${idx + 1}: ${btn.textContent.trim()}`);
        });
    }
    
    // 6. 추천 사항
    console.log('\n=== 확인 결과 ===');
    if (primaryButtons.length === 0 && inlineStyleButtons.length > 0) {
        console.log('❌ CSS 클래스가 적용되지 않았습니다.');
        console.log('✨ 해결 방법:');
        console.log('1. 브라우저 캐시 삭제 (Ctrl+Shift+R)');
        console.log('2. 개발자 도구 > Network 탭 > Disable cache 체크');
        console.log('3. 페이지 새로고침');
    } else if (primaryButtons.length > 0) {
        console.log('✅ CSS 클래스가 올바르게 적용되었습니다!');
    }
})();