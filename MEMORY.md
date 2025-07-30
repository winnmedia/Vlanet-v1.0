# VideoPlanet 개발 기록 (MEMORY.md)

## 프로젝트 구조

```
VideoPlanet/
├── vridge_front/                 # 프론트엔드 (Next.js)
│   ├── components/              # React 컴포넌트
│   │   ├── unified/            # 통합 UI 컴포넌트
│   │   │   ├── UnifiedButton.jsx
│   │   │   ├── UnifiedInput.jsx
│   │   │   ├── UnifiedCard.jsx
│   │   │   └── UnifiedModal.jsx
│   │   ├── minimal/            # 미니멀 디자인 컴포넌트
│   │   └── ui/                 # 기본 UI 컴포넌트
│   ├── pages/                   # Next.js 페이지
│   │   ├── _app.js
│   │   ├── index.js
│   │   └── style-comparison.disabled/
│   ├── src/
│   │   ├── page/               # 페이지 컴포넌트
│   │   │   ├── Cms/           # CMS 관련 페이지
│   │   │   ├── User/          # 사용자 관련 페이지
│   │   │   └── Admin/         # 관리자 페이지
│   │   ├── components/         # 공통 컴포넌트
│   │   ├── tasks/              # 기능별 컴포넌트
│   │   ├── styles/             # 글로벌 스타일
│   │   │   ├── design-system.scss
│   │   │   ├── _design-tokens.scss
│   │   │   ├── _variables.scss
│   │   │   └── global.scss
│   │   └── design-system/      # 디자인 시스템
│   │       ├── tokens/         # 디자인 토큰
│   │       │   ├── _breakpoints.scss
│   │       │   ├── _colors.scss
│   │       │   ├── _typography.scss
│   │       │   ├── _spacing.scss
│   │       │   ├── _effects.scss
│   │       │   └── _index.scss
│   │       ├── accessibility/  # 접근성 스타일
│   │       └── components/     # 컴포넌트 스타일
│   ├── scripts/                 # 자동화 스크립트
│   │   ├── migration/          # 마이그레이션 도구
│   │   │   ├── fix-jsx-syntax-errors.js
│   │   │   └── fix-additional-jsx-errors.js
│   │   └── analysis/           # 분석 도구
│   ├── tests/                   # 테스트 파일 (148개 이상)
│   ├── public/                  # 정적 파일
│   ├── package.json            # 프론트엔드 버전
│   ├── next.config.js
│   └── .vercelignore           # Vercel 배포 제외 파일
│
└── vridge_back/                 # 백엔드 (Django)
    ├── config/                  # Django 설정
    ├── projects/                # 프로젝트 앱
    ├── users/                   # 사용자 앱
    ├── feedbacks/               # 피드백 앱
    ├── video_planning/          # 영상기획 앱
    ├── manage.py
    └── requirements.txt
```

## 기술 스택
- **프론트엔드**: React 18.3.1, Next.js 15.4.2
- **스타일링**: SCSS, CSS Modules
- **상태관리**: Redux, Zustand
- **UI 라이브러리**: Ant Design 5.26.6
- **비디오**: Video.js 8.23.3, Vidstack
- **테스팅**: Jest, React Testing Library, Playwright
- **빌드/배포**: Vercel
- **백엔드**: Django 4.x (Railway 배포)
- **데이터베이스**: PostgreSQL
- **캐시**: Redis
- **프론트엔드 버전**: v2.1.17 (2025-07-30)
- **백엔드 버전**: v1.0.30 (2025-07-28)

## 주요 URL
- **프로덕션**: https://vlanet-v10.vercel.app
- **GitHub**: https://github.com/winnmedia/Vlanet-v1.0
- **API**: Railway 배포 Django 서버

## 개발 히스토리

### 2025-07-30: JSX 구문 오류 수정 (v2.1.17)
**문제 해결:**
- ProjectView-fixed.jsx: 누락된 닫는 div 태그 추가
- VideoPlanning.jsx: Button onClick 속성 누락 수정
- MyPage.jsx: UnifiedCard 닫는 태그 수정
- Signup.jsx: UnifiedInput 태그 속성 정리 및 onFocus 추가
- AuthEmail.jsx: UnifiedButton 닫는 태그 불일치 수정

### 2025-07-30: JSX 구문 오류 체계적 수정 (v2.1.16)
**날짜**: 2025년 7월 30일
**시간**: 오후 1:00
**요청**: Vercel 빌드에서 반복되는 JSX 구문 오류 5개 파일 수정
**버전**: 2.1.15 → 2.1.16

#### 수정된 오류들

1. **ProjectView-fixed.jsx:481**
   - 문제: 멤버 초대 모달 주석이 잘못된 위치에 있어 JSX 구문 오류 발생
   - 해결: 들여쓰기를 맞춰 주석이 올바른 위치에 오도록 수정

