# VideoPlanet 개발지침

## 프로젝트 개요
VideoPlanet은 영상 제작 프로젝트 관리 시스템입니다.
- 프론트엔드: React (포트 3000)
- 백엔드: Django (Railway 배포)
- 데이터베이스: PostgreSQL
- 캐시: Redis

## AI 어시스턴트 커뮤니케이션 가이드
- **필수**: 모든 설명과 응답은 한국어로 작성
- 코드 작성 시에도 주요 변경사항은 한국어로 설명
- 기술적 용어는 영어 그대로 사용 가능 (예: React, Django, CORS 등)
- 작업 완료 후 요약은 반드시 한국어로 제공
- 오류 메시지 설명도 한국어로 번역하여 제공

## 핵심 개발 원칙

### 0. 초고성능 자동화 우선 (최우선 원칙)
- **1000% 성과 목표**: 단순한 정상 작동(100%)을 넘어서 사용자의 작업을 10배 이상 효율화하는 기능 구현
- **인간 업무 대체**: 반복적이고 시간 소모적인 작업을 AI와 자동화로 완전 대체
- **직관적 자동화**: 복잡한 작업을 한 번의 클릭이나 간단한 입력으로 완료 가능하게 설계
- **지능형 개선**: AI를 활용하여 사용자가 예상하지 못한 개선사항까지 자동으로 제공
- **시간 절약 측정**: 모든 기능은 "기존 방식 대비 몇 분/시간 절약"을 명확히 정의하고 구현

#### 1000% 성과를 위한 필수 요소
1. **AI 기반 자동화**
   - 단순 템플릿이 아닌 맥락을 이해하는 지능형 생성
   - 사용자 의도를 파악하여 최적의 결과물 자동 생성
   - 반복 학습을 통한 개인화된 결과 제공

2. **원클릭 완성도**
   - 복잡한 다단계 작업을 한 번의 실행으로 완료
   - 사용자가 세부사항을 신경 쓰지 않아도 전문가 수준의 결과
   - 자동 오류 감지 및 수정 기능 내장

3. **예측적 기능 제공**
   - 사용자가 다음에 필요할 작업을 미리 준비
   - 프로젝트 패턴 분석을 통한 자동 제안
   - 업계 모범 사례를 자동으로 적용

4. **무한 확장성**
   - 한 번 설정하면 무제한 재사용 가능
   - 프로젝트 규모에 관계없이 동일한 효율성 제공
   - 팀 전체의 생산성 동시 향상

### 1. 코드 품질
- **주석 금지**: 코드에 주석을 추가하지 않음 (명시적 요청 시에만)
- **기존 패턴 준수**: 파일 수정 시 기존 코드 스타일과 패턴을 따름
- **라이브러리 확인**: 새 라이브러리 사용 전 package.json/requirements.txt 확인
- **버전 관리 필수**: 배포 시 반드시 package.json의 version을 업데이트하고, Git 태그 생성
  - 예: 0.2.3 → 0.2.4 (버그 수정), 0.2.3 → 0.3.0 (새 기능), 0.2.3 → 1.0.0 (주요 변경)
  - 배포 커밋 메시지에 버전 명시: "chore: bump version to 0.2.4"
  - Git 태그 생성: `git tag v0.2.4 && git push origin v0.2.4`

### 1-1. UI/UX 디자인 가이드 (필수)
- **대표 색상 통일**: 모든 프론트엔드 디자인에서 브랜드 대표 색상 사용
  - **주요 액션 버튼 (파란색)**: `#1631F8` (그라데이션: `#1631F8` → `#0F23C9`)
  - **위험/취소 액션 (빨간색)**: `#dc3545` (그라데이션: `#dc3545` → `#c82333`)
  - **성공 상태 (초록색)**: `#28a745`
  - **경고 상태 (노란색)**: `#ffc107`
  - **정보 상태 (하늘색)**: `#17a2b8`
  
- **버튼 스타일 가이드**:
  - 모든 주요 버튼은 파란색 그라데이션 사용
  - 삭제, 취소 등 부정적 액션만 빨간색 사용
  - 호버 효과: `transform: translateY(-2px)` + 그림자 강화
  - 비활성화 상태: `opacity: 0.6`
  
