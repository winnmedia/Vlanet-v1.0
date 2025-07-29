# 🔍 스냅샷 실패 자동 분석 가이드

## 스냅샷 실패 카테고리

### 1. 🎨 의도된 디자인 변경
**증상**: 
- 전체적인 레이아웃이나 색상이 일관되게 변경됨
- 여러 스냅샷에서 동일한 패턴의 변경 발생

**대응**:
```bash
# 스냅샷 업데이트
npm run test:update

# 특정 테스트만 업데이트
npm run test:update -- --grep "home"
```

### 2. 📱 반응형 레이아웃 이슈
**증상**:
- 특정 뷰포트에서만 실패
- 요소가 화면 밖으로 벗어남
- 겹침 현상 발생

**확인 코드**:
```javascript
// 문제가 되는 요소 찾기
const element = page.locator('.problem-element');
const box = await element.boundingBox();
console.log('Element position:', box);
```

### 3. 🔤 폰트 로딩 문제
**증상**:
- 텍스트 크기나 줄바꿈이 다름
- 폰트가 기본 폰트로 표시됨

**해결 방법**:
```javascript
// stabilize.ts에 폰트 대기 추가
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500); // 추가 대기
```

### 4. ⏱️ 애니메이션/트랜지션
**증상**:
- 요소가 중간 상태에서 캡처됨
- 호버 효과가 남아있음

**해결 방법**:
```javascript
// 애니메이션 완전 비활성화
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
  `
});
```

### 5. 📊 동적 데이터
**증상**:
- 시간, 날짜가 다름
- 랜덤 ID나 값이 변경됨
- API 응답이 다름

**해결 방법**:
```javascript
// 데이터 모킹
await page.route('**/api/**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify(mockData)
  });
});
```

### 6. 🌐 네트워크 리소스
**증상**:
- 이미지가 로드되지 않음
- 외부 리소스 차단됨

**해결 방법**:
```javascript
// 이미지 대체
await page.route('**/*.{png,jpg,jpeg}', route => {
  route.fulfill({
    path: 'tests/fixtures/placeholder.png'
  });
});
```

## 자동 분석 스크립트

```javascript
// analyze-snapshot-failure.js
const fs = require('fs');
const path = require('path');

function analyzeFailure(testName, diffPath) {
  const categories = {
    layout: ['position', 'size', 'margin', 'padding'],
    color: ['background', 'color', 'border'],
    text: ['font', 'line-height', 'letter-spacing'],
    responsive: ['width', 'height', 'overflow'],
  };
  
  // diff 이미지 분석 로직
  console.log(`\n📸 Analyzing: ${testName}`);
  console.log('Possible causes:');
  
  // 1. 파일 크기로 변경 규모 추정
  const stats = fs.statSync(diffPath);
  if (stats.size > 100000) {
    console.log('- Major layout change detected');
  }
  
  // 2. 테스트 이름으로 카테고리 추정
  if (testName.includes('mobile')) {
    console.log('- Responsive design issue');
  }
  
  if (testName.includes('hover') || testName.includes('focus')) {
    console.log('- Interactive state issue');
  }
  
  // 3. 권장 조치
  console.log('\nRecommended actions:');
  console.log('1. Review the diff image');
  console.log('2. Check recent CSS changes');
  console.log('3. Verify media queries');
}
```

## CI/CD 자동 분석 설정

```yaml
# .github/workflows/analyze-snapshots.yml
- name: Analyze failed snapshots
  if: failure()
  run: |
    echo "## 📸 Snapshot Failure Analysis" >> $GITHUB_STEP_SUMMARY
    
    # 실패한 스냅샷 찾기
    for diff in $(find . -name "*-diff.png"); do
      testname=$(basename $diff -diff.png)
      echo "### $testname" >> $GITHUB_STEP_SUMMARY
      
      # 카테고리 분석
      if [[ $testname == *"mobile"* ]]; then
        echo "- 📱 Responsive issue detected" >> $GITHUB_STEP_SUMMARY
      fi
      
      if [[ $testname == *"button"* ]] || [[ $testname == *"hover"* ]]; then
        echo "- 🎯 Interactive element change" >> $GITHUB_STEP_SUMMARY
      fi
      
      # 관련 코드 변경사항 찾기
      echo "#### Related changes:" >> $GITHUB_STEP_SUMMARY
      git diff --name-only HEAD~1 | grep -E "(scss|css|jsx|tsx)" | head -5 >> $GITHUB_STEP_SUMMARY
    done
```

## 디버깅 팁

### 1. 로컬에서 CI 환경 재현
```bash
# CI와 동일한 환경 설정
export CI=true
export NODE_ENV=test
npm run test:visual -- --project=chromium
```

### 2. 특정 테스트만 실행
```bash
# 실패한 테스트만 실행
npm run test -- --grep "failing-test-name"

# 디버그 모드로 실행
npm run test:ui
```

### 3. 스냅샷 비교 도구
```bash
# 이미지 비교 도구 설치
npm install -g reg-cli

# 스냅샷 비교
reg-cli actual.png expected.png diff.png -R report.html
```

## 일반적인 해결 방법

### CSS 변경으로 인한 실패
```diff
# 최근 CSS 변경사항 확인
git diff HEAD~1 -- "*.scss" "*.css"

# 특정 커밋 이후 변경사항
git diff abc123..HEAD -- "*.scss"
```

### 반응형 문제
```javascript
// 뷰포트별 테스트
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 }
];

for (const vp of viewports) {
  await page.setViewportSize(vp);
  // 각 뷰포트에서 문제 확인
}
```

### 플랫폼별 차이
```javascript
// OS별 폰트 차이 해결
await page.addStyleTag({
  content: `
    * { 
      font-family: Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `
});
```

## 스냅샷 관리 Best Practices

1. **작은 단위로 스냅샷 생성**
   - 전체 페이지보다는 컴포넌트 단위
   - 변경 가능성이 낮은 부분만 선택

2. **동적 콘텐츠 제외**
   ```javascript
   await page.locator('.dynamic-content').evaluate(el => {
     el.style.visibility = 'hidden';
   });
   ```

3. **의미 있는 스냅샷 이름**
   ```javascript
   await expect(page).toHaveScreenshot('button-primary-hover-state.png');
   ```

4. **정기적인 스냅샷 정리**
   ```bash
   # 사용하지 않는 스냅샷 찾기
   find . -name "*.png" -mtime +30 -print
   ```