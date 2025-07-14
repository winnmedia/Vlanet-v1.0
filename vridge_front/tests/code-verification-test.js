const fs = require('fs');
const path = require('path');

class CodeVerificationTester {
  constructor() {
    this.testResults = [];
    this.basePath = '/home/winnmedia/VideoPlanet';
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type}: ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  // 파일 내용 읽기
  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(this.basePath, filePath), 'utf8');
    } catch (error) {
      this.log(`파일 읽기 실패: ${filePath}`, 'ERROR');
      return null;
    }
  }

  // 1. PDF 한글 폰트 수정 확인
  testPDFKoreanFont() {
    this.log('🔍 1. PDF 한글 폰트 수정 확인');
    const content = this.readFile('vridge_back/video_planning/pdf_export_service.py');
    
    if (content) {
      if (content.includes('UnicodeCIDFont') && content.includes('HYGothic-Medium')) {
        this.log('✅ PDF 한글 폰트 CID 적용 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ PDF 한글 폰트 수정 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 2. 디버그 정보 버튼 제거 확인
  testDebugButtonRemoval() {
    this.log('🔍 2. 디버그 정보 버튼 제거 확인');
    const content = this.readFile('vridge_front/src/page/Cms/VideoPlanning.jsx');
    
    if (content) {
      if (!content.includes('디버그 정보') && !content.includes('debug')) {
        this.log('✅ 디버그 정보 버튼 제거 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 디버그 정보 버튼 여전히 존재', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 3. 버튼 브랜드 색상 적용 확인
  testBrandColorButtons() {
    this.log('🔍 3. 버튼 브랜드 색상 적용 확인');
    const content = this.readFile('vridge_front/src/page/Cms/VideoPlanning.scss');
    
    if (content) {
      if (content.includes('#4318FF') && content.includes('gradient')) {
        this.log('✅ 브랜드 색상 (#4318FF) 버튼 스타일 적용 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 브랜드 색상 버튼 스타일 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 4. 스토리 전개 강도 버튼 스타일 확인
  testStoryLevelButtons() {
    this.log('🔍 4. 스토리 전개 강도 버튼 스타일 확인');
    const content = this.readFile('vridge_front/src/page/Cms/VideoPlanning.scss');
    
    if (content) {
      if (content.includes('.level-btn') && content.includes('#42a5f5')) {
        this.log('✅ 스토리 전개 강도 버튼 색상 스타일 적용 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 스토리 전개 강도 버튼 스타일 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 5. 콘티 생성 속도 개선 확인
  testStoryboardOptimization() {
    this.log('🔍 5. 콘티 생성 속도 개선 확인');
    const content = this.readFile('vridge_front/src/page/Cms/VideoPlanning.jsx');
    
    if (content) {
      if (content.includes('quick_draft') && content.includes('speed_optimized')) {
        this.log('✅ 콘티 생성 속도 최적화 설정 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 콘티 생성 속도 최적화 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 6. Google Slides 서비스 개선 확인
  testGoogleSlidesService() {
    this.log('🔍 6. Google Slides 서비스 개선 확인');
    const content = this.readFile('vridge_back/video_planning/google_slides_service.py');
    
    if (content) {
      if (content.includes('GOOGLE_APPLICATION_CREDENTIALS') && content.includes('logger.warning')) {
        this.log('✅ Google Slides 서비스 에러 처리 개선 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ Google Slides 서비스 개선 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 7. 영상 업로드 버튼 디자인 확인
  testVideoUploadButton() {
    this.log('🔍 7. 영상 업로드 버튼 디자인 확인');
    const content = this.readFile('vridge_front/src/css/Cms/VideoUploadButton.scss');
    
    if (content) {
      if (content.includes('.video_upload_label') && content.includes('#1631F8')) {
        this.log('✅ 영상 업로드 버튼 브랜드 스타일 적용 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 영상 업로드 버튼 스타일 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 8. 영상 교체/삭제 버튼 확인
  testVideoReplaceDeleteButtons() {
    this.log('🔍 8. 영상 교체/삭제 버튼 확인');
    const content = this.readFile('vridge_front/src/page/Cms/Feedback.jsx');
    
    if (content) {
      if (content.includes('교체') && content.includes('삭제')) {
        this.log('✅ 영상 교체/삭제 버튼 추가 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 영상 교체/삭제 버튼 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 9. 피드백/코멘트 시스템 개선 확인
  testFeedbackSystem() {
    this.log('🔍 9. 피드백/코멘트 시스템 개선 확인');
    const opinionContent = this.readFile('vridge_front/src/tasks/Feedback/OpinionInput.jsx');
    const feedbackContent = this.readFile('vridge_front/src/tasks/Feedback/FeedbackInput.jsx');
    
    if (opinionContent && feedbackContent) {
      if (opinionContent.includes('error.response.status') && feedbackContent.includes('err.response.data')) {
        this.log('✅ 피드백/코멘트 에러 처리 개선 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 피드백/코멘트 에러 처리 개선 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 10. 스토리 수정 기능 확인
  testStoryEditFunction() {
    this.log('🔍 10. 스토리 수정 기능 확인');
    const content = this.readFile('vridge_front/src/page/Cms/VideoPlanning.jsx');
    
    if (content) {
      if (content.includes('editingStoryIndex') && content.includes('startEditingStory') && content.includes('edit-story-btn')) {
        this.log('✅ 스토리 수정 기능 추가 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 스토리 수정 기능 누락', 'ERROR');
        return false;
      }
    }
    return false;
  }

  // 접기/펴기 버튼 제거 확인
  testExpandCollapseRemoval() {
    this.log('🔍 추가: 접기/펴기 버튼 제거 확인');
    const content = this.readFile('vridge_front/src/page/Cms/VideoPlanning.jsx');
    
    if (content) {
      if (!content.includes('toggle-detail-btn') && !content.includes('▲ 접기') && !content.includes('▼ 펼치기')) {
        this.log('✅ 접기/펴기 버튼 제거 확인', 'SUCCESS');
        return true;
      } else {
        this.log('❌ 접기/펴기 버튼 여전히 존재', 'ERROR');
        return false;
      }
    }
    return false;
  }

  generateReport() {
    const successCount = this.testResults.filter(r => r.type === 'SUCCESS').length;
    const errorCount = this.testResults.filter(r => r.type === 'ERROR').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 코드 검증 테스트 결과 요약');
    console.log('='.repeat(60));
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    console.log('='.repeat(60));

    const improvements = [
      '1. PDF 내보내기 한글 렌더링 수정',
      '2. 디버그 정보 버튼 제거', 
      '3. 버튼 디자인 개선 (브랜드 색상)',
      '4. 스토리 전개 강도 버튼 스타일링',
      '5. 콘티 생성 속도 개선',
      '6. Google Slides 서비스 개선',
      '7. 영상 업로드 버튼 디자인',
      '8. 영상 교체/삭제 버튼 추가',
      '9. 피드백/코멘트 등록 기능 수정',
      '10. 스토리 수정 기능 추가'
    ];

    console.log('\n📋 개선사항별 검증 결과:');
    const results = this.testResults.filter(r => r.type === 'SUCCESS' || r.type === 'ERROR');
    results.forEach((result, index) => {
      const status = result.type === 'SUCCESS' ? '✅' : '❌';
      console.log(`${improvements[index] || `항목 ${index + 1}`} - ${status}`);
    });

    return {
      total: improvements.length,
      success: successCount,
      errors: errorCount
    };
  }

  async runAllTests() {
    this.log('🚀 VideoPlanet 개선사항 코드 검증 시작');
    
    // 모든 테스트 실행
    this.testPDFKoreanFont();
    this.testDebugButtonRemoval();
    this.testBrandColorButtons();
    this.testStoryLevelButtons();
    this.testStoryboardOptimization();
    this.testGoogleSlidesService();
    this.testVideoUploadButton();
    this.testVideoReplaceDeleteButtons();
    this.testFeedbackSystem();
    this.testStoryEditFunction();
    this.testExpandCollapseRemoval();

    return this.generateReport();
  }
}

// 테스트 실행
async function main() {
  const tester = new CodeVerificationTester();
  
  try {
    const results = await tester.runAllTests();
    
    console.log('\n🎯 최종 결론:');
    if (results.errors === 0) {
      console.log('✅ 모든 개선사항이 코드에 성공적으로 반영되었습니다!');
      console.log('🚀 배포 준비가 완료되었습니다.');
    } else {
      console.log(`⚠️ ${results.errors}개의 문제가 발견되었습니다. 추가 확인이 필요합니다.`);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = CodeVerificationTester;