- **일관성 원칙**:
  - 동일한 기능은 모든 페이지에서 같은 색상 사용
  - 새로운 기능 추가 시 기존 색상 체계 준수
  - 특별한 이유 없이 새로운 색상 추가 금지

### 2. 안전한 수정 원칙 (가장 중요)
- **격리된 수정**: 기능 오류 수정 시 다른 기능에 영향을 주지 않는 범위 내에서 수정하고 다른 기능을 건드릴 시 확인 할 것
- **의존성 분석**: 수정 전 해당 기능이 다른 기능과 어떻게 연결되어 있는지 분석
- **최소 변경**: 문제 해결에 필요한 최소한의 코드만 수정
- **단계별 검증**: 수정 후 관련 기능들이 정상 작동하는지 단계별로 확인

#### 오류 수정 시 필수 체크리스트
1. **영향 범위 분석**
   - 수정할 코드가 어떤 컴포넌트/모듈에서 사용되는지 확인
   - 해당 함수/메서드를 호출하는 모든 곳을 찾아서 검토
   - 상위/하위 컴포넌트와의 데이터 흐름 파악

2. **기존 기능 보호**
   - 새로운 조건문이나 로직 추가 시 기존 케이스가 여전히 동작하는지 확인
   - 기존 파라미터나 리턴값의 타입/구조를 변경하지 않기
   - 필요시 새로운 파라미터는 선택적(optional)으로 추가

3. **점진적 수정**
   - 한 번에 많은 부분을 수정하지 말고 작은 단위로 나누어 수정
   - 각 수정 후 즉시 테스트하여 문제 발생 지점을 명확히 파악
   - 문제가 발생하면 즉시 이전 상태로 롤백

4. **수정 금지 사항**
   - 전역 상태나 설정값을 함부로 변경하지 않기
   - 다른 기능에서 사용하는 공통 컴포넌트/유틸리티 함수의 인터페이스 변경 금지
   - CSS 클래스명이나 ID를 변경할 때 다른 곳에서 참조하는지 확인

5. **테스트 전략**
   - 수정한 기능뿐만 아니라 연관된 모든 기능 테스트
   - 주요 사용자 시나리오를 처음부터 끝까지 테스트
   - 엣지 케이스와 에러 상황도 반드시 테스트

### 3. 보안 우선
- **입력 검증**: 모든 사용자 입력에 대한 검증 필수
- **XSS 방지**: HTML 태그, 스크립트 태그 등 악성 패턴 차단
- **SQL 인젝션 방지**: Django ORM 사용, 원시 쿼리 금지
- **민감정보 보호**: 로그에 비밀번호, 토큰 등 민감정보 출력 금지

### 4. 성능 최적화
- **데이터베이스 쿼리 최적화**: select_related, prefetch_related 적극 활용
- **중복 방지**: 데이터베이스 레벨 제약조건 활용
- **캐시 활용**: Redis 캐시를 통한 성능 개선

## 파일 구조

### 백엔드 (/home/winnmedia/VideoPlanet/vridge_back/)
```
config/
├── settings_base.py     # 기본 설정
├── settings.py          # Railway 테스트용 설정
├── urls.py             # URL 라우팅
└── middleware.py       # 커스텀 미들웨어

users/                  # 사용자 관리
├── models.py          # User 모델
├── views.py           # 인증 API
├── validators.py      # 입력 검증
└── serializers.py     # 시리얼라이저

projects/              # 프로젝트 관리
├── models.py          # Project 모델
├── views.py           # 프로젝트 API
├── views_atomic.py    # 원자적 프로젝트 생성
└── serializers.py     # 시리얼라이저

feedbacks/             # 피드백 시스템
├── models.py          # Feedback 모델
├── views.py           # 피드백 API
└── middleware.py      # 미디어 헤더 미들웨어
```

