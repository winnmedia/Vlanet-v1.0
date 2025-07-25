# VideoPlanet 프로젝트 구조

## 프로젝트 디렉토리 구조
```
/home/winnmedia/VideoPlanet/
├── vridge_front/              # 프론트엔드 (React/Next.js)
│   ├── src/
│   │   ├── routes/           # 라우팅 설정
│   │   ├── page/             # 페이지 컴포넌트
│   │   │   ├── Cms/          # CMS 관련 페이지
│   │   │   │   ├── ProjectCreate.jsx      # 프로젝트 생성
│   │   │   │   ├── Feedback.jsx           # 피드백 페이지
│   │   │   │   ├── VideoList.jsx          # 영상 목록
│   │   │   │   └── VideoEdit.jsx          # 영상 편집
│   │   │   ├── MyPage/       # 마이페이지 관련
│   │   │   └── Admin/        # 관리자 페이지
│   │   ├── components/       # 공통 컴포넌트
│   │   │   ├── VideoJsPlayer.jsx          # 비디오 플레이어
│   │   │   ├── Header.jsx                 # 헤더
│   │   │   └── Modal/                     # 모달 컴포넌트
│   │   ├── store/            # Redux 상태 관리
│   │   ├── css/              # 스타일시트
│   │   │   ├── Cms/          # CMS 스타일
│   │   │   └── MyPage/       # 마이페이지 스타일
│   │   └── tests/            # 테스트 파일
│   ├── public/               # 정적 파일
│   ├── package.json          # 프론트엔드 의존성
│   └── next.config.js        # Next.js 설정
│
├── vridge_back/               # 백엔드 (Django)
│   ├── config/               # Django 설정
│   │   ├── settings_base.py  # 기본 설정
│   │   ├── settings.py       # 개발 설정
│   │   ├── urls.py           # URL 라우팅
│   │   └── middleware.py     # 커스텀 미들웨어
│   ├── users/                # 사용자 관리 앱
│   │   ├── models.py         # User 모델
│   │   ├── views.py          # 인증 API
│   │   └── serializers.py    # 시리얼라이저
│   ├── projects/             # 프로젝트 관리 앱
│   │   ├── models.py         # Project 모델
│   │   ├── views.py          # 프로젝트 API
│   │   └── views_atomic.py   # 원자적 트랜잭션 뷰
│   ├── feedbacks/            # 피드백 시스템 앱
│   │   ├── models.py         # Feedback 관련 모델
│   │   ├── views.py          # 피드백 API
│   │   └── middleware.py     # 미디어 헤더 처리
│   ├── video_planning/       # 영상 기획 앱
│   │   ├── models.py         # 기획 관련 모델
│   │   ├── views.py          # 기획 API
│   │   └── gemini_service.py # AI 서비스
│   ├── video_analysis/       # 영상 분석 앱
│   │   ├── models.py         # 분석 관련 모델
│   │   └── views.py          # 분석 API
│   ├── admin_dashboard/      # 관리자 대시보드 앱
│   │   ├── models.py         # 대시보드 모델
│   │   └── views.py          # 관리자 API
│   ├── manage.py             # Django 관리 스크립트
│   ├── requirements.txt      # 백엔드 의존성
│   └── start.sh              # 서버 시작 스크립트
│
├── CLAUDE.md                 # AI 개발 지침
├── memory.md                 # 프로젝트 히스토리 (이 파일)
├── README.md                 # 프로젝트 소개
└── .env.example              # 환경변수 예시

```

## 주요 기술 스택
- **프론트엔드**: React 18, Next.js 15, Redux Toolkit, Ant Design, Video.js
- **백엔드**: Django 4.2, Django REST Framework, PostgreSQL, Redis
- **배포**: Vercel (프론트엔드), Railway (백엔드)
- **AI**: Google Gemini API

## 주요 URL
- **프론트엔드**: https://vlanet.net
- **백엔드 API**: https://videoplanet.up.railway.app
- **스테이징**: https://videoplanet-seven.vercel.app

---

# 프로젝트 히스토리 및 기록

