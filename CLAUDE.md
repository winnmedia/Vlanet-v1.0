# VideoPlanet 개발지침

## 프로젝트 개요
VideoPlanet은 영상 제작 프로젝트 관리 시스템입니다.
- 프론트엔드: React (포트 3000)
- 백엔드: Django (Railway 배포)
- 데이터베이스: PostgreSQL
- 캐시: Redis

## 핵심 개발 원칙

### 1. 코드 품질
- **주석 금지**: 코드에 주석을 추가하지 않음 (명시적 요청 시에만)
- **기존 패턴 준수**: 파일 수정 시 기존 코드 스타일과 패턴을 따름
- **라이브러리 확인**: 새 라이브러리 사용 전 package.json/requirements.txt 확인

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

### 마이그레이션 모범 사례
- **원자적 마이그레이션**: 하나의 마이그레이션에 하나의 변경사항
- **데이터 마이그레이션**: RunPython을 사용한 데이터 변환
- **역방향 마이그레이션**: 항상 롤백 가능하도록 reverse 메서드 구현
- **대용량 테이블**: 인덱스 추가/삭제는 별도 마이그레이션으로 분리

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
  - [ ] 기존 데이터와의 호환성 검토
  - [ ] 롤백 가능 여부 확인
  - [ ] 운영 환경 영향도 분석

## 연락처 및 리소스
- **API 베이스 URL**: https://videoplanet.up.railway.app
- **프론트엔드 URL**: https://vlanet.net
- **데이터베이스**: PostgreSQL on Railway
- **캐시**: Redis on Railway

---
*이 문서는 VideoPlanet 개발팀의 효율적인 협업을 위한 가이드라인입니다.*