# 📝 커밋 메시지 가이드

## 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type (필수)
- **feat**: 새로운 기능 추가
- **fix**: 버그 수정
- **style**: UI/UX 변경 (코드 로직 변경 없음)
- **refactor**: 코드 리팩토링
- **test**: 테스트 추가/수정
- **docs**: 문서 수정
- **chore**: 빌드 프로세스, 라이브러리 업데이트 등

## Scope (선택)
- **ui**: UI 컴포넌트 변경
- **a11y**: 접근성 개선
- **responsive**: 반응형 디자인
- **visual**: 시각적 디자인 변경
- **perf**: 성능 최적화

## Subject (필수)
- 50자 이내로 작성
- 현재형으로 작성 (changed → change)
- 마침표 없음
- 무엇을 했는지 명확하게 설명

## Body (선택)
- 72자마다 줄바꿈
- 무엇을, 왜 변경했는지 설명
- UI 변경의 경우 시각적 변화 설명

## Footer (선택)
- Breaking Changes: `BREAKING CHANGE: 설명`
- 이슈 종료: `Closes #123`
- 스냅샷 업데이트: `Updates snapshots`

## 📌 예시

### UI 컴포넌트 스타일 변경
```
style(ui): 버튼 호버 효과 개선

- 그라데이션 배경색 적용
- 트랜지션 시간 0.3s로 통일
- 포커스 상태 outline 추가

Updates snapshots
```

### 접근성 개선
```
fix(a11y): 모바일 터치 타겟 크기 수정

- 모든 버튼 최소 크기 44x44px로 변경
- 링크 패딩 증가
- 아이콘 버튼 클릭 영역 확대

Closes #456
```

### 반응형 디자인 수정
```
feat(responsive): 태블릿 레이아웃 브레이크포인트 추가

- 768px에서 사이드바 토글 방식 변경
- 그리드 레이아웃 2열로 조정
- 폰트 크기 반응형 스케일 적용
```

### 시각적 회귀 테스트 스냅샷 업데이트
```
test(visual): 홈페이지 스냅샷 업데이트

- 새로운 히어로 섹션 디자인 반영
- 버튼 스타일 변경사항 반영
- 모바일/태블릿/데스크톱 뷰 모두 업데이트

Updates snapshots
```

### 스타일 파일 정리
```
refactor(style): 중복 SCSS 파일 통합

- FeedbackButton 관련 5개 파일을 1개로 통합
- 디자인 토큰 활용도 증가
- !important 사용 제거

BREAKING CHANGE: FeedbackButtonFix.scss 삭제됨
```

## 🚫 피해야 할 커밋 메시지

❌ `fix: 버그 수정`
❌ `update styles`
❌ `WIP`
❌ `스타일 수정함`

## ✅ 좋은 커밋 메시지

✅ `fix(ui): 프로젝트 카드 hover 시 레이아웃 깨짐 수정`
✅ `style(responsive): 모바일에서 사이드바 z-index 충돌 해결`
✅ `feat(a11y): 키보드 네비게이션을 위한 스킵 링크 추가`

## 🎨 UI/UX 관련 커밋 시 필수 확인사항

1. **스냅샷 업데이트 필요한가?**
   - UI 변경이 있다면 `Updates snapshots` 추가
   
2. **접근성 영향이 있는가?**
   - 있다면 scope에 `a11y` 포함
   
3. **반응형 디자인 영향이 있는가?**
   - 있다면 body에 영향받는 뷰포트 명시

4. **디자인 토큰 사용했는가?**
   - 하드코딩된 값이 있다면 body에 명시