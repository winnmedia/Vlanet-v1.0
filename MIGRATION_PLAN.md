# VideoPlanet 마이그레이션 종합 계획서

## 1. 프로젝트 개요

VideoPlanet은 영상 제작 프로젝트 관리 시스템으로, 실시간 피드백, AI 기반 영상 기획, 프로젝트 협업 기능을 제공하는 풀스택 웹 애플리케이션입니다.

### 기술 스택
- **프론트엔드**: React 18, Redux Toolkit, Ant Design, Sass
- **백엔드**: Django 4.2, Django REST Framework
- **데이터베이스**: PostgreSQL
- **캐시**: Redis
- **실시간 통신**: Django Channels (WebSocket)
- **배포**: Railway
- **인증**: JWT (SimpleJWT)

## 2. 시스템 아키텍처

### 2.1 백엔드 구조
```
vridge_back/
├── config/              # Django 설정 및 라우팅
├── users/               # 사용자 관리 (인증, 프로필)
├── projects/            # 프로젝트 관리 (CRUD, 권한)
├── feedbacks/           # 피드백 시스템 (파일, 댓글)
├── video_planning/      # AI 영상 기획 (GPT, DALL-E)
├── video_analysis/      # AI 영상 분석
├── onlines/            # 온라인 비디오 관리
├── admin_dashboard/    # 관리자 대시보드
└── core/               # 공통 유틸리티
```

### 2.2 프론트엔드 구조
```
vridge_front/src/
├── page/               # 페이지 컴포넌트
│   ├── Cms/           # 프로젝트 관리 페이지
│   ├── User/          # 인증 관련 페이지
│   └── Admin/         # 관리자 페이지
├── components/        # 재사용 컴포넌트
├── api/              # API 통신 모듈
├── redux/            # 상태 관리
└── routes/           # 라우팅 설정
```

## 3. 핵심 기능별 마이그레이션 가이드

### 3.1 사용자 인증 시스템

#### 구현 내용
- JWT 토큰 기반 인증 (액세스: 7일, 리프레시: 28일)
- 이메일/비밀번호 및 소셜 로그인 (Google, Kakao, Naver)
- 비밀번호 정책: 8-128자, 3가지 이상 문자 조합
- 세션 쿠키 (HttpOnly) 및 토큰 기반 인증 동시 지원

#### 마이그레이션 체크리스트
- [ ] User 모델 및 CustomUserManager 구현
- [ ] JWT 설정 (SimpleJWT)
- [ ] 로그인/회원가입 API 엔드포인트
- [ ] 이메일 인증 시스템
- [ ] 소셜 로그인 연동
- [ ] 프로필 관리 기능

### 3.2 프로젝트 관리 시스템

#### 데이터 모델
- Project: 프로젝트 기본 정보
- 8단계 프로세스: BasicPlan → VideoDelivery
- Members: 프로젝트별 권한 관리 (manager/normal)
- 멱등성 보장: IdempotencyRecord

#### 마이그레이션 체크리스트
- [ ] 프로젝트 모델 및 8단계 프로세스 모델
- [ ] 원자적 프로젝트 생성 (트랜잭션)
- [ ] 멤버 권한 시스템
- [ ] 프로젝트 초대 기능
- [ ] 파일 첨부 기능
- [ ] 중복 생성 방지 (멱등성)

### 3.3 피드백 시스템

#### 핵심 기능
- 비디오 파일 업로드 (최대 600MB)
- 실시간 WebSocket 채팅
- 타임스탬프 기반 피드백
- 익명 피드백 지원

#### 마이그레이션 체크리스트
- [ ] Feedback 모델 (비디오 메타데이터 포함)
- [ ] 파일 업로드 처리 (600MB 제한)
- [ ] WebSocket 설정 (Django Channels)
- [ ] 실시간 채팅 Consumer
- [ ] 피드백 댓글 시스템
- [ ] 미디어 파일 서빙

### 3.4 AI 영상 기획 시스템

#### 구현 내용
- 5단계 영상 기획 프로세스
- GPT-4 기반 스토리/씬 생성
- DALL-E 3 기반 스토리보드 이미지 생성
- 10가지 이미지 스타일 지원

#### 마이그레이션 체크리스트
- [ ] VideoPlanning 모델
- [ ] OpenAI API 연동
- [ ] 스토리/씬/샷 생성 로직
- [ ] 이미지 생성 및 저장
- [ ] 기획 히스토리 관리

