# 버튼 스타일 마이그레이션 가이드

## 1. 기존 스타일 → 새 디자인 시스템 매핑

### FeedbackButtonStyles.module.scss → Button 컴포넌트

```jsx
// 기존 코드
<button className={styles.feedbackButtonPrimary}>클릭</button>

// 새 코드
import Button from '@/design-system/components/Button'
<Button variant="primary">클릭</Button>
```

### 주요 클래스 매핑

| 기존 클래스 | 새 컴포넌트 Props |
|------------|------------------|
| feedbackButtonPrimary | variant="primary" |
| feedbackButtonDanger | variant="danger" |
| feedbackButtonSecondary | variant="secondary" |
| feedbackButtonOutline | variant="ghost" + CSS |
| feedbackButtonIconOnly | iconOnly={true} |
| feedbackButtonSmall | size="sm" |
| feedbackButtonPrimaryFull | variant="primary" fullWidth={true} |

### 피드백 액션 버튼

```jsx
// 기존 코드
<button className={`${styles.feedbackAction} ${styles.like}`}>좋아요</button>

// 새 코드
import FeedbackButton from '@/design-system/components/Button/FeedbackButton'
<FeedbackButton feedbackType="like">좋아요</FeedbackButton>
```

## 2. 마이그레이션 단계

1. **Phase 1**: 새 컴포넌트 생성 및 테스트
2. **Phase 2**: 점진적 컴포넌트 교체
3. **Phase 3**: 기존 스타일 파일 제거

## 3. 주의사항

- 시각적 회귀 테스트 필수
- 모든 상태(hover, active, disabled) 확인
- 접근성 속성 유지
- 반응형 동작 검증