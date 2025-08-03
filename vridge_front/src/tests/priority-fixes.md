# VideoPlanet 우선순위 수정 사항

## 🚨 긴급 수정 필요 (High Priority)

### 1. 파일 업로드 크기 제한 없음 (11개)
**위험도**: 🔴 높음 - 서버 과부하 가능
- `Feedback.jsx`: 1251, 1418번 줄
- `FeedbackPolling.jsx`: 476번 줄
- `FeedbackStable.jsx`: 515, 708번 줄
- `FeedbackAll.jsx`: 2050번 줄
- `ProjectCreate.jsx`: 238번 줄
- `ProjectEdit.jsx`: 453번 줄
- `ImageCropper.jsx`: 154번 줄

**수정 방법**: 
```javascript
// 600MB 제한 추가
const maxSize = 600 * 1024 * 1024;
if (files.size > maxSize) {
  toast.error('파일 크기가 너무 큽니다. 600MB 이하의 파일만 업로드 가능합니다.');
  return;
}
```

### 2. API 에러 처리 미흡 (92개)
**위험도**: 🔴 높음 - 사용자가 오류를 인지하지 못함
- `api/feedback.js`: 35, 56, 75, 140번 줄
- `api/project.js`: 111번 줄
- 기타 API 파일들

**수정 방법**:
```javascript
.catch(error => {
  console.error('API Error:', error);
  toast.error(error.response?.data?.message || '오류가 발생했습니다.');
  throw error;
});
```

### 3. onClick 없는 버튼 (13개)
**위험도**: 🟡 중간 - 기능이 작동하지 않음
- UI 컴포넌트의 버튼들
- 디자인 시스템 컴포넌트

## 🔧 중요 수정 사항 (Medium Priority)

### 1. window.alert 사용 (142개)
**위험도**: 🟡 중간 - UX 저하
- 모든 `window.alert` → `toast` 알림으로 변경
- 특히 인증 관련 알림은 중요

### 2. 입력값 검증 trim() 누락 (2개)
**위험도**: 🟢 낮음 - 공백 입력 가능
- `planning.title` 검증에 `.trim()` 추가

## 📋 수정 우선순위

1. **파일 업로드 크기 제한** - 서버 안정성
2. **API 에러 처리** - 사용자 경험
3. **onClick 없는 버튼** - 기능 정상화
4. **window.alert 교체** - UI/UX 개선
5. **입력값 검증** - 데이터 정확성

## 🎯 예상 효과

- **서버 안정성**: 파일 크기 제한으로 과부하 방지
- **사용자 경험**: 명확한 에러 메시지 제공
- **일관된 UI**: Toast 알림 시스템 통일
- **기능 완성도**: 모든 버튼이 정상 작동

## 📊 수정 후 기대 결과

- 오류 케이스 262개 → 0개
- 사용자 만족도 향상
- 시스템 안정성 증가