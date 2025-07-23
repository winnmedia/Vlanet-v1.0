# VideoPlanet 프로젝트 구조도

## 🏗️ 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         사용자 (브라우저)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    프론트엔드 (React SPA)                         │
│                     https://vlanet.net                           │
│                    (Vercel에서 호스팅)                            │
├─────────────────────────────────────────────────────────────────┤
│  • React 18.2                                                   │
│  • Redux Toolkit (상태 관리)                                     │
│  • React Router v6 (라우팅)                                      │
│  • Ant Design 5.5 (UI 프레임워크)                               │
│  • Axios (HTTP 클라이언트)                                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS/REST API
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      백엔드 (Django)                             │
│              https://videoplanet.up.railway.app                  │
│                   (Railway에서 호스팅)                            │
├─────────────────────────────────────────────────────────────────┤
│  • Django 4.2                                                   │
│  • Django REST Framework                                        │
│  • SimpleJWT (인증)                                             │
│  • Celery (비동기 작업)                                         │
│  • Django Channels (WebSocket)                                  │
└─────────────────────┬─────────────────┬─────────────────────────┘
                      │                 │
                      ▼                 ▼
         ┌────────────────────┐ ┌─────────────────────┐
         │   PostgreSQL DB    │ │      Redis Cache    │
         │    (Railway)       │ │      (Railway)      │
         └────────────────────┘ └─────────────────────┘
```

## 📁 프론트엔드 디렉토리 구조

```
vridge_front/
├── public/
│   ├── index.html
│   └── static/              # 정적 파일
├── src/
│   ├── index.js            # 앱 진입점
│   ├── App.js              # 루트 컴포넌트
│   ├── routes/
│   │   └── AppRoute.js     # 라우팅 설정
│   ├── page/               # 페이지 컴포넌트
│   │   ├── Home.jsx
│   │   ├── User/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── MyPage.jsx
│   │   │   └── ResetPw.jsx
│   │   ├── Cms/
│   │   │   ├── CmsHome.jsx      # 대시보드
│   │   │   ├── ProjectCreate.jsx
│   │   │   ├── ProjectEdit.jsx
│   │   │   ├── ProjectView.jsx
│   │   │   ├── Feedback.jsx
│   │   │   ├── VideoPlanning.jsx
│   │   │   └── Calendar.jsx
│   │   ├── Admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminRedirect.jsx
│   │   │   └── EmailMonitor.jsx
│   │   └── Policy/
│   │       ├── PrivacyPolicy.jsx
│   │       └── TermsOfService.jsx
│   ├── components/         # 재사용 컴포넌트
│   │   ├── PageTemplate.jsx
│   │   ├── SideBar.jsx
│   │   ├── Header.jsx
│   │   ├── LazyWrapper.jsx
│   │   └── SEOHelmet.jsx
│   ├── store/              # Redux 스토어
│   │   ├── index.js
│   │   ├── ProjectStore.js
│   │   └── UserStore.js
│   ├── util/               # 유틸리티
│   │   ├── util.js
│   │   ├── axiosInterceptor.js
│   │   └── navigation.js
│   └── css/               # 전역 스타일
│       └── index.scss
├── package.json
├── vercel.json            # Vercel 배포 설정
└── .env                   # 환경 변수
```

## 📁 백엔드 디렉토리 구조

```
vridge_back/
├── config/                # Django 설정
│   ├── settings_base.py   # 기본 설정
│   ├── settings.py        # 개발 설정
│   ├── urls.py            # 메인 URL 라우팅
│   ├── wsgi.py
│   └── asgi.py
├── users/                 # 사용자 관리 앱
│   ├── models.py          # User, Notification, Friendship
│   ├── views.py           # 인증, 소셜 로그인
│   ├── serializers.py
│   ├── urls.py
│   ├── validators.py      # 입력 검증
│   └── decorators.py      # 인증 데코레이터
├── projects/              # 프로젝트 관리 앱
│   ├── models.py          # Project, Members, Invitation
│   ├── views.py           # CRUD, 초대
│   ├── views_atomic.py    # 원자적 생성
│   ├── serializers.py
│   └── urls.py
├── feedbacks/             # 피드백 시스템 앱
│   ├── models.py          # Feedback, FeedbackFiles
│   ├── views.py           # 피드백 CRUD
│   ├── middleware.py      # 미디어 헤더
│   ├── serializers.py
│   └── urls.py
├── video_planning/        # 영상 기획 앱
│   ├── models.py
│   ├── views.py
│   └── urls.py
├── video_analysis/        # 영상 분석 앱
│   ├── models.py
│   ├── views.py
│   └── urls.py
├── admin_dashboard/       # 관리자 대시보드 앱
│   ├── views.py           # 통계, 관리 API
│   └── urls.py
├── onlines/              # 온라인 상태 앱
│   ├── models.py
│   ├── views.py
│   └── urls.py
├── media/                # 업로드 파일
├── static/               # 정적 파일
├── requirements.txt      # Python 패키지
├── manage.py
├── Procfile             # Railway 배포
└── start.sh             # 시작 스크립트
```

## 🔄 데이터 플로우

```
사용자 액션
    │
    ▼
