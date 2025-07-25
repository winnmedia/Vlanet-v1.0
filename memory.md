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

[이전 기록들...]