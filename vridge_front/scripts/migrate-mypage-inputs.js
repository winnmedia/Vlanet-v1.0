const fs = require('fs');
const path = require('path');

const filePath = '/home/winnmedia/VideoPlanet/vridge_front/src/page/User/MyPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Import 추가 (이미 Button이 import되어 있으므로 Input만 추가)
if (!content.includes("import { Input }") && !content.includes("from '../../components/unified/Input'")) {
  // Button import 찾기
  const buttonImportMatch = content.match(/import { Button } from '\.\.\/\.\.\/components\/unified\/Button'/);
  if (buttonImportMatch) {
    // Button import 뒤에 Input import 추가
    content = content.replace(
      buttonImportMatch[0],
      buttonImportMatch[0] + "\nimport { Input } from '../../components/unified/Input'"
    );
  }
}

// 닉네임 input
content = content.replace(
  /<input\s+type="text"\s+name="nickname"\s+value=\{profileForm\.nickname\}\s+onChange=\{handleInputChange\}\s+placeholder="닉네임"\s*\/>/g,
  `<Input 
                        type="text" 
                        name="nickname"
                        value={profileForm.nickname}
                        onChange={handleInputChange}
                        placeholder="닉네임"
                      />`
);

// 전화번호 input
content = content.replace(
  /<input\s+type="tel"\s+name="phone"\s+value=\{profileForm\.phone\}\s+onChange=\{handleInputChange\}\s+placeholder="전화번호"\s*\/>/g,
  `<Input 
                        type="tel" 
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleInputChange}
                        placeholder="전화번호"
                      />`
);

// 회사 input
content = content.replace(
  /<input\s+type="text"\s+name="company"\s+value=\{profileForm\.company\}\s+onChange=\{handleInputChange\}\s+placeholder="회사명"\s*\/>/g,
  `<Input 
                        type="text" 
                        name="company"
                        value={profileForm.company}
                        onChange={handleInputChange}
                        placeholder="회사명"
                      />`
);

// 부서 input
content = content.replace(
  /<input\s+type="text"\s+name="department"\s+value=\{profileForm\.department\}\s+onChange=\{handleInputChange\}\s+placeholder="부서명"\s*\/>/g,
  `<Input 
                        type="text" 
                        name="department"
                        value={profileForm.department}
                        onChange={handleInputChange}
                        placeholder="부서명"
                      />`
);

// 친구 검색 input
content = content.replace(
  /<input\s+type="text"\s+placeholder="이름 또는 이메일로 검색"\s+value=\{searchQuery\}\s+onChange=\{\(e\)\s*=>\s*setSearchQuery\(e\.target\.value\)\}\s+onKeyPress=\{handleSearchKeyPress\}\s*\/>/g,
  `<Input 
                        type="text" 
                        placeholder="이름 또는 이메일로 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                      />`
);

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ MyPage.jsx Input 마이그레이션 완료');
console.log('- 닉네임 input 변환');
console.log('- 전화번호 input 변환');
console.log('- 회사 input 변환');
console.log('- 부서 input 변환');
console.log('- 친구 검색 input 변환');