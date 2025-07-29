const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');
const pagesToSplit = [
  { file: 'terms.js', component: 'Terms', path: '../src/page/Terms' },
  { file: 'privacy.js', component: 'Privacy', path: '../src/page/Privacy' },
  { file: 'emailcheck.js', component: 'EmailCheck', path: '../src/page/User/EmailCheck' },
  { file: 'resetpw.js', component: 'ResetPw', path: '../src/page/User/ResetPw' },
  { file: 'videoplanning.js', component: 'VideoPlanning', path: '../src/page/Cms/VideoPlanning' },
  { file: 'calendar.js', component: 'Calendar', path: '../src/page/Cms/Calendar' },
  { file: 'feedbackall.js', component: 'FeedbackAll', path: '../src/page/Cms/FeedbackAll' },
  { file: 'admindashboard.js', component: 'AdminDashboard', path: '../src/page/Admin/AdminDashboard' },
  { file: 'emailmonitor.js', component: 'EmailMonitor', path: '../src/page/Admin/EmailMonitor' }
];

let updatedCount = 0;

pagesToSplit.forEach(({ file, component, path: componentPath }) => {
  const filePath = path.join(pagesDir, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 이미 dynamic import를 사용하는지 확인
    if (content.includes('dynamic(')) {
      console.log(`⏭️  ${file}: 이미 코드 스플리팅 적용됨`);
      return;
    }
    
    // 새 내용 생성
    const newContent = `import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

// 코드 스플리팅 적용
const ${component} = dynamic(
  () => import('${componentPath}'),
  {
    loading: () => <LoadingAnimation />,
    ssr: ${file.includes('admin') ? 'false' : 'true'}
  }
)

export default ${component}

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
`;
    
    fs.writeFileSync(filePath, newContent);
    updatedCount++;
    console.log(`✅ ${file}: 코드 스플리팅 적용 완료`);
    
  } catch (error) {
    console.error(`❌ ${file}: 에러 발생 - ${error.message}`);
  }
});

console.log(`\n📊 총 ${updatedCount}개 페이지에 코드 스플리팅 적용됨`);