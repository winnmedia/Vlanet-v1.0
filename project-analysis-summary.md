# VideoPlanet 프로젝트 분석 요약

## 📱 프론트엔드 (React)

### 기술 스택
- **React 18.2** + TypeScript
- **Redux Toolkit** (상태 관리)
- **Ant Design 5.x** (UI 컴포넌트)
- **React Router v6** (라우팅)
- **Axios** (API 통신)
- **SCSS** + Styled Components (스타일링)

### 주요 기능
1. **인증 시스템**
   - 이메일 로그인/회원가입
   - 소셜 로그인 (Google, Kakao, Naver)
   - 비밀번호 재설정
   - JWT 토큰 기반 인증

2. **프로젝트 관리**
   - 프로젝트 생성/수정/삭제
   - 8단계 프로세스 관리
   - 프로젝트 멤버 초대
   - 프로젝트 상태 추적

3. **피드백 시스템**
   - 비디오 업로드 및 스트리밍
   - 타임라인 기반 피드백
   - 실시간 채팅
   - 익명 피드백 지원

4. **관리자 대시보드**
   - 사용자 관리
   - 프로젝트 통계
   - 시스템 모니터링

## 🖥️ 백엔드 (Django)

### 기술 스택
- **Django 4.2.7** + Django REST Framework
- **PostgreSQL** (데이터베이스)
- **Redis** (캐싱 & 세션)
- **Celery** (비동기 작업)
- **JWT** (인증)
- **Gunicorn** (WSGI 서버)

### 주요 Django 앱
1. **users** - 사용자 관리 및 인증
2. **projects** - 프로젝트 관리
3. **feedbacks** - 피드백 시스템
4. **video_analysis** - AI 비디오 분석
5. **onlines** - 온라인 강의

### 데이터베이스 스키마

#### Users 앱
- **User**: 사용자 정보 (이메일, 소셜 로그인 타입)
- **UserProfile**: 프로필 정보 (이미지, 회사, 직책)
- **EmailVerify**: 이메일 인증

#### Projects 앱
- **Project**: 프로젝트 정보
- **프로세스 단계 모델들**: BasicPlan, Storyboard, Filming 등
- **Members**: 프로젝트 멤버 (manager/normal 권한)
- **ProjectInvite**: 초대 링크

#### Feedbacks 앱
- **FeedBack**: 비디오 파일 및 인코딩 정보
- **FeedBackComment**: 피드백 댓글
- **FeedBackMessage**: 채팅 메시지

### 보안 기능
- **입력 검증**: XSS, SQL Injection 방지
- **CORS 설정**: 허용된 도메인만 접근
- **JWT 인증**: 7일 액세스 토큰, 28일 리프레시 토큰
- **Rate Limiting**: API 요청 제한
- **CSRF 보호**: Django CSRF 미들웨어

## 🚀 배포 구조

### 현재 배포 환경
- **프론트엔드**: Vercel (vlanet.net)
- **백엔드**: Railway (videoplanet.up.railway.app)
- **데이터베이스**: PostgreSQL on Railway
- **캐시**: Redis on Railway
- **미디어 저장소**: Railway Volume

### 배포 설정
- Docker 컨테이너 기반
- 자동 마이그레이션 스크립트
- WhiteNoise로 정적 파일 서빙
- 환경 변수 기반 설정 관리

## 🔄 재구축 시 고려사항

### 개선 가능한 부분
1. **마이크로서비스 아키텍처** 고려
2. **TypeScript** 전면 도입
3. **Next.js** 사용으로 SSR/SSG 지원
4. **GraphQL** API 도입 고려
5. **Kubernetes** 기반 배포
6. **CI/CD 파이프라인** 강화
7. **모니터링 시스템** 구축 (Sentry, Prometheus)
8. **테스트 커버리지** 향상

### 유지해야 할 핵심 기능
1. 멀티 소셜 로그인
2. 프로젝트별 8단계 프로세스
3. 실시간 피드백 시스템
4. 비디오 스트리밍 (HLS)
5. 멤버 권한 관리
6. 멱등성 보장된 API

이 분석을 바탕으로 새로운 아키텍처를 설계하고 구현할 수 있습니다.