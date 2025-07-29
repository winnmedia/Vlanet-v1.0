const fs = require('fs');
const path = require('path');

const filePath = '/home/winnmedia/VideoPlanet/vridge_front/src/tasks/Feedback/FeedbackInput.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Input import 추가
if (!content.includes("import { Input }") && !content.includes("from '../../components/unified/Input'")) {
  // Button import 뒤에 Input import 추가
  content = content.replace(
    "import { Button } from '../../components/unified/Button'",
    "import { Button } from '../../components/unified/Button'\nimport { Input } from '../../components/unified/Input'"
  );
}

// 닉네임 input 변환
content = content.replace(
  /<input\s+type="text"\s+name="nickname"\s+value=\{nickname\}\s+onChange=\{onChange\}\s+placeholder="사용할 닉네임을 입력하세요"\s+maxLength=\{20\}\s*\/>/g,
  `<Input
                  type="text"
                  name="nickname"
                  value={nickname}
                  onChange={onChange}
                  placeholder="사용할 닉네임을 입력하세요"
                  maxLength={20}
                />`
);

// 시간 input 변환 - section 필드를 찾아서 변환
content = content.replace(
  /<input\s+type="text"\s+name="section"\s+value=\{section\}\s+onChange=\{onChange\}\s+placeholder="00:00:00"\s*\/>/g,
  `<Input
          type="text"
          name="section"
          value={section}
          onChange={onChange}
          placeholder="00:00:00"
        />`
);

// 피드백 내용 textarea는 일단 유지 (textarea는 별도 컴포넌트로 처리할 수 있음)

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ FeedbackInput.jsx Input 마이그레이션 완료');
console.log('- 닉네임 input 변환');
console.log('- 시간(section) input 변환');
console.log('- radio input은 유지 (특수한 경우)');
console.log('- textarea는 유지 (별도 컴포넌트 필요)');