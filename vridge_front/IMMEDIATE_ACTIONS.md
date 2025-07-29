# 즉시 실행 작업 목록

## 🚀 Day 1 (오늘) - 사용하지 않는 파일 정리

### 1. 안전하게 삭제 가능한 파일들 (중복/대체됨)

#### ✅ 즉시 삭제 가능 (이미 통합됨)
```bash
# 버튼 관련 (design-system/components/Button으로 통합)
rm src/css/Cms/ButtonAlignment.scss
rm src/css/Cms/ButtonFix.scss
rm src/css/Cms/FeedbackButton.scss
rm src/css/Cms/FeedbackButtons.scss

# 레이아웃 관련 (design-system/layout으로 통합)
rm src/css/Common/LayoutFix.scss
rm src/css/Cms/HomeLayoutFix.scss

# 개선된 버전이 있는 파일들
rm src/css/Cms/InputActivationFix.scss  # InputActivationFix-improved.scss 있음
rm src/css/HomeAlignment.scss          # HomeAlignment-improved.scss 있음
rm src/css/_layout.scss                # _layout-improved.scss 있음
```

#### ⚠️ 확인 후 삭제 (import 확인 필요)
```bash
# 사용 여부 확인
grep -r "ButtonAlignment" src --include="*.tsx" --include="*.jsx" --include="*.scss"
grep -r "InputActivationFix" src --include="*.tsx" --include="*.jsx" --include="*.scss"
```

### 2. Header 컴포넌트 마이그레이션 준비

#### 현재 Header 관련 파일 분석
```bash
# Header 관련 스타일 찾기
find src -name "*[Hh]eader*" -name "*.scss"
grep -r "header" src/css --include="*.scss" | grep -i "class"
```

#### 새로운 Header 컴포넌트 구조
```
src/design-system/components/Header/
├── Header.tsx
├── Header.module.scss
├── HeaderMobile.tsx
└── README.md
```

### 3. 즉시 적용 가능한 개선사항

#### A. package.json 스크립트 추가
```json
{
  "scripts": {
    "style:analyze": "node scripts/analyze-styles.js",
    "style:unused": "node scripts/find-unused-styles.js",
    "style:duplicates": "node scripts/find-duplicate-styles.js",
    "style:clean": "node scripts/clean-styles.js"
  }
}
```

#### B. 스타일 분석 스크립트 생성
```javascript
// scripts/analyze-styles.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// SCSS 파일 분석
const analyzeStyles = () => {
  const files = glob.sync('src/**/*.scss');
  const report = {
    total: files.length,
    byDirectory: {},
    largestFiles: [],
    hardcodedColors: 0,
    importantUsage: 0
  };
  
  // 분석 로직...
  console.log(report);
};

analyzeStyles();
```

### 4. Git 커밋 전략

#### 안전한 삭제를 위한 브랜치 전략
```bash
# 새 브랜치 생성
git checkout -b style-cleanup-phase-1

# 삭제 전 백업 태그
git tag backup-before-cleanup

# 파일별로 개별 커밋
git rm src/css/Cms/ButtonAlignment.scss
git commit -m "style: Remove ButtonAlignment.scss (통합됨: Button.module.scss)"

git rm src/css/Cms/InputActivationFix.scss  
git commit -m "style: Remove InputActivationFix.scss (개선됨: InputActivationFix-improved.scss)"
```

### 5. 영향도 체크리스트

각 파일 삭제 전 확인:
- [ ] 해당 파일을 import하는 곳이 없는가?
- [ ] 대체 파일이 모든 기능을 포함하는가?
- [ ] 빌드가 정상적으로 되는가?
- [ ] 스타일이 깨지지 않는가?

### 6. 오늘의 목표 (4시간)

#### 오전 (2시간)
1. **파일 정리** (1시간)
   - 안전한 파일 10개 삭제
   - Git 커밋 및 푸시
   
2. **분석 도구 설정** (1시간)
   - package.json 스크립트 추가
   - 기본 분석 스크립트 작성

#### 오후 (2시간)
3. **Header 분석** (1시간)
   - 현재 Header 스타일 파악
   - 마이그레이션 계획 수립
   
4. **문서 업데이트** (1시간)
   - STYLE_MIGRATION_TRACKER.md 업데이트
   - 진행 상황 기록

### 7. 빠른 성과 측정

#### Before
- SCSS 파일: 141개
- 중복 버튼 스타일: 16개
- 빌드 시간: 45초

#### After (오늘 목표)
- SCSS 파일: 131개 (-10개)
- 중복 버튼 스타일: 0개 (-16개)
- 빌드 시간: 42초 (-3초)

### 8. 위험 관리

만약 문제가 생기면:
```bash
# 즉시 롤백
git reset --hard backup-before-cleanup

# 또는 개별 파일 복구
git checkout HEAD~1 src/css/Cms/ButtonAlignment.scss
```

---

**시작 시간**: _____
**종료 시간**: _____
**실제 삭제한 파일 수**: _____
**발생한 이슈**: _____