2. **VideoPlanning.jsx:2045**
   - 문제: `onChange={(e) = aria-label="..." /> setPlanningTitle(...)}` 잘못된 구문
   - 해결: onChange와 aria-label을 분리하여 올바른 속성으로 배치

3. **MyPage.jsx (3개 오류)**
   - 849, 876번 라인: `<Button variant="secondary" aria-label="Click"> navigate(...)` onClick 누락
   - 950번 라인: `onChange={(e) = aria-label="..." /> setFriendSearchQuery(...)` 잘못된 구문
   - 해결: onClick 속성 추가, onChange와 aria-label 분리

4. **Signup.jsx:487**
   - 문제: UnifiedInput 태그가 중간에 닫히고 onFocus가 외부에 있는 심각한 구문 오류
   - 해결: 모든 속성을 올바르게 배치하고 onFocus/onBlur 이벤트 핸들러 수정

5. **AuthEmail.jsx:136**
   - 문제: onClick 핸들러가 닫히지 않고 onKeyDown이 그 내부에 포함됨
   - 해결: onClick과 onKeyDown을 별도의 속성으로 분리하고 중복 로직 정리

### 2025-07-29: Vercel 빌드 오류 대규모 수정 (v2.1.12)
**총 작업 시간**: 4시간 이상 (오후 7:40 ~ 11:40)
**버전 히스토리**: v2.1.1 → v2.1.12 (총 11번의 반복 수정)
**총 수정된 오류**: 약 65개

#### 주요 문제 패턴과 해결책

1. **CSS Modules 규칙 위반 (15개 오류)**
   - **문제**: :root 선택자, 전역 HTML 선택자(*, table, input 등) 사용
   - **해결**: 
     - 모든 :root 선택자를 제거하고 CSS 변수는 global.scss로 이동
     - 전역 선택자를 클래스 선택자로 변경
     - CSS Modules는 순수한 클래스/ID 선택자만 허용

2. **JSX 구문 오류 패턴 (30개 오류)**
   - **반복적 문제**: 
     - onClick과 onKeyDown 이벤트 핸들러가 잘못 결합
     - 이중 화살표 함수: `(e) => e.key === 'Enter' && (e) => {...}`
     - aria-label이 다른 속성 내부에 포함

3. **SCSS 변수/함수 오류 (20개 오류)**
   - **문제**: 
     - 정의되지 않은 변수 사용 ($radius-full, $shadow, $color-primary-hover)
     - 잘못된 함수 호출 ($transition-base-bezier())
     - px 단위 누락

### 2025-07-29: UI/UX 95점 목표 달성 작업
**날짜**: 2025년 7월 29일
**시작 점수**: 79/100
**최종 점수**: 93/100
**목표**: 95/100

#### 주요 작업 내용
1. **테스트 커버리지 대폭 확대 (23.8% → 85.5%)**
   - 31개 → 148개 테스트 파일 생성
   - 주요 컴포넌트, 페이지, API 테스트 추가
   - 자동 테스트 생성 스크립트 개발 및 활용
   - 테스트 커버리지 점수 100점 달성

2. **컴포넌트 일관성 향상 (51.4% → 97.9%)**
   - **버튼**: 100% 달성 (UnifiedButton 완전 통합)
   - **입력**: 100% 달성 (textarea, select 포함)
   - **카드**: 91.4% (22개 파일 마이그레이션)
   - **모달**: 100% 달성 (13개 파일 완전 통합)

3. **코드 스플리팅 최적화 (48% → 92%)**
   - 모든 페이지 컴포넌트에 dynamic import 적용
   - pages 디렉토리 100% 코드 스플리팅 달성
   - 성능 점수 77.6점으로 향상

4. **반응형 디자인 개선 (72% → 93.9%)**
   - 92/98 파일에 미디어 쿼리 추가
   - 글로벌 반응형 개선사항 적용
   - 터치 디바이스 및 모바일 최적화

5. **토큰 사용률 향상 (73.8% → 92.5%)**
   - 15,127개 값 토큰화 (전체 16,347개 중)
   - 하드코딩된 색상, 간격, 폰트 크기 제거
   - 디자인 시스템 일관성 강화

6. **코드 품질 개선 (70점 → 90점)**
   - console.log 대부분 제거 (107개 → 19개)
   - !important 사용 최소화 (39개 → 1개)
   - 린터 자동 수정으로 코드 품질 향상

### 2025-07-28: 영상기획 인서트샷 추천 개선 (백엔드 v1.0.30)
#### 문제 상황
- 인서트샷 추천이 3개만 제공되고 추상적임 (예: "감정 표현 샷", "환경 설정 샷")
- 실용적이고 구체적인 예시가 부족하여 촬영 감독이 바로 활용하기 어려움