## 2025년 1월 25일
### 영상기획 스토리 프레임워크 문제 수정 (v1.0.18)
- **문제**: 1단계에서 선택한 스토리 프레임워크가 2단계에 반영되지 않음
- **해결**: 
  - `gemini_service.py`에 각 프레임워크별 구조 및 JSON 템플릿 구현
  - 5가지 프레임워크 모두 지원: classic, hook_immersion, pixar, save_the_cat, star_moment
  - `_get_framework_structure()`, `_get_framework_json_template()` 메서드 추가

### 비디오 플레이어 업그레이드
- **추가 기능**:
  - 단축키 지원 (videojs-hotkeys 플러그인)
  - 타임라인 마커 (videojs-markers 플러그인)
  - 프레임 단위 이동 (`,` `.` 키)
  - 재생 속도 조절 (Shift + `,` `.`)
  - 마커 추가/제거 (M키, Shift+C)

### 피드백 페이지 UI/UX 개선
- **레이아웃**: 2컬럼 구조 (왼쪽: 플레이어, 오른쪽: 피드백)
- **반응형**: 모바일/태블릿 대응
- **버튼**: 아이콘 전용 디자인
- **기능**: 스크린샷, 답글, 중요 표시 기능 추가

### 마이페이지 UI 버그 수정 (v1.0.19)
- **프로필 이미지 원형 프레임**: 원형 테두리가 보이도록 CSS 강화
- **홈 섹션 토글 버튼**: 원형 디자인으로 변경 (파란색 그라데이션)
- **프로젝트 현황**: 완료된 프로젝트 섹션 제거
- **전체일정 캘린더**: ProjectScheduleSection.scss 임포트 누락 수정
- **서브메뉴**: 프로젝트 개수와 텍스트 사이 여백 추가

### CSS 모듈 빌드 오류 수정
- **문제**: Next.js에서 글로벌 CSS를 컴포넌트에서 직접 임포트 불가
- **해결**: 
  - ProjectScheduleSection.scss를 CSS 모듈(*.module.scss)로 변경
  - 컴포넌트에서 styles 객체로 클래스명 참조하도록 수정
  - _app.js에서 오래된 글로벌 CSS import 제거

## 2025년 1월 24일
### Vercel 프로젝트 정리 가이드 작성
- 여러 개의 Vercel 프로젝트 중 정리 기준 제시
- 프로덕션/스테이징 환경 분리 전략

### 개발 지침 업데이트
- 프로젝트별 특화 가이드라인 추가
- 성능 최적화 전략 문서화
- 테스트 전략 및 모니터링 가이드 추가

## 2025년 1월 25일 (추가 작업)
### UI/UX 개선 작업
- **로그인 로딩 애니메이션 개선**:
  - LoadingAnimation-v2.jsx 수정
  - 이모지 제거, 미니멀한 3개 점 애니메이션으로 변경
  - 투명도 조정 (0.95), 빠른 페이드인 (0.2초)
  
- **홈 대시보드 개선**:
  - 시간 표시 크기: 120px → 140px로 확대
  - 날짜/요일 표시: 24px 크기, font-weight 500으로 개선
  - 완료된 프로젝트 섹션 제거 (ProjectPhaseBoard.jsx)
  
- **영상기획 기능 개선**:
  - 주인공 설정 UI는 이미 잘 구현되어 있음 확인
  - 스토리 프레임워크 표시 개선: 선택된 프레임워크명 동적 표시
  - 인서트 샷 추천 기능 추가:
    - 프론트엔드: generateInsertShots 함수 구현
    - 백엔드: generate_insert_shots API 엔드포인트 추가
    - GeminiService에 generate_insert_shots 메서드 구현
    - 각 씬마다 3개의 인서트 샷 추천
  
- **서브메뉴 UI 개선**:
  - 프로젝트 관리 원형 뱃지에 margin-left: 8px 추가
  - 텍스트와 뱃지 간격 개선

### UI/UX 개선 및 스토리 프레임워크 반영 (v1.0.21)
- **로그인 로딩 애니메이션 개선**:
  - z-index를 999999로 증가하여 겹침 문제 해결
  - Redux 로딩 스택 관리 개선으로 중복 방지
  
- **홈 대시보드 시간/날짜 표시 확대**:
  - 시간 표시: 140px → 160px
  - 날짜/요일 표시: 24px → 28px (font-weight: 600)
  
