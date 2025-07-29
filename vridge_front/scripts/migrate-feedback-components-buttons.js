const fs = require('fs');
const path = require('path');

const filePath = '/home/winnmedia/VideoPlanet/vridge_front/src/design-system/pages/Feedback/FeedbackComponents.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// 버튼 마이그레이션 매핑
const buttonReplacements = [
  // VideoControls 내부 버튼들
  {
    old: `<button className={styles.controlButton} onClick={onAddFeedback} title="피드백 추가">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>`,
    new: `<Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onAddFeedback} 
          title="피드백 추가"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </Button>`
  },
  {
    old: `<button className={styles.controlButton} onClick={onUpload} title="영상 업로드">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
          </svg>
        </button>`,
    new: `<Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onUpload} 
          title="영상 업로드"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
          </svg>
        </Button>`
  },
  {
    old: `<button className={styles.controlButton} onClick={onDelete} title="영상 삭제">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>`,
    new: `<Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onDelete} 
          title="영상 삭제"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </Button>`
  },
  {
    old: `<button className={styles.controlButton} onClick={onShare} title="공유">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
        </button>`,
    new: `<Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onShare} 
          title="공유"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
        </Button>`
  },
  {
    old: `<button className={styles.controlButton} onClick={onScreenshot} title="스크린샷">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </button>`,
    new: `<Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onScreenshot} 
          title="스크린샷"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </Button>`
  },
  {
    old: `<button className={styles.controlButton} onClick={onFullview} title="전체보기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/>
          </svg>
        </button>`,
    new: `<Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onFullview} 
          title="전체보기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/>
          </svg>
        </Button>`
  }
];

// TabMenu 내부 버튼 마이그레이션
const tabButtonReplacement = {
  old: /(<button\s+key=\{tab\.id\}\s+className=\{classNames\(\s*styles\.tabButton,\s*\{\s*\[styles\.active\]:\s*activeTab\s*===\s*tab\.id\s*\}\s*\)\}\s+onClick=\{\(\)\s*=>\s*onTabChange\(tab\.id\)\}\s*>\s*\{tab\.label\}\s*<\/button>)/gs,
  new: `<Button 
          key={tab.id}
          variant={activeTab === tab.id ? "primary" : "ghost"}
          size="sm"
          className={classNames(
            styles.tabButton,
            { [styles.active]: activeTab === tab.id }
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>`
};

let updatedContent = content;

// 일반 버튼 교체
buttonReplacements.forEach(({ old, new: newValue }) => {
  updatedContent = updatedContent.replace(old, newValue);
});

// TabMenu 버튼 교체
updatedContent = updatedContent.replace(tabButtonReplacement.old, tabButtonReplacement.new);

// 파일 저장
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('✅ FeedbackComponents.tsx 버튼 마이그레이션 완료');
console.log('- VideoSection 정보 버튼 변환');
console.log('- VideoControls 버튼 6개 변환');
console.log('- TabMenu 버튼 변환');