#### 해결 내용
1. **프롬프트 개선**:
   - 20년 경력 베테랑 촬영 감독 페르소나 설정
   - 카테고리별 구체적인 예시 추가 (감정 표현, 환경/공간, 소품/오브젝트, 시간 경과, 동작 디테일)
   - 각 샷에 촬영 시간(2-5초) 명시
   - 나쁜 예시와 좋은 예시 대비로 구체성 강조

2. **기본 인서트샷 개선**:
   - 장소별 특화 샷 (카페, 사무실, 집 등)
   - 시간대별 특화 샷 (아침, 저녁, 비 오는 날 등)
   - 구체적인 촬영 방법과 시간 포함

#### 기술적 세부사항
- `vridge_back/video_planning/gemini_service.py`의 `generate_insert_shots` 메서드 수정
- 5개의 구체적인 인서트샷 추천으로 확대
- 에러 발생 시에도 맥락에 맞는 구체적인 기본 샷 제공

### 2025-07-28: 영상기획 스토리 프레임워크 동기화 수정 (백엔드 v1.0.29)
#### 문제 상황
- 1단계에서 선택한 스토리 프레임워크(훅-몰입-반전-떡밥 등)가 2단계와 3단계에 반영되지 않고 '기승전결'로만 표시됨

#### 해결 내용
1. **백엔드 수정**:
   - `gemini_service.py`: `generate_stories_from_planning` 함수에서 응답에 planning_options 포함하도록 수정
   - `views.py`: generate_story API 응답에 planning_options 추가
   
2. **프론트엔드 수정**:
   - `VideoPlanning.jsx`: 
     - 스토리 생성 응답에서 planning_options를 상태에 저장
     - 최근 기획 로드 시 story_framework/storyFramework 호환성 처리
     - 3단계 설명에서 선택한 프레임워크 이름 동적으로 표시

#### 기술적 세부사항
- 백엔드는 `story_framework` 키를 사용하고 프론트엔드는 `storyFramework` 키를 사용하는 차이 해결
- 백엔드와 프론트엔드 간 데이터 형식 일관성 확보

### 2025-07-28: UI/UX 95점 목표 작업
**날짜**: 2025년 7월 28일
**목표**: 73점에서 95점으로 상승

#### 주요 개선 영역
1. **토큰 사용률 향상 (60% → 91.8%)**
   - 하드코딩된 색상값 토큰 변환
   - 간격, 폰트 크기 토큰화
   - 자동화 스크립트로 일괄 변환

2. **컴포넌트 일관성 (30% → 60%)**
   - UnifiedButton 마이그레이션
   - UnifiedInput 적용
   - 커스텀 컴포넌트 통합

3. **접근성 개선 (65% → 88%)**
   - aria-label 추가
   - 키보드 내비게이션 지원
   - 스크린 리더 최적화

### 2025-07-24: UI/UX 개선 작업
#### 주요 작업 내용
1. **영상 기획 페이지 개선**
   - 주인공 설정 섹션의 가시성 향상
   - 패딩, 폰트 크기, 여백 증가로 레이아웃 개선

2. **사이드바 개선**
   - 프로젝트 카운트를 텍스트에서 원형 뱃지로 변경
   - 브랜드 컬러(#1631F8) 그라데이션 적용

3. **피드백 페이지 비디오 플레이어 개선**
   - 가로 크기 고정, 세로 반응형 설계
   - 16:9 비율 유지
   - 플레이어 콘솔 섹션 하단 명확히 배치
   - 클릭으로 재생/일시정지 기능 추가
   - 일시정지 시 아이콘 애니메이션 표시

4. **버튼 레이아웃 정리**
   - 플레이어 하단 4개 버튼 반응형 레이아웃 (flex: 1)
   - 일관된 너비와 단일 줄 텍스트 유지
   - AI 피드백 버튼 제거

5. **피드백/코멘트 디자인 개선**
   - 체크마크 표시에서 카드 기반 디자인으로 변경
   - 시간 표시, 사용자 정보, 코멘트 내용 구조화

6. **페이지 구조 개선**
   - 단일 컨테이너 구조로 재구성 (feedback-main)
   - 일관된 크기와 레이아웃 유지

#### 기술적 변경사항
- VideoJsPlayer-fixed 컴포넌트 생성 (video.js CSS import 포함)
- VideoJsPlayer.scss를 CSS 모듈로 변경 (빌드 오류 해결)
- 플레이어와 컨테이너 크기 일치 (600px 고정 높이)

#### 배포 정보
- 버전: 1.0.10 → 1.0.11 → 1.0.12
- Vercel 자동 배포
- GitHub 저장소: winnmedia/Vlanet-v1.0

---

**마지막 업데이트**: 2025-07-30
**최종 버전**: 
- 프론트엔드: v2.1.17
- 백엔드: v1.0.30