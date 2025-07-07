const puppeteer = require('puppeteer');

async function testFeedbackReactions() {
  console.log('=== 피드백 좋아요/싫어요 버튼 테스트 시작 ===\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 콘솔 메시지 캡처
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[브라우저 에러] ${msg.text()}`);
      }
    });
    
    // 페이지 에러 캡처
    page.on('pageerror', error => {
      console.log(`[페이지 에러] ${error.message}`);
    });
    
    // 1. 로그인
    console.log('1. 로그인 진행...');
    await page.goto('http://localhost:3000/Login', { waitUntil: 'networkidle0' });
    
    await page.type('input[name="email"]', 'test@test.com');
    await page.type('input[name="password"]', 'test1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ 로그인 성공\n');
    
    // 2. 프로젝트 목록 확인
    console.log('2. 프로젝트 목록 확인...');
    await page.goto('http://localhost:3000/Cms', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    const projects = await page.$$eval('.project_item', elements => 
      elements.map(el => ({
        name: el.querySelector('h4')?.textContent || '',
        id: el.getAttribute('data-project-id') || el.querySelector('a')?.href?.match(/\/Feedback\/(\d+)/)?.[1]
      }))
    );
    
    if (projects.length === 0) {
      console.log('❌ 프로젝트가 없습니다. 프로젝트를 먼저 생성해주세요.\n');
      return;
    }
    
    console.log(`✅ ${projects.length}개의 프로젝트 발견\n`);
    
    // 3. 첫 번째 프로젝트의 피드백 페이지로 이동
    const firstProject = projects[0];
    console.log(`3. "${firstProject.name}" 프로젝트의 피드백 페이지로 이동...`);
    
    const feedbackUrl = `http://localhost:3000/Feedback/${firstProject.id}`;
    await page.goto(feedbackUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    
    // 4. 코멘트 탭 확인
    console.log('\n4. 코멘트 탭 확인...');
    const commentTab = await page.$('button:has-text("코멘트")');
    if (commentTab) {
      await commentTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ 코멘트 탭 클릭 완료');
    }
    
    // 5. OpinionInput 컴포넌트에서 좋아요/싫어요 버튼 확인
    console.log('\n5. OpinionInput 컴포넌트 확인...');
    
    // 코멘트 목록 확인
    const opinionItems = await page.$$('.opinion-item');
    console.log(`- 등록된 코멘트 수: ${opinionItems.length}개`);
    
    if (opinionItems.length > 0) {
      // 첫 번째 코멘트의 좋아요/싫어요 버튼 확인
      const firstOpinion = opinionItems[0];
      const likeButton = await firstOpinion.$('.reaction-btn.like');
      const dislikeButton = await firstOpinion.$('.reaction-btn.dislike');
      
      if (likeButton && dislikeButton) {
        console.log('✅ 좋아요/싫어요 버튼이 표시됩니다');
        
        // 좋아요 버튼 클릭 전 카운트
        const likeBefore = await likeButton.$eval('.count', el => el.textContent);
        console.log(`- 좋아요 클릭 전: ${likeBefore}`);
        
        // 좋아요 버튼 클릭
        await likeButton.click();
        await page.waitForTimeout(500);
        
        // 좋아요 버튼 클릭 후 카운트
        const likeAfter = await likeButton.$eval('.count', el => el.textContent);
        console.log(`- 좋아요 클릭 후: ${likeAfter}`);
        
        if (parseInt(likeAfter) > parseInt(likeBefore)) {
          console.log('✅ 좋아요 카운트가 증가했습니다');
        } else {
          console.log('❌ 좋아요 카운트가 증가하지 않았습니다');
        }
      } else {
        console.log('❌ 좋아요/싫어요 버튼이 표시되지 않습니다');
      }
    } else {
      console.log('⚠️  등록된 코멘트가 없습니다. 먼저 코멘트를 작성해주세요.');
    }
    
    // 6. FeedbackMore 컴포넌트 확인
    console.log('\n6. FeedbackMore 컴포넌트 확인...');
    
    // 피드백 목록 확인
    const feedbackItems = await page.$$('.feedback-item-wrapper');
    console.log(`- 피드백 항목 수: ${feedbackItems.length}개`);
    
    if (feedbackItems.length > 0) {
      // 첫 번째 피드백 클릭하여 확장
      const firstFeedback = feedbackItems[0];
      const feedbackItem = await firstFeedback.$('.feedback-item');
      
      if (feedbackItem) {
        await feedbackItem.click();
        await page.waitForTimeout(1000);
        
        // 확장된 피드백의 좋아요/싫어요 버튼 확인
        const detailSection = await firstFeedback.$('.feedback-detail');
        if (detailSection) {
          const likeBtn = await detailSection.$('.reaction-btn.like');
          const dislikeBtn = await detailSection.$('.reaction-btn.dislike');
          
          if (likeBtn && dislikeBtn) {
            console.log('✅ 피드백 상세에 좋아요/싫어요 버튼이 표시됩니다');
            
            // 좋아요 버튼 클릭 테스트
            const likeBefore = await likeBtn.$eval('.count', el => el.textContent);
            await likeBtn.click();
            await page.waitForTimeout(500);
            const likeAfter = await likeBtn.$eval('.count', el => el.textContent);
            
            if (parseInt(likeAfter) > parseInt(likeBefore)) {
              console.log('✅ 피드백 좋아요 카운트가 증가했습니다');
            } else {
              console.log('❌ 피드백 좋아요 카운트가 증가하지 않았습니다');
            }
          } else {
            console.log('❌ 피드백 상세에 좋아요/싫어요 버튼이 표시되지 않습니다');
          }
        } else {
          console.log('❌ 피드백이 확장되지 않았습니다');
        }
      }
    } else {
      console.log('⚠️  피드백이 없습니다. 먼저 피드백을 작성해주세요.');
    }
    
    // 7. 브라우저 콘솔 에러 확인
    console.log('\n7. 브라우저 콘솔 에러 확인...');
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      // 콘솔 에러는 이미 위에서 캡처했으므로 여기서는 DOM 에러만 확인
      const errorElements = document.querySelectorAll('.error, .error-message');
      errorElements.forEach(el => errors.push(el.textContent));
      return errors;
    });
    
    if (consoleErrors.length > 0) {
      console.log('❌ 페이지에 에러가 있습니다:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✅ 페이지에 에러가 없습니다');
    }
    
    console.log('\n=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testFeedbackReactions().catch(console.error);