### 3.5 미디어 파일 처리

#### 구현 내용
- 비디오: MP4, WebM, OGG, MOV, AVI, MKV
- 이미지: 자동 리사이징, EXIF 처리
- HLS 스트리밍 준비 (미구현)

#### 마이그레이션 체크리스트
- [ ] 파일 업로드 핸들러
- [ ] 이미지 처리 (Pillow)
- [ ] 미디어 파일 디렉토리 구조
- [ ] CORS 설정 (미디어 파일)
- [ ] 파일 보안 검증

## 4. 인프라 및 배포

### 4.1 데이터베이스
- PostgreSQL (Railway 제공)
- 인덱스: user, project, created 필드
- 제약조건: 프로젝트명 유일성, 멤버십 유일성

### 4.2 캐시 시스템
- Redis (Railway 제공)
- 용도: 세션, 캐시, WebSocket 채널 레이어
- 설정: 5분 기본 타임아웃, zlib 압축

### 4.3 배포 설정
- Railway 자동 배포
- 환경별 설정: minimal → progressive → full
- WhiteNoise 정적 파일 서빙
- 자동 마이그레이션 스크립트

## 5. 마이그레이션 실행 단계

### Phase 1: 기본 인프라 (1-2주)
1. Django 프로젝트 초기 설정
2. PostgreSQL, Redis 연결
3. 기본 인증 시스템 구현
4. 프론트엔드 기본 구조 설정

### Phase 2: 핵심 기능 (2-3주)
1. 프로젝트 관리 시스템
2. 피드백 시스템 (파일 업로드 포함)
3. 기본 권한 관리
4. API 엔드포인트 구현

### Phase 3: 고급 기능 (2-3주)
1. WebSocket 실시간 채팅
2. AI 영상 기획 시스템
3. 미디어 파일 최적화
4. 성능 최적화

### Phase 4: 배포 및 최적화 (1주)
1. Railway 배포 설정
2. 프로덕션 환경 테스트
3. 성능 모니터링 설정
4. 문서화 및 인수인계

## 6. 주의사항 및 개선 제안

### 현재 비활성화된 기능
- WebSocket (channels 앱 주석 처리됨)
- 비디오 인코딩 (FFmpeg 기반)
- Celery 비동기 작업
- S3 스토리지

### 보안 고려사항
- XSS 방지 (입력 검증)
- SQL 인젝션 방지 (ORM 사용)
- CORS 설정 (허용 도메인 제한)
- 파일 업로드 검증

### 성능 최적화 제안
- 구현된 믹스인 활용 (OptimizedQueryMixin)
- 프론트엔드 코드 스플리팅
- 이미지 lazy loading
- API 응답 캐싱 확대

## 7. 테스트 체크리스트

### 단위 테스트
- [ ] 인증 시스템 테스트
- [ ] 프로젝트 CRUD 테스트
- [ ] 파일 업로드 테스트
- [ ] 권한 검증 테스트

### 통합 테스트
- [ ] API 엔드포인트 테스트
- [ ] WebSocket 연결 테스트
- [ ] 파일 처리 테스트
- [ ] 성능 부하 테스트

### 시나리오 테스트
- [ ] 사용자 회원가입 → 로그인 → 프로젝트 생성
- [ ] 피드백 업로드 → 댓글 작성 → 실시간 채팅
- [ ] AI 영상 기획 전체 프로세스

## 8. 참고 자료

### 기존 테스트 파일
- `/vridge_front/src/tests/simple-test.js`
- `/vridge_front/src/tests/user-scenario-test.js`
- `/vridge_front/src/tests/final-verification.js`

### 주요 설정 파일
- `/vridge_back/config/settings_base.py`
- `/vridge_front/src/routes/App.js`
- `/vridge_back/requirements.txt`
- `/vridge_front/package.json`

### API 문서
- 인증: `/api/users/`
- 프로젝트: `/api/projects/`
- 피드백: `/api/feedbacks/`
- 영상기획: `/api/video-planning/`

---

이 마이그레이션 계획서는 VideoPlanet 시스템의 완전한 재구현을 위한 종합 가이드입니다. 각 단계별로 체크리스트를 확인하며 진행하시기 바랍니다.