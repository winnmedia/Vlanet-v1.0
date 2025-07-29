# VideoPlanet 누락된 핵심 UI 요소 카탈로그

## 1. 홈페이지 정렬 요소 (HomeAlignment.scss)

### Visual 섹션
```scss
// 누락된 핵심 스타일
.visual {
  .txt {
    text-align: left;
    line-height: 1.4;
    br + span {
      display: inline-block;
      margin-top: 0;
    }
    p {
      text-align: left;
      line-height: 1.6;
      margin-top: 30px;
    }
  }
}
```
**영향**: 메인 비주얼 텍스트가 중앙 정렬되거나 라인 높이가 불일치

### Function 섹션
```scss
// 누락된 핵심 스타일
.function {
  .content {
    align-items: center;
    .txt {
      text-align: left;
      > div {
        line-height: 1.4;
        margin-bottom: 20px;
      }
      button {
        margin-top: 30px;
      }
    }
  }
}
```
**영향**: 기능 설명 섹션의 정렬 깨짐, 버튼 간격 불일치

### Identity 섹션 그리드
```scss
// 누락된 핵심 스타일
.identity {
  ul {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
    align-items: start;
  }
}
```
**영향**: 4열 그리드가 깨져 아이콘이 불규칙하게 배치

## 2. 버튼 정렬 시스템 (ButtonAlignment.scss)

### 전역 버튼 정렬
```scss
// 누락된 핵심 스타일
button, .button, [type="button"], [type="submit"] {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  line-height: 1 !important;
  white-space: nowrap;
}
```
**영향**: 모든 버튼의 텍스트가 중앙 정렬되지 않음

### 비디오 플레이어 버튼
```scss
// 누락된 핵심 스타일
.video_player_section {
  .control_btn_wrap {
    gap: 10px;
    button {
      min-width: 40px;
      height: 40px;
      padding: 0 !important;
    }
  }
}
```
**영향**: 재생 컨트롤 버튼 크기와 간격 불일치

## 3. 피드백 페이지 레이아웃

### 피드백 버튼 레이아웃 (FeedbackButtonLayoutFix.scss)
```scss
// 누락된 핵심 스타일
.feedback_wrap {
  .etc_box {
    .flex {
      justify-content: space-between;
      gap: 10px;
      button {
        min-width: 120px;
        height: 40px !important;
      }
    }
  }
}
```
**영향**: 좋아요, 공유 버튼이 불규칙한 크기로 표시

### 피드백 섹션 정렬 (FeedbackLayoutFix.scss)
```scss
// 누락된 핵심 스타일
.feedback_section {
  .comment_list {
    .comment_item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
  }
}
```
**영향**: 댓글 목록의 정렬과 간격이 불규칙

## 4. CMS 페이지 요소

### 프로젝트 카드 정렬 (CmsHomeFix.scss)
```scss
// 누락된 핵심 스타일
.project_list {
  .project_card {
    padding: 24px;
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
  }
}
```
**영향**: 프로젝트 카드 헤더의 제목과 버튼이 정렬되지 않음

### 입력 필드 활성화 (InputActivationFix.scss)
```scss
// 누락된 핵심 스타일
input[type="text"]:focus,
input[type="email"]:focus,
textarea:focus {
  border-color: #1631F8 !important;
  box-shadow: 0 0 0 3px rgba(22, 49, 248, 0.1) !important;
  outline: none !important;
}
```
**영향**: 입력 필드 포커스 시 시각적 피드백 없음

## 5. 캘린더 레이아웃 (CalendarLayout.scss)

```scss
// 누락된 핵심 스타일
.calendar_container {
  .fc-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
  }
  .fc-day-grid-event {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 13px;
  }
}
```
**영향**: 캘린더 툴바와 이벤트 표시가 불규칙

## 복원 우선순위

### 🔴 긴급 (즉시 복원 필요)
1. HomeAlignment - 메인 페이지 첫인상
2. ButtonAlignment - 전체 UX 일관성
3. FeedbackButtonLayoutFix - 핵심 기능 사용성

### 🟡 높음 (1-2일 내)
4. CmsHomeFix - 프로젝트 관리 기능
5. InputActivationFix - 사용자 입력 피드백
6. FeedbackLayoutFix - 피드백 가독성

### 🟢 중간 (3-5일 내)
7. CalendarLayout - 일정 관리 기능
8. 기타 피드백 관련 스타일
9. 영상기획 버튼 레이아웃

## 복원 방법

1. **직접 복원**: 백업에서 핵심 규칙만 추출
2. **토큰 통합**: 하드코딩된 값을 디자인 토큰으로 대체
3. **!important 제거**: CSS 특정성으로 해결
4. **모듈화**: 페이지별로 분리하여 관리