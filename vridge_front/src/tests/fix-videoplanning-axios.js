// VideoPlanning.jsx의 axios 직접 호출을 axiosCredentials로 변경하는 스크립트
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../page/Cms/VideoPlanning.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// axios 직접 호출을 axiosCredentials로 변경하는 패턴들
const replacements = [
  // GET 요청
  {
    pattern: /await axios\.get\(`\/api\/video-planning\/library\/`\)/g,
    replacement: `await axiosCredentials('get', '/api/video-planning/library/')`
  },
  {
    pattern: /await axios\.get\(`\/api\/video-planning\/library\/\${planningId}\/`\)/g,
    replacement: `await axiosCredentials('get', \`/api/video-planning/library/\${planningId}/\`)`
  },
  {
    pattern: /await axios\.get\(\s*`\/api\/video-planning\/export\/pdf\/\${planningId}\/`,\s*\{ responseType: 'blob' \}\s*\)/g,
    replacement: `await axiosCredentials('get', \`/api/video-planning/export/pdf/\${planningId}/\`, null, { responseType: 'blob' })`
  },
  
  // POST 요청
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/library\/`,\s*\{/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/library/', {`
  },
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/save\/`,\s*planningDataToSave/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/save/', planningDataToSave`
  },
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/generate\/story\/`,\s*\{/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/generate/story/', {`
  },
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/generate\/scenes\/`,\s*\{/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/generate/scenes/', {`
  },
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/generate\/shots\/`,\s*\{/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/generate/shots/', {`
  },
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/generate\/storyboards\/`,\s*\{/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/generate/storyboards/', {`
  },
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/regenerate\/storyboard-image\/`,\s*\{/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/regenerate/storyboard-image/', {`
  },
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/download\/storyboard-image\/`,\s*\{/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/download/storyboard-image/', {`
  },
  {
    pattern: /await axios\.post\(\s*`\/api\/video-planning\/generate\/all-storyboards\/`,\s*\{/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/generate/all-storyboards/', {`
  },
  {
    pattern: /await axios\.post\('\/api\/video-planning\/complete\/', formData, \{\s*headers: \{\s*'Content-Type': 'multipart\/form-data'/g,
    replacement: `await axiosCredentials('post', '/api/video-planning/complete/', formData, {\n        headers: {\n          'Content-Type': 'multipart/form-data'`
  },
  
  // PUT 요청
  {
    pattern: /await axios\.put\(\s*`\/api\/video-planning\/update\/\${currentPlanningId}\/`,\s*planningDataToSave/g,
    replacement: `await axiosCredentials('put', \`/api/video-planning/update/\${currentPlanningId}/\`, planningDataToSave`
  }
];

// 각 패턴을 적용
replacements.forEach(({ pattern, replacement }) => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`Found ${matches.length} matches for pattern:`, pattern.toString());
    content = content.replace(pattern, replacement);
  }
});

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');
console.log('VideoPlanning.jsx has been updated successfully!');