- **영상기획 개선**:
  - 주인공 설정 UI에 그라데이션 배경 및 강화된 그림자 효과 추가
  - 스토리 프레임워크가 4개 박스에 정확히 반영되도록 수정
  - getStageLabel/getStageName 함수 추가로 프레임워크별 단계명 표시
  - 인서트 샷 버튼을 "인서트 샷 생성"으로 변경하고 브랜드 색상(#1631F8) 적용
  - "스토리 다시 선택" 버튼을 검정색으로 변경
  
- **백엔드 연결 문제 해결**:
  - .env.local의 API URL을 production 주소로 수정
  - localhost:8000 → https://videoplanet.up.railway.app

### API 경로 수정 및 UI 개선 (v1.0.22)
- **API 경로 수정**:
  - 모든 auth.js API 경로에 /api 접두사 추가
  - 로그인 404 오류 해결 (/users/login/ → /api/users/login/)
  
- **UI 개선**:
  - 로그인에서 홈으로 이동 시 로딩 애니메이션 제거
  - _app.js에서 조건부 로딩 표시 구현
  
- **프로젝트 진행 현황 UI 개선**:
  - 토글 버튼을 원형 디자인(32x32px)으로 변경
  - 활성 상태: 파란색 배경(#1631F8)에 흰색 화살표
  - 비활성 상태: 회색 배경(#f5f5f5)에 회색 화살표
  - 제목 스타일 개선 (font-size: 24px, font-weight: 700)

### development_framework 필드 활성화 및 500 에러 해결
- **문제**: 백엔드에서 500 에러 발생 ("데이터베이스 구조 업데이트 중" 메시지)
- **원인**: 
  - models.py에서 development_framework 필드가 주석 처리되어 있었음
  - views.py에서 development_framework를 select_related에서 제외하고 있었음
- **해결**:
  - Project 모델의 development_framework 필드 주석 해제
  - ProjectList 뷰의 select_related에 development_framework 추가
  - 0026 마이그레이션 파일 생성 및 적용
  - Railway 배포를 통해 프로덕션 환경에 마이그레이션 자동 적용

### 로그아웃 및 프로필 이미지 문제 수정
- **로그아웃 무한 경고 문제**:
  - 원인: axios 인터셉터에서 401 에러 시 중복 alert 발생
  - 해결: window._redirecting 플래그로 중복 리다이렉트 방지
  - SideBar 컴포넌트에서 window.location.href 사용하여 직접 이동
  
- **프로필 이미지 표시 문제**:
  - 원인: 잘못된 API URL 사용 (api.vlanet.net)
  - 해결: 모든 프로필 이미지 URL을 videoplanet.up.railway.app로 수정
  - UserAvatar 컴포넌트에 SCSS import 추가
  - util.js, MyPage.jsx의 프로필 이미지 URL 처리 수정

### 보안 및 UI/UX 대규모 개선 (v1.0.20)
- **보안 문제 해결**:
  - 콘솔 로그에서 비밀번호 노출 문제 수정
  - Login.jsx, axios.js, util.js, feedback.js 등에서 민감 정보 로깅 제거
  - 토큰, 비밀번호 등의 민감 데이터 로깅 완전 차단

- **백엔드 CORS 문제 해결**:
  - Railway 환경에서 CORS 설정 강화
  - CustomCORSMiddleware 생성하여 OPTIONS 요청 명시적 처리
  - www.vlanet.net 도메인 추가

- **GitHub Actions 배포 개선**:
  - Vercel GitHub Action v25 사용으로 단순화
  - "spawn sh ENOENT" 오류 해결
  - Root Directory 설정 문제 수정

- **is_important 컬럼 문제 해결**:
  - feedbacks_feedbackcomment 테이블의 누락된 컬럼 문제
  - ensure_is_important_column.py 스크립트 생성
  - apply_feedback_migrations.py로 마이그레이션 순차 적용
  - start.sh에 자동 실행 로직 추가

- **UI/UX 통합 개선**:
  - UnifiedLoading 컴포넌트 생성으로 로딩 애니메이션 통일
  - 홈 화면 토글 버튼 화살표 크기 20x20으로 확대
  - 프로젝트 진행 현황 완료 버튼 클릭 시 파란색 테두리 효과
  - 영상 기획 프레임워크 레이블 수정 (훅/몰입/반전/떡밥)
  - 인서트 샷 5개 추천 및 구체적 내용 요청 기능
  - 캘린더 기능 정상 작동 확인

### 피드백 페이지 UI/UX 개선 시작
- **왼쪽 플레이어 섹션 개선**:
  - FeedbackPageRedesign.scss에 비디오 플레이어 테두리 추가 (2px solid #e9ecef)
  - 배경색 #f8f9fa 및 border-radius 12px 적용
  - Video.js 플레이어 재생 버튼 정중앙 배치 (absolute positioning)
  - 컨트롤바 높이 45px, 버튼 크기 통일
  - 프로그레스 바 색상 브랜드 블루(#1631F8) 적용

- **액션 버튼 그룹 개선**:
  - FeedbackButtonStyles.module.scss의 actionButtonGroup 수정
  - flex-wrap: nowrap으로 한 줄 유지
  - overflow-x: auto 추가로 필요시 가로 스크롤
  - 버튼 크기 자동 조정 (flex: 0 0 auto)
  - 모바일 반응형 대응 (768px 이하에서 텍스트 숨김)

[이전 기록들...]

### 피드백 페이지 UI/UX 전면 개선 (v1.0.23)
- **왼쪽 플레이어 섹션 개선**:
  - 영상 테두리 강화 (3px solid #dee2e6 + 그림자 효과)
  - 재생 버튼 정중앙 배치 완료
  - 비디오 컨트롤바 디자인 개선:
    - 그라데이션 배경 적용
    - 버튼 크기 및 정렬 통일
    - 프로그레스바 브랜드 색상 적용
    - hover 시 시각적 피드백 개선
  - 액션 버튼 그룹 한 줄 유지 (flex-wrap: nowrap, overflow-x: auto)
  - 단축키 가이드 버튼 제거

- **오른쪽 피드백 섹션 개선**:
  - 프로젝트 이름 강조 (22px, font-weight: 700)
  - 정보 버튼 원형 디자인 변경 (36x36px)
  - 시간/내용 입력 필드 레이블 디자인 개선
  - 피드백 리스트 카드 디자인 개선:
    - hover 효과 및 그림자 추가
    - 활성 상태 시 왼쪽 강조 바
    - 아바타 크기 증가 및 그라데이션 배경
  - 피드백 상세 표시 개선 (그라데이션 배경, 강화된 그림자)

## 2025-07-25 - UI/UX 개선 작업

### v1.0.24 - UI/UX 전반적 개선
- **로그인 페이지**:
  - 로그인에서 홈으로 전환 시 로딩 애니메이션 제거 (_app.js에서 이미 구현됨)
  - UnifiedLoading 컴포넌트로 전체 로딩 애니메이션 통일

- **홈 페이지**:
  - 토글 버튼 원형 디자인으로 통일 (CmsHomeImproved.scss)
    - 32x32px 원형 버튼
    - 플러스/마이너스 아이콘 CSS pseudo-elements로 구현
    - 호버 시 파란색 그라데이션 배경
  - 프로젝트 진행 현황 완료 버튼 기능 구현 (ProjectPhaseBoard)
    - complete-btn 클래스 추가
    - onPhaseUpdate 핸들러 매개변수 수정
    - UpdateDate API 연동으로 상태 영속화

- **영상기획 페이지**:
  - 모든 토글 버튼 원형 디자인 통일 (VideoPlanning.jsx, VideoPlanning.scss)
    - planning, stories, scenes 섹션 토글 버튼 모두 collapse-btn 클래스 적용
  - 주인공 설정 입력란 테두리 확인 (이미 2px solid #e9ecef 적용됨)
  - 스토리 전개 박스 라벨 수정
    - 픽사 프레임워크의 "1단계, 2단계..." 레이블 제거
    - getStageLabel 함수에서 픽사는 빈 문자열 반환하도록 수정
  - 스토리 프레임워크 반영 버그 수정
    - generateStories 함수에서 프레임워크별 stage, stage_name 자동 추가
  - 인서트 샷 5개 추천 기능 확인 (이미 구현됨)
  - PDF 내보내기 기능 확인 (ExportModal 컴포넌트에 이미 구현됨)

- **전체 일정**:
  - 캘린더 기능 확인 (Calendar.jsx, CalendarEnhanced.jsx 정상 작동)