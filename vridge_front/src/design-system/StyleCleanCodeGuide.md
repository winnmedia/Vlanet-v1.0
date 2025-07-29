# VideoPlanet 스타일 클린 코드 가이드

## 1. 중복 파일을 만들지 않기 위한 실전 가이드

### 문제의 근본 원인
1. **두려움**: 기존 코드를 수정하면 다른 곳이 깨질까 두려워함
2. **가시성 부족**: 어떤 스타일 파일이 이미 있는지 모름
3. **소통 부재**: 팀원이 이미 만든 컴포넌트를 모름
4. **프로세스 부재**: 스타일 작업 시 따라야 할 명확한 절차 없음

### 해결책: 3단계 프로세스

#### Step 1: 검색 (5분)
```bash
# 1. 기능명으로 검색
grep -r "button" src/**/*.scss
grep -r "feedback" src/**/*.scss

# 2. 유사 단어로 검색
grep -r "btn\|button\|action" src/**/*.scss

# 3. 색상/스타일로 검색
grep -r "#1631F8" src/**/*.scss  # 주요 색상
grep -r "44px" src/**/*.scss      # 버튼 높이
```

#### Step 2: 분석 (10분)
- 찾은 파일들을 열어서 실제로 확인
- 비슷한 기능인지 판단
- 수정 가능한지 확인

#### Step 3: 결정 (5분)
```
┌─────────────────────────┐
│ 기존 파일이 있는가?      │
└────────┬────────────────┘
         │ Yes
         ▼
┌─────────────────────────┐
│ 수정 가능한가?          │
└────────┬────────────────┘
         │ Yes (90%)
         ▼
┌─────────────────────────┐
│ 기존 파일 수정          │
└─────────────────────────┘
```

## 2. 실제 사례로 배우는 클린 코드

### 나쁜 예시 ❌
```
src/css/
├── FeedbackPage.scss          # 원본
├── FeedbackPageFix.scss       # 버그 수정?
├── FeedbackPageRedesign.scss  # 리디자인?
├── FeedbackPageFinal.scss     # 최종?
├── FeedbackPageNew.scss       # 새로운?
└── FeedbackPageV2.scss        # 버전2?
```

**왜 나쁜가?**
- 어떤 파일이 현재 사용 중인지 모름
- 각 파일의 차이점을 알 수 없음
- 삭제하기 두려워 계속 쌓임

### 좋은 예시 ✅
```
src/design-system/
└── pages/
    └── Feedback/
        ├── Feedback.module.scss    # 단일 파일
        ├── Feedback.tsx
        └── README.md              # 변경 이력 문서화
```

**왜 좋은가?**
- 하나의 명확한 파일
- Git으로 버전 관리
- 변경 이력은 커밋 메시지로

## 3. 스타일 작성 시 체크리스트

### 작업 시작 전 (필수)
- [ ] 관련 스타일 파일 검색했는가?
- [ ] 디자인 시스템 확인했는가?
- [ ] 팀원에게 물어봤는가?

### 코드 작성 중
- [ ] 디자인 토큰 사용했는가?
- [ ] !important 없는가?
- [ ] CSS 모듈 사용했는가?

### 커밋 전
- [ ] 중복 코드 없는가?
- [ ] 하드코딩 값 없는가?
- [ ] 불필요한 주석 없는가?

## 4. 안티패턴과 해결책

### 안티패턴 1: "일단 새 파일"
```scss
// ❌ FeedbackButtonNew.scss
.feedback-button-new {
  background: #1631F8;  // 기존과 같은 색상
  height: 44px;         // 기존과 같은 높이
  // ... 90% 동일한 코드
}
```

**해결책**: 기존 Button.scss에 variant 추가
```scss
// ✅ Button.module.scss
.button {
  &.feedback {
    // 피드백 전용 스타일만 추가
  }
}
```

### 안티패턴 2: "Fix 파일 생성"
```scss
// ❌ HeaderFix.scss
.header {
  z-index: 9999 !important;  // 급한 수정
}
```

**해결책**: 원본 파일 수정
```scss
// ✅ Header.module.scss
.header {
  z-index: $z-header;  // 토큰 사용
}
```

### 안티패턴 3: "전역 오버라이드"
```scss
// ❌ GlobalOverride.scss
* {
  box-sizing: border-box !important;
}

.some-library-class {
  display: none !important;
}
```

**해결책**: 스코프 제한
```scss
// ✅ App.module.scss
.app {
  * {
    box-sizing: border-box;
  }
  
  :global(.some-library-class) {
    display: none;
  }
}
```

## 5. 팀 차원의 예방책

### 코드 리뷰 문화
1. **스타일 PR 템플릿**
   ```
   ## 스타일 변경 사항
   - [ ] 기존 파일 검색 완료
   - [ ] 새 파일이 필요한 이유: ___
   - [ ] 영향받는 컴포넌트: ___
   ```

2. **리뷰어 체크포인트**
   - 중복 파일 여부
   - 디자인 토큰 사용
   - !important 사용 여부

### 주간 스타일 정리
- 매주 금요일 30분
- 중복 파일 찾기
- 사용하지 않는 스타일 제거
- 리팩토링 대상 선정

### 문서화
```markdown
# 스타일 변경 로그

## 2025-01-28
- FeedbackPage 스타일 통합 (6개 → 1개)
- 이유: 중복 제거
- 영향: 피드백 페이지 전체

## 2025-01-27
- Button 컴포넌트 통합 (10개 → 1개)
- 이유: 일관성 개선
- 영향: 전체 버튼
```

## 6. 도구 활용

### VSCode 확장
- **CSS Peek**: 스타일 정의 바로 가기
- **SCSS IntelliSense**: 변수 자동완성
- **Stylelint**: 규칙 검사

### 스크립트
```json
// package.json
{
  "scripts": {
    "style:check": "stylelint src/**/*.scss",
    "style:duplicates": "node scripts/find-duplicates.js",
    "style:unused": "node scripts/find-unused.js"
  }
}
```

### Git Hooks
```bash
# .husky/pre-commit
#!/bin/sh
npm run style:check
npm run style:duplicates
```

## 7. 마인드셋 변화

### Before 🚫
- "혹시 깨질까봐 새 파일 만들자"
- "일단 !important로 해결하자"
- "나중에 정리하자"

### After ✅
- "기존 파일을 개선하자"
- "CSS 특정성으로 해결하자"
- "지금 바로 정리하자"

## 8. 골든 룰

1. **Fix First**: 새 파일보다 기존 파일 수정 우선
2. **Token First**: 하드코딩보다 토큰 우선
3. **Module First**: 전역 스타일보다 모듈 우선
4. **Test First**: 수정 전 영향 범위 테스트
5. **Document First**: 변경 이유 문서화

## 9. 지속적인 개선

### 월간 리뷰
- 스타일 파일 증가율
- 중복 코드 비율
- !important 사용률
- 하드코딩 비율

### 분기별 목표
- Q1: 스타일 파일 50% 감소
- Q2: !important 0% 달성
- Q3: 100% 토큰 사용
- Q4: 완전한 모듈화

## 10. 결론

클린한 스타일 코드는 한 번에 이루어지지 않습니다. 하지만 매일 조금씩 개선하면:
- 개발 속도 향상
- 버그 감소
- 팀 협업 개선
- 유지보수 비용 절감

**Remember**: "오늘의 리팩토링이 내일의 시간을 절약한다"