# 버튼 컴포넌트 마이그레이션 가이드

## 🎯 통합 버튼 컴포넌트 사용법

### 기본 사용
```jsx
import { Button } from '@/components/unified/Button';

// Primary 버튼 (기본)
<Button onClick={handleClick}>저장하기</Button>

// Secondary 버튼
<Button variant="secondary">취소</Button>

// Danger 버튼
<Button variant="danger">삭제</Button>
```

### 크기 옵션
```jsx
<Button size="xs">아주 작은 버튼</Button>
<Button size="sm">작은 버튼</Button>
<Button size="md">중간 버튼 (기본)</Button>
<Button size="lg">큰 버튼</Button>
<Button size="xl">아주 큰 버튼</Button>
```

### 상태 관리
```jsx
// 로딩 상태
<Button loading>처리 중...</Button>

// 비활성화
<Button disabled>사용 불가</Button>

// 전체 너비
<Button fullWidth>전체 너비 버튼</Button>
```

### 아이콘 버튼
```jsx
// 아이콘만
<Button icon={<PlusIcon />} />

// 텍스트와 아이콘
<Button icon={<SaveIcon />}>저장</Button>

// 아이콘 위치 변경
<Button icon={<ArrowIcon />} iconPosition="right">다음</Button>
```

## 🔄 마이그레이션 매핑

### 1. FeedbackButtonStyles.module.scss → Button 컴포넌트
```jsx
// Before
<button className={styles.feedbackSubmitBtn}>제출</button>

// After
<Button variant="primary">제출</Button>
```

### 2. VideoPlanning.scss 버튼들
```jsx
// Before (추가 버튼)
<button className="add-framework-btn">+ 추가</button>

// After
<Button variant="secondary" size="sm" icon={<PlusIcon />}>추가</Button>

// Before (저장 버튼)
<button className="save-button">저장</button>

// After
<Button variant="primary">저장</Button>
```

### 3. CMS 버튼들
```jsx
// Before (프로젝트 생성)
<button className="create-project-btn">새 프로젝트</button>

// After
<Button variant="primary" icon={<PlusIcon />}>새 프로젝트</Button>

// Before (업로드 버튼)
<button className="upload-btn">업로드</button>

// After
<Button variant="secondary" icon={<UploadIcon />}>업로드</Button>
```

### 4. 위험 액션 버튼
```jsx
// Before
<button className="delete-btn">삭제</button>
<button className="btn-danger">취소</button>

// After
<Button variant="danger" icon={<TrashIcon />}>삭제</Button>
<Button variant="danger">취소</Button>
```

## 📝 마이그레이션 체크리스트

### Phase 1: 핵심 페이지 (Day 1)
- [ ] Login 페이지 버튼
- [ ] CmsHome 페이지 버튼
- [ ] Feedback 페이지 버튼
- [ ] VideoPlanning 페이지 버튼

### Phase 2: 관리자 페이지 (Day 2)
- [ ] AdminDashboard 버튼
- [ ] ProjectManagement 버튼
- [ ] UserManagement 버튼

### Phase 3: 모달 및 폼 (Day 3)
- [ ] 모든 모달 내 버튼
- [ ] 폼 제출/취소 버튼
- [ ] 드롭다운 액션 버튼

## 🚫 제거해야 할 파일들
마이그레이션 완료 후 삭제:
1. `src/page/Cms/FeedbackButtonStyles.module.scss`
2. `src/css/Common/ButtonAlignment.scss`
3. `src/components/minimal/MinimalButton.module.scss`
4. 기타 버튼 전용 SCSS 파일들

## ✅ 품질 체크리스트
- [ ] 모든 버튼이 통합 컴포넌트 사용
- [ ] 일관된 hover/active 효과
- [ ] 접근성 (focus-visible) 지원
- [ ] 반응형 크기 조정
- [ ] 로딩 상태 표시
- [ ] 아이콘 정렬 일관성

## 🎨 디자인 토큰 활용
통합 버튼은 100% 디자인 토큰을 사용합니다:
- 색상: `$color-*` 토큰
- 간격: `$spacing-*` 토큰
- 테두리: `$border-radius-*` 토큰
- 그림자: `$shadow-*` 토큰
- 애니메이션: `$transition-*` 토큰