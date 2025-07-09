# Django 설정 파일 가이드

## 개요
VideoPlanet 프로젝트의 Django 설정 파일 구조와 사용 방법을 설명합니다.

## 설정 파일 구조

```
config/
├── __init__.py
├── settings_base.py          # 기본 설정 (모든 환경에서 공통)
├── settings_dev.py           # 로컬 개발 환경 설정
├── settings/
│   ├── __init__.py
│   └── railway.py            # Railway 배포 환경 설정
├── urls.py                   # URL 라우팅
├── wsgi.py                   # WSGI 설정
├── asgi.py                   # ASGI 설정 (WebSocket 지원)
└── middleware.py             # 커스텀 미들웨어
```

## 환경별 설정 사용

### 1. 로컬 개발 환경
```bash
# 자동으로 settings_dev.py 사용
python manage.py runserver
```

### 2. Railway 배포 환경
```bash
# 환경변수 RAILWAY_ENVIRONMENT가 설정되면 자동으로 settings/railway.py 사용
# Railway 플랫폼에서 자동 설정됨
```

### 3. 명시적 설정 지정
```bash
# 특정 설정 파일 사용
python manage.py runserver --settings=config.settings_dev
python manage.py migrate --settings=config.settings.railway
```

## 설정 파일 상속 구조

```
settings_base.py (기본 설정)
    ├── settings_dev.py (개발 환경)
    └── settings/railway.py (운영 환경)
```

## 주요 설정 항목

### settings_base.py (기본 설정)
- **INSTALLED_APPS**: 모든 Django 앱 정의
  - Django 기본 앱
  - 프로젝트 앱: core, users, projects, feedbacks, onlines, video_planning, video_analysis, admin_dashboard
  - 서드파티 앱: corsheaders, rest_framework, rest_framework_simplejwt
- **MIDDLEWARE**: 공통 미들웨어 설정
- **TEMPLATES**: 템플릿 설정
- **AUTH_USER_MODEL**: 커스텀 사용자 모델
- **REST_FRAMEWORK**: DRF 기본 설정
- **SIMPLE_JWT**: JWT 인증 설정

### settings_dev.py (개발 환경)
- **DEBUG**: True
- **DATABASES**: SQLite 사용
- **CORS_ALLOW_ALL_ORIGINS**: True (개발 편의성)
- **EMAIL_BACKEND**: 콘솔 출력
- **CACHES**: 로컬 메모리 캐시

### settings/railway.py (운영 환경)
- **DEBUG**: 환경변수로 제어
- **ALLOWED_HOSTS**: 운영 도메인만 허용
- **DATABASES**: PostgreSQL (Railway 제공)
- **STATIC/MEDIA**: WhiteNoise와 Railway 볼륨 사용
- **CORS_ALLOWED_ORIGINS**: 명시적 도메인만 허용
- **EMAIL_BACKEND**: SendGrid 또는 Gmail SMTP
- **CACHES**: Redis 또는 DB 캐시
- **보안 헤더**: XSS, Content-Type 보호

## 환경변수 설정

### 필수 환경변수
- `SECRET_KEY`: Django 비밀 키
- `DATABASE_URL`: PostgreSQL 연결 문자열 (Railway 자동 제공)

### 선택적 환경변수
- `DEBUG`: 디버그 모드 (기본값: False)
- `SENDGRID_API_KEY`: SendGrid 이메일 서비스
- `REDIS_URL`: Redis 캐시 서버
- `CORS_ALLOWED_ORIGINS`: 추가 CORS 허용 도메인 (쉼표 구분)

## 새로운 앱 추가 방법

1. `settings_base.py`의 `PROJECT_APPS`에 앱 이름 추가:
   ```python
   PROJECT_APPS = [
       "core",
       "users",
       # ... 기존 앱들
       "new_app",  # 새로운 앱 추가
   ]
   ```

2. 마이그레이션 생성 및 적용:
   ```bash
   python manage.py makemigrations new_app
   python manage.py migrate
   ```

## 문제 해결

### 1. INSTALLED_APPS 오류
- 증상: "Model class doesn't declare an explicit app_label"
- 해결: settings_base.py의 PROJECT_APPS에 앱이 추가되었는지 확인

### 2. 설정 파일 충돌
- 증상: 예상과 다른 설정이 적용됨
- 해결: manage.py와 wsgi.py에서 올바른 설정을 참조하는지 확인

### 3. 환경변수 누락
- 증상: "SECRET_KEY environment variable must be set"
- 해결: Railway 또는 .env 파일에 필수 환경변수 설정

## 모범 사례

1. **새로운 설정 추가 시**:
   - 공통 설정은 settings_base.py에 추가
   - 환경별 설정은 해당 환경 파일에만 추가

2. **보안 주의사항**:
   - SECRET_KEY, API 키 등은 절대 코드에 하드코딩하지 않음
   - 환경변수로 관리

3. **설정 파일 정리**:
   - 사용하지 않는 설정 파일은 즉시 제거
   - 임시 설정 파일 생성 자제

4. **버전 관리**:
   - 설정 변경 시 CHANGELOG.md 업데이트
   - 중요한 설정 변경은 배포 로그에 기록

---
*최종 업데이트: 2025-01-09*