### 프론트엔드 (/home/winnmedia/VideoPlanet/vridge_front/)
```
src/
├── routes/App.js           # 메인 라우팅
├── page/
│   ├── Cms/
│   │   ├── ProjectCreate.jsx   # 프로젝트 생성
│   │   └── Feedback.jsx        # 피드백 페이지
│   └── MyPage/                 # 마이페이지
├── components/             # 공통 컴포넌트
├── store/                 # Redux 상태 관리
└── tests/                 # 테스트 파일
```

## 주요 기능별 개발 가이드

### 1. 프로젝트 생성
- **중복 방지**: 사용자별 프로젝트명 유일성 보장
- **원자적 처리**: 모든 관련 객체를 트랜잭션으로 처리
- **에러 처리**: 사용자 친화적 에러 메시지 제공

### 2. 피드백 시스템
- **파일 URL**: HTTPS 기반 절대 경로 사용
- **WebSocket**: 자동 재연결 기능 포함
- **미디어 처리**: 적절한 MIME 타입 및 헤더 설정

### 3. 인증 시스템
- **JWT 토큰**: SimpleJWT 라이브러리 사용
- **세션 관리**: HttpOnly 쿠키 활용
- **비밀번호 정책**: 복잡도 요구사항 준수

## 테스트 가이드

### 테스트 실행
```bash
# 간단한 기능 테스트
cd /home/winnmedia/VideoPlanet/vridge_front/src/tests
node simple-test.js

# 사용자 시나리오 테스트
node user-scenario-test.js

# 최종 검증 테스트
node final-verification.js
```

### 테스트 시나리오
1. **API 서버 연결** 확인
2. **입력 검증** 시스템 테스트
3. **회원가입/로그인** 플로우 테스트
4. **프로젝트 생성** 및 **중복 방지** 테스트
5. **피드백 시스템** 접근성 테스트

## 마이그레이션 관리 가이드

### 마이그레이션 오류 방지 체크리스트 (필독!)
**"Model class doesn't declare an explicit app_label" 오류를 방지하기 위해 반드시 확인해야 할 사항들:**

1. **INSTALLED_APPS 확인**
   - 새로운 앱을 추가할 때는 `settings_base.py`의 `PROJECT_APPS`에 반드시 추가
   - Railway 배포 시에는 `config.settings.railway`가 사용되는지 확인
   - 환경변수 `DJANGO_SETTINGS_MODULE`이 올바른 설정 파일을 가리키는지 확인

2. **마이그레이션 파일 관리**
   - 모델 변경 후 반드시 `makemigrations` 실행
   - 생성된 마이그레이션 파일을 반드시 Git에 커밋
   - 배포 전 로컬에서 `migrate` 테스트 완료

3. **Railway 배포 시 환경변수**
   ```
   DJANGO_SETTINGS_MODULE=config.settings.railway
   SECRET_KEY=your-secret-key
   DATABASE_URL=postgresql://...
   ```

4. **자동 마이그레이션 실행**
   - `start.sh` 스크립트를 통해 서버 시작 (마이그레이션 자동 실행)
   - 또는 `ensure_migrations` 커맨드 사용:
     ```bash
     python manage.py ensure_migrations
     ```

### 마이그레이션 개발 프로세스
1. **모델 변경 전 확인사항**
   ```bash
   # 현재 마이그레이션 상태 확인
   python3 manage.py showmigrations
   
   # 특정 앱의 마이그레이션 상태
   python3 manage.py showmigrations [app_name]
   ```

2. **모델 변경 시 필수 절차**
   - 기존 데이터 백업
   - 변경사항이 기존 데이터에 미치는 영향 분석
   - NULL/DEFAULT 값 설정으로 데이터 손실 방지

3. **마이그레이션 생성 및 검토**
   ```bash
   # 마이그레이션 생성
   python3 manage.py makemigrations [app_name]
   
   # 생성된 SQL 검토 (실행하지 않고 확인만)
   python3 manage.py sqlmigrate [app_name] [migration_number]
   
   # 드라이런 (실제 적용 전 테스트)
   python3 manage.py migrate --fake [app_name]
   ```

