const fs = require('fs');
const path = require('path');

console.log('\n=== VideoPlanet 오류 케이스 스캐너 ===\n');

const issues = {
  alerts: [],
  validations: [],
  apiPaths: [],
  buttons: [],
  fileUploads: [],
  errorHandling: []
};

// 파일 검색 함수
function scanDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      scanDirectory(filePath, callback);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      callback(filePath);
    }
  });
}

// 파일 내용 검사
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileName = path.relative('/home/winnmedia/VideoPlanet/vridge_front/src', filePath);
  
  lines.forEach((line, index) => {
    // 1. window.alert 또는 alert 사용
    if ((line.includes('window.alert(') || line.includes(' alert(')) && !line.includes('//')) {
      issues.alerts.push({
        file: fileName,
        line: index + 1,
        code: line.trim()
      });
    }
    
    // 2. 입력값 검증 시 trim() 누락
    if (line.match(/if\s*\(\s*!?\s*\w+\.(name|email|title|description|password|value)\s*[)&|]/) && 
        !line.includes('trim()') && !line.includes('?.trim')) {
      issues.validations.push({
        file: fileName,
        line: index + 1,
        code: line.trim(),
        issue: 'trim() 없는 입력값 검증'
      });
    }
    
    // 3. 잘못된 API 경로 패턴
    if (line.includes('/api/')) {
      // projects 대신 project 사용
      if (line.match(/\/api\/project\/[^s]/)) {
        issues.apiPaths.push({
          file: fileName,
          line: index + 1,
          code: line.trim(),
          issue: '/api/project/ (s 누락)'
        });
      }
      // feedbacks 대신 feedback 사용
      if (line.match(/\/api\/feedback\/[^s]/) || line.match(/\/api\/feedback$/)) {
        issues.apiPaths.push({
          file: fileName,
          line: index + 1,
          code: line.trim(),
          issue: '/api/feedback/ (s 누락)'
        });
      }
    }
    
    // 4. onClick 없는 버튼 (단순 검사)
    if (line.includes('<button') && !line.includes('type="submit"')) {
      // 다음 5줄 내에 onClick이 있는지 확인
      let hasOnClick = false;
      for (let j = 0; j < 5 && (index + j) < lines.length; j++) {
        if (lines[index + j].includes('onClick')) {
          hasOnClick = true;
          break;
        }
      }
      if (!hasOnClick && !line.includes('disabled')) {
        issues.buttons.push({
          file: fileName,
          line: index + 1,
          code: line.trim()
        });
      }
    }
    
    // 5. 파일 업로드 크기 제한 없음
    if (line.includes('type="file"') || line.includes('type=\'file\'')) {
      // 앞뒤 20줄에서 파일 크기 체크 확인
      let hasSizeCheck = false;
      for (let j = Math.max(0, index - 20); j < Math.min(lines.length, index + 20); j++) {
        if (lines[j].includes('size') && (lines[j].includes('MB') || lines[j].includes('maxSize'))) {
          hasSizeCheck = true;
          break;
        }
      }
      if (!hasSizeCheck) {
        issues.fileUploads.push({
          file: fileName,
          line: index + 1,
          code: line.trim(),
          issue: '파일 크기 제한 체크 없음'
        });
      }
    }
    
    // 6. catch 블록에서 console.error만 사용
    if (line.includes('catch') && lines[index + 1] && lines[index + 1].includes('console.error') &&
        !lines[index + 2].includes('toast') && !lines[index + 2].includes('alert') && 
        !lines[index + 2].includes('showError')) {
      issues.errorHandling.push({
        file: fileName,
        line: index + 1,
        code: lines[index + 1].trim(),
        issue: '사용자에게 에러 알림 없음'
      });
    }
  });
}

// 스캔 시작
const srcDir = '/home/winnmedia/VideoPlanet/vridge_front/src';
scanDirectory(srcDir, scanFile);

// 결과 출력
console.log('🔍 발견된 오류 케이스:\n');

console.log(`1. window.alert 사용 (${issues.alerts.length}개)`);
if (issues.alerts.length > 0) {
  issues.alerts.slice(0, 5).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
    console.log(`      ${issue.code}`);
  });
  if (issues.alerts.length > 5) {
    console.log(`   ... 외 ${issues.alerts.length - 5}개`);
  }
}

console.log(`\n2. 입력값 검증 시 trim() 누락 (${issues.validations.length}개)`);
if (issues.validations.length > 0) {
  issues.validations.slice(0, 5).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
    console.log(`      ${issue.code}`);
  });
  if (issues.validations.length > 5) {
    console.log(`   ... 외 ${issues.validations.length - 5}개`);
  }
}

console.log(`\n3. 잘못된 API 경로 (${issues.apiPaths.length}개)`);
if (issues.apiPaths.length > 0) {
  issues.apiPaths.slice(0, 5).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line} - ${issue.issue}`);
    console.log(`      ${issue.code}`);
  });
  if (issues.apiPaths.length > 5) {
    console.log(`   ... 외 ${issues.apiPaths.length - 5}개`);
  }
}

console.log(`\n4. onClick 없는 버튼 (${issues.buttons.length}개)`);
if (issues.buttons.length > 0) {
  issues.buttons.slice(0, 5).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
    console.log(`      ${issue.code}`);
  });
  if (issues.buttons.length > 5) {
    console.log(`   ... 외 ${issues.buttons.length - 5}개`);
  }
}

console.log(`\n5. 파일 업로드 크기 제한 없음 (${issues.fileUploads.length}개)`);
if (issues.fileUploads.length > 0) {
  issues.fileUploads.slice(0, 5).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line}`);
    console.log(`      ${issue.code}`);
  });
  if (issues.fileUploads.length > 5) {
    console.log(`   ... 외 ${issues.fileUploads.length - 5}개`);
  }
}

console.log(`\n6. 에러 처리 미흡 (${issues.errorHandling.length}개)`);
if (issues.errorHandling.length > 0) {
  issues.errorHandling.slice(0, 5).forEach(issue => {
    console.log(`   📍 ${issue.file}:${issue.line} - ${issue.issue}`);
    console.log(`      ${issue.code}`);
  });
  if (issues.errorHandling.length > 5) {
    console.log(`   ... 외 ${issues.errorHandling.length - 5}개`);
  }
}

// 요약
console.log('\n📊 요약:');
const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
console.log(`   총 ${totalIssues}개의 잠재적 오류 케이스 발견`);

// 상세 보고서 저장
const report = {
  scannedAt: new Date().toISOString(),
  summary: {
    total: totalIssues,
    alerts: issues.alerts.length,
    validations: issues.validations.length,
    apiPaths: issues.apiPaths.length,
    buttons: issues.buttons.length,
    fileUploads: issues.fileUploads.length,
    errorHandling: issues.errorHandling.length
  },
  details: issues
};

fs.writeFileSync(
  path.join(__dirname, 'error-case-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n💾 상세 보고서가 error-case-report.json에 저장되었습니다.');