React Component
    │
    ├─→ Redux Action
    │       │
    │       ▼
    │   Redux Store
    │       │
    │       ▼
    │   Component Update
    │
    ▼
Axios Request
    │
    ▼
Django View
    │
    ├─→ Serializer (검증)
    │
    ├─→ Model (DB 작업)
    │
    ├─→ Cache (Redis)
    │
    ▼
JSON Response
    │
    ▼
Component Update
```

## 🔐 인증 플로우

```
로그인 요청
    │
    ▼
/api/users/login/
    │
    ├─→ 이메일/비밀번호 검증
    │
    ├─→ JWT 토큰 생성
    │   ├── Access Token (15분)
    │   └── Refresh Token (7일)
    │
    ▼
클라이언트 저장
    │
    ├─→ localStorage (토큰)
    │
    └─→ Redux Store (사용자 정보)
```

## 🌐 주요 API 엔드포인트

### 인증 관련
```
POST   /api/users/login/              # 로그인
POST   /api/users/signup/             # 회원가입
POST   /api/users/refresh/            # 토큰 갱신
GET    /api/users/me/                 # 현재 사용자
POST   /api/users/login/kakao/        # 카카오 로그인
POST   /api/users/login/naver/        # 네이버 로그인
POST   /api/users/login/google/       # 구글 로그인
```

### 프로젝트 관련
```
GET    /api/projects/                 # 프로젝트 목록
POST   /api/projects/                 # 프로젝트 생성
GET    /api/projects/:id/             # 프로젝트 상세
PUT    /api/projects/:id/             # 프로젝트 수정
DELETE /api/projects/:id/             # 프로젝트 삭제
POST   /api/projects/invitation/send/ # 초대 발송
```

### 피드백 관련
```
GET    /api/feedbacks/:id/            # 피드백 조회
POST   /api/feedbacks/:id/            # 피드백 생성
PUT    /api/feedbacks/:id/            # 피드백 수정
DELETE /api/feedbacks/:id/            # 피드백 삭제
```

### 관리자 관련
```
GET    /admin-dashboard/stats/        # 통계
GET    /admin-dashboard/users/        # 사용자 관리
GET    /admin-dashboard/projects/     # 프로젝트 관리
GET    /admin-dashboard/feedbacks/    # 피드백 통계
GET    /admin-dashboard/system/       # 시스템 정보
```

## 🚀 배포 구조

```
GitHub Repository
    │
    ├─→ Vercel (프론트엔드)
    │   ├── 자동 빌드
    │   ├── CDN 배포
    │   └── 환경 변수 설정
    │
    └─→ Railway (백엔드)
        ├── 자동 배포
        ├── PostgreSQL
        ├── Redis
        └── 환경 변수 설정
```

## 📊 주요 모델 관계도

```
User (사용자)
 │
 ├─→ Project (1:N) [소유 프로젝트]
 │    │
 │    ├─→ Members (N:M) [프로젝트 멤버]
 │    │
 │    ├─→ Feedback (1:N) [피드백]
 │    │    └─→ FeedbackFiles (1:N) [첨부파일]
 │    │
 │    └─→ ProjectInvitation (1:N) [초대]
 │
 ├─→ Notification (1:N) [알림]
 │
 └─→ Friendship (N:M) [친구 관계]
```

## 🔧 주요 기술 스택

### 프론트엔드
- **프레임워크**: React 18.2
- **상태관리**: Redux Toolkit
- **라우팅**: React Router v6
- **UI**: Ant Design 5.5
- **스타일**: SCSS, Styled Components
- **HTTP**: Axios
- **차트**: @ant-design/plots
- **SEO**: react-helmet-async

### 백엔드
- **프레임워크**: Django 4.2
- **API**: Django REST Framework
- **인증**: SimpleJWT
- **DB**: PostgreSQL
- **캐시**: Redis
- **비동기**: Celery
- **웹소켓**: Django Channels

### 인프라
- **프론트엔드 호스팅**: Vercel
- **백엔드 호스팅**: Railway
- **버전 관리**: Git/GitHub
- **CI/CD**: 자동 배포 (GitHub 연동)

## 🔍 성능 최적화

1. **코드 스플리팅**: React.lazy()로 페이지별 번들 분리
2. **캐싱**: Redis로 API 응답 캐싱
3. **CDN**: Vercel의 글로벌 CDN 활용
4. **압축**: gzip 압축 적용
5. **이미지 최적화**: WebP 포맷 지원

## 🛡️ 보안 조치

1. **HTTPS**: 모든 통신 암호화
2. **JWT**: 상태 없는 인증
3. **CORS**: 허용된 도메인만 접근
4. **입력 검증**: 프론트/백엔드 이중 검증
5. **SQL 인젝션 방지**: ORM 사용
6. **XSS 방지**: 입력 살균화