4. **마이그레이션 충돌 해결**
   - 병렬 개발 시 마이그레이션 번호 충돌 확인
   - `python3 manage.py showmigrations --plan` 으로 순서 확인
   - 필요시 마이그레이션 merge 또는 rebase

5. **운영 환경 마이그레이션**
   - Railway는 Procfile에서 자동 실행
   - 수동 실행 필요 시: `python3 manage.py migrate --settings=config.settings.railway`
   - 롤백 계획 수립 (migrate [app_name] [previous_migration])

### 마이그레이션 오류 발생 시 해결 방법
1. **"No migrations to apply" 문제**
   - 로그에서 실제 적용된 앱 확인 (admin, auth, contenttypes만 나오는 경우)
   - `settings_base.py`와 실제 사용 중인 설정 파일 비교
   - 순차적 마이그레이션 실행:
     ```bash
     python manage.py migrate contenttypes
     python manage.py migrate auth
     python manage.py migrate users
     python manage.py migrate projects
     python manage.py migrate feedbacks
     python manage.py migrate video_planning
     python manage.py migrate video_analysis
     python manage.py migrate admin_dashboard
     ```

2. **"relation does not exist" 오류**
   - 데이터베이스 초기화 고려: `python manage.py flush --noinput`
   - 특정 앱만 마이그레이션: `python manage.py migrate [app_name] zero`
   - 재마이그레이션: `python manage.py migrate [app_name]`

### 마이그레이션 모범 사례
- **원자적 마이그레이션**: 하나의 마이그레이션에 하나의 변경사항
- **데이터 마이그레이션**: RunPython을 사용한 데이터 변환
- **역방향 마이그레이션**: 항상 롤백 가능하도록 reverse 메서드 구현
- **대용량 테이블**: 인덱스 추가/삭제는 별도 마이그레이션으로 분리
- **마이그레이션 파일 커밋**: 생성된 마이그레이션 파일은 반드시 버전 관리에 포함

### Django 모델 자동 생성 도구 활용
프로젝트에 포함된 모델 자동 생성 스크립트를 활용하여 API 스펙 기반 모델 생성 가능:

```bash
# API 트래픽 기반 모델 생성
python3 generate_models_from_api.py

# HAR 파일 기반 모델 생성
python3 enhanced_model_generator.py

# 템플릿 기반 모델 생성
python3 template_model_generator.py
```

생성된 모델은 검토 후 필요에 따라 수정하여 사용

## 배포 가이드

### 🚨 배포 교훈 및 원칙 (2025.01.09 추가)

#### KISS 원칙 (Keep It Simple, Stupid)
- **복잡한 통합보다 단순한 분리**: 프론트엔드와 백엔드는 별도로 배포
- **과도한 최적화 금지**: 작동하는 간단한 솔루션을 먼저 구현
- **한 번에 하나씩**: 여러 변경사항을 동시에 배포하지 않기

#### 문서화 우선
- **환경변수 문서화**: 모든 필수 환경변수는 .env.example에 기록
- **배포 과정 기록**: 각 단계별 명령어와 예상 결과 명시
- **에러 해결 기록**: 발생한 문제와 해결 방법을 TROUBLESHOOTING.md에 기록

#### 점진적 변경
- **작은 단위로 테스트**: 큰 기능도 작은 PR로 나누어 배포
- **로컬 테스트 필수**: `npm run build` 성공 후에만 푸시
- **의존성 변경 주의**: 새 패키지 추가 시 빌드 테스트 필수

#### 롤백 계획
- **이전 커밋 태그**: 안정적인 버전에 태그 추가 (예: v1.0-stable)
- **백업 브랜치**: 중요 변경 전 백업 브랜치 생성
- **환경변수 백업**: Railway 환경변수 스크린샷 보관

#### 배포 실패 시 체크리스트
1. **환경변수 확인**: SECRET_KEY, DATABASE_URL 등 필수 변수 설정 여부
2. **빌드 로그 확인**: PostCSS, 의존성 충돌 등 빌드 에러 확인
3. **헬스체크 경로**: /api/health/ 엔드포인트 접근 가능 여부
4. **시작 스크립트**: start.sh가 너무 복잡하지 않은지 확인
5. **타임아웃 설정**: 헬스체크 타임아웃이 충분한지 확인

### 배포 전 필수 체크리스트
1. **로컬 테스트 완료**: 모든 기능을 MECE 방식으로 100% 테스트 통과
   ```bash
   cd /home/winnmedia/VideoPlanet/vridge_front/src/tests
   node final-verification.js
   ```
2. **마이그레이션 확인**: 
   - `python3 manage.py showmigrations` 로 모든 마이그레이션 적용 확인
   - 운영 DB와 로컬 DB의 마이그레이션 상태 동기화 확인
   - 신규 마이그레이션이 있다면 운영 환경 영향도 분석
3. **환경변수 점검**: Railway에 필요한 모든 환경변수가 설정되어 있는지 확인

### 환경 설정
- **개발환경**: `DEBUG=True`, 로컬 데이터베이스
- **운영환경**: `DEBUG=False`, PostgreSQL, Redis

### CORS 설정
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://vlanet.net",
    "https://www.vlanet.net",
    "https://videoplanet.up.railway.app",
]
```

### 필수 명령어
```bash
# 캐시 테이블 생성
python3 manage.py createcachetable

# 데이터베이스 마이그레이션
python3 manage.py migrate

# 정적 파일 수집
python3 manage.py collectstatic
```

### 배포 프로세스

#### 프론트엔드 배포 (Vercel)
현재 2단계 배포 시스템 운영 중:

1. **스테이징 배포 (리허설)**
   - URL: `videoplanet-seven.vercel.app`
   - 목적: 실제 환경과 동일한 조건에서 사전 테스트
   - 버전 형식: `0.2.4-beta` 또는 `0.2.4-rc.1`
   - 커밋 메시지: `chore: prepare staging release v0.2.4-beta`

2. **프로덕션 배포 (정식)**
   - URL: `vlanet.net`
   - 목적: 실제 사용자 서비스
   - 버전 형식: `0.2.4` (정식 버전)
   - 커밋 메시지: `chore: release v0.2.4`
   - Git 태그: `git tag v0.2.4 && git push origin v0.2.4`

3. **배포 절차**
   - 로컬 테스트 완료 (MECE 100% 통과 필수)
   - package.json 버전 업데이트
   - 스테이징 배포 및 테스트
   - 프로덕션 배포 승인 후 정식 배포
   - 배포 완료 후 운영 환경 검증

#### 백엔드 배포 (Railway)
1. 로컬에서 모든 기능 테스트 (MECE 100% 통과 필수)
2. 변경사항 커밋 및 푸시
3. Railway 자동 배포 대기 (약 5-10분)
4. 배포 완료 후 운영 환경 테스트

## 문제 해결 가이드

### 자주 발생하는 문제
1. **CORS 오류**: `CORS_ALLOWED_ORIGINS`에 도메인 추가
2. **캐시 테이블 오류**: `createcachetable` 명령 실행
3. **프로젝트 중복 생성**: 데이터베이스 제약조건 확인
4. **피드백 파일 접근 불가**: URL 경로 및 HTTPS 설정 확인
5. **마이그레이션 오류**:
   - `relation does not exist`: 마이그레이션 누락, `python3 manage.py migrate` 실행
   - `column does not exist`: 모델 변경 후 마이그레이션 미생성, `makemigrations` 실행
   - 충돌 발생: `python3 manage.py migrate --fake` 로 상태 동기화
   - 롤백 필요: `python3 manage.py migrate [app_name] [previous_migration_number]`

### 디버깅 팁
- Django 로그에서 상세 에러 정보 확인
- 브라우저 개발자 도구에서 네트워크 탭 확인
- Redis 연결 상태 확인 (`redis-cli ping`)

## 코드 리뷰 체크리스트
- [ ] **안전한 수정**: 다른 기능에 영향을 주지 않는 범위 내에서 수정
- [ ] **의존성 확인**: 수정된 코드가 다른 기능과 어떻게 연결되어 있는지 분석
- [ ] **보안 취약점 확인**: XSS, SQL 인젝션 등 보안 문제 검토
- [ ] **입력 검증 로직**: 모든 사용자 입력에 대한 검증 포함
- [ ] **에러 핸들링**: 적절한 예외 처리 및 사용자 친화적 메시지
- [ ] **성능 최적화**: 쿼리 최적화, 캐시 활용 등 성능 개선
- [ ] **기존 코드 스타일**: 프로젝트 전체의 일관된 스타일 준수
- [ ] **테스트 커버리지**: 수정된 기능에 대한 테스트 실행 및 확인
- [ ] **마이그레이션 검토**: 
  - [ ] 모델 변경 시 마이그레이션 파일 생성 확인
  - [ ] 생성된 마이그레이션 파일 Git 커밋 여부 확인
  - [ ] settings_base.py의 INSTALLED_APPS에 앱 등록 확인
  - [ ] 기존 데이터와의 호환성 검토
  - [ ] 롤백 가능 여부 확인
  - [ ] 운영 환경 영향도 분석
  - [ ] Railway 환경변수 DJANGO_SETTINGS_MODULE 확인

## 1000% 성과 측정 기준

### 기능별 성과 목표
1. **기획안 내보내기**: 기존 수작업 3-5시간 → AI 자동화 5분 (3600% 효율 향상)
2. **프로젝트 생성**: 기존 30분 설정 → 원클릭 2분 (1500% 효율 향상)
3. **피드백 관리**: 기존 이메일/전화 → 실시간 동기화 (무한대 효율 향상)
4. **콘티 생성**: 기존 수작업 2-3시간 → AI 자동 생성 10분 (1800% 효율 향상)

### 성과 평가 체크리스트
개발 완료 전 반드시 확인:
- [ ] **시간 절약량**: 기존 방식 대비 최소 5배 이상 빠른 처리
- [ ] **작업 자동화율**: 수동 개입 없이 90% 이상 자동 처리
- [ ] **오류 감소**: 인간 실수 요소 80% 이상 제거
- [ ] **사용자 만족도**: "이 기능 없이는 일할 수 없다" 수준의 의존성 달성
- [ ] **확장성**: 사용량 증가에도 동일한 성능 유지

### 혁신적 기능 요구사항
모든 새 기능은 다음 중 하나 이상을 만족해야 함:
1. **업계 최초**: 경쟁사에 없는 완전히 새로운 접근
2. **AI 파워**: 인공지능으로 불가능했던 것을 가능하게 만듦
3. **원클릭 완성**: 복잡한 워크플로우를 한 번에 해결
4. **예측적 자동화**: 사용자가 요청하기 전에 필요한 것을 제공

## 권장 배포 아키텍처 (2025.01.09 추가)

### 🏗️ 단순하고 확장 가능한 구조
```
프론트엔드 (React)          백엔드 (Django)
    Vercel/Netlify    <->    Railway
    vlanet.net              api.vlanet.net
         |                        |
         +--------[CORS]---------+
```

### 각 서비스별 역할
1. **프론트엔드 (Vercel/Netlify)**
   - React 정적 파일 서빙
   - 자동 CDN 배포
   - 빌드 최적화

2. **백엔드 (Railway)**
   - API 엔드포인트만 제공
   - 데이터베이스 연결
   - 미디어 파일 처리

3. **데이터베이스 (Railway PostgreSQL)**
   - 자동 백업
   - 연결 풀링

4. **캐시 (Railway Redis)**
   - 세션 저장
   - API 캐싱

### 환경 분리
```
개발: localhost:3000 <-> localhost:8000
스테이징: staging.vlanet.net <-> api-staging.vlanet.net  
프로덕션: vlanet.net <-> api.vlanet.net
```

## 연락처 및 리소스
- **API 베이스 URL**: https://videoplanet.up.railway.app
- **프론트엔드 URL**: https://vlanet.net
- **데이터베이스**: PostgreSQL on Railway
- **캐시**: Redis on Railway

---
*이 문서는 VideoPlanet 개발팀의 10배 성과 달성을 위한 가이드라인입니다.*